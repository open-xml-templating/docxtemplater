const {
	mergeObjects,
	chunkBy,
	last,
	isParagraphStart,
	isParagraphEnd,
	isContent,
} = require("../doc-utils");
const dashInnerRegex = /^-([^\s]+)\s(.+)$/;
const wrapper = require("../module-wrapper");

const moduleName = "loop";

function hasContent(parts) {
	return parts.some(function(part) {
		return isContent(part);
	});
}

function isEnclosedByParagraphs(parsed) {
	if (parsed.length === 0) {
		return false;
	}
	return isParagraphStart(parsed[0]) && isParagraphEnd(last(parsed));
}

function getOffset(chunk) {
	return hasContent(chunk) ? 0 : chunk.length;
}

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

		return parsed.reduce(function(tags, part, offset) {
			if (part.type === "placeholder" && part.module === moduleName) {
				tags.push({ part, offset });
			}
			return tags;
		}, []);
	},
	postparse(parsed, { basePart }) {
		if (!isEnclosedByParagraphs(parsed)) {
			return parsed;
		}
		if (!basePart || basePart.expandTo !== "auto") {
			return parsed;
		}
		const chunks = chunkBy(parsed, function(p) {
			if (isParagraphStart(p)) {
				return "start";
			}
			if (isParagraphEnd(p)) {
				return "end";
			}
			return null;
		});
		if (chunks.length <= 2) {
			return parsed;
		}
		const firstChunk = chunks[0];
		const lastChunk = last(chunks);
		const firstOffset = getOffset(firstChunk);
		const lastOffset = getOffset(lastChunk);
		if (firstOffset === 0 || lastOffset === 0) {
			return parsed;
		}
		const result = parsed.slice(firstOffset, parsed.length - lastOffset);
		return result;
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
		return { value: totalValue.join(""), errors };
	},
};

module.exports = () => wrapper(loopModule);
