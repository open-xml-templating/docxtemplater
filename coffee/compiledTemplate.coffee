Errors = require("./errors")

CompiledTemplate=class CompiledTemplate
	constructor:() ->
		@compiled = []
		this
	prependText:(text) ->
		@compiled.unshift(text)
		this
	appendTag:(compiledTag) ->
		if !compiledTag
			err = new Errors.XTInternalError("Compiled tag empty")
			err.properties.id = "tag_appended_empty"
			throw err
		@compiled = @compiled.concat(compiledTag.compiled)
		this
	appendRaw:(tag) ->
		@compiled.push({type:'raw',tag})
		this
	appendText:(text) ->
		if text!=''
			@compiled.push(text)
		this
	appendSubTemplate:(subTemplate,tag, inverted) ->
		if !subTemplate
			err = new Errors.XTInternalError("Subtemplate empty")
			err.properties.id = "subtemplate_appended_empty"
			throw err
		@compiled.push {type:'loop',tag, inverted, template:subTemplate}

module.exports=CompiledTemplate
