const naturalCompare = require("natural-compare");

function intersectSafe(a, b) {
	var ai = 0,
		bi = 0;
	var result = [];

	while (ai < a.length && bi < b.length) {
		if (a[ai] < b[bi]) {
			ai++;
		} else if (a[ai] > b[bi]) {
			bi++;
		} /* they're equal */ else {
			result.push(a[ai]);
			ai++;
			bi++;
		}
	}

	return result;
}

module.exports = {
	meta: {
		type: "suggestion",
		fixable: "code",
		docs: {
			description: "require object keys to be sorted",
			category: "Stylistic Issues",
			recommended: false,
			url: "https://github.com/namnm/eslint-plugin-sort-keys",
		},
		schema: [
			{
				enum: ["asc", "desc"],
			},
			{
				type: "object",
				properties: {
					caseSensitive: {
						type: "boolean",
						default: true,
					},
					natural: {
						type: "boolean",
						default: false,
					},
					minKeys: {
						type: "integer",
						minimum: 2,
						default: 2,
					},
				},
				additionalProperties: false,
			},
		],
		messages: {
			sortKeys:
				"Expected object keys to be in {{natural}}{{insensitive}}{{order}}ending order. '{{thisName}}' should be before '{{prevName}}'.",
		},
	},

	create(ctx) {
		// Parse options
		const order = ctx.options[0] || "asc";
		const options = ctx.options[1];
		const insensitive = (options && options.caseSensitive) === false;
		const natural = Boolean(options && options.natural);
		const minKeys = Number(options && options.minKeys) || 2;
		// The stack to save the previous property's name for each object literals
		let stack = null;
		// Shared SpreadElement for ExperimentalSpreadProperty
		const SpreadElement = (node) => {
			if (node.parent.type === "ObjectExpression") {
				stack.prevName = null;
			}
		};
		return {
			ExperimentalSpreadProperty: SpreadElement,
			SpreadElement,

			ObjectExpression() {
				stack = {
					upper: stack,
					prevName: null,
					prevNode: null,
				};
			},
			"ObjectExpression:exit"() {
				stack = stack.upper;
			},

			Property(node) {
				if (node.parent.type === "ObjectPattern") {
					return;
				}
				if (node.parent.properties.length < minKeys) {
					return;
				}
				function getNames(node) {
					const { properties } = node;
					const names = [];
					properties.forEach(function (prop) {
						if (prop.key && prop.key.name) {
							names.push(prop.key.name);
						}
					});
					return names;
				}
				const names = getNames(node.parent);
				const sortedVars = [
					[
						"it",
						"content",
						"options",
						"scope",
						"error",
						"errorType",
						"resolved",
						"result",
						"xmllexed",
						"lexed",
						"parsed",
						"postparsed",
					],
					["preparse", "parse", "postparse", "constructor"],
				];
				sortedVars.forEach(function (vars) {
					const intersect = intersectSafe(names, vars);
					if (intersect.length <= 1) {
						return;
					}

					const prevName = stack.prevName;
					const prevNode = stack.prevNode;
					const thisName = getPropertyName(node);

					if (thisName !== null) {
						stack.prevName = thisName;
						stack.prevNode = node || prevNode;
					}

					if (prevName === null || thisName === null) {
						return;
					}

					const isValidOrder = function (prevName, thisName) {
						const indexPrev = vars.indexOf(prevName);
						const indexThis = vars.indexOf(thisName);
						if (indexPrev === -1 || indexThis === -1) {
							return true;
						}
						if (indexPrev < indexThis) {
							return true;
						}
						return false;
					};

					if (!isValidOrder(prevName, thisName)) {
						ctx.report({
							node,
							loc: node.key.loc,
							messageId: "sortKeys",
							data: {
								thisName,
								prevName,
								order,
								insensitive: insensitive ? "insensitive " : "",
								natural: natural ? "natural " : "",
							},
							fix(fixer) {
								// Check if already sorted
								if (
									node.parent.__alreadySorted ||
									node.parent.properties.__alreadySorted
								) {
									return [];
								}
								node.parent.__alreadySorted = true;
								node.parent.properties.__alreadySorted = true;
								//
								const src = ctx.getSourceCode();
								const props = node.parent.properties;
								// Split into parts on each spread operator (empty key)
								const parts = [];
								let part = [];
								props.forEach((p) => {
									if (!p.key) {
										parts.push(part);
										part = [];
									} else {
										part.push(p);
									}
								});
								parts.push(part);
								// Sort all parts
								parts.forEach((part) => {
									part.sort((p1, p2) => {
										const n1 = getPropertyName(p1);
										const n2 = getPropertyName(p2);
										if (insensitive && n1.toLowerCase() === n2.toLowerCase()) {
											return 0;
										}
										return isValidOrder(n1, n2) ? -1 : 1;
									});
								});
								// Perform fixes
								const fixes = [];
								let newIndex = 0;
								parts.forEach((part) => {
									part.forEach((p) => {
										moveProperty(p, props[newIndex], fixer, src).forEach((f) =>
											fixes.push(f)
										);
										newIndex++;
									});
									newIndex++;
								});
								return fixes;
							},
						});
					}
				});
			},
		};
	},
};

const moveProperty = (thisNode, toNode, fixer, src) => {
	if (thisNode === toNode) {
		return [];
	}
	const fixes = [];
	// Move property
	fixes.push(fixer.replaceText(toNode, src.getText(thisNode)));
	// Move comments on top of this property, but do not move comments
	//    on the same line with the previous property
	const prev = findTokenPrevLine(thisNode, src);
	const cond = (c) => !prev || prev.loc.end.line !== c.loc.start.line;
	const commentsBefore = src.getCommentsBefore(thisNode).filter(cond);
	if (commentsBefore.length) {
		const prevComments = src
			.getCommentsBefore(thisNode)
			.filter((c) => !cond(c));
		const b = prevComments.length
			? prevComments[prevComments.length - 1].range[1]
			: prev
			? prev.range[1]
			: commentsBefore[0].range[0];
		const e = commentsBefore[commentsBefore.length - 1].range[1];
		fixes.push(fixer.replaceTextRange([b, e], ""));
		const toPrev = src.getTokenBefore(toNode, { includeComments: true });
		const txt = src.text.substring(b, e);
		fixes.push(fixer.insertTextAfter(toPrev, txt));
	}
	// Move comments on the same line with this property
	const next = findCommaSameLine(thisNode, src) || thisNode;
	const commentsAfter = src
		.getCommentsAfter(next)
		.filter((c) => thisNode.loc.end.line === c.loc.start.line);
	if (commentsAfter.length) {
		const b = next.range[1];
		const e = commentsAfter[commentsAfter.length - 1].range[1];
		fixes.push(fixer.replaceTextRange([b, e], ""));
		const toNext = findCommaSameLine(toNode, src) || toNode;
		const txt = src.text.substring(b, e);
		fixes.push(fixer.insertTextAfter(toNext, txt));
	}
	return fixes;
};
const findTokenPrevLine = (node, src) => {
	let t = src.getTokenBefore(node);
	while (true) {
		if (!t || t.range[0] < node.parent.range[0]) {
			return null;
		}
		if (t.loc.end.line < node.loc.start.line) {
			return t;
		}
		t = src.getTokenBefore(t);
	}
};
const findCommaSameLine = (node, src) => {
	const t = src.getTokenAfter(node);
	return t && t.value === "," && node.loc.end.line === t.loc.start.line
		? t
		: null;
};

const isValidOrders = {
	asc: (a, b) => a <= b,
	ascI: (a, b) => a.toLowerCase() <= b.toLowerCase(),
	ascN: (a, b) => naturalCompare(a, b) <= 0,
	ascIN: (a, b) => naturalCompare(a.toLowerCase(), b.toLowerCase()) <= 0,
	desc: (a, b) => isValidOrders.asc(b, a),
	descI: (a, b) => isValidOrders.ascI(b, a),
	descN: (a, b) => isValidOrders.ascN(b, a),
	descIN: (a, b) => isValidOrders.ascIN(b, a),
};

const getPropertyName = (node) => {
	let prop;
	switch (node && node.type) {
		case "Property":
		case "MethodDefinition":
			prop = node.key;
			break;
		case "MemberExpression":
			prop = node.property;
			break;
	}
	switch (prop && prop.type) {
		case "Literal":
			return String(prop.value);
		case "TemplateLiteral":
			if (prop.expressions.length === 0 && prop.quasis.length === 1) {
				return prop.quasis[0].value.cooked;
			}
			break;
		case "Identifier":
			if (!node.computed) {
				return prop.name;
			}
			break;
	}
	return (node.key && node.key.name) || null;
};
