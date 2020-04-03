function isArray(thing) {
	return thing instanceof Array;
}
function isObject(thing) {
	return thing instanceof Object && !isArray(thing);
}
function isString(thing) {
	return typeof thing === "string";
}

class AssertionModule {
	preparse(parsed) {
		if (!isArray(parsed)) {
			throw new Error("Parsed should be an array");
		}
	}
	parse(placeholderContent) {
		if (!isString(placeholderContent)) {
			throw new Error("placeholderContent should be a string");
		}
	}
	postparse(parsed, { filePath, contentType }) {
		if (!isArray(parsed)) {
			throw new Error("Parsed should be an array");
		}
		if (!isString(filePath)) {
			throw new Error("filePath should be a string");
		}
		if (!isString(contentType)) {
			throw new Error("contentType should be a string");
		}
	}
	render(part, { filePath, contentType }) {
		if (!isObject(part)) {
			throw new Error("part should be an object");
		}
		if (!isString(filePath)) {
			throw new Error("filePath should be a string");
		}
		if (!isString(contentType)) {
			throw new Error("contentType should be a string");
		}
	}
	postrender(parts) {
		if (!isArray(parts)) {
			throw new Error("Parts should be an array");
		}
		return parts;
	}
}

module.exports = AssertionModule;
