const { concatArrays } = require("./doc-utils.js");
const { match, getValue, getValues } = require("./prefix-matcher.js");

function moduleParse(placeHolderContent, options) {
	const modules = options.modules;
	const startOffset = options.startOffset;
	const endLindex = options.lIndex;
	let moduleParsed;
	options.offset = startOffset;
	options.match = match;
	options.getValue = getValue;
	options.getValues = getValues;

	for (let i = 0, l = modules.length; i < l; i++) {
		const module = modules[i];
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
			return modules.forEach(function (module) {
				module.preparse(parsed, options);
			});
		}
		return { preparsed: preparse(parsed, options) };
	},
	postparse(postparsed, modules, options) {
		function getTraits(traitName, postparsed) {
			return modules.map(function (module) {
				return module.getTraits(traitName, postparsed);
			});
		}
		let errors = [];
		function postparse(postparsed, options) {
			return modules.reduce(function (postparsed, module) {
				const r = module.postparse(postparsed, {
					...options,
					postparse: (parsed, opts) => {
						return postparse(parsed, { ...options, ...opts });
					},
					getTraits,
				});
				if (r == null) {
					return postparsed;
				}
				if (r.errors) {
					errors = concatArrays([errors, r.errors]);
					return r.postparsed;
				}
				return r;
			}, postparsed);
		}
		return { postparsed: postparse(postparsed, options), errors };
	},

	parse(lexed, modules, options) {
		let inPlaceHolder = false;
		let placeHolderContent = "";
		let startOffset;
		let tailParts = [];
		return lexed.reduce(function lexedToParsed(parsed, token) {
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
					parsed.push(options.parse(placeHolderContent));
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
				tailParts.push(token);
				return parsed;
			}
			placeHolderContent += token.value;
			return parsed;
		}, []);
	},
};

module.exports = parser;
