#This class responsibility is to deal with parts of the document
Errors = require("./errors")

module.exports=class SubContent
	constructor:(@fullText="")->
		@text=""
		@start=0
		@end=0
	getInnerLoop:(templaterState)->
		@start= templaterState.calcEndTag templaterState.loopOpen
		@end= templaterState.calcStartTag templaterState.loopClose
		@refreshText()
	getOuterLoop:(templaterState)->
		@start = templaterState.calcStartTag templaterState.loopOpen
		@end= templaterState.calcEndTag templaterState.loopClose
		@refreshText()
	getInnerTag:(templaterState)->
		@start=templaterState.calcPosition(templaterState.tagStart)
		@end=templaterState.calcPosition(templaterState.tagEnd)+1
		@refreshText()
	refreshText:()->
		@text=@fullText.substr(@start,@end-@start)
		this
	getErrorProps:(xmlTag)->
		xmlTag: xmlTag
		text: @fullText
		start: @start
		previousEnd: @end
	getOuterXml:(xmlTag)->
		endCandidate = @fullText.indexOf('</'+xmlTag+'>',@end)
		startCandiate = Math.max @fullText.lastIndexOf('<'+xmlTag+'>',@start), @fullText.lastIndexOf('<'+xmlTag+' ',@start)
		if endCandidate == -1
			err = new Errors.XTTemplateError("Can't find endTag")
			err.properties = @getErrorProps(xmlTag)
			throw err
		if startCandiate==-1
			err = new Errors.XTTemplateError("Can't find startTag")
			err.properties = @getErrorProps(xmlTag)
			throw err
		@end= endCandidate + ('</'+xmlTag+'>').length
		@start = startCandiate
		@refreshText()
	replace:(newText)->
		@fullText=@fullText.substr(0,@start)+newText+@fullText.substr(@end)
		@end=@start+newText.length
		@refreshText()
