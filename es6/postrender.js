"use strict";

function postrender(parts, options) {
	for (let i = 0, l = options.modules.length; i < l; i++) {
		const module = options.modules[i];
		parts = module.postrender(parts, options);
	}
	// Before doing this "uncorruption" method here, this was done with the `part.emptyValue` trick, however, there were some corruptions that were not handled, for example with a template like this :
	//
	// ------------------------------------------------
	// | {-w:p falsy}My para{/falsy}   |              |
	// | {-w:p falsy}My para{/falsy}   |              |
	// ------------------------------------------------
	const contains = options.fileTypeConfig.tagShouldContain || [];
	let collecting = "";
	let currentlyCollecting = -1;
	return parts.reduce(function(full, part) {
		for (let i = 0, len = contains.length; i < len; i++) {
			const { tag, shouldContain, value } = contains[i];
			if (currentlyCollecting === i) {
				if (part === `</${tag}>`) {
					currentlyCollecting = -1;
					return full + collecting + value + part;
				}
				collecting += part;
				if (part.trim().indexOf(`<${shouldContain}`) !== -1) {
					currentlyCollecting = -1;
					return full + collecting;
				}
				return full;
			}
			if (currentlyCollecting === -1 && part.indexOf(`<${tag}`) === 0) {
				currentlyCollecting = i;
				collecting = part;
				return full;
			}
		}
		return full + part;
	}, "");
}

module.exports = postrender;
