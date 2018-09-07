const { wordToUtf8, concatArrays } = require("./doc-utils");

function moduleParse(
	modules,
	placeHolderContent,
	parsed,
	startOffset,
	endLindex
) {
	let moduleParsed;
	for (let i = 0, l = modules.length; i < l; i++) {
		const module = modules[i];
		moduleParsed = module.parse(placeHolderContent);
		if (moduleParsed) {
			moduleParsed.offset = startOffset;
			moduleParsed.endLindex = endLindex;
			moduleParsed.lIndex = endLindex;
			moduleParsed.raw = placeHolderContent;
			parsed.push(moduleParsed);
			return parsed;
		}
	}
	parsed.push({
		type: "placeholder",
		value: placeHolderContent,
		offset: startOffset,
		endLindex,
		lIndex: endLindex,
	});
	return parsed;
}

const parser = {
	postparse(postparsed, modules) {
		function getTraits(traitName, postparsed) {
			return modules.map(function(module) {
				return module.getTraits(traitName, postparsed);
			});
		}
		let errors = [];
		function postparse(postparsed, options) {
			return modules.reduce(function(postparsed, module) {
				const r = module.postparse(postparsed, {
					...options,
					postparse,
					getTraits,
				});
				if (r.errors) {
					errors = concatArrays([errors, r.errors]);
					return r.postparsed;
				}
				return r;
			}, postparsed);
		}
		return { postparsed: postparse(postparsed), errors };
	},

	parse(lexed, modules) {
		let inPlaceHolder = false;
		let placeHolderContent = "";
		let startOffset;
		let tailParts = [];
		return lexed.reduce(function lexedToParsed(parsed, token) {
			if (token.type === "delimiter") {
				inPlaceHolder = token.position === "start";
				if (token.position === "end") {
					const endLindex = token.lIndex;
					placeHolderContent = wordToUtf8(placeHolderContent);
					parsed = moduleParse(
						modules,
						placeHolderContent,
						parsed,
						startOffset,
						endLindex
					);
					startOffset = null;
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
