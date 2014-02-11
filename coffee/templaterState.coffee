root= global ? window
env= if global? then 'node' else 'browser'

#This class responsibility is to store an xmlTemplater's state

TemplaterState =  class TemplaterState
	initialize:()->
		@inForLoop= false # bracket with sharp: {#forLoop}______{/forLoop}

root.TemplaterState=TemplaterState

