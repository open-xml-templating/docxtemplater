"use strict";

const {utf8ToWord, concatArrays} = require("./doc-utils");
const {throwUnimplementedTagType} = require("./errors");

function moduleRender(part, options) {
	let moduleRendered;
	for (let i = 0, l = options.modules.length; i < l; i++) {
		const module = options.modules[i];
		moduleRendered = module.render(part, options);
		if (moduleRendered) {
			return moduleRendered;
		}
	}
	return false;
}

function render(options) {
	const {compiled, scopeManager, nullGetter} = options;
	let errors = [];
	const parts = compiled.map(function (part) {
		const moduleRendered = moduleRender(part, options);
		if (moduleRendered) {
			if (moduleRendered.errors) {
				errors = concatArrays([errors, moduleRendered.errors]);
			}
			return moduleRendered.value;
		}
		if (part.type === "placeholder") {
			let value = scopeManager.getValue(part.value);
			if (value == null) {
				value = nullGetter(part);
			}
			return utf8ToWord(value);
		}
		if (part.type === "content" || part.type === "tag") {
			return part.value;
		}
		throwUnimplementedTagType(part);
	});
	return {errors, parts};
}

module.exports = {render};
