"use strict";

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

module.exports = {
	XTError,
	XTTemplateError,
	XTInternalError,
	XTScopeParserError,
};
