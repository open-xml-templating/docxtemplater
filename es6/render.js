const {
	throwUnimplementedTagType,
	XTScopeParserError,
} = require("./errors.js");
const { pushArray } = require("./doc-utils.js");
const getResolvedId = require("./get-resolved-id.js");

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
	options.nullGetter = (part, sm) => baseNullGetter(part, sm || scopeManager);
	const errors = [];
	const parts = compiled
		.map((part, i) => {
			options.index = i;
			options.resolvedId = getResolvedId(part, options);
			let moduleRendered;
			try {
				moduleRendered = moduleRender(part, options);
			} catch (e) {
				if (e instanceof XTScopeParserError) {
					errors.push(e);
					return part;
				}
				throw e;
			}
			if (moduleRendered) {
				if (moduleRendered.errors) {
					Array.prototype.push.apply(errors, moduleRendered.errors);
				}
				return moduleRendered;
			}
			if (part.type === "content" || part.type === "tag") {
				return part;
			}
			throwUnimplementedTagType(part, i);
		})
		.reduce((parts, { value }) => {
			if (value instanceof Array) {
				pushArray(parts, value);
			} else if (value) {
				parts.push(value);
			}
			return parts;
		}, []);
	return { errors, parts };
}

module.exports = render;
