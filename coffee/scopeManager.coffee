root= global ? window
env= if global? then 'node' else 'browser'

#This class responsibility is to manage the scope

root.ScopeManager =  class ScopeManager
	constructor:(@tags,@scopePath)->
