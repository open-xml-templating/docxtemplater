root= global ? window
env= if global? then 'node' else 'browser'

#This is an abstract class, DocXTemplater is an example of inherited class

TemplaterState =  class TemplaterState #abstract class !!

root.TemplaterState=TemplaterState
