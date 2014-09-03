#This class responsibility is to parse the XML.
DocUtils=require('./docUtils')

module.exports=class XmlMatcher
	constructor:(@content)->

	parse:(@tagXml)->
		@matches=DocUtils.preg_match_all("(<#{@tagXml}[^>]*>)([^<>]*)</#{@tagXml}>",@content)
		@charactersAdded= (0 for i in [0...@matches.length])
		@handleRecursiveCase()
		return this

	handleRecursiveCase:()->
		###
		Because xmlTemplater is recursive (meaning it can call it self), we need to handle special cases where the XML is not valid:
		For example with this string "I am</w:t></w:r></w:p><w:p><w:r><w:t>sleeping",
			- we need to match also the string that is inside an implicit <w:t> (that's the role of replacerUnshift) (in this case 'I am')
			- we need to match the string that is at the right of a <w:t> (that's the role of replacerPush) (in this case 'sleeping')
		the test: describe "scope calculation" it "should compute the scope between 2 <w:t>" makes sure that this part of code works
		It should even work if they is no XML at all, for example if the code is just "I am sleeping", in this case however, they should only be one match
		###
		replacerUnshift = (match,pn ..., offset, string)=>
			pn.unshift match #add match so that pn[0] = whole match, pn[1]= first parenthesis,...
			pn.offset= offset
			pn.first= true
			@matches.unshift pn #add at the beginning
			@charactersAdded.unshift 0
		@content.replace /^()([^<]+)/,replacerUnshift

		replacerPush = (match,pn ..., offset, string)=>
			pn.unshift match #add match so that pn[0] = whole match, pn[1]= first parenthesis,...
			pn.offset= offset
			pn.last= true
			@matches.push pn #add at the beginning
			@charactersAdded.push 0

		regex= "(<#{@tagXml}[^>]*>)([^>]+)$"
		@content.replace (new RegExp(regex)),replacerPush
		return this
