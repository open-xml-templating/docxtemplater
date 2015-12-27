xmlUtil=require('./xmlUtil')
SubContent=require('./subContent')

PptXFileTypeConfig =
	textPath:"ppt/slides/slide1.xml"
	tagsXmlArray:['a:t', 'm:t']
	tagRawXml:'p:sp'
	getTemplatedFiles:(zip)->
		slideTemplates=zip.file(/ppt\/(slides|slideMasters)\/(slide|slideMaster)\d+\.xml/).map (file) -> file.name
		slideTemplates.concat ["ppt/presentation.xml"]
	calcIntellegentlyDashElement:(content,templaterState)->
		{_,start,end} = new SubContent(content).getOuterLoop(templaterState)
		scopeContent= xmlUtil.getListXmlElements content, start,end-start
		for t in scopeContent
			if t.tag=='<a:tc>'
				return 'a:tr'
		return false

DocXFileTypeConfig =
	getTemplatedFiles:(zip)->
		slideTemplates=zip.file(/word\/(header|footer)\d+\.xml/).map (file) -> file.name
		slideTemplates.concat ["word/document.xml"]
	textPath:"word/document.xml"
	tagsXmlArray:['w:t','m:t']
	tagRawXml:'w:p'
	calcIntellegentlyDashElement:(content,templaterState)->
		{_,start,end} = new SubContent(content).getOuterLoop(templaterState)
		scopeContent= xmlUtil.getListXmlElements content, start,end-start
		for t in scopeContent
			if t.tag=='<w:tc>'
				return 'w:tr'
		return false

module.exports=
	docx:DocXFileTypeConfig
	pptx:PptXFileTypeConfig
