"use strict";

var XTError = function (message) {
	this.name = "GenericError";
	this.message = message;
	this.stack = (new Error()).stack;
};
XTError.prototype = new Error();

var XTTemplateError = function (message) {
	this.name = "TemplateError";
	this.message = message;
	this.stack = (new Error()).stack;
};
XTTemplateError.prototype = new XTError();

var XTScopeParserError = function (message) {
	this.name = "ScopeParserError";
	this.message = message;
	this.stack = (new Error()).stack;
};
XTScopeParserError.prototype = new XTError();

var XTInternalError = function (message) {
	this.name = "InternalError";
	this.properties = {explanation: "InternalError"};
	this.message = message;
	this.stack = (new Error()).stack;
};
XTInternalError.prototype = new XTError();

module.exports = {
	XTError: XTError,
	XTTemplateError: XTTemplateError,
	XTInternalError: XTInternalError,
	XTScopeParserError: XTScopeParserError,
};
