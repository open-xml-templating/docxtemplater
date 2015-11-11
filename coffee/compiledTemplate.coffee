CompiledTemplate=class CompiledTemplate
	constructor:() ->
		@compiled = []
		this
	prependText:(text) ->
		@compiled.unshift(text)
		this
	appendTag:(compiledTag) ->
		if !compiledTag
			throw new Error "compiled tag empty!"
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
			throw new Error "subTemplate empty!"
		@compiled.push {type:'loop',tag, inverted, template:subTemplate}

module.exports=CompiledTemplate
