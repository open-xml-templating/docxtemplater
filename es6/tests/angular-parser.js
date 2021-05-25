const expressions = require("angular-expressions");
const assign = require("lodash/assign.js");
const last = require("lodash/last.js");

function angularParser(tag) {
	if (tag === ".") {
		return {
			get(s) {
				return s;
			},
		};
	}
	const expr = expressions.compile(
		tag.replace(/(’|‘)/g, "'").replace(/(“|”)/g, '"')
	);
	// isAngularAssignment will be true if your tag contains a `=`, for example
	// when you write the following in your template :
	// {full_name = first_name + last_name}
	// In that case, it makes sense to return an empty string so
	// that the tag does not write something to the generated document.
	const isAngularAssignment =
		expr.ast.body[0] &&
		expr.ast.body[0].expression.type === "AssignmentExpression";

	return {
		get(scope, context) {
			let obj = {};
			const scopeList = context.scopeList;
			const index = last(context.scopePathItem);
			const num = context.num;
			for (let i = 0, len = num + 1; i < len; i++) {
				obj = assign(obj, scopeList[i]);
			}
			obj = assign(obj, { $index: index });
			const result = expr(scope, obj);
			if (isAngularAssignment) {
				return "";
			}
			return result;
		},
	};
}

module.exports = angularParser;
