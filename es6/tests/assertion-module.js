function logContext(parsed, i) {
	const context = parsed.slice(i - 2, i + 2);
	// eslint-disable-next-line no-console
	console.log(JSON.stringify({ context }));
}
function isArray(thing) {
	return thing instanceof Array;
}
function isObject(thing) {
	return thing instanceof Object && !isArray(thing);
}
function isString(thing) {
	return typeof thing === "string";
}

function verifyPart(part) {
	if (part == null) {
		throw new Error("postparsed contains nullish value");
	}
	if (!part) {
		throw new Error("postparsed contains falsy value");
	}
	if (typeof part.type !== "string") {
		throw new Error("postparsed contains part without type");
	}
	if (["content", "tag", "placeholder"].indexOf(part.type) === -1) {
		throw new Error(
			`postparsed contains part with invalid type : '${part.type}'`
		);
	}
}

function verifyOptions(options) {
	if (!isString(options.contentType)) {
		throw new Error("contentType should be a string");
	}
	if (!isString(options.filePath)) {
		throw new Error("filePath should be a string");
	}
	if (!isString(options.fileType)) {
		throw new Error("fileType should be a string");
	}
	if (!isObject(options.fileTypeConfig)) {
		throw new Error("fileTypeConfig should be an object");
	}
	if (!isObject(options.cachedParsers)) {
		throw new Error("cachedParsers should be an object");
	}
}

class AssertionModule {
	constructor() {
		this.name = "AssertionModule";
	}
	optionsTransformer(options, docxtemplater) {
		for (const module of docxtemplater.modules) {
			if (!module.name) {
				throw new Error("Unnamed module");
			}
		}
		return options;
	}
	clone() {
		return new AssertionModule();
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
			throw new Error(
				`parsed contains part with invalid type : '${type}'`
			);
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
	postparse(parsed, options) {
		verifyOptions(options);
		if (!isArray(parsed)) {
			throw new Error("Parsed should be an array");
		}
		for (let i = 0, len = parsed.length; i < len; i++) {
			const part = parsed[i];
			try {
				verifyPart(part);
			} catch (e) {
				logContext(parsed, i);
				throw e;
			}
		}
	}
	resolve(part, options) {
		verifyOptions(options);
	}

	render(part, options) {
		verifyPart(part);
		verifyOptions(options);
		if (!isObject(part)) {
			throw new Error("part should be an object");
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
