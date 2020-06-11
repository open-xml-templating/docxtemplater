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
	options.nullGetter = (part, sm) => {
		return baseNullGetter(part, sm || scopeManager);
	};
	options.resolved = resolved;
	const errors = [];
	return Promise.all(
		compiled
			.map(function (part) {
				return Promise.resolve()
					.then(function () {
						const moduleResolved = moduleResolve(part, options);
						if (moduleResolved) {
							return moduleResolved.then(function (value) {
								resolved.push({ tag: part.value, value, lIndex: part.lIndex });
							});
						}
						if (part.type === "placeholder") {
							return scopeManager
								.getValueAsync(part.value, { part })
								.then(function (value) {
									if (value == null) {
										value = options.nullGetter(part);
									}
									resolved.push({
										tag: part.value,
										value,
										lIndex: part.lIndex,
									});
									return value;
								});
						}
						return;
					})
					.catch(function (e) {
						if (e.length > 1) {
							errors.push(...e);
						} else {
							errors.push(e);
						}
					});
			})
			.filter((a) => {
				return a;
			})
	).then(function () {
		return { errors, resolved };
	});
}

module.exports = resolve;
