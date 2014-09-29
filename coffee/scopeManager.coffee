#This class responsibility is to manage the scope
DocUtils=require('./docUtils')

module.exports=class ScopeManager
	constructor:(@tags,@scopePath,@usedTags,@currentScope,@parser)->
	loopOver:(tag,callback,inverted=false)->
		value = @getValue(tag)
		type = typeof value
		if inverted
			return callback(@currentScope) unless value
			return if type == 'string'
			if type == 'object' && value.length < 1
				callback(@currentScope)
			return
		return unless value?
		if type == 'object'
			for scope,i in value
				callback(scope)
		if value == true
			callback(@currentScope)
	getValue:(tag)->
		parser=@parser(DocUtils.wordToUtf8(tag))
		result=parser.get(@currentScope)
	getValueFromScope: (tag) ->
		result=@getValue(tag)
		if result?
			if typeof result=='string'
				@useTag(tag)
				value= result
				if value.indexOf(DocUtils.tags.start)!=-1 or value.indexOf(DocUtils.tags.end)!=-1
					throw new Error("You can't enter #{DocUtils.tags.start} or	#{DocUtils.tags.end} inside the content of the variable. Tag: #{tag}, Value: #{result}")
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
