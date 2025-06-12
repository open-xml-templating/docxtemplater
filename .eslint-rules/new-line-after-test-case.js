module.exports = {
	meta: {
		type: "layout",
		docs: {
			description:
				"Require blank line after it()/describe() unless followed by another it/describe or closing brace",
		},
		fixable: "whitespace",
		schema: [],
	},

	create(context) {
		const sourceCode = context.getSourceCode();

		return {
			ExpressionStatement(node) {
				const expr = node.expression;

				if (
					expr.type !== "CallExpression" ||
					!["it", "describe"].includes(expr.callee.name)
				) {
					return;
				}

				const closingToken = sourceCode.getLastToken(node);
				const nextToken = sourceCode.getTokenAfter(closingToken, {
					includeComments: true,
				});
				if (!nextToken) return;

				const endLine = closingToken.loc.end.line;
				const nextLine = nextToken.loc.start.line;
				const linesBetween = nextLine - endLine;

				// ✅ Skip if next token is a closing brace (})
				if (nextToken.type === "Punctuator" && nextToken.value === "}") {
					return;
				}

				// ✅ Skip if next is another it/describe
				const nextNode = sourceCode.getNodeByRangeIndex(nextToken.range[0]);
				if (
					nextNode?.type === "ExpressionStatement" &&
					nextNode.expression?.type === "CallExpression" &&
					["it", "describe"].includes(nextNode.expression.callee.name)
				) {
					return;
				}

				if (linesBetween === 1) {
					context.report({
						node,
						message: `Expected blank line after ${expr.callee.name}() block.`,
						fix(fixer) {
							return fixer.insertTextAfter(closingToken, "\n");
						},
					});
				}
			},
		};
	},
};
