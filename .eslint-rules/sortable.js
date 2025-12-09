const naturalCompare = require("natural-compare");

function difference(a, b) {
	const setB = new Set(b);
	return a.filter((x) => !setB.has(x));
}

function intersectSafe(a, b) {
	let ai = 0,
		bi = 0;
	const result = [];

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
			disallowedKey: "Object literal contains disallowed key '{{key}}'.",
		},
	},

	create(ctx) {
		// Parse options
		const order = ctx.options[0] || "asc";
		const options = ctx.options[1];
		const insensitive = (options && options.caseSensitive) === false;
		const natural = Boolean(options && options.natural);
		const minKeys = Number(options && options.minKeys) || 2;
		const sortedVars = [
			[
				"rawXmlTest",
				"noInternals",
				"it",
				"content",
				"contentText",
				"async",
				"pptx",
				"options",
				"delimiters",
				"scope",
				"error",
				"errorType",
				"resolved",
				"result",
				"resultText",
				"assertBefore",
				"assertAfter",
				"xmllexed",
				"lexed",
				"parsed",
				"postparsed",
			],
			[
				"constructor",
				"name",
				"requiredAPIVersion",
				"clone",
				// Before render
				"on",
				"set",
				"getFileType",
				"optionsTransformer",
				"preparse",
				"matchers",
				"parse",
				"getTraits",
				"postparse",
				"errorsTransformer",
				// After render :
				"preResolve",
				"resolve",
				"getRenderedMap",
				"render",
				"nullGetter",
				"postrender",
				"*",
			],
			[
				"async",
				"name",
				"expectedName",
				"expectedText",
				"data",
				"options",
			],
		];
		const allowedVars = sortedVars.flat();

		// The stack to save the previous property's name for each object literals
		let stack = null;
		function checkAndReport(
			node,
			stack,
			ctx,
			order,
			insensitive,
			natural,
			minKeys,
			sortedVars,
			allowedVars
		) {
			const isObject = node.parent.type === "ObjectExpression";
			const isClass = node.parent.type === "ClassBody";
			if (!isObject && !isClass) return;
			const members = isObject
				? node.parent.properties
				: node.parent.body;
			if (members.length < minKeys) return;
			function getNames(mems) {
				const names = [];
				for (const mem of mems) {
					const name = getPropertyName(mem);
					if (name) {
						names.push(name);
					}
				}
				return names;
			}
			const names = getNames(members);
			let hasRelevantIntersect = false;
			let specialMatched = false;
			for (const vars of sortedVars) {
				const intersect = intersectSafe(names, vars);
				if (intersect.length > 1) {
					hasRelevantIntersect = true;
					if (vars.includes("*")) {
						specialMatched = true;
					}
				}
			}
			// Check for disallowed keys (extras) only if relevant intersect and not special matched
			if (
				hasRelevantIntersect &&
				!specialMatched &&
				!node.parent.__reportedExtras
			) {
				node.parent.__reportedExtras = true;
				const extras = difference(names, allowedVars);
				if (extras.length > 0) {
					for (const mem of members) {
						const name = getPropertyName(mem);
						if (name && extras.includes(name)) {
							ctx.report({
								node: mem,
								loc:
									mem.type === "SpreadElement" ||
									mem.type === "ExperimentalSpreadProperty"
										? mem.argument.loc
										: mem.key
											? mem.key.loc
											: mem.loc,
								messageId: "disallowedKey",
								data: {
									key: name,
								},
							});
						}
					}
				}
			}
			for (const vars of sortedVars) {
				const intersect = intersectSafe(names, vars);
				if (intersect.length <= 1) {
					continue;
				}
				const prevName = stack.prevName;
				const prevNode = stack.prevNode;
				const thisName = getPropertyName(node);
				if (thisName !== null) {
					stack.prevName = thisName;
					stack.prevNode = node || prevNode;
				}
				if (prevName === null || thisName === null) {
					continue;
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
						loc:
							node.type === "SpreadElement" ||
							node.type === "ExperimentalSpreadProperty"
								? node.argument.loc
								: node.key
									? node.key.loc
									: node.loc,
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
								(isObject
									? node.parent.properties.__alreadySorted
									: node.parent.body.__alreadySorted)
							) {
								return [];
							}
							node.parent.__alreadySorted = true;
							if (isObject) {
								node.parent.properties.__alreadySorted = true;
							} else {
								node.parent.body.__alreadySorted = true;
							}
							//
							const src = ctx.getSourceCode();
							const originalMembers = members;
							// Split into parts on each spread operator (empty key), but include special spread
							const parts = [];
							let part = [];
							for (const p of originalMembers) {
								const isSpread =
									p.type === "SpreadElement" ||
									p.type === "ExperimentalSpreadProperty";
								const isSpecialSpread =
									isSpread &&
									p.argument &&
									p.argument.name === "noInternals";
								if (isSpread && !isSpecialSpread) {
									parts.push(part);
									part = [];
								} else {
									part.push(p);
								}
							}
							parts.push(part);
							// Sort all parts
							for (const part of parts) {
								part.sort((p1, p2) => {
									const n1 = getPropertyName(p1);
									const n2 = getPropertyName(p2);
									if (
										insensitive &&
										n1.toLowerCase() === n2.toLowerCase()
									) {
										return 0;
									}
									const index1 = vars.indexOf(n1);
									const index2 = vars.indexOf(n2);
									if (index1 === -1 && index2 === -1) {
										return 0;
									}
									if (index1 === -1) {
										return 1;
									}
									if (index2 === -1) {
										return -1;
									}
									return index1 < index2
										? -1
										: index1 > index2
											? 1
											: 0;
								});
							}
							// Perform fixes
							const fixes = [];
							let newIndex = 0;
							for (let i = 0; i < parts.length; i++) {
								const part = parts[i];
								for (const p of part) {
									for (const f of moveProperty(
										p,
										originalMembers[newIndex],
										fixer,
										src
									)) {
										fixes.push(f);
									}
									newIndex++;
								}
								if (i < parts.length - 1) {
									newIndex++; // skip spread
								}
							}
							return fixes;
						},
					});
				}
			}
		}

		const handleSpread = (node) => {
			if (node.parent.type !== "ObjectExpression") return;
			const isSpecial =
				node.argument && node.argument.name === "noInternals";
			if (!isSpecial) {
				stack.prevName = null;
				return;
			}
			checkAndReport(
				node,
				stack,
				ctx,
				order,
				insensitive,
				natural,
				minKeys,
				sortedVars,
				allowedVars
			);
		};

		return {
			ExperimentalSpreadProperty: handleSpread,
			SpreadElement: handleSpread,
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
				checkAndReport(
					node,
					stack,
					ctx,
					order,
					insensitive,
					natural,
					minKeys,
					sortedVars,
					allowedVars
				);
			},
			ClassBody() {
				stack = {
					upper: stack,
					prevName: null,
					prevNode: null,
				};
			},
			"ClassBody:exit"() {
				stack = stack.upper;
			},
			MethodDefinition(node) {
				if (node.parent.type !== "ClassBody") {
					return;
				}
				checkAndReport(
					node,
					stack,
					ctx,
					order,
					insensitive,
					natural,
					minKeys,
					sortedVars,
					allowedVars
				);
			},
			ClassProperty(node) {
				if (node.parent.type !== "ClassBody") {
					return;
				}
				checkAndReport(
					node,
					stack,
					ctx,
					order,
					insensitive,
					natural,
					minKeys,
					sortedVars,
					allowedVars
				);
			},
		};
	},
};

const moveProperty = (thisNode, toNode, fixer, src) => {
	if (thisNode === toNode) {
		return [];
	}
	const isObject = thisNode.parent.type === "ObjectExpression";
	const sep = isObject ? "," : ";";
	const findSepSameLine = (node, s) => {
		const t = s.getTokenAfter(node);
		return t && t.value === sep && node.loc.end.line === t.loc.start.line
			? t
			: null;
	};
	const fixes = [];
	// Move property
	fixes.push(fixer.replaceText(toNode, src.getText(thisNode)));
	// Move comments on top of this property, but do not move comments
	// on the same line with the previous property
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
	const next = findSepSameLine(thisNode, src) || thisNode;
	const commentsAfter = src
		.getCommentsAfter(next)
		.filter((c) => thisNode.loc.end.line === c.loc.start.line);
	if (commentsAfter.length) {
		const b = next.range[1];
		const e = commentsAfter[commentsAfter.length - 1].range[1];
		fixes.push(fixer.replaceTextRange([b, e], ""));
		const toNext = findSepSameLine(toNode, src) || toNode;
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
		case "ClassProperty":
			prop = node.key;
			break;
		case "MemberExpression":
			prop = node.property;
			break;
		case "SpreadElement":
		case "ExperimentalSpreadProperty":
			return node.argument.name;
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
