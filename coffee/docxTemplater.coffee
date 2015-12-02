XmlTemplater=require('./xmlTemplater')
SubContent=require('./subContent')
xmlUtil=require('./xmlUtil')

DocXTemplater = class DocXTemplater extends XmlTemplater
	constructor:(content="",options={}) ->
		super("",options)
		@currentClass=DocXTemplater
		@tagXml='w:t'
		@tagRawXml='w:p'
		@load content
	calcIntellegentlyDashElement:()->
		{content,start,end} = new SubContent(@content).getOuterLoop(@templaterState)
		scopeContent= xmlUtil.getListXmlElements @content, start,end-start
		for t in scopeContent
			if t.tag=='<w:tc>'
				return 'w:tr'
		return super()

module.exports=DocXTemplater
