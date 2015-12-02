XTError = (message)->
	this.name = "GenericError"
	this.message = message
	this.stack = (new Error()).stack
XTError.prototype = new Error

XTTemplateError = (message) ->
	this.name = "TemplateError"
	this.message = message
	this.stack = (new Error()).stack
XTTemplateError.prototype = new XTError

XTScopeParserError = (message) ->
	this.name = "ScopeParserError"
	this.message = message
	this.stack = (new Error()).stack
XTScopeParserError.prototype = new XTError

XTInternalError = (message) ->
	this.name = "InternalError"
	this.properties =
		explanation : "InternalError"
	this.message = message
	this.stack = (new Error()).stack
XTInternalError.prototype = new XTError

module.exports =
	XTError:XTError
	XTTemplateError:XTTemplateError
	XTInternalError:XTInternalError
	XTScopeParserError:XTScopeParserError
