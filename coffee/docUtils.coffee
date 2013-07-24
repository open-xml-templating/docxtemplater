root= global ? window
env= if global? then 'node' else 'browser'

root.DocUtils= {}
root.docX=[]
root.docXData=[]

DocUtils.nl2br = (str,is_xhtml) ->
	(str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');

DocUtils.loadDoc= (path,noDocx=false,intelligentTagging=false,async=false,callback=null,basePath=null) ->
	console.log 'loading Doc:'+path
	throw 'path not defined' unless path?
	if path.indexOf('/')!=-1
		totalPath= path
		fileName= totalPath
	else
		fileName= path
		if basePath==null#set basePath only if it wasn't set as an argument
			if env=='browser'
				basePath= '../examples/'
			else
				basePath= '../../examples/'
		totalPath= basePath+path
	loadFile = (data) ->
		root.docXData[fileName]=data
		if noDocx==false
			root.docX[fileName]=new DocxGen(data,{},intelligentTagging)
		if callback?
			callback(false)
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
					console.log 'error loading doc'
					if callback? then callback(true)
		xhrDoc.send()
	else
		httpRegex= new RegExp "(http|ftp)://"
		httpsRegex= new RegExp "(https)://"
		if httpRegex.test(path)
			# console.log('http url matched:'+path)
			# http.get(path, (res) -> 
			# 	console.log("Got response: " + res.statusCode);
			# 	res.on('data', (d) ->
			# 		loadFile(d)
			# 	)
			# )
			# .on('error', (e) ->
			# 	console.log("Got error: " + e.message);
			# )

		else if httpsRegex.test(path)
			console.log('https url matched:'+path)

			urloptions=(url.parse(path))

			options = 
				hostname:urloptions.hostname
				path:urloptions.path
				method: 'GET'
				rejectUnauthorized:false

			req = https.request(options, (res)->
				res.setEncoding('binary')
				data = ""

				res.on('data', (chunk)->
					console.log "Status Code #{res.statusCode}"
					console.log('received')
					data += chunk
				)

				res.on('end', ()->
					console.log('receivedTotally')
					loadFile(data))

				res.on('error',(err)->
					console.log("Error during HTTP request");
					console.log(err.message)
					console.log(err.stack))

				).on('error',(e)->
						console.log("Error: \n" + e.message); 
						console.log( e.stack );
					)

			req.end();

		else
			if async==true
				fs.readFile totalPath,"binary", (err, data) ->
					if err
						if callback? then callback(true)
					else
						loadFile(data)
						if callback? then callback(false)
			else
				console.log('loading async:'+totalPath)

				try
					data=fs.readFileSync(totalPath,"binary")
					loadFile(data)
					if callback? then callback(false)
				catch e
					if callback? then callback(true)
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
	if xmlNode==undefined
		throw "xmlNode undefined!"
	try
		if global?
			a= new XMLSerializer()
			content= a.serializeToString(xmlNode)
		# Gecko- and Webkit-based browsers (Firefox, Chrome), Opera.
		else
			content=(new XMLSerializer()).serializeToString(xmlNode);
	catch e
		try
			# Internet Explorer.
			content= xmlNode.xml;
		catch e
			#Other browsers without XML Serializer
			console.log('Xmlserializer not supported');
	content= content.replace /\x20xmlns=""/g, '' #remove all added xmlns="" (these cause the file to be corrupt)
	return content;

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