fs=require('fs')
DOMParser = require('xmldom').DOMParser
XMLSerializer= require('xmldom').XMLSerializer
JSZip=require('jszip')
url=require('url')
http=require('http')
https=require('https')

DocUtils= {}
DocUtils.env= if fs.readFile? then 'node' else 'browser'
DocUtils.docX=[]
DocUtils.docXData=[]
DocUtils.getPathConfig=()->
	if !DocUtils.pathConfig? then return ""
	return if DocUtils.pathConfig.node? then DocUtils.pathConfig.node else DocUtils.pathConfig.browser

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
			basePath=DocUtils.getPathConfig()
		totalPath= basePath+path
	loadFile = (data) ->
		DocUtils.docXData[fileName]=data
		if noDocx==false
			DocUtils.docX[fileName]=new DocxGen(data,{},{intelligentTagging:intelligentTagging})
			return DocUtils.docX[fileName]
		if callback?
			return callback(DocUtils.docXData[fileName])
		if async==false
			return DocUtils.docXData[fileName]
	if DocUtils.env=='browser'
		DocUtils.loadHttp path,(err,result)->
			if err
				console.log 'error'
				if callback? then callback(true)
				return
			loadFile(result)
		,async
	else
		if path.indexOf("http")==0
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
						if callback? then return callback(err)
					else
						return loadFile(data)
			else
				try
					data=fs.readFileSync(totalPath,"binary")
					return loadFile(data)
				catch e
					if callback? then return callback(e)

DocUtils.loadHttp=(result,callback,async=false)->
	if DocUtils.env=='node'
		urloptions=(url.parse(result))
		options =
			hostname:urloptions.hostname
			path:urloptions.path
			method: 'GET'
			rejectUnauthorized:false


		errorCallback= (e) ->
			callback(e)

		reqCallback= (res)->
			res.setEncoding('binary')
			data = ""
			res.on 'data',(chunk)-> data += chunk
			res.on 'end',()->callback(null,data)
		switch urloptions.protocol
			when "https:"
				req = https.request(options, reqCallback).on('error',errorCallback)
			when 'http:'
				req = http.request(options, reqCallback).on('error',errorCallback)
		req.end()
	else
		xhrDoc= new XMLHttpRequest()
		xhrDoc.open('GET', result , async)
		if xhrDoc.overrideMimeType
			xhrDoc.overrideMimeType('text/plain; charset=x-user-defined')
		xhrDoc.onreadystatechange =(e)->
			if this.readyState == 4
				if this.status == 200
					callback(null,this.response)
				else
					callback(true)
		xhrDoc.send()

DocUtils.unsecureQrCode=(result,callback)->
	if DocUtils.env=='node'
		console.log 'Your are using an insecure qrcode image finder. With this function, a malicious user could read anyfile that is on the server where docxtemplater resides. The qrcode module now accepts a function as its first parameter instead of a bool see http://docxtemplater.readthedocs.org/en/latest/configuration.html#image-replacing'
	if result.substr(0,5)=='http:' or result.substr(0,6)=='https:'
		DocUtils.loadHttp(result,callback)
	else if result.substr(0,4)=='gen:'
		defaultImageCreator=(arg,callback) ->
			#This is the image of an arrow, you can replace this function by whatever you want to generate an image
			res=JSZip.base64.decode("iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAIAAABvSEP3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACXSURBVDhPtY7BDYAwDAMZhCf7b8YMxeCoatOQJhWc/KGxT2zlCyaWcz8Y+X7Bs1TFVJSwIHIYyFkQufWIRVX9cNJyW1QpEo4rixaEe7JuQagAUctb7ZFYFh5MVJPBe84CVBnB42//YsZRgKjFDBVg3cI9WbRwXLktQJX8cNIiFhM1ZuTWk7PIYSBhkVcLzwIiCjCxhCjlAkBqYnqFoQQ2AAAAAElFTkSuQmCC")
			callback(null,res)
		defaultImageCreator(result,callback)
	else if result!=null and result!= undefined and result.substr(0,22)!= 'error decoding QR Code'
		if DocUtils.env=='node'
			fs.readFile(DocUtils.getPathConfig()+result,callback)
		else
			DocUtils.loadHttp(DocUtils.getPathConfig()+result,callback)
	else
		callback()

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
	a= new XMLSerializer()
	a.serializeToString(xmlNode)

DocUtils.Str2xml= (str,errorHandler) ->
	parser=new DOMParser({errorHandler})
	xmlDoc=parser.parseFromString(str,"text/xml")

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

DocUtils.maxArray = (a) -> Math.max.apply(null, a)

DocUtils.getOuterXml=(text,start,end,xmlTag)-> #tag: w:t
	endTag= text.indexOf('</'+xmlTag+'>',end)
	if endTag==-1 then throw new Error("can't find endTag #{endTag}")
	endTag+=('</'+xmlTag+'>').length
	startTag = Math.max text.lastIndexOf('<'+xmlTag+'>',start), text.lastIndexOf('<'+xmlTag+' ',start)
	if startTag==-1 then throw new Error("can't find startTag")
	{"text":text.substr(startTag,endTag-startTag),startTag,endTag}

module.exports=DocUtils
