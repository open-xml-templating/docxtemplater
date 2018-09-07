function match(condition, placeHolderContent) {
	if (typeof condition === "string") {
		return placeHolderContent.substr(0, condition.length) === condition;
	}
	if (condition instanceof RegExp) {
		return condition.test(placeHolderContent);
	}
}
function getValue(condition, placeHolderContent) {
	if (typeof condition === "string") {
		return placeHolderContent.substr(condition.length);
	}
	if (condition instanceof RegExp) {
		return placeHolderContent.match(condition)[1];
	}
}

function getValues(condition, placeHolderContent) {
	if (condition instanceof RegExp) {
		return placeHolderContent.match(condition);
	}
}

module.exports = {
	match,
	getValue,
	getValues,
};
