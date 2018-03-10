"use strict";

var expressions = require("angular-expressions");
function angularParser(tag) {
	var expr = expressions.compile(tag.replace(/’/g, "'"));
	return {
		get: function get(scope) {
			return expr(scope);
		}
	};
}

module.exports = angularParser;