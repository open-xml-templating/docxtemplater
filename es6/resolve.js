"use strict";

function moduleResolve(part, options) {
	let moduleResolved;
	for (let i = 0, l = options.modules.length; i < l; i++) {
		const module = options.modules[i];
		moduleResolved = module.resolve(part, options);
		if (moduleResolved) {
			return moduleResolved;
		}
	}
	return false;
}

function resolve(options) {
	const resolved = [];
	const baseNullGetter = options.baseNullGetter;
	const { compiled, scopeManager } = options;
	const nullGetter = (options.nullGetter = (part, sm) => {
		return baseNullGetter(part, sm || scopeManager);
	});
	options.resolved = resolved;
	const errors = [];
	return Promise.all(
		compiled
			.map(function(part) {
				const moduleResolved = moduleResolve(part, options);
				if (moduleResolved) {
					return moduleResolved.then(function(value) {
						resolved.push({ tag: part.value, value });
					});
				}
				if (part.type === "placeholder") {
					return scopeManager.getValueAsync(part.value).then(function(value) {
						if (value == null) {
							value = nullGetter(part);
						}
						resolved.push({ tag: part.value, value });
						return value;
					});
				}
				return;
			})
			.filter(a => {
				return a;
			})
	).then(function() {
		return { errors, resolved };
	});
}

module.exports = resolve;
