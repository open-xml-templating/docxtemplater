XmlTemplater=require('./xmlTemplater')
xmlUtil=require('./xmlUtil')
SubContent=require('./subContent')

PptXTemplater = class PptXTemplater extends XmlTemplater
	constructor:(content="",options={}) ->
		super(content,options)
		@currentClass=PptXTemplater
		@tagXml='a:t'
		@tagRawXml='p:sp'
		if typeof content=="string" then @load content else throw new Error("content must be string!")
	xmlToBeReplaced:(options)->
		if options.noStartTag
			return options.insideValue
		else
			str=@templaterState.matches[options.xmlTagNumber][1]+options.insideValue
			if options.noEndTag==true then return str else return str+"</#{@tagXml}>"
	calcIntellegentlyDashElement:()->
		{content,start,end} = new SubContent(@content).getOuterLoop(@templaterState)
		scopeContent= xmlUtil.getListXmlElements @content, start,end-start
		for t in scopeContent
			if t.tag=='<a:tc>'
				return 'a:tr'
		return super()

module.exports=PptXTemplater
