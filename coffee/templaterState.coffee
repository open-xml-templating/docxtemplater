root= global ? window
env= if global? then 'node' else 'browser'

#This class responsibility is to store an xmlTemplater's state

TemplaterState =  class TemplaterState
	initialize:()->
		@inForLoop= false # bracket with sharp: {#forLoop}______{/forLoop}
		@inTag= false # all brackets  {___}
		@inDashLoop = false	# bracket with dash: {-w:tr dashLoop} {/dashLoop}
		@textInsideTag= ""
	startTag:()->
		if @inTag is true then throw "Tag already open with text: #{@textInsideTag}"
		@inTag= true
		@textInsideTag= ""
		@bracketStart=@currentStep
	loopType:()->
		if @inDashLoop then return 'dash'
		if @inForLoop then return 'for'
		return 'simple'
	endTag:()->
		if @inTag is false then throw "Tag already closed"
		@inTag= false
		@bracketEnd=@currentStep
		if @textInsideTag[0]=='#' and @loopType()=='simple'
			@inForLoop= true #begin for loop
			@loopOpen={'start':@bracketStart,'end':@bracketEnd,'tag':@textInsideTag.substr 1}
		if @textInsideTag[0]=='-' and @loopType()=='simple'
			@inDashLoop= true
			dashInnerRegex= /^-([a-zA-Z_:]+) ([a-zA-Z_:]+)$/
			@loopOpen={'start':@bracketStart,'end':@bracketEnd,'tag':(@textInsideTag.replace dashInnerRegex, '$2'),'element':(@textInsideTag.replace dashInnerRegex, '$1')}
		if @textInsideTag[0]=='/'
			@loopClose={'start':@bracketStart,'end':@bracketEnd}


root.TemplaterState=TemplaterState

