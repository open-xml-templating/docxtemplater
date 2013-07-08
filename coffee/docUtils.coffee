if window? #js
	console.log 1
	window.DocUtils= {}
	window.docX=[]
	window.docXData=[]
else 
	global.DocUtils= {}
	global.docX=[]
	global.docXData=[]

DocUtils.nl2br = (str,is_xhtml) ->
	(str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');

DocUtils.loadDoc= (path,noDocx=false,intelligentTagging=false,async=false,callback=null) ->
	xhrDoc= new XMLHttpRequest()
	if path.indexOf('/')!=-1
		totalPath= path
		fileName= totalPath
	else
		fileName= path
		totalPath= "../examples/#{path}"
	xhrDoc.open('GET', totalPath , async)
	if xhrDoc.overrideMimeType
		xhrDoc.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDoc.onreadystatechange =(e)->
		if this.readyState == 4
			if this.status == 200
				window.docXData[fileName]=this.response
				if noDocx==false
					window.docX[fileName]=new DocxGen(this.response,{},intelligentTagging)

				if callback?
					callback(false)
				if async==false
					return window.docXData[fileName]
			else
				# throw 'error loading doc'
				console.log 'error loading doc'
				callback(true)
	xhrDoc.send()
	return fileName

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

	return newInstance

DocUtils.xml2Str = (xmlNode) ->
	try
		# Gecko- and Webkit-based browsers (Firefox, Chrome), Opera.
		content=(new XMLSerializer()).serializeToString(xmlNode);
	catch e
		try
			# Internet Explorer.
			content= xmlNode.xml;
		catch e
			#Other browsers without XML Serializer
			alert('Xmlserializer not supported');
	content= content.replace /\x20xmlns=""/g, '' #remove all added xmlns="" (these cause the file to be corrupt)
	return content;

DocUtils.Str2xml= (str) ->
	if window.DOMParser #Chrome, Firefox, and modern browsers
		parser=new DOMParser();
		xmlDoc=parser.parseFromString(str,"text/xml")
	else # Internet Explorer
		xmlDoc=new ActiveXObject("Microsoft.XMLDOM")
		xmlDoc.async=false
		xmlDoc.loadXML(str)
	xmlDoc

DocUtils.replaceFirstFrom = (string,search,replace,from) ->  #replace first occurence of search (can be regex) after *from* offset
	string.substr(0,from)+string.substr(from).replace(search,replace)

DocUtils.encode_utf8 = (s)->
	unescape(encodeURIComponent(s))

DocUtils.decode_utf8= (s) ->
	decodeURIComponent(escape(s)).replace(new RegExp(String.fromCharCode(160),"g")," ") #replace Ascii 160 space by the normal space, Ascii 32

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

Array.prototype.max = () -> Math.max.apply(null, this)

Array.prototype.min = () -> Math.min.apply(null, this)