"use strict";

function renderCompiled(compiled, tags, scopeManager) {
	return compiled.map(function (part) {
		var r = "";
		function callback(subTags) {
			var s = scopeManager.createSubScopeManager(subTags, part.tag);
			r += renderCompiled(part.template, subTags, s);
		}
		if (typeof part === "string") {
			return part;
		}
		if (part.type === "loop") {
			scopeManager.loopOver(part.tag, callback, part.inverted);
			return r;
		}
		if (part.type === "tag") {
			return scopeManager.getValueFromScope(part.tag);
		}
		throw new Error("Unimplemented tag type");
	}).join("");
}

module.exports = renderCompiled;
