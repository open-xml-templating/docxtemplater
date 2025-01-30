const { wordToUtf8 } = require("./doc-utils.js");
const { match, getValue, getValues } = require("./prefix-matcher.js");

function getMatchers(modules, options) {
	const matchers = [];
	for (const module of modules) {
		if (module.matchers) {
			const mmm = module.matchers(options);
			if (!(mmm instanceof Array)) {
				throw new Error("module matcher returns a non array");
			}
			matchers.push(...mmm);
		}
	}
	return matchers;
}

function getMatches(matchers, placeHolderContent, options) {
	const matches = [];
	for (const matcher of matchers) {
		const [prefix, module] = matcher;
		let properties = matcher[2] || {};
		if (options.match(prefix, placeHolderContent)) {
			const values = options.getValues(prefix, placeHolderContent);
			if (typeof properties === "function") {
				properties = properties(values);
			}
			if (!properties.value) {
				[, properties.value] = values;
			}
			matches.push({
				type: "placeholder",
				prefix,
				module,
				onMatch: properties.onMatch,
				priority: properties.priority,
				...properties,
			});
		}
	}

	return matches;
}

function moduleParse(placeHolderContent, options) {
	const modules = options.modules;
	const startOffset = options.startOffset;
	const endLindex = options.lIndex;
	let moduleParsed;
	options.offset = startOffset;
	options.match = match;
	options.getValue = getValue;
	options.getValues = getValues;

	const matchers = getMatchers(modules, options);
	const matches = getMatches(matchers, placeHolderContent, options);
	if (matches.length > 0) {
		let bestMatch = null;
		for (const match of matches) {
			match.priority ||= -match.value.length;
			if (!bestMatch || match.priority > bestMatch.priority) {
				bestMatch = match;
			}
		}
		bestMatch.offset = startOffset;
		delete bestMatch.priority;
		bestMatch.endLindex = endLindex;
		bestMatch.lIndex = endLindex;
		bestMatch.raw = placeHolderContent;
		if (bestMatch.onMatch) {
			bestMatch.onMatch(bestMatch);
		}
		delete bestMatch.onMatch;
		delete bestMatch.prefix;
		return bestMatch;
	}

	for (const module of modules) {
		moduleParsed = module.parse(placeHolderContent, options);
		if (moduleParsed) {
			moduleParsed.offset = startOffset;
			moduleParsed.endLindex = endLindex;
			moduleParsed.lIndex = endLindex;
			moduleParsed.raw = placeHolderContent;
			return moduleParsed;
		}
	}
	return {
		type: "placeholder",
		value: placeHolderContent,
		offset: startOffset,
		endLindex,
		lIndex: endLindex,
	};
}

const parser = {
	preparse(parsed, modules, options) {
		function preparse(parsed, options) {
			for (const module of modules) {
				parsed = module.preparse(parsed, options) || parsed;
			}
			return parsed;
		}
		return preparse(parsed, options);
	},
	parse(lexed, modules, options) {
		let inPlaceHolder = false;
		let placeHolderContent = "";
		let startOffset;
		let tailParts = [];
		const droppedTags =
			options.fileTypeConfig.droppedTagsInsidePlaceholder || [];
		return lexed.reduce((parsed, token) => {
			if (token.type === "delimiter") {
				inPlaceHolder = token.position === "start";
				if (token.position === "end") {
					options.parse = (placeHolderContent) =>
						moduleParse(placeHolderContent, {
							...options,
							...token,
							startOffset,
							modules,
						});
					parsed.push(options.parse(wordToUtf8(placeHolderContent)));
					Array.prototype.push.apply(parsed, tailParts);
					tailParts = [];
				}
				if (token.position === "start") {
					tailParts = [];
					startOffset = token.offset;
				}
				placeHolderContent = "";
				return parsed;
			}
			if (!inPlaceHolder) {
				parsed.push(token);
				return parsed;
			}
			if (token.type !== "content" || token.position !== "insidetag") {
				if (droppedTags.indexOf(token.tag) !== -1) {
					return parsed;
				}
				tailParts.push(token);
				return parsed;
			}
			placeHolderContent += token.value;
			return parsed;
		}, []);
	},

	postparse(postparsed, modules, options) {
		function getTraits(traitName, postparsed) {
			return modules.map((module) => module.getTraits(traitName, postparsed));
		}
		const errors = [];
		function postparse(postparsed, options) {
			return modules.reduce((postparsed, module) => {
				const r = module.postparse(postparsed, {
					...options,
					postparse: (parsed, opts) =>
						postparse(parsed, { ...options, ...opts }),
					getTraits,
				});
				if (r == null) {
					return postparsed;
				}
				if (r.errors) {
					Array.prototype.push.apply(errors, r.errors);
					return r.postparsed;
				}
				return r;
			}, postparsed);
		}
		return { postparsed: postparse(postparsed, options), errors };
	},
};

module.exports = parser;
