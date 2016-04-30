"use strict";

function XTError(message) {
	this.name = "GenericError";
	this.message = message;
	this.stack = (new Error()).stack;
}
XTError.prototype = new Error();

function XTTemplateError(message) {
	this.name = "TemplateError";
	this.message = message;
	this.stack = (new Error()).stack;
}
XTTemplateError.prototype = new XTError();

function XTScopeParserError(message) {
	this.name = "ScopeParserError";
	this.message = message;
	this.stack = (new Error()).stack;
}
XTScopeParserError.prototype = new XTError();

function XTInternalError(message) {
	this.name = "InternalError";
	this.properties = {explanation: "InternalError"};
	this.message = message;
	this.stack = (new Error()).stack;
}
XTInternalError.prototype = new XTError();

module.exports = {
	XTError: XTError,
	XTTemplateError: XTTemplateError,
	XTInternalError: XTInternalError,
	XTScopeParserError: XTScopeParserError,
};
