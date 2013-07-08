DocXTemplater = class DocXTemplater extends XmlTemplater
	constructor:(content="",creator,@templateVars={},@intelligentTagging=off,@scopePath=[],@usedTemplateVars={},@imageId=0) ->
		super(null,creator,@templateVars,@intelligentTagging,@scopePath,@usedTemplateVars,@imageId)
		@class=DocXTemplater
		@tagX='w:t'
		if typeof content=="string" then @load content else throw "content must be string!"

if window?
	window.DocXTemplater=DocXTemplater
else
	global.DocXTemplater=DocXTemplater