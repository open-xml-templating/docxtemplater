const {mergeObjects} = require("../doc-utils");
const dashInnerRegex = /^-([^\s]+)\s(.+)$/;
const wrapper = require("../module-wrapper");

const moduleName = "loop";

const loopModule = {
	name: "LoopModule",
	prefix: {
		start: "#",
		end: "/",
		dash: "-",
		inverted: "^",
	},
	parse(placeHolderContent) {
		const module = moduleName;
		const type = "placeholder";
		const prefix = this.prefix;
		if (placeHolderContent[0] === prefix.start) {
			return {
				type,
				value: placeHolderContent.substr(1),
				expandTo: "auto",
				module,
				location: "start",
				inverted: false,
			};
		}
		if (placeHolderContent[0] === prefix.inverted) {
			return {
				type,
				value: placeHolderContent.substr(1),
				expandTo: "auto",
				module,
				location: "start",
				inverted: true,
			};
		}
		if (placeHolderContent[0] === prefix.end) {
			return {
				type,
				value: placeHolderContent.substr(1),
				module,
				location: "end",
			};
		}
		if (placeHolderContent[0] === prefix.dash) {
			const value = placeHolderContent.replace(dashInnerRegex, "$2");
			const expandTo = placeHolderContent.replace(dashInnerRegex, "$1");
			return {
				type,
				value,
				expandTo,
				module,
				location: "start",
				inverted: false,
			};
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
		if (!part.type === "placeholder" || part.module !== moduleName) {
			return null;
		}
		let totalValue = [];
		let errors = [];
		function loopOver(scope) {
			const scopeManager = options.scopeManager.createSubScopeManager(
				scope,
				part.value
			);
			const subRendered = options.render(
				mergeObjects({}, options, {
					compiled: part.subparsed,
					tags: {},
					scopeManager,
				})
			);
			totalValue = totalValue.concat(subRendered.parts);
			errors = errors.concat(subRendered.errors || []);
		}
		options.scopeManager.loopOver(part.value, loopOver, part.inverted);
		return {value: totalValue.join(""), errors};
	},
};

module.exports = () => wrapper(loopModule);
