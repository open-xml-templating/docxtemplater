root= global ? window
env= if global? then 'node' else 'browser'

root.DocXTemplater = class DocXTemplater extends XmlTemplater
	xmlUtil=new XmlUtil()
	constructor:(content="",options={}) ->
		super("",options)
		@currentClass=root.DocXTemplater
		@tagXml='w:t'
		if typeof content=="string" then @load content else throw new Error("content must be string!")
	calcIntellegentlyDashElement:()->
		{content,start,end}= @templaterState.findOuterTagsContent(@content)
		scopeContent= xmlUtil.getListXmlElements @content, start,end-start
		for t in scopeContent
			if t.tag=='<w:tc>'
				return 'w:tr'
		return super()
