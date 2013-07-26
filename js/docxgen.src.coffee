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
		httpRegex= new RegExp "(https?)","i"
		# httpsRegex= new RegExp "(https)://"
		if httpRegex.test(path)
			console.log('http(s) url matched:'+path)
			urloptions=(url.parse(path))
			options = 
				hostname:urloptions.hostname
				path:urloptions.path
				method: 'GET'
				rejectUnauthorized:false
			
			errorCallback= (e) ->
				console.log("Error: \n" + e.message); 
				console.log( e.stack );

			reqCallback= (res)->
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
###
Docxgen.coffee
Created by Edgar HIPP
26/07/2013
###

root= global ? window
env= if global? then 'node' else 'browser'

root.DocxGen = class DocxGen
	imageExtensions=['gif','jpeg','jpg','emf','png']
	constructor: (content, @templateVars={},@intelligentTagging=on,@qrCode=off,@localImageCreator,@finishedCallback) ->
		@finishedCallback= (() -> console.log 'document ready!') unless @finishedCallback? #Default Value of @finishedCallback
		if not @localImageCreator?
			@localImageCreator= (arg,callback) ->
				#This is the image of an arrow, you can replace this function by whatever you want to generate an image
				result=JSZipBase64.decode("iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAIAAABvSEP3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACXSURBVDhPtY7BDYAwDAMZhCf7b8YMxeCoatOQJhWc/KGxT2zlCyaWcz8Y+X7Bs1TFVJSwIHIYyFkQufWIRVX9cNJyW1QpEo4rixaEe7JuQagAUctb7ZFYFh5MVJPBe84CVBnB42//YsZRgKjFDBVg3cI9WbRwXLktQJX8cNIiFhM1ZuTWk7PIYSBhkVcLzwIiCjCxhCjlAkBqYnqFoQQ2AAAAAElFTkSuQmCC")
				callback(result)
		@templatedFiles=["word/document.xml","word/footer1.xml","word/footer2.xml","word/footer3.xml","word/header1.xml","word/header2.xml","word/header3.xml"]
		@filesProcessed=0  # This is the number of files that were processed, When all files are processed and all qrcodes are decoded, the finished Callback is called
		@qrCodeNumCallBack=0 #This is the order of the qrcode
		@qrCodeWaitingFor= [] #The templater waits till all the qrcodes are decoded, This is the list of the remaining qrcodes to decode (only their order in the document is stored)
		if content? then @load(content)
		this
	qrCodeCallBack:(num,add=true) ->
		if add==true
			@qrCodeWaitingFor.push num
		else if add == false
			index = @qrCodeWaitingFor.indexOf(num)
			@qrCodeWaitingFor.splice(index, 1)
		@testReady()
	testReady:()->
		if @qrCodeWaitingFor.length==0 and @filesProcessed== @templatedFiles.length ## When all files are processed and all qrCodes are processed too, the finished callback can be called
			@ready=true
			@finishedCallback()
	load: (content)->
		@zip = new JSZip content
		@loadImageRels() #Loads the image Relationships that can be found in "word/_rels/document.xml.rels"
	loadImageRels: () ->
		content= DocUtils.decode_utf8 @zip.files["word/_rels/document.xml.rels"].data
		@xmlDoc= DocUtils.Str2xml content
		RidArray = ((parseInt tag.getAttribute("Id").substr(3)) for tag in @xmlDoc.getElementsByTagName('Relationship')) #Get all Rids
		@maxRid=RidArray.max()
		@imageRels=[]
		this
	addExtensionRels: (contentType,extension) -> #Add an extension type in the [Content_Types.xml], is used if for example you want word to be able to read png files (for every extension you add you need a contentType)
		content = DocUtils.decode_utf8 @zip.files["[Content_Types].xml"].data
		xmlDoc= DocUtils.Str2xml content
		addTag= true
		defaultTags=xmlDoc.getElementsByTagName('Default')
		for tag in defaultTags
			if tag.getAttribute('Extension')==extension then addTag= false
		if addTag
			types=xmlDoc.getElementsByTagName("Types")[0]
			newTag=xmlDoc.createElement 'Default'
			newTag.namespaceURI= null
			newTag.setAttribute('ContentType',contentType)
			newTag.setAttribute('Extension',extension)
			types.appendChild newTag
			@zip.files["[Content_Types].xml"].data= DocUtils.encode_utf8 DocUtils.xml2Str xmlDoc
	addImageRels: (imageName,imageData) -> #Adding an image and returns it's Rid
		if @zip.files["word/media/#{imageName}"]?
			throw 'file already exists'
			return false
		@maxRid++
		file=
			'name':"word/media/#{imageName}"
			'data':imageData
			'options':
				base64: false
				binary: true
				compression: null
				date: new Date()
				dir: false
		@zip.file file.name,file.data,file.options
		extension= imageName.replace(/[^.]+\.([^.]+)/,'$1')
		@addExtensionRels("image/#{extension}",extension)
		relationships= @xmlDoc.getElementsByTagName("Relationships")[0]
		newTag= @xmlDoc.createElement 'Relationship' #,relationships.namespaceURI
		newTag.namespaceURI= null
		newTag.setAttribute('Id',"rId#{@maxRid}")
		newTag.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/image')
		newTag.setAttribute('Target',"media/#{imageName}")
		relationships.appendChild newTag
		@zip.files["word/_rels/document.xml.rels"].data= DocUtils.encode_utf8 DocUtils.xml2Str @xmlDoc
		@maxRid
	getImageByRid:(rId)-> #This is to get an image by it's rId (returns null if no img was found)
		relationships= @xmlDoc.getElementsByTagName('Relationship')
		for relationship in relationships
			cRId= relationship.getAttribute('Id')
			if rId==cRId
				path=relationship.getAttribute('Target')
				if path.substr(0,6)=='media/'
					return @zip.files["word/#{path}"]
		return null
	getImageList: () ->
		regex= ///
		[^.]+  #name
		\.   #dot
		([^.]+)  #extension
		///
		imageList= []
		for index of @zip.files
			extension= index.replace(regex,'$1')
			if extension in imageExtensions #Defined in constructor
				imageList.push {"path":index,files:@zip.files[index]}
		imageList
	setImage: (path,data) ->
		@zip.files[path].data= data
	applyTemplateVars:(@templateVars=@templateVars,qrCodeCallback=null)->
		#Loop inside all templatedFiles (basically xml files with content). Sometimes they dont't exist (footer.xml for example)
		for fileName in @templatedFiles when !@zip.files[fileName]?
			@filesProcessed++ #count  files that don't exist as processed
		for fileName in @templatedFiles when @zip.files[fileName]?
			currentFile= new DocXTemplater(@zip.files[fileName].data,this,@templateVars,@intelligentTagging,[],{},0,qrCodeCallback,@localImageCreator)
			@zip.files[fileName].data= currentFile.applyTemplateVars().content
			@filesProcessed++
		#When all files have been processed, check if the document is ready
		@testReady()
	getCsvVars:() ->
		obj= @getTemplateVars()
		csvcontent = ""
		csvVars= {}
		for temp,i in obj
			for j of temp.vars
				csvcontent+=j+";" unless csvVars[j]?
				csvVars[j]= {}
		csvcontent
	getCsvFile:() ->
		file= btoa @getCsvVars()
		document.location.href= "data:application/vnd.ms-excel;base64,#{file}"
	getTemplateVars:()->
		usedTemplateVars=[]
		for fileName in @templatedFiles when @zip.files[fileName]?
			currentFile= new DocXTemplater(@zip.files[fileName].data,this,@templateVars,@intelligentTagging)
			usedTemplateV= currentFile.applyTemplateVars().usedTemplateVars
			#test if usedTemplateV!={}
			n=0
			for h of usedTemplateV
				n++
			if n>0 
				usedTemplateVars.push {fileName,vars:usedTemplateV}
		usedTemplateVars
	setTemplateVars: (@templateVars) ->
		this
	#output all files, if docx has been loaded via javascript, it will be available
	output: (download = true,name="output.docx") ->
		@calcZip()
		result= @zip.generate()
		if download
			if env=='node'
				fs.writeFile process.cwd()+'/'+name, result, 'base64', (err) ->
					if err then throw err
					console.log 'file Saved'
			else
				#Be aware that data-uri doesn't work for too big files: More Info http://stackoverflow.com/questions/17082286/getting-max-data-uri-size-in-javascript
				document.location.href= "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,#{result}"
		result
	calcZip: () ->
		zip = new JSZip()
		for index of @zip.files
			file= @zip.files[index]
			zip.file file.name,file.data,file.options
		@zip=zip
	getFullText:(path="word/document.xml",data="") ->
		if data==""
			currentFile= new DocXTemplater(@zip.files[path].data,this,@templateVars,@intelligentTagging)
		else
			currentFile= new DocXTemplater(data,this,@templateVars,@intelligentTagging)
		currentFile.getFullText()
	download: (swfpath, imgpath, filename="default.docx") ->
		@calcZip()
		output=@zip.generate()
		Downloadify.create 'downloadify',
			filename: () ->	return filename
			data: () ->
				return output
			onCancel: () -> alert 'You have cancelled the saving of this file.'
			onError: () -> alert 'You must put something in the File Contents or there will be nothing to save!'
			swf: swfpath
			downloadImage: imgpath
			width: 100
			height: 30
			transparent: true
			append: false
			dataType:'base64'


root= global ? window
env= if global? then 'node' else 'browser'

#This is an abstract class, DocXTemplater is an example of inherited class

XmlTemplater =  class XmlTemplater #abstract class !! 
	constructor: (content="",creator,@templateVars={},@intelligentTagging=off,@scopePath=[],@usedTemplateVars={},@imageId=0, @qrcodeCallback = null,@localImageCreator) ->
		if @qrcodeCallback==null then @qrcodeCallback= () -> @DocxGen.ready= true
		@tagX='' #TagX represents the name of the tag that contains text. For example, in docx, @tagX='w:t'
		@class=XmlTemplater #This is used because tags are recursive, so the class needs to be able to instanciate an object of the same class. I created a variable so you don't have to Override all functions relative to recursivity
		
		###They are two ways to instantiate a XmlTemplater object:
		1: new XmlTemplater(content,creator,@templateVars, ...)
			content:string
			creator:DocxGen object
			...
		2: new XmlTemplater(content, options)
			content is the content
			options contains all the arguments:
			options=
				{
				"templateVars":...,
				"DocxGen":...,
				"intelligentTagging":...,
				"scopePath":...,
				"usedTemplateVars":...,
				"imageId":...
				}
		###
		if creator instanceof DocxGen or (not creator?) 
			@DocxGen=creator
		else
			options= creator
			@templateVars= options.templateVars
			@DocxGen= options.DocxGen
			@intelligentTagging=options.intelligentTagging
			@scopePath=options.scopePath
			@usedTemplateVars=options.usedTemplateVars
			@imageId=options.imageId
		if typeof content=="string" then @load content else throw "content must be string!"
		@numQrCode=0
		@currentScope=@templateVars
	load: (@content) ->
		@matches = @_getFullTextMatchesFromData()
		@charactersAdded= (0 for i in [0...@matches.length])
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

		regex= "(<#{@tagX}[^>]*>)([^>]+)$"
		@content.replace (new RegExp(regex)),replacerPush
	setUsedTemplateVars: (tag) ->
		u = @usedTemplateVars
		for s,i in @scopePath
			u[s]={} unless u[s]?
			u = u[s]
		if tag!=""
			u[tag]= true
	getValueFromTag: (tag,scope) ->
		@setUsedTemplateVars(tag)
		content= ""
		if scope[tag]?
			content= DocUtils.encode_utf8 scope[tag]
		else
			content= "undefined"
		if content.indexOf('{')!=-1 or content.indexOf('}')!=-1
			alert('On ne peut mettre de { ou de } dans le contenu d\'une variable')
			throw 'On ne peut mettre de { ou de } dans le contenu d\'une variable'
		content
	calcScopeText: (text,start=0,end=text.length-1) ->
		###get the different closing and opening tags between two texts (doesn't take into account tags that are opened then closed (those that are closed then opened are returned)):
		returns:[{"tag":"</w:r>","offset":13},{"tag":"</w:p>","offset":265},{"tag":"</w:tc>","offset":271},{"tag":"<w:tc>","offset":828},{"tag":"<w:p>","offset":883},{"tag":"<w:r>","offset":1483}]
		###
		tags= DocUtils.preg_match_all("<(\/?[^/> ]+)([^>]*)>",text.substr(start,end)) #getThemAll (the opening and closing tags)!
		result=[]
		for tag,i in tags
			if tag[1][0]=='/' #closing tag
				justOpened= false
				if result.length>0
					lastTag= result[result.length-1]
					innerLastTag= lastTag.tag.substr(1,lastTag.tag.length-2)
					innerCurrentTag= tag[1].substr(1)
					if innerLastTag==innerCurrentTag then justOpened= true #tag was just opened
				if justOpened then result.pop() else result.push {tag:'<'+tag[1]+'>',offset:tag.offset}
			else if tag[2][tag[2].length-1]=='/' #open/closing tag aren't taken into account(for example <w:style/>)
			else	#opening tag
				result.push {tag:'<'+tag[1]+'>',offset:tag.offset}
		result
	calcScopeDifference: (text,start=0,end=text.length-1) -> #it returns the difference between two scopes, ie simplifyes closes and opens. If it is not null, it means that the beginning is for example in a table, and the second one is not. If you hard copy this text, the XML will  break
		scope= @calcScopeText text,start,end
		while(1)
			if (scope.length<=1) #if scope.length==1, then they can't be an opeining and closing tag
				break;
			if ((scope[0]).tag.substr(2)==(scope[scope.length-1]).tag.substr(1)) #if the first closing is the same than the last opening, ie: [</tag>,...,<tag>]
				scope.pop() #remove both the first and the last one
				scope.shift()
			else break;
		scope
	getFullText:() ->
		@matches= @_getFullTextMatchesFromData() #get everything that is between <w:t>
		output= (match[2] for match in @matches) #get only the text
		DocUtils.decode_utf8(output.join("")) #join it
	_getFullTextMatchesFromData: () ->
		@matches= DocUtils.preg_match_all("(<#{@tagX}[^>]*>)([^<>]*)?</#{@tagX}>",@content)
	calcInnerTextScope: (text,start,end,tag) -> #tag: w:t
		endTag= text.indexOf('</'+tag+'>',end)
		if endTag==-1 then throw "can't find endTag #{endTag}"
		endTag+=('</'+tag+'>').length
		startTag = Math.max text.lastIndexOf('<'+tag+'>',start), text.lastIndexOf('<'+tag+' ',start)
		if startTag==-1 then throw "can't find startTag"
		{"text":text.substr(startTag,endTag-startTag),startTag,endTag}
	calcB: () ->
		startB = @calcStartBracket @loopOpen
		endB= @calcEndBracket @loopClose
		{B:@content.substr(startB,endB-startB),startB,endB}
	calcA: () ->
		startA= @calcEndBracket @loopOpen
		endA= @calcStartBracket @loopClose
		{A:@content.substr(startA,endA-startA),startA,endA}
	calcStartBracket: (bracket) ->
		@matches[bracket.start.i].offset+@matches[bracket.start.i][1].length+@charactersAdded[bracket.start.i]+bracket.start.j
	calcEndBracket: (bracket)->
		@matches[bracket.end.i].offset+@matches[bracket.end.i][1].length+@charactersAdded[bracket.end.i]+bracket.end.j+1
	toJson: () ->
		templateVars:DocUtils.clone @templateVars
		DocxGen:@DocxGen
		intelligentTagging:DocUtils.clone @intelligentTagging
		scopePath:DocUtils.clone @scopePath
		usedTemplateVars:@usedTemplateVars
		localImageCreator:@localImageCreator
		imageId:@imageId
	forLoop: (A="",B="") ->
		###
			<w:t>{#forTag} blabla</w:t>
			Blabla1
			Blabla2
			<w:t>{/forTag}</w:t>

			Let A be what is in between the first closing bracket and the second opening bracket
			Let B what is in between the first opening tag {# and the last closing tag

			A=</w:t>
			Blabla1
			Blabla2
			<w:t>

			B={#forTag}</w:t>
			Blabla1
			Blabla2
			<w:t>{/forTag}

			We replace B by nA, n is equal to the length of the array in scope forTag
			<w:t>subContent subContent subContent</w:t>
		###
		if A=="" and B==""
			B= @calcB().B
			A= @calcA().A

			if B[0]!='{' or B.indexOf('{')==-1 or B.indexOf('/')==-1 or B.indexOf('}')==-1 or B.indexOf('#')==-1 then throw "no {,#,/ or } found in B: #{B}"

		if @currentScope[@loopOpen.tag]?
			# if then throw '{#'+@loopOpen.tag+"}should be an object (it is a #{typeof @currentScope[@loopOpen.tag]})"
			subScope= @currentScope[@loopOpen.tag] if typeof @currentScope[@loopOpen.tag]=='object'
			subScope= true if @currentScope[@loopOpen.tag]=='true'
			subScope= false if @currentScope[@loopOpen.tag]=='false'
			newContent= "";

			if typeof subScope == 'object'
				for scope,i in @currentScope[@loopOpen.tag]
					options= @toJson()
					options.templateVars=scope
					options.scopePath= options.scopePath.concat(@loopOpen.tag)
					subfile= new @class  A,options
					subfile.applyTemplateVars()
					@imageId=subfile.imageId
					newContent+=subfile.content #@applyTemplateVars A,scope
					if ((subfile.getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{subfile.getFullText()} (1)"
			if subScope == true
				options= @toJson()
				options.templateVars= @currentScope
				options.scopePath= options.scopePath.concat(@loopOpen.tag)
				subfile= new @class  A,options
				subfile.applyTemplateVars()
				@imageId=subfile.imageId
				newContent+=subfile.content #@applyTemplateVars A,scope
				if ((subfile.getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{subfile.getFullText()} (1)"
			@content=@content.replace B, newContent
		else
			options= @toJson()
			options.templateVars={}
			options.scopePath= options.scopePath.concat(@loopOpen.tag)
			subfile= new @class A, options
			subfile.applyTemplateVars()
			@imageId=subfile.imageId
			@content= @content.replace B, ""

		options= @toJson()
		nextFile= new @class @content,options
		nextFile.applyTemplateVars()
		@imageId=nextFile.imageId
		if ((nextFile.getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{nextFile.getFullText()} (3)"
		@content=nextFile.content
		return this

	dashLoop: (elementDashLoop,sharp=false) ->
		{B,startB,endB}= @calcB()
		resultFullScope = @calcInnerTextScope @content, startB, endB, elementDashLoop
		for t in [0..@matches.length]
			@charactersAdded[t]-=resultFullScope.startTag
		B= resultFullScope.text
		if (@content.indexOf B)==-1 then throw "couln't find B in @content"
		A = B
		copyA= A

		#for deleting the opening tag

		@bracketEnd= {"i":@loopOpen.end.i,"j":@loopOpen.end.j}
		@bracketStart= {"i":@loopOpen.start.i,"j":@loopOpen.start.j}
		if sharp==false then @textInsideBracket= "-"+@loopOpen.element+" "+@loopOpen.tag
		if sharp==true then @textInsideBracket= "#"+@loopOpen.tag

		A= @replaceCurly("",A)
		if copyA==A then throw "A should have changed after deleting the opening tag"
		copyA= A

		@textInsideBracket= "/"+@loopOpen.tag
		#for deleting the closing tag
		@bracketEnd= {"i":@loopClose.end.i,"j":@loopClose.end.j}
		@bracketStart= {"i":@loopClose.start.i,"j":@loopClose.start.j}
		A= @replaceCurly("",A)

		if copyA==A then throw "A should have changed after deleting the opening tag"

		return @forLoop(A,B)

	replaceXmlTag: (content,tagNumber,insideValue,spacePreserve=false,noStartTag=false) ->
		@matches[tagNumber][2]=insideValue #so that the matches are still correct
		startTag= @matches[tagNumber].offset+@charactersAdded[tagNumber]  #where the open tag starts: <w:t>
		#calculate the replacer according to the params
		if noStartTag == true
			replacer= insideValue
		else
			if spacePreserve==true
				replacer= """<#{@tagX} xml:space="preserve">#{insideValue}</#{@tagX}>"""
			else replacer= @matches[tagNumber][1]+insideValue+"</#{@tagX}>"
		@charactersAdded[tagNumber+1]+=replacer.length-@matches[tagNumber][0].length
		if content.indexOf(@matches[tagNumber][0])==-1 then throw "content #{@matches[tagNumber][0]} not found in content"
		copyContent= content
		content = DocUtils.replaceFirstFrom content,@matches[tagNumber][0], replacer, startTag
		@matches[tagNumber][0]=replacer

		if copyContent==content then throw "offset problem0: didnt changed the value (should have changed from #{@matches[@bracketStart.i][0]} to #{replacer}"
		content

	replaceCurly: (newValue,content=@content) ->
		if (@matches[@bracketEnd.i][2].indexOf ('}'))==-1 then throw "no closing bracket at @bracketEnd.i #{@matches[@bracketEnd.i][2]}"
		if (@matches[@bracketStart.i][2].indexOf ('{'))==-1 then throw "no opening bracket at @bracketStart.i #{@matches[@bracketStart.i][2]}"
		copyContent=content
		if @bracketEnd.i==@bracketStart.i #<w>{aaaaa}</w>
			if (@matches[@bracketStart.i].first?)
				insideValue= @matches[@bracketStart.i][2].replace "{#{@textInsideBracket}}", newValue
				content= @replaceXmlTag(content,@bracketStart.i,insideValue,true,true)

			else if (@matches[@bracketStart.i].last?)
				insideValue= @matches[@bracketStart.i][0].replace "{#{@textInsideBracket}}", newValue
				content= @replaceXmlTag(content,@bracketStart.i,insideValue,true,true)
			else
				insideValue= @matches[@bracketStart.i][2].replace "{#{@textInsideBracket}}", newValue
				content= @replaceXmlTag(content,@bracketStart.i,insideValue,true)

		else if @bracketEnd.i>@bracketStart.i

			# 1. for the first (@bracketStart.i): replace __{.. by __value
			regexRight= /^([^{]*){.*$/
			subMatches= @matches[@bracketStart.i][2].match regexRight

			if @matches[@bracketStart.i].first? #if the content starts with:  {tag</w:t>
				content= @replaceXmlTag(content,@bracketStart.i,newValue,true,true)
			else if @matches[@bracketStart.i].last?
				content= @replaceXmlTag(content,@bracketStart.i,newValue,true,true)
			else
				insideValue=subMatches[1]+newValue
				content= @replaceXmlTag(content,@bracketStart.i,insideValue,true)

			#2. for in between (@bracketStart.i+1...@bracketEnd.i) replace whole by ""
			for k in [(@bracketStart.i+1)...@bracketEnd.i]
				@charactersAdded[k+1]=@charactersAdded[k]
				content= @replaceXmlTag(content,k,"")

			#3. for the last (@bracketEnd.i) replace ..}__ by ".." ###
			regexLeft= /^[^}]*}(.*)$/;
			insideValue = @matches[@bracketEnd.i][2].replace regexLeft, '$1'
			@charactersAdded[@bracketEnd.i+1]=@charactersAdded[@bracketEnd.i]
			content= @replaceXmlTag(content,k, insideValue,true)

		for match, j in @matches when j>@bracketEnd.i
			@charactersAdded[j+1]=@charactersAdded[j]
		if copyContent==content then throw "copycontent=content !!"
		return content
	###
	content is the whole content to be tagged
	scope is the current scope
	returns the new content of the tagged content###
	applyTemplateVars:()->
		@setUsedTemplateVars("")
		@inForLoop= false # bracket with sharp: {#forLoop}______{/forLoop}
		@inBracket= false # all brackets  {___}
		@inDashLoop = false	# bracket with dash: {-w:tr dashLoop} {/dashLoop}
		@textInsideBracket= ""
		for match,i in @matches
			innerText= match[2] || "" #text inside the <w:t>
			for t in [i...@matches.length]
				@charactersAdded[t+1]=@charactersAdded[t]
			for character,j in innerText
				for m,t in @matches when t<=i
					if @content[m.offset+@charactersAdded[t]]!=m[0][0] then throw "no < at the beginning of #{m[0][0]} (2)"
				if character=='{'
					if @inBracket is true then throw "Bracket already open with text: #{@textInsideBracket}"
					@inBracket= true
					@textInsideBracket= ""
					@bracketStart={"i":i,"j":j}

				else if character == '}'
					@bracketEnd={"i":i,"j":j}

					if @textInsideBracket[0]=='#' and @inForLoop is false and @inDashLoop is false
						@inForLoop= true #begin for loop
						@loopOpen={'start':@bracketStart,'end':@bracketEnd,'tag':@textInsideBracket.substr 1}
					if @textInsideBracket[0]=='-' and @inForLoop is false and @inDashLoop is false
						@inDashLoop= true
						regex= /^-([a-zA-Z_:]+) ([a-zA-Z_:]+)$/
						@loopOpen={'start':@bracketStart,'end':@bracketEnd,'tag':(@textInsideBracket.replace regex, '$2'),'element':(@textInsideBracket.replace regex, '$1')}
					if @inBracket is false then	throw "Bracket already closed #{@content}"
					@inBracket= false

					if @inForLoop is false and @inDashLoop is false
						@content = @replaceCurly(@getValueFromTag(@textInsideBracket,@currentScope))

					if @textInsideBracket[0]=='/'
						@loopClose={'start':@bracketStart,'end':@bracketEnd}

					if @textInsideBracket[0]=='/' and ('/'+@loopOpen.tag == @textInsideBracket) and @inDashLoop is true
						return @dashLoop(@loopOpen.element)

					if @textInsideBracket[0]=='/' and ('/'+@loopOpen.tag == @textInsideBracket) and @inForLoop is true
						#You DashLoop= take the outer scope only if you are in a table
						dashLooping= no
						if @intelligentTagging==on
							{B,startB,endB}= @calcB()
							scopeContent= @calcScopeText @content, startB,endB-startB
							for t in scopeContent
								if t.tag=='<w:tc>'
									dashLooping= yes
									elementDashLoop= 'w:tr'

						if dashLooping==no
							return @forLoop()
						else
							return @dashLoop(elementDashLoop,true)
				else #if character != '{' and character != '}'
					if @inBracket is true then @textInsideBracket+=character
		# if ((@getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{@getFullText()} (2)"
		imgReplacer= new ImgReplacer(this)
		imgReplacer.findImages()
		imgReplacer.replaceImages()
		this

root.XmlTemplater=XmlTemplater
root= global ? window
env= if global? then 'node' else 'browser'

DocXTemplater = class DocXTemplater extends XmlTemplater
	constructor:(content="",creator,@templateVars={},@intelligentTagging=off,@scopePath=[],@usedTemplateVars={},@imageId=0) ->
		super(null,creator,@templateVars,@intelligentTagging,@scopePath,@usedTemplateVars,@imageId)
		@class=DocXTemplater
		@tagX='w:t'
		if typeof content=="string" then @load content else throw "content must be string!"

root.DocXTemplater=DocXTemplater
root= global ? window
env= if global? then 'node' else 'browser'

ImgReplacer = class ImgReplacer
	constructor: (@xmlTemplater)->
		@imgMatches=[]
	findImages:() ->
		@imgMatches= DocUtils.preg_match_all ///
		<w:drawing[^>]*>
		.*?
		</w:drawing>
		///g, @xmlTemplater.content
	replaceImages: ()->
		console.log 'replacing Images ...'
		qr=[]

		callback= (docxqrCode) ->
			console.log ('removing qrcode')
			console.log 'setting image:'+"word/media/#{docxqrCode.imgName}"
			docxqrCode.xmlTemplater.numQrCode--
			docxqrCode.xmlTemplater.DocxGen.setImage("word/media/#{docxqrCode.imgName}",docxqrCode.data)
			docxqrCode.xmlTemplater.DocxGen.qrCodeCallBack(docxqrCode.num,false)
		for match,u in @imgMatches
			xmlImg= DocUtils.Str2xml '<?xml version="1.0" ?><w:document mc:Ignorable="w14 wp14" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">'+match[0]+'</w:document>'

			if @xmlTemplater.DocxGen.qrCode
				tagrId= xmlImg.getElementsByTagNameNS('*','blip')[0]

				if tagrId==undefined
					console.log 'tagRid not defined, trying alternate method'
					tagrId= xmlImg.getElementsByTagName("a:blip")[0]
				if tagrId!=undefined
					rId = tagrId.getAttribute('r:embed')
					oldFile= @xmlTemplater.DocxGen.getImageByRid(rId)

					if oldFile!=null
						tag= xmlImg.getElementsByTagNameNS('*','docPr')[0]
						if tag==undefined
							console.log 'tag not defined, trying alternate method'
							tag=xmlImg.getElementsByTagName('wp:docPr')[0]
						if tag!=undefined

							if tag.getAttribute("name").substr(0,6)!="Copie_" #if image is not already a replacement

								imgName= ("Copie_"+@xmlTemplater.imageId+".png").replace(/\x20/,"")
								@xmlTemplater.DocxGen.qrCodeNumCallBack++
								
								@xmlTemplater.DocxGen.qrCodeCallBack(@xmlTemplater.DocxGen.qrCodeNumCallBack,true)

								newId= @xmlTemplater.DocxGen.addImageRels(imgName,"")
								@xmlTemplater.imageId++
								@xmlTemplater.DocxGen.setImage("word/media/#{imgName}",oldFile.data)
								# tag.setAttribute('id',@xmlTemplater.imageId)


								if env=='browser'
									qr[u]= new DocxQrCode(oldFile.data,@xmlTemplater,imgName,@xmlTemplater.DocxGen.qrCodeNumCallBack)

								tag.setAttribute('name',"#{imgName}")
								tagrId.setAttribute('r:embed',"rId#{newId}")
								console.log "tagrId:"+tagrId.getAttribute('r:embed')
								imageTag= xmlImg.getElementsByTagNameNS('*','drawing')[0]

								if imageTag==undefined
									console.log 'imagetag not defined, trying alternate method'
									imageTag=xmlImg.getElementsByTagName('w:drawing')[0]

								replacement= DocUtils.xml2Str imageTag
								@xmlTemplater.content= @xmlTemplater.content.replace(match[0], replacement)

								@xmlTemplater.numQrCode++

								if env=='browser'
									qr[u].decode(callback)
								else
									if /\.png$/.test(oldFile.name) 
										do (imgName) =>
											console.log(oldFile.name)
											base64= JSZipBase64.encode oldFile.data
											binaryData = new Buffer(base64, 'base64') 			
											png= new PNG(binaryData)
											finished= (a) =>
												try
													png.decoded= a
													qr[u]= new DocxQrCode(png,@xmlTemplater,imgName,@xmlTemplater.DocxGen.qrCodeNumCallBack)
													qr[u].decode(callback)											
												catch e
													console.log(e)
													@xmlTemplater.DocxGen.qrCodeCallBack(@xmlTemplater.DocxGen.qrCodeNumCallBack,false)
											dat= png.decode(finished)
									else
										#remove the image from the list of images to be tested
										@xmlTemplater.DocxGen.qrCodeCallBack(@xmlTemplater.DocxGen.qrCodeNumCallBack,false)


			else if @xmlTemplater.currentScope["img"]? then if @xmlTemplater.currentScope["img"][u]?
				
				imgName= @xmlTemplater.currentScope["img"][u].name
				imgData= @xmlTemplater.currentScope["img"][u].data
				throw 'DocxGen not defined' unless @xmlTemplater.DocxGen?
				newId= @xmlTemplater.DocxGen.addImageRels(imgName,imgData)
				tag= xmlImg.getElementsByTagNameNS('*','docPr')[0]
				if tag==undefined
					console.log 'tag not defined, trying alternate method'
					tag=xmlImg.getElementsByTagName('wp:docPr')[0]
				if tag!=undefined

					@xmlTemplater.imageId++
					tag.setAttribute('id',@xmlTemplater.imageId)
					tag.setAttribute('name',"#{imgName}")

					tagrId= xmlImg.getElementsByTagNameNS('*','blip')[0]
					if tagrId==undefined
						console.log 'tagRid not defined, trying alternate method'
						tagrId= xmlImg.getElementsByTagName("a:blip")[0]
					if tagrId!=undefined
						tagrId.setAttribute('r:embed',"rId#{newId}")
						imageTag= xmlImg.getElementsByTagNameNS('*','drawing')[0]
						if imageTag==undefined
							console.log 'imagetag not defined, trying alternate method'
							imageTag=xmlImg.getElementsByTagName('w:drawing')[0]

						@xmlTemplater.content=@xmlTemplater.content.replace(match[0], DocUtils.xml2Str imageTag)

root.ImgReplacer=ImgReplacer
root= global ? window
env= if global? then 'node' else 'browser'

DocxQrCode = class DocxQrCode
	constructor:(imageData, @xmlTemplater,@imgName="",@num,@callback)->
		@data=imageData
		@base64Data=JSZipBase64.encode(@data)
		@ready=false
		@result=null
	decode:(@callback) ->
		_this= this
		console.log('qrcode')
		@qr= new QrCode()
		@qr.callback= () ->
			_this.ready= true
			_this.result= this.result
			console.log('result:'+_this.result)

			testdoc= new _this.xmlTemplater.class this.result, _this.xmlTemplater.toJson()
			testdoc.applyTemplateVars()
			_this.result=testdoc.content
			_this.searchImage()
		if env=='browser'
			@qr.decode("data:image/png;base64,#{@base64Data}")
		else
			@qr.decode(@data,@data.decoded)

	searchImage:() ->
		if @result.substr(0,4)=='gen:'
			callback= (data) =>
				@data=data
				@callback(this,@imgName,@num)
				@xmlTemplater.DocxGen.localImageCreator(@result,callback)
		else if @result!=null and @result!= undefined and @result.substr(0,22)!= 'error decoding QR Code'
			loadDocCallback= (fail=false) =>
				if not fail
					@data=docXData[@result]
					@callback(this,@imgName,@num)
				else
					console.log('file image loading failed!')
					@callback(this,@imgName,@num)
			DocUtils.loadDoc(@result,true,false,false,loadDocCallback)
		else
			@callback(this,@imgName,@num)	

root.DocxQrCode=DocxQrCode