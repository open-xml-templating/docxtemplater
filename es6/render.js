const {
	throwUnimplementedTagType,
	XTScopeParserError,
} = require("./errors.js");
const { pushArray } = require("./doc-utils.js");
const getResolvedId = require("./get-resolved-id.js");

function moduleRender(part, options) {
	for (const module of options.modules) {
		const moduleRendered = module.render(part, options);
		if (moduleRendered) {
			return moduleRendered;
		}
	}
	return false;
}

function render(options) {
	const baseNullGetter = options.baseNullGetter;
	const { compiled, scopeManager } = options;
	options.nullGetter = (part, sm) => baseNullGetter(part, sm || scopeManager);
	const errors = [];
	const parts = [];
	for (let i = 0, len = compiled.length; i < len; i++) {
		const part = compiled[i];
		options.index = i;
		options.resolvedId = getResolvedId(part, options);
		let moduleRendered;
		try {
			moduleRendered = moduleRender(part, options);
		} catch (e) {
			if (e instanceof XTScopeParserError) {
				errors.push(e);
				parts.push(part);
				continue;
			}
			throw e;
		}
		if (moduleRendered) {
			if (moduleRendered.errors) {
				pushArray(errors, moduleRendered.errors);
			}
			parts.push(moduleRendered);
			continue;
		}
		if (part.type === "content" || part.type === "tag") {
			parts.push(part);
			continue;
		}
		throwUnimplementedTagType(part, i);
	}

	// This is done in two steps because for some files, it is possible to #edit-value-backwards
	const totalParts = [];
	for (const { value } of parts) {
		if (value instanceof Array) {
			pushArray(totalParts, value);
		} else if (value) {
			totalParts.push(value);
		}
	}
	return { errors, parts: totalParts };
}

module.exports = render;
