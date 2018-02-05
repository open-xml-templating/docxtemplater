const expressions = require("angular-expressions");
function angularParser(tag) {
	const expr = expressions.compile(tag.replace(/’/g, "'"));
	return {
		get(scope) {
			return expr(scope);
		},
	};
}

module.exports = angularParser;
