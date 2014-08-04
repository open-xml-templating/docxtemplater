root= global ? window
env= if global? then 'node' else 'browser'

#This class responsibility is to manage the scope

root.ScopeManager =	class ScopeManager
	constructor:(@tags,@scopePath,@usedTags,@currentScope,@parser)->
	loopOver:(tag,callback,inverted=false)->
		if inverted
			return callback(@currentScope) unless @getValue(tag)
			return if @getTypeOf(tag) == 'string'
			if @getTypeOf(tag) == 'object' && @getValue(tag).length < 1
				callback(@currentScope)
			return
		if !@getValue(tag)? then return
		if @getTypeOf(tag) == 'object'
			for scope,i in @getValue(tag)
				callback(scope)
		if @getValue(tag) == true
			callback(@currentScope)
	get:(tag)->
		@currentScope[tag]
	getTypeOf:(tag)->
		typeof @getValue(tag)
	getValue:(tag)->
		parser=@parser(tag)
		result=parser.get(@currentScope)
		result

	getValueFromScope: (tag) ->
		result=@getValue(tag)
		if result?
			if typeof result=='string'
				@useTag(tag)
				value= result
				if value.indexOf(DocUtils.tags.start)!=-1 or value.indexOf(DocUtils.tags.end)!=-1
					throw new Error("You can't enter #{DocUtils.tags.start} or	#{DocUtils.tags.end} inside the content of a variable")
			else if typeof result=="number"
				value=String(result)
			else value= result
		else
			@useTag(tag)
			value= "undefined"
		value
	#set the tag as used, so that DocxGen can return the list off all tags
	useTag: (tag) ->
		u = @usedTags
		for s,i in @scopePath
			u[s]={} unless u[s]?
			u = u[s]
		if tag!=""
			u[tag]= true
