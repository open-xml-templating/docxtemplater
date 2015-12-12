XmlTemplater=require('./xmlTemplater')
xmlUtil=require('./xmlUtil')
SubContent=require('./subContent')

PptXTemplater = class PptXTemplater extends XmlTemplater
	constructor:(content="",options={}) ->
		super(content,options)
		@currentClass=PptXTemplater
		@tagsXmlArray=['a:t', 'm:t']
		@tagXml='a:t'
		@tagRawXml='p:sp'
		@load content
	calcIntellegentlyDashElement:()->
		{content,start,end} = new SubContent(@content).getOuterLoop(@templaterState)
		scopeContent= xmlUtil.getListXmlElements @content, start,end-start
		for t in scopeContent
			if t.tag=='<a:tc>'
				return 'a:tr'
		return super()

module.exports=PptXTemplater
