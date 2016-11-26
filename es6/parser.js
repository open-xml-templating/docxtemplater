const DocUtils = require("./doc-utils");

const parser = {
	postparse(parsed, modules) {
		function getTraits(traitName, parsed) {
			return modules.map(function (module) {
				return module.getTraits ? module.getTraits(traitName, parsed) : null;
			});
		}
		function postparse(parsed) {
			return modules.reduce(function (parsed, module) {
				return module.postparse ? module.postparse(parsed, {postparse, getTraits}) : parsed;
			}, parsed);
		}
		return postparse(parsed);
	},

	parse(lexed, modules) {
		function moduleParse(placeHolderContent, parsed) {
			let moduleParsed;
			for (let i = 0, l = modules.length; i < l; i++) {
				const module = modules[i];
				if (!module.parse) {
					continue;
				}
				moduleParsed = module.parse(placeHolderContent);
				if (moduleParsed) {
					parsed.push(moduleParsed);
					return moduleParsed;
				}
			}
			return null;
		}

		let inPlaceHolder = false;
		let placeHolderContent;
		let tailParts = [];
		return lexed.reduce(function (parsed, token) {
			if (token.type === "delimiter") {
				inPlaceHolder = token.position === "start";
				if (token.position === "end") {
					placeHolderContent = DocUtils.wordToUtf8(placeHolderContent);
					if (!moduleParse(placeHolderContent, parsed)) {
						parsed.push({type: "placeholder", value: placeHolderContent});
					}
					Array.prototype.push.apply(parsed, tailParts);
					tailParts = [];
					return parsed;
				}
				placeHolderContent = "";
				return parsed;
			}
			if (inPlaceHolder) {
				if (token.type === "content" && token.position === "insidetag") {
					placeHolderContent += token.value;
				}
				else {
					tailParts.push(token);
				}
				return parsed;
			}
			parsed.push(token);
			return parsed;
		}, []);
	},
};

module.exports = parser;
