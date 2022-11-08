const expressions = require("angular-expressions");

function angularParser(tag) {
	tag = tag
		.replace(/^\s*\.\s*$/, "this")
		.replace(/[’‘]/g, "'")
		.replace(/[“”]/g, '"');
	const expr = expressions.compile(tag);
	// isAngularAssignment will be true if your tag contains an Assignment, for example
	// when you write the following in your template :
	// {full_name = first_name + last_name}
	// In that case, it makes sense to return an empty string so
	// that the tag does not write something to the generated document.
	const isAngularAssignment =
		expr.ast.body[0] &&
		expr.ast.body[0].expression.type === "AssignmentExpression";

	return {
		get(scope, context) {
			const scopeList = context.scopeList;
			const index = context.scopePathItem[context.scopePathItem.length - 1];

			const px = new Proxy(
				{},
				{
					get(target, name) {
						if (name === "$index") {
							return index;
						}
						if (scope[name]) {
							const property = scope[name];
							return typeof property === "function"
								? property.bind(scope)
								: property;
						}
						for (let i = scopeList.length - 1; i >= 0; i--) {
							const s = scopeList[i];
							if (s[name]) {
								const property = s[name];
								return typeof property === "function"
									? property.bind(s)
									: property;
							}
						}
						return null;
					},
					has(target, name) {
						if (name === "$index") {
							return true;
						}
						if (scope[name]) {
							return true;
						}
						for (let i = scopeList.length - 1; i >= 0; i--) {
							const s = scopeList[i];
							if (s[name]) {
								return true;
							}
						}
						return false;
					},
					set(target, name, value) {
						if (typeof scope === "object" && scope) {
							scope[name] = value;
							return value;
						}
						for (let i = scopeList.length - 1; i >= 0; i--) {
							const s = scopeList[i];
							if (typeof s === "object" && s) {
								s[name] = value;
								return value;
							}
						}
						return value;
					},
				}
			);

			const result = expr(px, px);
			if (isAngularAssignment) {
				return "";
			}
			return result;
		},
	};
}
angularParser.filters = expressions.filters;

module.exports = angularParser;
