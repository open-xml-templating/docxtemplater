DocUtils= {}
DocUtils.getPathConfig=()->
	if !DocUtils.pathConfig? then return ""
	if DocUtils.env=='node' then return DocUtils.pathConfig.node
	DocUtils.pathConfig.browser

DocUtils.escapeRegExp= (str) ->
	str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

DocUtils.charMap=
	'&':"&amp;"
	"'":"&apos;"
	"<":"&lt;"
	">":"&gt;"

DocUtils.wordToUtf8= (string) ->
	for endChar,startChar of DocUtils.charMap
		string=string.replace(new RegExp(DocUtils.escapeRegExp(startChar),"g"),endChar)
	string

DocUtils.utf8ToWord= (string) ->
	for startChar,endChar of DocUtils.charMap
		string=string.replace(new RegExp(DocUtils.escapeRegExp(startChar),"g"),endChar)
	string

DocUtils.defaultParser=(tag) ->
	return {
	'get':(scope) ->
		if tag=='.' then return scope else return scope[tag]
	}

DocUtils.tags=
	start:'{'
	end:'}'

DocUtils.clone = (obj) ->
	if not obj? or typeof obj isnt 'object'
		return obj

	if obj instanceof Date
		return new Date(obj.getTime())

	if obj instanceof RegExp
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

DocUtils.replaceFirstFrom = (string,search,replace,from) ->  #replace first occurence of search (can be regex) after *from* offset
	string.substr(0,from)+string.substr(from).replace(search,replace)

DocUtils.encode_utf8 = (s)->
	unescape(encodeURIComponent(s))

DocUtils.convert_spaces= (s) ->
	s.replace(new RegExp(String.fromCharCode(160),"g")," ")

DocUtils.decode_utf8= (s) ->
	try
		if s==undefined then return undefined
		return decodeURIComponent(escape(DocUtils.convert_spaces(s))) #replace Ascii 160 space by the normal space, Ascii 32
	catch e
		console.error s
		console.error 'could not decode'
		throw new Error('end')

DocUtils.base64encode= (b) ->
    btoa(unescape(encodeURIComponent(b)))

DocUtils.preg_match_all= (regex, content) ->
	###regex is a string, content is the content. It returns an array of all matches with their offset, for example:
	regex=la
	content=lolalolilala
	returns: [{0:'la',offset:2},{0:'la',offset:8},{0:'la',offset:10}]
	###
	regex= (new RegExp(regex,'g')) unless (typeof regex=='object')
	matchArray= []
	replacer = (match,pn ..., offset, string)->
		pn.unshift match #add match so that pn[0] = whole match, pn[1]= first parenthesis,...
		pn.offset= offset
		matchArray.push pn
	content.replace regex,replacer
	matchArray

DocUtils.sizeOfObject = (obj) ->
	size=0
	log = 0
	for key of obj
		size++
	size

DocUtils.getOuterXml=(text,start,end,xmlTag)-> #tag: w:t
	endTag= text.indexOf('</'+xmlTag+'>',end)
	if endTag==-1 then throw new Error("can't find endTag #{endTag}")
	endTag+=('</'+xmlTag+'>').length
	startTag = Math.max text.lastIndexOf('<'+xmlTag+'>',start), text.lastIndexOf('<'+xmlTag+' ',start)
	if startTag==-1 then throw new Error("can't find startTag")
	{"text":text.substr(startTag,endTag-startTag),startTag,endTag}

module.exports=DocUtils
