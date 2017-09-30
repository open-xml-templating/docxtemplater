"use strict";

function first(a) {
	return a[0];
}
function last(a) {
	return a[a.length - 1];
}
function XTError(message) {
	this.name = "GenericError";
	this.message = message;
	this.stack = (new Error(message)).stack;
}
XTError.prototype = Error.prototype;

function XTTemplateError(message) {
	this.name = "TemplateError";
	this.message = message;
	this.stack = (new Error(message)).stack;
}
XTTemplateError.prototype = new XTError();

function RenderingError(message) {
	this.name = "RenderingError";
	this.message = message;
	this.stack = (new Error(message)).stack;
}
RenderingError.prototype = new XTError();

function XTScopeParserError(message) {
	this.name = "ScopeParserError";
	this.message = message;
	this.stack = (new Error(message)).stack;
}
XTScopeParserError.prototype = new XTError();

function XTInternalError(message) {
	this.name = "InternalError";
	this.properties = {explanation: "InternalError"};
	this.message = message;
	this.stack = (new Error(message)).stack;
}
XTInternalError.prototype = new XTError();

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
		explanation: `The tag beginning with "${options.xtag.substr(0, 10)}" is unopened`,
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
		explanation: `The tag beginning with "${options.xtag.substr(0, 10)}" is unclosed`,
	};
	return err;
}

function throwXmlTagNotFound(options) {
	const err = new XTTemplateError(`No tag "${options.element}" was found at the ${options.position}`);
	err.properties = {
		id: `no_xml_tag_found_at_${options.position}`,
		explanation: `No tag "${options.element}" was found at the ${options.position}`,
		parsed: options.parsed,
		index: options.index,
		element: options.element,
	};
	throw err;
}

function throwDecodeUTF8Error(s) {
	const err = new XTInternalError("End");
	err.properties = {
		id: "utf8_decode",
		data: s,
		explanation: "Could not decode string to UTF8",
	};
	throw err;
}

function throwContentMustBeString(type) {
	const err = new XTInternalError("Content must be a string");
	err.properties.id = "xmltemplater_content_must_be_string";
	err.properties.type = type;
	throw err;
}

function throwRawTagNotInParagraph(options) {
	const err = new XTTemplateError("Raw tag not in paragraph");
	const {part: {value, offset}} = options;
	err.properties = {
		id: "raw_tag_outerxml_invalid",
		explanation: `The tag "${value}" is not inside a paragraph`,
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
	const err = new XTTemplateError("Raw tag should be the only text in paragraph");
	const tag = options.part.value;
	err.properties = {
		id: "raw_xml_tag_should_be_only_text_in_paragraph",
		explanation: `The tag "${tag}" should be the only text in this paragraph`,
		xtag: options.part.value,
		offset: options.part.offset,
		paragraphParts: options.paragraphParts,
	};
	throw err;
}

function getUnmatchedLoopException(options) {
	const {location} = options;
	const t = location === "start" ? "unclosed" : "unopened";
	const T = location === "start" ? "Unclosed" : "Unopened";

	const err = new XTTemplateError(`${T} loop`);
	const tag = options.part.value;
	err.properties = {
		id: `${t}_loop`,
		explanation: `The loop with tag "${tag}" is ${t}`,
		xtag: tag,
	};
	return err;
}

function getClosingTagNotMatchOpeningTag(options) {
	const {tags} = options;

	const err = new XTTemplateError("Closing tag does not match opening tag");
	err.properties = {
		id: "closing_tag_does_not_match_opening_tag",
		explanation: `The tag "${tags[0].value}" is closed by the tag "${tags[1].value}"`,
		openingtag: tags[0].value,
		offset: [tags[0].offset, tags[1].offset],
		closingtag: tags[1].value,
	};
	return err;
}

function getScopeCompilationError({tag, rootError}) {
	const err = new XTScopeParserError("Scope parser compilation failed");
	err.properties = {
		id: "scopeparser_compilation_failed",
		tag,
		explanation: `The scope parser for the tag "${tag}" failed to compile`,
		rootError,
	};
	return err;
}

function getLoopPositionProducesInvalidXMLError({tag}) {
	const err = new XTTemplateError(`The position of the loop tags "${tag}" would produce invalid XML`);
	err.properties = {
		tag,
		id: "loop_position_invalid",
		explanation: `The tags "${tag}" are misplaced in the document, for example one of them is in a table and the other one outside the table`,
	};
	return err;
}

function throwUnimplementedTagType(part) {
	const err = new XTTemplateError(`Unimplemented tag type "${part.type}"`);
	err.properties = {
		part,
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
	throw new XTInternalError(`Location should be one of "start" or "end" (given : ${part.location})`);
}

function throwFileTypeNotHandled(fileType) {
	const err = new XTInternalError(`The filetype "${fileType}" is not handled by docxtemplater`);
	err.properties = {
		id: "filetype_not_handled",
		explanation: `The file you are trying to generate is of type "${fileType}", but only docx and pptx formats are handled`,
	};
	throw err;
}

function throwFileTypeNotIdentified() {
	const err = new XTInternalError("The filetype for this file could not be identified, is this file corrupted ?");
	err.properties = {
		id: "filetype_not_identified",
	};
	throw err;
}

module.exports = {
	XTError,
	XTTemplateError,
	XTInternalError,
	XTScopeParserError,
	RenderingError,
	throwMultiError,
	throwXmlTagNotFound,
	throwDecodeUTF8Error,
	throwContentMustBeString,
	getUnmatchedLoopException,
	throwRawTagShouldBeOnlyTextInParagraph,
	throwRawTagNotInParagraph,
	getClosingTagNotMatchOpeningTag,
	throwUnimplementedTagType,
	getScopeCompilationError,
	getUnopenedTagException,
	getUnclosedTagException,
	throwMalformedXml,
	throwFileTypeNotIdentified,
	throwFileTypeNotHandled,
	getLoopPositionProducesInvalidXMLError,
	throwLocationInvalid,
};
