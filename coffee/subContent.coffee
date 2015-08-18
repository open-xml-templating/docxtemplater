#This class responsibility is to deal with parts of the document

class SubContent
	###*
	 * [constructor description]
	 * @param  {[type]} @fullText =             "" [description]
	 * @return {[type]}           [description]
	###
	constructor: (@fullText = "") ->
		@text = ""
		@start = 0
		@end = 0

	###*
	 * [getInnerTag description]
	 * @param  {[type]} templaterState [description]
	 * @return {[type]}                [description]
	###
	getInnerTag: (templaterState) ->
		@start = templaterState.calcPosition(templaterState.tagStart)
		@end = templaterState.calcPosition(templaterState.tagEnd) + 1
		@refreshText()

	###*
	 * [refreshText description]
	 * @return {[type]} [description]
	###
	refreshText: () ->
		@text = @fullText.substr(@start, @end - @start)
		return this

	###*
	 * [getOuterXml description]
	 * @param  {[type]} xmlTag [description]
	 * @return {[type]}        [description]
	###
	getOuterXml: (xmlTag) ->
		@end = @fullText.indexOf('</' + xmlTag + '>', @end)
		if @end == -1 then throw new Error("can't find endTag #{@end}")
		@end += ('</'+xmlTag+'>').length
		@start = Math.max @fullText.lastIndexOf('<' + xmlTag + '>', @start), @fullText.lastIndexOf('<' + xmlTag + ' ', @start)
		if @start == -1 then throw new Error("can't find startTag")
		@refreshText()

	###*
	 * [replace description]
	 * @param  {[type]} newText [description]
	 * @return {[type]}         [description]
	###
	replace: (newText) ->
		@fullText = @fullText.substr(0,@start)+newText+@fullText.substr(@end)
		@end = @start + newText.length
		@refreshText()

module.exports = SubContent
