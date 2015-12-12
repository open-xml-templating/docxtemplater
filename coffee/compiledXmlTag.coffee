CompiledXmlTag=class CompiledXmlTag
	constructor:(compiled=[]) -> @set(compiled)
	set:(compiled=[])->
		if @null then return this
		@compiled=[]
		for text in compiled
			if text!=''
				@compiled.push(text)
		this
	prependText:(text) ->
		if @null then return this
		if text!=''
			@compiled.unshift(text)
		this
	appendText:(text) ->
		if @null then return this
		if text!=''
			@compiled.push(text)
		this

CompiledXmlTag.null = () ->
	obj = new CompiledXmlTag()
	obj.null = true
	obj

module.exports=CompiledXmlTag
