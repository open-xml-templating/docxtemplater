root= global ? window
env= if global? then 'node' else 'browser'

#This class responsibility is to manage the scope

root.ScopeManager =  class ScopeManager
	constructor:(@tags,@scopePath,@usedTags,@currentScope,@parser)->
	useTag: (tag) ->
		u = @usedTags
		for s,i in @scopePath
			u[s]={} unless u[s]?
			u = u[s]
		if tag!=""
			u[tag]= true
