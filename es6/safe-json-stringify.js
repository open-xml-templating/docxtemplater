function safeStringify(obj) {
	const cache = [];

	return JSON.stringify(
		obj,
		(key, value) => {
			if (typeof value === "object" && value !== null) {
				if (cache.indexOf(value) !== -1) {
					// Circular reference found
					return;
				}
				cache.push(value);
			}
			return value;
		},
		null
	);
}

module.exports = safeStringify;
