"use strict";

var _require = require("../doc-utils"),
    mergeObjects = _require.mergeObjects,
    chunkBy = _require.chunkBy,
    last = _require.last,
    isParagraphStart = _require.isParagraphStart,
    isParagraphEnd = _require.isParagraphEnd,
    isContent = _require.isContent;

var dashInnerRegex = /^-([^\s]+)\s(.+)$/;
var wrapper = require("../module-wrapper");

var moduleName = "loop";

function hasContent(parts) {
	return parts.some(function (part) {
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

var loopModule = {
	name: "LoopModule",
	prefix: {
		start: "#",
		end: "/",
		dash: "-",
		inverted: "^"
	},
	parse: function parse(placeHolderContent) {
		var module = moduleName;
		var type = "placeholder";
		var prefix = this.prefix;
		if (placeHolderContent[0] === prefix.start) {
			return {
				type: type,
				value: placeHolderContent.substr(1),
				expandTo: "auto",
				module: module,
				location: "start",
				inverted: false
			};
		}
		if (placeHolderContent[0] === prefix.inverted) {
			return {
				type: type,
				value: placeHolderContent.substr(1),
				expandTo: "auto",
				module: module,
				location: "start",
				inverted: true
			};
		}
		if (placeHolderContent[0] === prefix.end) {
			return {
				type: type,
				value: placeHolderContent.substr(1),
				module: module,
				location: "end"
			};
		}
		if (placeHolderContent[0] === prefix.dash) {
			var value = placeHolderContent.replace(dashInnerRegex, "$2");
			var expandTo = placeHolderContent.replace(dashInnerRegex, "$1");
			return {
				type: type,
				value: value,
				expandTo: expandTo,
				module: module,
				location: "start",
				inverted: false
			};
		}
		return null;
	},
	getTraits: function getTraits(traitName, parsed) {
		if (traitName !== "expandPair") {
			return;
		}

		return parsed.reduce(function (tags, part, offset) {
			if (part.type === "placeholder" && part.module === moduleName) {
				tags.push({ part: part, offset: offset });
			}
			return tags;
		}, []);
	},
	postparse: function postparse(parsed, _ref) {
		var basePart = _ref.basePart;

		if (!isEnclosedByParagraphs(parsed)) {
			return parsed;
		}
		if (!basePart || basePart.expandTo !== "auto") {
			return parsed;
		}
		var chunks = chunkBy(parsed, function (p) {
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
		var firstChunk = chunks[0];
		var lastChunk = last(chunks);
		var firstOffset = getOffset(firstChunk);
		var lastOffset = getOffset(lastChunk);
		if (firstOffset === 0 || lastOffset === 0) {
			return parsed;
		}
		var result = parsed.slice(firstOffset, parsed.length - lastOffset);
		return result;
	},
	render: function render(part, options) {
		if (!part.type === "placeholder" || part.module !== moduleName) {
			return null;
		}
		var totalValue = [];
		var errors = [];
		function loopOver(scope) {
			var scopeManager = options.scopeManager.createSubScopeManager(scope, part.value);
			var subRendered = options.render(mergeObjects({}, options, {
				compiled: part.subparsed,
				tags: {},
				scopeManager: scopeManager
			}));
			totalValue = totalValue.concat(subRendered.parts);
			errors = errors.concat(subRendered.errors || []);
		}
		options.scopeManager.loopOver(part.value, loopOver, part.inverted);
		return { value: totalValue.join(""), errors: errors };
	}
};

module.exports = function () {
	return wrapper(loopModule);
};