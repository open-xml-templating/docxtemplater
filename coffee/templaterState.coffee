#This class responsibility is to store an xmlTemplater's state
DocUtils = require('./docUtils')

module.exports = class TemplaterState
	###*
	 * [constructor description]
	 * @param  {[type]} @moduleManager [description]
	 * @return {[type]}                [description]
	###
	constructor: (@moduleManager) -> @moduleManager.templaterState = this

	###*
	 * [moveCharacters description]
	 * @param  {[type]} numXmlTag     [description]
	 * @param  {[type]} newTextLength [description]
	 * @param  {[type]} oldTextLength [description]
	 * @return {[type]}               [description]
	###
	moveCharacters: (numXmlTag,newTextLength,oldTextLength) ->
		for k in [numXmlTag..@matches.length]
			@charactersAdded[k] += newTextLength-oldTextLength

	###*
	 * [calcStartTag description]
	 * @param  {[type]} tag [description]
	 * @return {[type]}     [description]
	###
	calcStartTag: (tag) -> @calcPosition(tag.start)

	###*
	 * [calcXmlTagPosition description]
	 * @param  {[type]} xmlTagNumber [description]
	 * @return {[type]}              [description]
	###
	calcXmlTagPosition: (xmlTagNumber) ->
		@matches[xmlTagNumber].offset+@charactersAdded[xmlTagNumber]

	###*
	 * [calcEndTag description]
	 * @param  {[type]} tag [description]
	 * @return {[type]}     [description]
	###
	calcEndTag: (tag)-> @calcPosition(tag.end) + 1

	###*
	 * [calcPosition description]
	 * @param  {[type]} bracket [description]
	 * @return {[type]}         [description]
	###
	calcPosition: (bracket) ->
		@matches[bracket.numXmlTag].offset + @matches[bracket.numXmlTag][1].length + @charactersAdded[bracket.numXmlTag] + bracket.numCharacter

	###*
	 * [findOuterTagsContent description]
	 * @param  {[type]} content [description]
	 * @return {[type]}         [description]
	###
	findOuterTagsContent: (content) ->
		start = @calcStartTag(@loopOpen)
		end= @calcEndTag(@loopClose)
		{content:content.substr(start,end-start),start,end}

	###*
	 * [innerContent description]
	 * @param  {[type]} type [description]
	 * @return {[type]}      [description]
	###
	innerContent: (type) -> @matches[this[type].numXmlTag][2]

	###*
	 * [findInnerTagsContent description]
	 * @param  {[type]} content [description]
	 * @return {[type]}         [description]
	###
	findInnerTagsContent: (content) ->
		start = @calcEndTag(@loopOpen)
		end = @calcStartTag(@loopClose)
		{content: content.substr(start,end-start),start,end}

	###*
	 * [initialize description]
	 * @return {[type]} [description]
	###
	initialize: () ->
		@context = ""
		@inForLoop = false # tag with sharp: {#forLoop}______{/forLoop}
		@loopIsInverted = false # tag with caret: {^invertedForLoop}_____{/invertedForLoop}
		@inTag = false # all tags  {___}
		@inDashLoop = false	# tag with dash: {-w:tr dashLoop} {/dashLoop}
		@rawXmlTag = false
		@textInsideTag = ""

	###*
	 * [startTag description]
	 * @return {[type]} [description]
	###
	startTag: () ->
		if @inTag is true then throw new Error("Unclosed tag : '#{@textInsideTag}'")
		@inTag = true
		@rawXmlTag = false
		@textInsideTag = ""
		@tagStart = @currentStep

	###*
	 * [loopType description]
	 * @return {[type]} [description]
	###
	loopType: () ->
		if @inDashLoop then return 'dash'
		if @inForLoop then return 'for'
		if @rawXmlTag then return 'xml'
		getFromModule = @moduleManager.get('loopType')
		if getFromModule != null then return getFromModule
		return 'simple'

	###*
	 * [isLoopClosingTag description]
	 * @return {Boolean} [description]
	###
	isLoopClosingTag: () ->
		@textInsideTag[0] == '/' and ('/'+@loopOpen.tag == @textInsideTag)

	###*
	 * [getLeftValue description]
	 * @return {[type]} [description]
	###
	getLeftValue: () ->
		@innerContent('tagStart')
			.substr(0, @tagStart.numCharacter + @offset[@tagStart.numXmlTag])

	###*
	 * [getRightValue description]
	 * @return {[type]} [description]
	###
	getRightValue: () ->
		@innerContent('tagEnd')
			.substr(@tagEnd.numCharacter + 1 + @offset[@tagEnd.numXmlTag])

	###*
	 * [endTag description]
	 * @return {[type]} [description]
	###
	endTag: () ->
		if @inTag is false then throw new Error("Unopened tag near : '#{@context.substr(@context.length-10,10)}'")
		@inTag = false
		@tagEnd = @currentStep
		@textInsideTag = @textInsideTag.substr(0, @textInsideTag.length + 1 - DocUtils.tags.end.length)
		if @loopType() == 'simple'
			if @textInsideTag[0] == '@'
				@rawXmlTag = true
				@tag = @textInsideTag.substr(1)
			if @textInsideTag[0] == '#' or @textInsideTag[0] == '^'
				@inForLoop = true #begin for loop
				@loopOpen = {
					'start': @tagStart,
					'end': @tagEnd,
					'tag': @textInsideTag.substr(1),
					'raw': @textInsideTag
				}
			if @textInsideTag[0] == '^'
				@loopIsInverted = true
			if @textInsideTag[0] == '-' and @loopType() == 'simple'
				@inDashLoop = true
				dashInnerRegex = /^-([^\s]+)\s(.+)$/
				@loopOpen = {
					'start': @tagStart,
					'end': @tagEnd,
					'tag': (@textInsideTag.replace(dashInnerRegex, '$2')),
					'element': (@textInsideTag.replace(dashInnerRegex, '$1')),
					'raw': @textInsideTag
				}
		if @textInsideTag[0] == '/'
			@loopClose = {
				'start': @tagStart,
				'end': @tagEnd,
				'raw': @textInsideTag
			}
