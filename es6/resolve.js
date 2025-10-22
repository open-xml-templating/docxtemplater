const { pushArray } = require("./doc-utils.js");
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

function resolvePart(part, resolved, errors, options) {
	const moduleResolved = moduleResolve(part, {
		...options,
		resolvedId: getResolvedId(part, options),
	});
	if (moduleResolved) {
		return moduleResolved
			.then((value) => {
				resolved.push({
					tag: part.value,
					lIndex: part.lIndex,
					value,
				});
			})
			.catch((e) => {
				if (e instanceof Array) {
					pushArray(errors, e);
				} else {
					errors.push(e);
				}
			});
	}
	if (part.type === "placeholder") {
		return options.scopeManager
			.getValueAsync(part.value, { part })
			.then((value) => (value == null ? options.nullGetter(part) : value))
			.then((value) => {
				resolved.push({
					tag: part.value,
					lIndex: part.lIndex,
					value,
				});
			})
			.catch((e) => {
				if (e instanceof Array) {
					pushArray(errors, e);
				} else {
					errors.push(e);
				}
			});
	}
}

function resolve(options) {
	const resolved = [];
	const errors = [];
	const { baseNullGetter } = options;
	const { scopeManager } = options;
	options.nullGetter = (part, sm) => baseNullGetter(part, sm || scopeManager);
	options.resolved = resolved;

	const p = resolveSerial(options, errors, resolved);
	if (p) {
		return p.then(() => resolveParallel(options, errors, resolved));
	}
	return resolveParallel(options, errors, resolved);
}

function resolveSerial(options, errors, resolved) {
	let p = null;
	for (const part of options.compiled) {
		if (["content", "tag"].indexOf(part.type) !== -1) {
			continue;
		}
		if (part.resolveFirst) {
			p ??= Promise.resolve(null);
			p = p.then(() => resolvePart(part, resolved, errors, options));
		}
	}
	return p;
}

function resolveParallel(options, errors, resolved) {
	const promises = [];
	for (const part of options.compiled) {
		if (["content", "tag"].indexOf(part.type) !== -1) {
			continue;
		}
		if (!part.resolveFirst) {
			promises.push(resolvePart(part, resolved, errors, options));
		}
	}

	return Promise.all(promises).then(() => ({ errors, resolved }));
}

module.exports = resolve;
