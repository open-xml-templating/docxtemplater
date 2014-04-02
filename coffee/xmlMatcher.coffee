root= global ? window
env= if global? then 'node' else 'browser'

#This class responsibility is to parse the XML.

root.XmlMatcher =  class XmlMatcher
