const expressions = require("angular-expressions");

function angularParser(tag) {
	if (tag === ".") {
		return {
			get(s) {
				return s;
			},
		};
	}
	const expr = expressions.compile(tag.replace(/(’|“|”|‘)/g, "'"));
	return {
		get(scope, context) {
			return expr(...context.scopeList);
		},
	};
}

module.exports = angularParser;
