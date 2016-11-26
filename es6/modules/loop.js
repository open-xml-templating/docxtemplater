const DocUtils = require("../doc-utils");
const dashInnerRegex = /^-([^\s]+)\s(.+)$/;

const moduleName = "loop";

const loopModule = {
	parse(placeHolderContent) {
		const module = moduleName;
		const type = "placeholder";
		if (placeHolderContent[0] === "#") {
			return {type, value: placeHolderContent.substr(1), expandTo: "auto", module, location: "start", inverted: false};
		}
		if (placeHolderContent[0] === "^") {
			return {type, value: placeHolderContent.substr(1), expandTo: "auto", module, location: "start", inverted: true};
		}
		if (placeHolderContent[0] === "/") {
			return {type, value: placeHolderContent.substr(1), module, location: "end"};
		}
		if (placeHolderContent[0] === "-") {
			const value = placeHolderContent.replace(dashInnerRegex, "$2");
			const expandTo = placeHolderContent.replace(dashInnerRegex, "$1");
			return {type, value, expandTo, module, location: "start", inverted: false};
		}
		return null;
	},
	getTraits(traitName, parsed) {
		if (traitName !== "expandPair") {
			return;
		}

		return parsed.reduce(function (tags, part, offset) {
			if (part.type === "placeholder" && part.module === moduleName) {
				tags.push({part, offset});
			}
			return tags;
		}, []);
	},
	render(part, options) {
		if(!part.type === "placeholder" || part.module !== moduleName) {
			return null;
		}
		const totalValue = [];
		function loopOver(scope) {
			const scopeManager = options.scopeManager.createSubScopeManager(scope, part.value);
			totalValue.push(options.render(
				DocUtils.mergeObjects({}, options, {
					compiled: part.subparsed,
					tags: {},
					scopeManager,
				})
			));
		}
		options.scopeManager.loopOver(part.value, loopOver, part.inverted);
		return {value: totalValue.join("")};
	},
};

module.exports = loopModule;
