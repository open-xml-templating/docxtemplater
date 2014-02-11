root= global ? window
env= if global? then 'node' else 'browser'

DocXTemplater = class DocXTemplater extends XmlTemplater
	constructor:(content="",options={}) ->
		super("",options)
		@currentClass=DocXTemplater
		@tagX='w:t'
		if typeof content=="string" then @load content else throw "content must be string!"

root.DocXTemplater=DocXTemplater
