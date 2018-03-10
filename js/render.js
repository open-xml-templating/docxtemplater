"use strict";

var _require = require("./doc-utils"),
    utf8ToWord = _require.utf8ToWord,
    concatArrays = _require.concatArrays,
    hasCorruptCharacters = _require.hasCorruptCharacters;

var _require2 = require("./errors"),
    throwUnimplementedTagType = _require2.throwUnimplementedTagType,
    throwCorruptCharacters = _require2.throwCorruptCharacters;

function moduleRender(part, options) {
	var moduleRendered = void 0;
	for (var i = 0, l = options.modules.length; i < l; i++) {
		var _module = options.modules[i];
		moduleRendered = _module.render(part, options);
		if (moduleRendered) {
			return moduleRendered;
		}
	}
	return false;
}

function render(options) {
	var compiled = options.compiled,
	    scopeManager = options.scopeManager,
	    nullGetter = options.nullGetter;

	var errors = [];
	var parts = compiled.map(function (part) {
		var moduleRendered = moduleRender(part, options);
		if (moduleRendered) {
			if (moduleRendered.errors) {
				errors = concatArrays([errors, moduleRendered.errors]);
			}
			return moduleRendered.value;
		}
		if (part.type === "placeholder") {
			var value = scopeManager.getValue(part.value);
			if (value == null) {
				value = nullGetter(part);
			}
			if (hasCorruptCharacters(value)) {
				throwCorruptCharacters({ tag: part.value, value: value });
			}
			return utf8ToWord(value);
		}
		if (part.type === "content" || part.type === "tag") {
			return part.value;
		}
		throwUnimplementedTagType(part);
	});
	return { errors: errors, parts: parts };
}

module.exports = { render: render };