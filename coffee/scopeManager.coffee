root= global ? window
env= if global? then 'node' else 'browser'

#This class responsibility is to manage the scope

root.ScopeManager =  class ScopeManager
	constructor:(@tags,@scopePath,@usedTags,@currentScope,@parser)->
	getValueFromScope: (tag) ->
		parser=@parser(tag)
		result=parser.get(@currentScope)
		if result?
			if typeof result=='string'
				@useTag(tag)
				value= result
				if value.indexOf('{')!=-1 or value.indexOf('}')!=-1
					throw "You can't enter { or  } inside the content of a variable"
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
