const expressions = require("angular-expressions");
const merge = require("lodash/merge");

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
			const num = context.num;
			for (let i = 0, len = num + 1; i < len; i++) {
				obj = merge(obj, scopeList[i]);
			}
			return expr(scope, obj);
		},
	};
}

module.exports = angularParser;
