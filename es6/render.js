"use strict";

const ScopeManager = require("./scope-manager");
const DocUtils = require("./doc-utils");
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
	options.render = render;
	options.modules = options.modules;
	if (!options.scopeManager) {
		options.scopeManager = ScopeManager.createBaseScopeManager(options);
	}
	let errors = [];
	const parts = options.compiled.map(function (part) {
		const moduleRendered = moduleRender(part, options);
		if (moduleRendered) {
			if (moduleRendered.errors) {
				errors = errors.concat(moduleRendered.errors);
			}
			return moduleRendered.value;
		}
		if (part.type === "placeholder") {
			let value = options.scopeManager.getValue(part.value);
			if (value == null) {
				value = options.nullGetter(part);
			}
			return DocUtils.utf8ToWord(value);
		}
		if (part.type === "content" || part.type === "tag") {
			return part.value;
		}
		throwUnimplementedTagType(part);
	});
	return {errors, parts};
}

module.exports = render;
