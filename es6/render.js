const { throwUnimplementedTagType } = require("./errors.js");
const { XTScopeParserError } = require("./errors.js");

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
	const errors = [];
	const parts = compiled
		.map(function (part, i) {
			options.index = i;
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
		.reduce(function (parts, { value }) {
			if (value instanceof Array) {
				for (let i = 0, len = value.length; i < len; i++) {
					parts.push(value[i]);
				}
			} else if (value) {
				parts.push(value);
			}
			return parts;
		}, []);
	return { errors, parts };
}

module.exports = render;
