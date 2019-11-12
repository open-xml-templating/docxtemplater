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
			let obj = {};
			const scopeList = context.scopeList;
			for (let i = 0, len = scopeList.length; i < len; i++) {
				obj = { ...obj, ...scopeList[i] };
			}
			return expr(null, obj);
		},
	};
}

module.exports = angularParser;
