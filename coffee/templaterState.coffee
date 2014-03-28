root= global ? window
env= if global? then 'node' else 'browser'

#This class responsibility is to store an xmlTemplater's state

root.TemplaterState =  class TemplaterState
	calcStartTag: (tag) -> @calcPosition(tag.start)
	calcEndTag: (tag)-> @calcPosition(tag.end)+1
	calcPosition:(bracket)->
		@matches[bracket.numXmlTag].offset+@matches[bracket.numXmlTag][1].length+@charactersAdded[bracket.numXmlTag]+bracket.numCharacter
	initialize:()->
		@inForLoop= false # tag with sharp: {#forLoop}______{/forLoop}
		@inTag= false # all tags  {___}
		@inDashLoop = false	# tag with dash: {-w:tr dashLoop} {/dashLoop}
		@rawXmlTag=false
		@textInsideTag= ""
	startTag:(char)->
		if @inTag is true then throw "Tag already open with text: #{@textInsideTag}"
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
		if @inTag is false then throw "Tag already closed"
		@inTag= false
		@tagEnd=@currentStep
		if @textInsideTag[0]=='@' and @loopType()=='simple'
			@rawXmlTag=true
			@tag=@textInsideTag.substr 1
		if @textInsideTag[0]=='#' and @loopType()=='simple'
			@inForLoop= true #begin for loop
			@loopOpen={'start':@tagStart,'end':@tagEnd,'tag':@textInsideTag.substr 1}
		if @textInsideTag[0]=='-' and @loopType()=='simple'
			@inDashLoop= true
			dashInnerRegex= /^-([a-zA-Z_:]+) ([a-zA-Z_:]+)$/
			@loopOpen={'start':@tagStart,'end':@tagEnd,'tag':(@textInsideTag.replace dashInnerRegex, '$2'),'element':(@textInsideTag.replace dashInnerRegex, '$1')}
		if @textInsideTag[0]=='/'
			@loopClose={'start':@tagStart,'end':@tagEnd}
