"use strict";
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
	const err = new XTTemplateError("Duplicate open tag, expected one open tag");
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
		explanation: "There are some corrupt characters for the field ${tag}",
	};
	return err;
}

function throwContentMustBeString(type) {
	const err = new XTInternalError("Content must be a string");
	err.properties.id = "xmltemplater_content_must_be_string";
	err.properties.type = type;
	throw err;
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
	const { location, offset } = part;
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
	return err;
}

function getScopeCompilationError({ tag, rootError, offset }) {
	const err = new XTScopeParserError("Scope parser compilation failed");
	err.properties = {
		id: "scopeparser_compilation_failed",
		offset,
		tag,
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
		tag,
		rootError: error,
	};
	return err;
}

function getLoopPositionProducesInvalidXMLError({ tag, offset }) {
	const err = new XTTemplateError(
		`The position of the loop tags "${tag}" would produce invalid XML`
	);
	err.properties = {
		tag,
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

function throwMalformedXml(part) {
	const err = new XTInternalError("Malformed xml");
	err.properties = {
		part,
		id: "malformed_xml",
	};
	throw err;
}

function throwLocationInvalid(part) {
	throw new XTInternalError(
		`Location should be one of "start" or "end" (given : ${part.location})`
	);
}

function throwResolveBeforeCompile() {
	const err = new XTInternalError(
		"You must run `.compile()` before running `.resolveData()`"
	);
	err.properties = {
		id: "resolve_before_compile",
	};
	throw err;
}

function throwRenderInvalidTemplate() {
	const err = new XTInternalError(
		"You should not call .render on a document that had compilation errors"
	);
	err.properties = {
		id: "render_on_invalid_template",
	};
	throw err;
}

function throwFileTypeNotIdentified() {
	const err = new XTInternalError(
		"The filetype for this file could not be identified, is this file corrupted ?"
	);
	err.properties = {
		id: "filetype_not_identified",
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
	getUnbalancedLoopException,

	throwApiVersionError,
	throwContentMustBeString,
	throwFileTypeNotHandled,
	throwFileTypeNotIdentified,
	throwLocationInvalid,
	throwMalformedXml,
	throwMultiError,
	throwExpandNotFound,
	throwRawTagShouldBeOnlyTextInParagraph,
	throwUnimplementedTagType,
	throwXmlTagNotFound,
	throwXmlInvalid,
	throwResolveBeforeCompile,
	throwRenderInvalidTemplate,
};
