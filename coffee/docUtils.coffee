DocUtils= {}

DocUtils.escapeRegExp= (str) ->
	str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")

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

DocUtils.replaceFirstFrom = (string,search,replace,from) ->  #replace first occurence of search (can be regex) after *from* offset
	substr = string.substr(from)
	replaced = substr.replace(search,replace)
	if substr == replaced
		throw new Error "replaced can't be the same as substring"
	string.substr(0,from)+replaced


DocUtils.convert_spaces= (s) ->
	s.replace(new RegExp(String.fromCharCode(160),"g")," ")


DocUtils.preg_match_all= (regex, content) ->
	###regex is a string, content is the content. It returns an array of all matches with their offset, for example:
	regex=la
	content=lolalolilala
	returns: [{0:'la',offset:2},{0:'la',offset:8},{0:'la',offset:10}]
	###
	if (typeof regex!='object')
		regex= (new RegExp(regex,'g'))
	matchArray= []
	replacer = (match,pn..., offset, string)->
		#add match so that pn[0] = whole match, pn[1]= first parenthesis,...
		pn.unshift match
		pn.offset= offset
		matchArray.push pn
	content.replace regex,replacer
	matchArray

DocUtils.sizeOfObject = (obj) ->
	size=0
	for key of obj
		size++
	size

DocUtils.getOuterXml=(text,start,end,xmlTag)-> #tag: w:t
	endTag= text.indexOf('</'+xmlTag+'>',end)
	if endTag==-1
		throw new Error("can't find endTag #{endTag}")
	endTag+=('</'+xmlTag+'>').length
	startTag = Math.max text.lastIndexOf('<'+xmlTag+'>',start), text.lastIndexOf('<'+xmlTag+' ',start)
	if startTag==-1
		throw new Error("can't find startTag")
	{"text":text.substr(startTag,endTag-startTag),startTag,endTag}

module.exports=DocUtils
