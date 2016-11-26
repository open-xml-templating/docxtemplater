"use strict";

function memoize(func) {
	const stringifyJson = JSON.stringify,
		cache = {};
	function cachedfun() {
		const hash = stringifyJson(arguments);
		return (hash in cache) ? cache[hash] : cache[hash] = func.apply(this, arguments);
	}
	return cachedfun;
}

module.exports = memoize;
