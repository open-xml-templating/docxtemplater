const {wordToUtf8, concatArrays} = require("./doc-utils");

function moduleParse(modules, placeHolderContent, parsed, startOffset) {
	let moduleParsed;
	for (let i = 0, l = modules.length; i < l; i++) {
		const module = modules[i];
		moduleParsed = module.parse(placeHolderContent);
		if (moduleParsed) {
			moduleParsed.offset = startOffset;
			parsed.push(moduleParsed);
			return parsed;
		}
	}
	parsed.push({type: "placeholder", value: placeHolderContent, offset: startOffset});
	return parsed;
}

const parser = {
	postparse(postparsed, modules) {
		function getTraits(traitName, postparsed) {
			return modules.map(function (module) {
				return module.getTraits(traitName, postparsed);
			});
		}
		let errors = [];
		function postparse(postparsed) {
			return modules.reduce(function (postparsed, module) {
				const r = module.postparse(postparsed, {postparse, getTraits});
				if (r.errors) {
					errors = concatArrays([errors, r.errors]);
					return r.postparsed;
				}
				return r;
			}, postparsed);
		}
		return {postparsed: postparse(postparsed), errors};
	},

	parse(lexed, modules) {
		let inPlaceHolder = false;
		let placeHolderContent = "";
		let startOffset;
		let tailParts = [];
		return lexed.filter(function (token) {
			return !token.error;
		}).reduce(function lexedToParsed(parsed, token) {
			if (token.type === "delimiter") {
				inPlaceHolder = token.position === "start";
				if (token.position === "end") {
					placeHolderContent = wordToUtf8(placeHolderContent);
					parsed = moduleParse(modules, placeHolderContent, parsed, startOffset);
					startOffset = null;
					Array.prototype.push.apply(parsed, tailParts);
					tailParts = [];
				}
				else {
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
