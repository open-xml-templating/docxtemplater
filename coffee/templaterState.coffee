#This class responsibility is to store an xmlTemplater's state
DocUtils=require('./docUtils')
Errors = require("./errors")

module.exports=class TemplaterState
	constructor:(@moduleManager,@delimiters)->@moduleManager.templaterState=this
	moveCharacters:(numXmlTag,newTextLength,oldTextLength)->
		for k in [numXmlTag...@matches.length]
			@charactersAdded[k]+=newTextLength-oldTextLength
	calcStartTag: (tag) -> @calcPosition(tag.start)
	calcXmlTagPosition:(xmlTagNumber)->
		@matches[xmlTagNumber].offset+@charactersAdded[xmlTagNumber]
	calcEndTag: (tag)-> @calcPosition(tag.end)+1
	calcPosition:(bracket)->
		@matches[bracket.numXmlTag].offset+@matches[bracket.numXmlTag][1].length+@charactersAdded[bracket.numXmlTag]+bracket.numCharacter
	innerContent:(type)->@matches[this[type].numXmlTag][2]
	initialize:()->
		@context=""
		@inForLoop= false # tag with sharp: {#forLoop}______{/forLoop}
		@loopIsInverted= false # tag with caret: {^invertedForLoop}_____{/invertedForLoop}
		@inTag= false # all tags  {___}
		@inDashLoop = false	# tag with dash: {-w:tr dashLoop} {/dashLoop}
		@rawXmlTag=false
		@textInsideTag= ""
		@trail=""
		@trailSteps=[]
		@offset=[]
	startTag:()->
		if @inTag is true
			err = new Errors.XTTemplateError("Unclosed tag")
			xtag = @textInsideTag
			err.properties =
				xtag:xtag
				id: "unclosed_tag"
				explanation: "The tag beginning with #{xtag.substr(10)} is unclosed"
			throw err
		@currentStep=@trailSteps[0]
		@inTag= true
		@rawXmlTag=false
		@textInsideTag= ""
		@tagStart=@currentStep
		@trail=""
	loopType:()->
		if @inDashLoop then return 'dash'
		if @inForLoop then return 'for'
		if @rawXmlTag then return 'xml'
		getFromModule=@moduleManager.get('loopType')
		if getFromModule!=null then return getFromModule
		return 'simple'
	isLoopClosingTag:()->
		@textInsideTag[0]=='/' and ('/'+@loopOpen.tag == @textInsideTag)
	finishLoop:()->
		@context=""
		@rawXmlTag=false
		@inForLoop=false
		@loopIsInverted=false
		@loopOpen=null
		@loopClose=null
		@inDashLoop=false
		@inTag=false
		@textInsideTag=""
	getLeftValue:()->
		@innerContent('tagStart')
			.substr(0,@tagStart.numCharacter+@offset[@tagStart.numXmlTag])
	getRightValue:()->
		@innerContent('tagEnd').
			substr(@tagEnd.numCharacter+1+@offset[@tagEnd.numXmlTag])
	endTag:()->
		if @inTag is false
			err = new Errors.XTTemplateError("Unopened tag")
			err.properties =
				id: "unopened_tag"
				explanation: "Unopened tag near : '#{@context.substr(@context.length-10,10)}'"
			throw err
		@inTag= false
		@tagEnd=@currentStep
		@textInsideTag=@textInsideTag.substr(0,@textInsideTag.length+1-@delimiters.end.length)
		@textInsideTag=DocUtils.wordToUtf8 @textInsideTag
		if @loopType()=='simple'
			if @textInsideTag[0]=='@'
				@rawXmlTag=true
				@tag=@textInsideTag.substr 1
			if @textInsideTag[0]=='#' or @textInsideTag[0]=='^'
				@inForLoop= true #begin for loop
				@loopOpen={'start':@tagStart,'end':@tagEnd,'tag':@textInsideTag.substr(1),'raw':@textInsideTag}
			if @textInsideTag[0]=='^'
				@loopIsInverted= true
			if @textInsideTag[0]=='-' and @loopType()=='simple'
				@inDashLoop= true
				dashInnerRegex= /^-([^\s]+)\s(.+)$/
				@loopOpen={'start':@tagStart,'end':@tagEnd,'tag':(@textInsideTag.replace dashInnerRegex, '$2'),'element':(@textInsideTag.replace dashInnerRegex, '$1'),'raw':@textInsideTag}
		if @textInsideTag[0]=='/'
			@loopClose={'start':@tagStart,'end':@tagEnd,'raw':@textInsideTag}
