Errors = require("./errors")

DocUtils= {}

DocUtils.defaults =
	nullGetter:(tag, props)->
		if props.tag == "simple"
			return "undefined"
		if props.tag == "raw"
			return ""
		return ""
	parser:(tag) ->
		return {
			'get':(scope) ->
				if tag=='.' then return scope else return scope[tag]
		}
	intelligentTagging:true
	fileType:'docx'
	delimiters:
		start:'{'
		end:'}'

DocUtils.charMap=
	'&':"&amp;"
	"'":"&apos;"
	"<":"&lt;"
	">":"&gt;"

DocUtils.wordToUtf8= (string) ->
	if typeof string != "string"
		string = string.toString()
	for endChar,startChar of DocUtils.charMap
		string=string.replace(new RegExp(DocUtils.escapeRegExp(startChar),"g"),endChar)
	string

DocUtils.utf8ToWord= (string) ->
	if typeof string != "string"
		string = string.toString()
	for startChar,endChar of DocUtils.charMap
		string=string.replace(new RegExp(DocUtils.escapeRegExp(startChar),"g"),endChar)
	string

DocUtils.clone = (obj) ->
	if not obj? or typeof obj isnt 'object'
		return obj

	if typeof obj == "Date"
		return new Date(obj.getTime())

	if typeof obj == "RegExp"
		flags = ''
		flags += 'g' if obj.global?
		flags += 'i' if obj.ignoreCase?
		flags += 'm' if obj.multiline?
		flags += 'y' if obj.sticky?
		return new RegExp(obj.source, flags)

	newInstance = new obj.constructor()

	for key of obj
		newInstance[key] = DocUtils.clone obj[key]

	newInstance

DocUtils.convertSpaces= (s) ->
	s.replace(new RegExp(String.fromCharCode(160),"g")," ")

DocUtils.pregMatchAll= (regex, content) ->
	###regex is a string, content is the content. It returns an array of all matches with their offset, for example:
	regex=la
	content=lolalolilala
	returns: [{0:'la',offset:2},{0:'la',offset:8},{0:'la',offset:10}]
	###
	if (typeof regex!='object')
		regex= (new RegExp(regex,'g'))
	matchArray= []
	replacer = (pn...)->
		string = pn.pop()
		offset = pn.pop()
		#add match so that pn[0] = whole match, pn[1]= first parenthesis,...
		pn.offset= offset
		matchArray.push pn
	content.replace regex,replacer
	matchArray

DocUtils.sizeOfObject = (obj) ->
	size=0
	for key of obj
		size++
	size

# Deprecated methods, to be removed
DocUtils.encode_utf8 = (s)->
	unescape(encodeURIComponent(s))
DocUtils.decode_utf8= (s) ->
	try
		if s==undefined then return undefined
		return decodeURIComponent(escape(DocUtils.convert_spaces(s))) #replace Ascii 160 space by the normal space, Ascii 32
	catch e
		err = new Errors.XTError('Could not decode utf8')
		err.properties =
			toDecode: s
			baseErr: e
		throw err

DocUtils.base64encode= (b) ->
    btoa(unescape(encodeURIComponent(b)))

DocUtils.tags = DocUtils.defaults.delimiters
DocUtils.defaultParser  = DocUtils.defaults.parser
DocUtils.convert_spaces = DocUtils.convertSpaces
DocUtils.preg_match_all = DocUtils.pregMatchAll

DocUtils.escapeRegExp= (str) ->
	str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")

module.exports=DocUtils
