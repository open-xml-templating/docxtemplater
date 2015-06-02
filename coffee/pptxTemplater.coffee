XmlTemplater=require('./xmlTemplater')
xmlUtil=require('./xmlUtil')

PptXTemplater = class PptXTemplater extends XmlTemplater
	constructor:(content="",options={}) ->
		super(content,options)
		@currentClass=PptXTemplater
		@tagXml='a:t'
		if typeof content=="string" then @load content else throw new Error("content must be string!")
	xmlToBeReplaced:(noStartTag, spacePreserve, insideValue,xmlTagNumber,noEndTag)->
		if noStartTag == true
			return insideValue
		else
			str=@templaterState.matches[xmlTagNumber][1]+insideValue
			if noEndTag==true then return str else return str+"</#{@tagXml}>"
	calcIntellegentlyDashElement:()->
		{content,start,end}= @templaterState.findOuterTagsContent(@content)
		scopeContent= xmlUtil.getListXmlElements @content, start,end-start
		for t in scopeContent
			if t.tag=='<a:tc>'
				return 'a:tr'
		return super()

module.exports=PptXTemplater
