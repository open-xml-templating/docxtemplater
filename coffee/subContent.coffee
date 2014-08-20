#This class responsibility is to deal with parts of the document

module.exports=class SubContent
	constructor:(@fullText="")->
		@text=""
		@start=0
		@end=0
	getInnerTag:(templaterState)->
		@start=templaterState.calcPosition(templaterState.tagStart)
		@end=templaterState.calcPosition(templaterState.tagEnd)+1
		@refreshText()
	refreshText:()->
		@text=@fullText.substr(@start,@end-@start)
		this
	getOuterXml:(xmlTag)->
		@end= @fullText.indexOf('</'+xmlTag+'>',@end)
		if @end==-1 then throw new Error("can't find endTag #{@end}")
		@end+=('</'+xmlTag+'>').length
		@start = Math.max @fullText.lastIndexOf('<'+xmlTag+'>',@start), @fullText.lastIndexOf('<'+xmlTag+' ',@start)
		if @start==-1 then throw new Error("can't find startTag")
		@refreshText()
	replace:(newText)->
		@fullText=@fullText.substr(0,@start)+newText+@fullText.substr(@end)
		@end=@start+newText.length
		@refreshText()
