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
	endBracket:()->
		@bracketEnd=@currentStep

root.TemplaterState=TemplaterState

