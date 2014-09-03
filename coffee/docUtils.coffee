root= global ? window
env= if global? then 'node' else 'browser'

root.DocUtils= {}
root.docX=[]
root.docXData=[]

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
	'get':(scope) -> return scope[tag]
	}

DocUtils.nl2br = (str,is_xhtml) ->
	(str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');

DocUtils.loadDoc= (path,options={}) ->
	noDocx= if options.docx? then !options.docx else false
	async=if options.async? then options.async else false
	intelligentTagging=if options.intelligentTagging? then options.intelligentTagging else false
	callback=if options.callback? then options.callback else null
	basePath=""
	if !path? then throw new Error('path not defined')
	if path.indexOf('/')!=-1
		totalPath= path
		fileName= totalPath
	else
		fileName= path
		if basePath=="" && DocUtils.pathConfig? #set basePath only if it wasn't set as an argument
			if env=='browser'
				basePath= DocUtils.pathConfig.browser
			else
				basePath= DocUtils.pathConfig.node
		totalPath= basePath+path
	loadFile = (data) ->
		root.docXData[fileName]=data
		if noDocx==false
			root.docX[fileName]=new DocxGen(data,{},{intelligentTagging:intelligentTagging})
			return root.docX[fileName]
		if callback?
			callback(root.docXData[fileName])
		if async==false
			return root.docXData[fileName]
	if env=='browser'
		xhrDoc= new XMLHttpRequest()
		xhrDoc.open('GET', totalPath , async)
		if xhrDoc.overrideMimeType
			xhrDoc.overrideMimeType('text/plain; charset=x-user-defined')
		xhrDoc.onreadystatechange =(e)->
			if this.readyState == 4
				if this.status == 200
					loadFile(this.response)
				else
					if callback? then callback(true)
		xhrDoc.send()
	else
		httpRegex= new RegExp "(https?)","i"
		# httpsRegex= new RegExp "(https)://"
		if httpRegex.test(path)
			urloptions=(url.parse(path))
			options =
				hostname:urloptions.hostname
				path:urloptions.path
				method: 'GET'
				rejectUnauthorized:false

			errorCallback= (e) ->
				throw new Error("Error on HTTPS Call")

			reqCallback= (res)->
				res.setEncoding('binary')
				data = ""
				res.on('data', (chunk)->
					data += chunk
				)
				res.on('end', ()->
					loadFile(data))
			switch urloptions.protocol
				when "https:"
					req = https.request(options, reqCallback).on('error',errorCallback)
				when 'http:'
					req = http.request(options, reqCallback).on('error',errorCallback)
			req.end();

		else
			if async==true
				fs.readFile totalPath,"binary", (err, data) ->
					if err
						if callback? then callback(true)
					else
						loadFile(data)
						if callback? then callback(data)
			else
				try
					data=fs.readFileSync(totalPath,"binary")
					a=loadFile(data)
					if callback? then callback(data) else return a
				catch e
					if callback? then callback()
	return fileName

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

	return newInstance

DocUtils.xml2Str = (xmlNode) ->
	if xmlNode==undefined
		throw new Error("xmlNode undefined!")
	try
		if global?
			a= new XMLSerializer()
			content= a.serializeToString(xmlNode)
		# Gecko- and Webkit-based browsers (Firefox, Chrome), Opera.
		else
			content=(new XMLSerializer()).serializeToString(xmlNode);
	catch e
		content= xmlNode.xml;
	content= content.replace /\x20xmlns=""/g, '' #remove all added xmlns="" (these cause the file to be corrupt and was a problem for firefox)

DocUtils.Str2xml= (str) ->
	if root.DOMParser #Chrome, Firefox, and modern browsers
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

DocUtils.convert_spaces= (s) ->
	s.replace(new RegExp(String.fromCharCode(160),"g")," ")

DocUtils.decode_utf8= (s) ->
	try
		if s==undefined then return undefined
		return decodeURIComponent(escape(DocUtils.convert_spaces(s))) #replace Ascii 160 space by the normal space, Ascii 32
	catch e
		console.log s
		console.log 'could not decode'
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

Array.prototype.max = () -> Math.max.apply(null, this)
Array.prototype.min = () -> Math.min.apply(null, this)
