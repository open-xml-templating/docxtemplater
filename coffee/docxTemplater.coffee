root= global ? window
env= if global? then 'node' else 'browser'

DocXTemplater = class DocXTemplater extends XmlTemplater
	xmlUtil=new XmlUtil()
	constructor:(content="",options={}) ->
		super("",options)
		@currentClass=DocXTemplater
		@tagX='w:t'
		if typeof content=="string" then @load content else throw "content must be string!"
	calcIntellegentlyDashElement:()->
		{content,start,end}= @findOuterTagsContent()
		scopeContent= xmlUtil.getListXmlElements @content, start,end-start
		for t in scopeContent
			if t.tag=='<w:tc>'
				return 'w:tr'
		return super()

root.DocXTemplater=DocXTemplater
