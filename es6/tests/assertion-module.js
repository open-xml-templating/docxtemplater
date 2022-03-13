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
	constructor() {
		this.name = "AssertionModule";
	}
	optionsTransformer(options, docxtemplater) {
		docxtemplater.modules.forEach(function (module) {
			if (!module.name) {
				throw new Error("Unnamed module");
			}
		});
		return options;
	}
	preparse(parsed) {
		if (!isArray(parsed)) {
			throw new Error("Parsed should be an array");
		}
	}
	matchers(options) {
		if (!isArray(options.modules)) {
			throw new Error("Options.modules should be an array");
		}
		return [];
	}
	parse(placeholderContent, options) {
		if (!isString(placeholderContent)) {
			throw new Error("placeholderContent should be a string");
		}
		const { type, position, filePath, contentType, lIndex } = options;
		if (typeof type !== "string") {
			throw new Error("parsed contains part without type");
		}
		if (type !== "delimiter") {
			throw new Error(`parsed contains part with invalid type : '${type}'`);
		}
		if (position !== "end") {
			throw new Error(
				`parsed contains part with invalid position : '${position}'`
			);
		}
		if (typeof filePath !== "string" || filePath.length === 0) {
			throw new Error("parsed contains part without filePath");
		}
		if (typeof contentType !== "string" || contentType.length === 0) {
			throw new Error("parsed contains part without contentType");
		}
		if (!lIndex) {
			throw new Error("parsed contains part without lIndex");
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
		function logContext(parsed, i) {
			const context = parsed.slice(i - 2, i + 2);
			// eslint-disable-next-line no-console
			console.log(JSON.stringify({ context }));
		}
		parsed.forEach(function (part, i) {
			if (part == null) {
				logContext(parsed, i);
				throw new Error("postparsed contains nullish value");
			}
			if (!part) {
				logContext(parsed, i);
				throw new Error("postparsed contains falsy value");
			}
			if (typeof part.type !== "string") {
				logContext(parsed, i);
				throw new Error("postparsed contains part without type");
			}
			if (["content", "tag", "placeholder"].indexOf(part.type) === -1) {
				logContext(parsed, i);
				throw new Error(
					`postparsed contains part with invalid type : '${part.type}'`
				);
			}
		});
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
