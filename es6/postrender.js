"use strict";

function postrender(parts, options) {
	for (let i = 0, l = options.modules.length; i < l; i++) {
		const module = options.modules[i];
		parts = module.postrender(parts, options);
	}
	const contains = options.fileTypeConfig.tagShouldContain || [];
	return options.joinUncorrupt(parts, contains);
}

module.exports = postrender;
