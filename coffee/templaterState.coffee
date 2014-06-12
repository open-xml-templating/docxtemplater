root= global ? window
env= if global? then 'node' else 'browser'

#This class responsibility is to store an xmlTemplater's state

root.TemplaterState=  class TemplaterState
	moveCharacters:(numXmlTag,newTextLength,oldTextLength)->
		if typeof newTextLength!='number' then return @moveCharacters(numXmlTag,newTextLength.length,oldTextLength)
		if typeof oldTextLength!='number' then return @moveCharacters(numXmlTag,newTextLength,oldTextLength.length)
		for k in [numXmlTag..@matches.length]
			@charactersAdded[k]+=newTextLength-oldTextLength
	calcStartTag: (tag) -> @calcPosition(tag.start)
	calcXmlTagPosition:(xmlTagNumber)->
		@matches[xmlTagNumber].offset+@charactersAdded[xmlTagNumber]
	calcEndTag: (tag)-> @calcPosition(tag.end)+1
	calcPosition:(bracket)->
		@matches[bracket.numXmlTag].offset+@matches[bracket.numXmlTag][1].length+@charactersAdded[bracket.numXmlTag]+bracket.numCharacter
	findOuterTagsContent: (content) ->
		start = @calcStartTag @loopOpen
		end= @calcEndTag @loopClose
		{content:content.substr(start,end-start),start,end}
	findInnerTagsContent: (content) ->
		start= @calcEndTag @loopOpen
		end= @calcStartTag @loopClose
		{content:content.substr(start,end-start),start,end}
	initialize:()->
		@inForLoop= false # tag with sharp: {#forLoop}______{/forLoop}
		@loopIsInverted= false # tag with caret: {^invertedForLoop}_____{/invertedForLoop}
		@inTag= false # all tags  {___}
		@inDashLoop = false	# tag with dash: {-w:tr dashLoop} {/dashLoop}
		@rawXmlTag=false
		@textInsideTag= ""
	startTag:(char)->
		if @inTag is true then throw new Error("Tag already open with text: #{@textInsideTag}")
		@inTag= true
		@rawXmlTag=false
		@textInsideTag= ""
		@tagStart=@currentStep
	loopType:()->
		if @inDashLoop then return 'dash'
		if @inForLoop then return 'for'
		if @rawXmlTag then return 'xml'
		return 'simple'
	isLoopClosingTag:()->
		@textInsideTag[0]=='/' and ('/'+@loopOpen.tag == @textInsideTag)
	endTag:()->
		if @inTag is false then throw new Error("Tag already closed")
		@inTag= false
		@tagEnd=@currentStep
		if @textInsideTag[0]=='@' and @loopType()=='simple'
			@rawXmlTag=true
			@tag=@textInsideTag.substr 1
		if @textInsideTag[0]=='#' and @loopType()=='simple'
			@inForLoop= true #begin for loop
			@loopOpen={'start':@tagStart,'end':@tagEnd,'tag':@textInsideTag.substr 1}
		if @textInsideTag[0]=='^' and @loopType()=='simple'
			@inForLoop= true #begin for loop
			@loopIsInverted= true
			@loopOpen={'start':@tagStart,'end':@tagEnd,'tag':@textInsideTag.substr 1}
		if @textInsideTag[0]=='-' and @loopType()=='simple'
			@inDashLoop= true
			dashInnerRegex= /^-([a-zA-Z_:]+) ([a-zA-Z_:]+)$/
			@loopOpen={'start':@tagStart,'end':@tagEnd,'tag':(@textInsideTag.replace dashInnerRegex, '$2'),'element':(@textInsideTag.replace dashInnerRegex, '$1')}
		if @textInsideTag[0]=='/'
			@loopClose={'start':@tagStart,'end':@tagEnd}
