const expressions = require("angular-expressions");

function reverseArray(arr) {
	const newArray = [];
	for (let i = arr.length - 1; i >= 0; i--) {
		newArray.push(arr[i]);
	}
	return newArray;
}

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
		get(s, options) {
			const reversed = reverseArray(options.scopeList);
			return expr(...reversed);
		},
	};
}

module.exports = angularParser;
