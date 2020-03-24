"use strict";

const { concatArrays } = require("./doc-utils");
const { throwUnimplementedTagType } = require("./errors");

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
	const baseNullGetter = options.baseNullGetter;
	const { compiled, scopeManager } = options;
	options.nullGetter = (part, sm) => {
		return baseNullGetter(part, sm || scopeManager);
	};
	if (!options.prefix) {
		options.prefix = "";
	}
	if (options.index) {
		options.prefix = options.prefix + options.index + "-";
	}
	let errors = [];
	const parts = compiled.map(function (part, i) {
		options.index = i;
		const moduleRendered = moduleRender(part, options);
		if (moduleRendered) {
			if (moduleRendered.errors) {
				errors = concatArrays([errors, moduleRendered.errors]);
			}
			return moduleRendered.value;
		}
		if (part.type === "content" || part.type === "tag") {
			return part.value;
		}
		throwUnimplementedTagType(part, i);
	});
	return { errors, parts };
}

module.exports = render;
