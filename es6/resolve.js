const getResolvedId = require("./get-resolved-id.js");

function moduleResolve(part, options) {
	for (const module of options.modules) {
		const moduleResolved = module.resolve(part, options);
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
	options.nullGetter = (part, sm) => baseNullGetter(part, sm || scopeManager);
	options.resolved = resolved;
	const errors = [];

	return Promise.all(
		compiled
			.filter((part) => ["content", "tag"].indexOf(part.type) === -1)
			.reduce((promises, part) => {
				const moduleResolved = moduleResolve(part, {
					...options,
					resolvedId: getResolvedId(part, options),
				});
				let result;
				if (moduleResolved) {
					result = moduleResolved.then((value) => {
						resolved.push({ tag: part.value, lIndex: part.lIndex, value });
					});
				} else if (part.type === "placeholder") {
					result = scopeManager
						.getValueAsync(part.value, { part })
						.then((value) => (value == null ? options.nullGetter(part) : value))
						.then((value) => {
							resolved.push({
								tag: part.value,
								lIndex: part.lIndex,
								value,
							});
							return value;
						});
				} else {
					return;
				}
				promises.push(
					result.catch((e) => {
						if (e instanceof Array) {
							errors.push(...e);
						} else {
							errors.push(e);
						}
					})
				);
				return promises;
			}, [])
	).then(() => ({ errors, resolved }));
}

module.exports = resolve;
