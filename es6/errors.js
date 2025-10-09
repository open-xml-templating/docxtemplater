const { last, first } = require("./utils.js");

function XTError(message) {
	this.name = "GenericError";
	this.message = message;
	this.stack = new Error(message).stack;
}
XTError.prototype = Error.prototype;

function XTTemplateError(message) {
	this.name = "TemplateError";
	this.message = message;
	this.stack = new Error(message).stack;
}
XTTemplateError.prototype = new XTError();

function XTRenderingError(message) {
	this.name = "RenderingError";
	this.message = message;
	this.stack = new Error(message).stack;
}
XTRenderingError.prototype = new XTError();

function XTScopeParserError(message) {
	this.name = "ScopeParserError";
	this.message = message;
	this.stack = new Error(message).stack;
}
XTScopeParserError.prototype = new XTError();

function XTInternalError(message) {
	this.name = "InternalError";
	this.properties = { explanation: "InternalError" };
	this.message = message;
	this.stack = new Error(message).stack;
}
XTInternalError.prototype = new XTError();

function XTAPIVersionError(message) {
	this.name = "APIVersionError";
	this.properties = { explanation: "APIVersionError" };
	this.message = message;
	this.stack = new Error(message).stack;
}
XTAPIVersionError.prototype = new XTError();

function throwApiVersionError(msg, properties) {
	const err = new XTAPIVersionError(msg);
	err.properties = {
		id: "api_version_error",
		...properties,
	};
	throw err;
}

function throwMultiError(errors) {
	const err = new XTTemplateError("Multi error");
	err.properties = {
		errors,
		id: "multi_error",
		explanation: "The template has multiple errors",
	};
	throw err;
}

function getUnopenedTagException(options) {
	const err = new XTTemplateError("Unopened tag");
	err.properties = {
		xtag: last(options.xtag.split(" ")),
		id: "unopened_tag",
		context: options.xtag,
		offset: options.offset,
		lIndex: options.lIndex,
		explanation: `The tag beginning with "${options.xtag.substr(
			0,
			10
		)}" is unopened`,
	};
	return err;
}

function getDuplicateOpenTagException(options) {
	const err = new XTTemplateError(
		"Duplicate open tag, expected one open tag"
	);
	err.properties = {
		xtag: first(options.xtag.split(" ")),
		id: "duplicate_open_tag",
		context: options.xtag,
		offset: options.offset,
		lIndex: options.lIndex,
		explanation: `The tag beginning with "${options.xtag.substr(
			0,
			10
		)}" has duplicate open tags`,
	};
	return err;
}

function getDuplicateCloseTagException(options) {
	const err = new XTTemplateError(
		"Duplicate close tag, expected one close tag"
	);
	err.properties = {
		xtag: first(options.xtag.split(" ")),
		id: "duplicate_close_tag",
		context: options.xtag,
		offset: options.offset,
		lIndex: options.lIndex,
		explanation: `The tag ending with "${options.xtag.substr(
			0,
			10
		)}" has duplicate close tags`,
	};
	return err;
}

function getUnclosedTagException(options) {
	const err = new XTTemplateError("Unclosed tag");
	err.properties = {
		xtag: first(options.xtag.split(" ")).substr(1),
		id: "unclosed_tag",
		context: options.xtag,
		offset: options.offset,
		lIndex: options.lIndex,
		explanation: `The tag beginning with "${options.xtag.substr(
			0,
			10
		)}" is unclosed`,
	};
	return err;
}

function throwXmlTagNotFound(options) {
	const err = new XTTemplateError(
		`No tag "${options.element}" was found at the ${options.position}`
	);
	const part = options.parsed[options.index];
	err.properties = {
		id: `no_xml_tag_found_at_${options.position}`,
		explanation: `No tag "${options.element}" was found at the ${options.position}`,
		offset: part.offset,
		part,
		parsed: options.parsed,
		index: options.index,
		element: options.element,
	};
	throw err;
}

function getCorruptCharactersException({ tag, value, offset }) {
	const err = new XTRenderingError("There are some XML corrupt characters");
	err.properties = {
		id: "invalid_xml_characters",
		xtag: tag,
		value,
		offset,
		explanation: `There are some corrupt characters for the field ${tag}`,
	};
	return err;
}

function getInvalidRawXMLValueException({ tag, value, offset }) {
	const err = new XTRenderingError(
		"Non string values are not allowed for rawXML tags"
	);
	err.properties = {
		id: "invalid_raw_xml_value",
		xtag: tag,
		value,
		offset,
		explanation: `The value of the raw tag : '${tag}' is not a string`,
	};
	return err;
}

function throwExpandNotFound(options) {
	const {
		part: { value, offset },
		id = "raw_tag_outerxml_invalid",
		message = "Raw tag not in paragraph",
	} = options;
	const { part } = options;
	let { explanation = `The tag "${value}" is not inside a paragraph` } =
		options;
	if (typeof explanation === "function") {
		explanation = explanation(part);
	}
	const err = new XTTemplateError(message);
	err.properties = {
		id,
		explanation,
		rootError: options.rootError,
		xtag: value,
		offset,
		postparsed: options.postparsed,
		expandTo: options.expandTo,
		index: options.index,
	};
	throw err;
}

function throwRawTagShouldBeOnlyTextInParagraph(options) {
	const err = new XTTemplateError(
		"Raw tag should be the only text in paragraph"
	);
	const tag = options.part.value;
	err.properties = {
		id: "raw_xml_tag_should_be_only_text_in_paragraph",
		explanation: `The raw tag "${tag}" should be the only text in this paragraph. This means that this tag should not be surrounded by any text or spaces.`,
		xtag: tag,
		offset: options.part.offset,
		paragraphParts: options.paragraphParts,
	};
	throw err;
}

function getUnmatchedLoopException(part) {
	const { location, offset, square } = part;
	const t = location === "start" ? "unclosed" : "unopened";
	const T = location === "start" ? "Unclosed" : "Unopened";

	const err = new XTTemplateError(`${T} loop`);
	const tag = part.value;
	err.properties = {
		id: `${t}_loop`,
		explanation: `The loop with tag "${tag}" is ${t}`,
		xtag: tag,
		offset,
	};
	if (square) {
		err.properties.square = square;
	}
	return err;
}

function getUnbalancedLoopException(pair, lastPair) {
	const err = new XTTemplateError("Unbalanced loop tag");
	const lastL = lastPair[0].part.value;
	const lastR = lastPair[1].part.value;
	const l = pair[0].part.value;
	const r = pair[1].part.value;
	err.properties = {
		id: "unbalanced_loop_tags",
		explanation: `Unbalanced loop tags {#${lastL}}{/${lastR}}{#${l}}{/${r}}`,
		offset: [lastPair[0].part.offset, pair[1].part.offset],
		lastPair: {
			left: lastPair[0].part.value,
			right: lastPair[1].part.value,
		},
		pair: {
			left: pair[0].part.value,
			right: pair[1].part.value,
		},
	};
	return err;
}

function getClosingTagNotMatchOpeningTag({ tags }) {
	const err = new XTTemplateError("Closing tag does not match opening tag");
	err.properties = {
		id: "closing_tag_does_not_match_opening_tag",
		explanation: `The tag "${tags[0].value}" is closed by the tag "${tags[1].value}"`,
		openingtag: first(tags).value,
		offset: [first(tags).offset, last(tags).offset],
		closingtag: last(tags).value,
	};
	if (first(tags).square) {
		err.properties.square = [first(tags).square, last(tags).square];
	}
	return err;
}

function getScopeCompilationError({ tag, rootError, offset }) {
	const err = new XTScopeParserError("Scope parser compilation failed");
	err.properties = {
		id: "scopeparser_compilation_failed",
		offset,
		xtag: tag,
		explanation: `The scope parser for the tag "${tag}" failed to compile`,
		rootError,
	};
	return err;
}

function getScopeParserExecutionError({ tag, scope, error, offset }) {
	const err = new XTScopeParserError("Scope parser execution failed");
	err.properties = {
		id: "scopeparser_execution_failed",
		explanation: `The scope parser for the tag ${tag} failed to execute`,
		scope,
		offset,
		xtag: tag,
		rootError: error,
	};
	return err;
}

function getLoopPositionProducesInvalidXMLError({ tag, offset }) {
	const err = new XTTemplateError(
		`The position of the loop tags "${tag}" would produce invalid XML`
	);
	err.properties = {
		xtag: tag,
		id: "loop_position_invalid",
		explanation: `The tags "${tag}" are misplaced in the document, for example one of them is in a table and the other one outside the table`,
		offset,
	};
	return err;
}

function throwUnimplementedTagType(part, index) {
	let errorMsg = `Unimplemented tag type "${part.type}"`;
	if (part.module) {
		errorMsg += ` "${part.module}"`;
	}
	const err = new XTTemplateError(errorMsg);
	err.properties = {
		part,
		index,
		id: "unimplemented_tag_type",
	};
	throw err;
}

function throwMalformedXml() {
	const err = new XTInternalError("Malformed xml");
	err.properties = {
		explanation: "The template contains malformed xml",
		id: "malformed_xml",
	};
	throw err;
}

function throwResolveBeforeCompile() {
	const err = new XTInternalError(
		"You must run `.compile()` before running `.resolveData()`"
	);
	err.properties = {
		id: "resolve_before_compile",
		explanation:
			"You must run `.compile()` before running `.resolveData()`",
	};
	throw err;
}

function throwRenderInvalidTemplate() {
	const err = new XTInternalError(
		"You should not call .render on a document that had compilation errors"
	);
	err.properties = {
		id: "render_on_invalid_template",
		explanation:
			"You should not call .render on a document that had compilation errors",
	};
	throw err;
}

function throwRenderTwice() {
	const err = new XTInternalError(
		"You should not call .render twice on the same docxtemplater instance"
	);
	err.properties = {
		id: "render_twice",
		explanation:
			"You should not call .render twice on the same docxtemplater instance",
	};
	throw err;
}

function throwFileTypeNotIdentified(zip) {
	const files = Object.keys(zip.files).slice(0, 10);
	let msg = "";
	if (files.length === 0) {
		msg = "Empty zip file";
	} else {
		msg = `Zip file contains : ${files.join(",")}`;
	}

	const err = new XTInternalError(
		`The filetype for this file could not be identified, is this file corrupted ? ${msg}`
	);
	err.properties = {
		id: "filetype_not_identified",
		explanation: `The filetype for this file could not be identified, is this file corrupted ? ${msg}`,
	};
	throw err;
}

function throwXmlInvalid(content, offset) {
	const err = new XTTemplateError("An XML file has invalid xml");
	err.properties = {
		id: "file_has_invalid_xml",
		content,
		offset,
		explanation: "The docx contains invalid XML, it is most likely corrupt",
	};
	throw err;
}

function throwFileTypeNotHandled(fileType) {
	const err = new XTInternalError(
		`The filetype "${fileType}" is not handled by docxtemplater`
	);
	err.properties = {
		id: "filetype_not_handled",
		explanation: `The file you are trying to generate is of type "${fileType}", but only docx and pptx formats are handled`,
		fileType,
	};
	throw err;
}

module.exports = {
	XTError,
	XTTemplateError,
	XTInternalError,
	XTScopeParserError,
	XTAPIVersionError,
	// Remove this alias in v4
	RenderingError: XTRenderingError,
	XTRenderingError,

	getClosingTagNotMatchOpeningTag,
	getLoopPositionProducesInvalidXMLError,
	getScopeCompilationError,
	getScopeParserExecutionError,
	getUnclosedTagException,
	getUnopenedTagException,
	getUnmatchedLoopException,
	getDuplicateCloseTagException,
	getDuplicateOpenTagException,
	getCorruptCharactersException,
	getInvalidRawXMLValueException,
	getUnbalancedLoopException,

	throwApiVersionError,
	throwFileTypeNotHandled,
	throwFileTypeNotIdentified,
	throwMalformedXml,
	throwMultiError,
	throwExpandNotFound,
	throwRawTagShouldBeOnlyTextInParagraph,
	throwUnimplementedTagType,
	throwXmlTagNotFound,
	throwXmlInvalid,
	throwResolveBeforeCompile,
	throwRenderInvalidTemplate,
	throwRenderTwice,
};
