XmlTemplater=require('./xmlTemplater')
xmlUtil=require('./xmlUtil')

DocXTemplater = class DocXTemplater extends XmlTemplater
	tagByFileType = {pptx: "a:t", docx: "w:t"}
	constructor:(content="",options={}) ->
		super("",options)
		@currentClass=DocXTemplater
		@tagXml = (tagByFileType[options.fileType] ||= tagByFileType["docx"])
		if typeof content=="string" then @load content else throw new Error("content must be string!")
	calcIntellegentlyDashElement:()->
		{content,start,end}= @templaterState.findOuterTagsContent(@content)
		scopeContent= xmlUtil.getListXmlElements @content, start,end-start
		for t in scopeContent
			if t.tag=='<w:tc>'
				return 'w:tr'
		return super()

module.exports=DocXTemplater
