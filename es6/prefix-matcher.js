const nbspRegex = new RegExp(String.fromCharCode(160), "g");
function replaceNbsps(str) {
	return str.replace(nbspRegex, " ");
}

function match(condition, placeHolderContent) {
	if (typeof condition === "string") {
		return (
			replaceNbsps(placeHolderContent.substr(0, condition.length)) === condition
		);
	}
	if (condition instanceof RegExp) {
		return condition.test(replaceNbsps(placeHolderContent));
	}
}
function getValue(condition, placeHolderContent) {
	if (typeof condition === "string") {
		return replaceNbsps(placeHolderContent).substr(condition.length);
	}
	if (condition instanceof RegExp) {
		return replaceNbsps(placeHolderContent).match(condition)[1];
	}
}

function getValues(condition, placeHolderContent) {
	if (condition instanceof RegExp) {
		return replaceNbsps(placeHolderContent).match(condition);
	}
}

module.exports = {
	match,
	getValue,
	getValues,
};
