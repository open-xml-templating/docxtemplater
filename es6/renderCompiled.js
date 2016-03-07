"use strict";

var renderCompiled = function (compiled, tags, scopeManager) {
	return compiled.map(function (part) {
		if (typeof part === "string") {
			return part;
		}
		if (part.type === "loop") {
			var r = "";
			var callback = function (subTags) {
				var s = scopeManager.createSubScopeManager(subTags, part.tag);
				r += renderCompiled(part.template, subTags, s);
			};
			scopeManager.loopOver(part.tag, callback, part.inverted);
			return r;
		}
		if (part.type === "tag") {
			return scopeManager.getValueFromScope(part.tag);
		}
		throw new Error("Unimplemented tag type");
	}).join("");
};

module.exports = renderCompiled;
