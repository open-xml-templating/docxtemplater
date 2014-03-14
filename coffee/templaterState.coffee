root= global ? window
env= if global? then 'node' else 'browser'

#This class responsibility is to store an xmlTemplater's state

root.TemplaterState =  class TemplaterState
	calcStartTag: (tag) ->
		@matches[tag.start.numXmlTag].offset+@matches[tag.start.numXmlTag][1].length+@charactersAdded[tag.start.numXmlTag]+tag.start.numCharacter
	calcEndTag: (tag)->
		@matches[tag.end.numXmlTag].offset+@matches[tag.end.numXmlTag][1].length+@charactersAdded[tag.end.numXmlTag]+tag.end.numCharacter+1
	initialize:()->
		@inForLoop= false # tag with sharp: {#forLoop}______{/forLoop}
		@inTag= false # all tags  {___}
		@inDashLoop = false	# tag with dash: {-w:tr dashLoop} {/dashLoop}
		@textInsideTag= ""
	startTag:(char)->
		if @inTag is true then throw "Tag already open with text: #{@textInsideTag}"
		@inTag= true
		@textInsideTag= ""
		@tagStart=@currentStep
	loopType:()->
		if @inDashLoop then return 'dash'
		if @inForLoop then return 'for'
		return 'simple'
	endTag:()->
		if @inTag is false then throw "Tag already closed"
		@inTag= false
		@tagEnd=@currentStep
		if @textInsideTag[0]=='#' and @loopType()=='simple'
			@inForLoop= true #begin for loop
			@loopOpen={'start':@tagStart,'end':@tagEnd,'tag':@textInsideTag.substr 1}
		if @textInsideTag[0]=='-' and @loopType()=='simple'
			@inDashLoop= true
			dashInnerRegex= /^-([a-zA-Z_:]+) ([a-zA-Z_:]+)$/
			@loopOpen={'start':@tagStart,'end':@tagEnd,'tag':(@textInsideTag.replace dashInnerRegex, '$2'),'element':(@textInsideTag.replace dashInnerRegex, '$1')}
		if @textInsideTag[0]=='/'
			@loopClose={'start':@tagStart,'end':@tagEnd}
