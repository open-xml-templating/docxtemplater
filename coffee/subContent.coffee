root= global ? window
env= if global? then 'node' else 'browser'

#This class responsibility is to deal with parts of the document

root.SubContent =  class SubContent
