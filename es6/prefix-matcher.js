const nbspRegex = new RegExp(String.fromCharCode(160), "g");
function replaceNbsps(str) {
	return str.replace(nbspRegex, " ");
}

function match(condition, placeHolderContent) {
	const type = typeof condition;
	if (type === "string") {
		return (
			replaceNbsps(placeHolderContent.substr(0, condition.length)) ===
			condition
		);
	}
	if (condition instanceof RegExp) {
		return condition.test(replaceNbsps(placeHolderContent));
	}
	if (type === "function") {
		return !!condition(placeHolderContent);
	}
}
function getValue(condition, placeHolderContent) {
	const type = typeof condition;
	if (type === "string") {
		return replaceNbsps(placeHolderContent).substr(condition.length);
	}
	if (condition instanceof RegExp) {
		return replaceNbsps(placeHolderContent).match(condition)[1];
	}
	if (type === "function") {
		return condition(placeHolderContent);
	}
}

function getValues(condition, placeHolderContent) {
	const type = typeof condition;
	if (type === "string") {
		return [
			placeHolderContent,
			replaceNbsps(placeHolderContent).substr(condition.length),
		];
	}
	if (condition instanceof RegExp) {
		return replaceNbsps(placeHolderContent).match(condition);
	}
	if (type === "function") {
		return [placeHolderContent, condition(placeHolderContent)];
	}
}

module.exports = {
	match,
	getValue,
	getValues,
};
