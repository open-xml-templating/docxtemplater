root= global ? window
env= if global? then 'node' else 'browser'

#This class responsibility is to store an xmlTemplater's state

TemplaterState =  class TemplaterState
	initialize:()->
		@inForLoop= false # bracket with sharp: {#forLoop}______{/forLoop}
		@inBracket= false # all brackets  {___}
		@inDashLoop = false	# bracket with dash: {-w:tr dashLoop} {/dashLoop}
		@textInsideBracket= ""
	startBracket:()->
		if @inBracket is true then throw "Bracket already open with text: #{@textInsideBracket}"
		@inBracket= true
		@textInsideBracket= ""
		@bracketStart=@currentStep
	loopType:()->
		if @inDashLoop then return 'dash'
		if @inForLoop then return 'for'
		return 'simple'
	endBracket:()->
		if @inBracket is false then throw "Bracket already closed"
		@inBracket= false
		@bracketEnd=@currentStep
		if @textInsideBracket[0]=='#' and @loopType()=='simple'
			@inForLoop= true #begin for loop
			@loopOpen={'start':@bracketStart,'end':@bracketEnd,'tag':@textInsideBracket.substr 1}
		if @textInsideBracket[0]=='-' and @loopType()=='simple'
			@inDashLoop= true
			dashInnerRegex= /^-([a-zA-Z_:]+) ([a-zA-Z_:]+)$/
			@loopOpen={'start':@bracketStart,'end':@bracketEnd,'tag':(@textInsideBracket.replace dashInnerRegex, '$2'),'element':(@textInsideBracket.replace dashInnerRegex, '$1')}
		if @textInsideBracket[0]=='/'
			@loopClose={'start':@bracketStart,'end':@bracketEnd}


root.TemplaterState=TemplaterState

