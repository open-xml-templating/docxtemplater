"use strict";

const { concatArrays, utf8ToWord } = require("./doc-utils.js");
const { throwUnimplementedTagType } = require("./errors.js");

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
			if (part.position === "insidetag") {
				return utf8ToWord(part.value);
			}
			return part.value;
		}
		throwUnimplementedTagType(part, i);
	});
	return { errors, parts };
}

module.exports = render;
