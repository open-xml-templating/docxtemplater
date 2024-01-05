const getResolvedId = require("./get-resolved-id.js");

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
			.filter(function (part) {
				return ["content", "tag"].indexOf(part.type) === -1;
			})
			.reduce(function (promises, part) {
				options.resolvedId = getResolvedId(part, options);
				const moduleResolved = moduleResolve(part, {
					...options,
					resolvedId: getResolvedId(part, options),
				});
				let result;
				if (moduleResolved) {
					result = moduleResolved.then(function (value) {
						resolved.push({ tag: part.value, lIndex: part.lIndex, value });
					});
				} else if (part.type === "placeholder") {
					result = scopeManager
						.getValueAsync(part.value, { part })
						.then(function (value) {
							return value == null ? options.nullGetter(part) : value;
						})
						.then(function (value) {
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
					result.catch(function (e) {
						if (e instanceof Array) {
							errors.push(...e);
						} else {
							errors.push(e);
						}
					})
				);
				return promises;
			}, [])
	).then(function () {
		return { errors, resolved };
	});
}

module.exports = resolve;
