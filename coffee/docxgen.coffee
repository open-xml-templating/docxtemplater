###
Docxgen.coffee
Created by Edgar HIPP
03/06/2013
###
window.DocUtils= {}

DocUtils.loadDoc= (path,noDocx=false,intelligentTagging=false,async=false) ->
	xhrDoc= new XMLHttpRequest()
	xhrDoc.open('GET', "../examples/#{path}", async)
	if xhrDoc.overrideMimeType
		xhrDoc.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDoc.onreadystatechange =(e)->
		if this.readyState == 4 and this.status == 200
			window.docXData[path]=this.response
			if noDocx==false
				window.docX[path]=new DocxGen(this.response,{},intelligentTagging)
	xhrDoc.send()

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
	content= content.replace /\x20xmlns=""/g, ''
	return content;

DocUtils.Str2xml= (str) ->
	if window.DOMParser
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

window.DocxGen = class DocxGen
	imageExtensions=['gif','jpeg','jpg','emf','png']
	constructor: (content, @templateVars={},@intelligentTagging=off) ->
		@templatedFiles=["word/document.xml"
		"word/footer1.xml",
		"word/footer2.xml",
		"word/footer3.xml",
		"word/header1.xml",
		"word/header2.xml",
		"word/header3.xml"
		]
		if typeof content == "string" then @load(content)
	load: (content)->
		@zip = new JSZip content
		@zip.files=@zip.files
		@loadImageRels()
	loadImageRels: () ->
		content= DocUtils.decode_utf8 @zip.files["word/_rels/document.xml.rels"].data
		@xmlDoc= DocUtils.Str2xml content
		@maxRid=0
		for tag in @xmlDoc.getElementsByTagName('Relationship')
			@maxRid= Math.max((parseInt tag.getAttribute("Id").substr(3)),@maxRid)
		@imageRels=[]
		this
	addExtensionRels: (contentType,extension) ->

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
	addImageRels: (imageName,imageData) ->
		if @zip.files["word/media/#{imageName}"]?
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
		 # @zip.files["word/media/#{imageName}"]=

		extension= imageName.replace(/[^.]+\.([^.]+)/,'$1')
		@addExtensionRels("image/#{extension}",extension)
		relationships= @xmlDoc.getElementsByTagName("Relationships")[0]
		newTag= @xmlDoc.createElement 'Relationship' #,relationships.namespaceURI
		console.log newTag
		newTag.namespaceURI= null
		newTag.setAttribute('Id',"rId#{@maxRid}")
		newTag.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/image')
		newTag.setAttribute('Target',"media/#{imageName}")
		relationships.appendChild newTag
		@zip.files["word/_rels/document.xml.rels"].data= DocUtils.encode_utf8 DocUtils.xml2Str @xmlDoc
		@maxRid
	saveImageRels: () ->
		@zip.files["word/_rels/document.xml.rels"].data	
	getImageList: () ->
		regex= ///
		[^.]*  #name
		\.   #dot
		([^.]*)  #extension
		///
		imageList= []
		for index of @zip.files
			extension= index.replace(regex,'$1')
			if extension in imageExtensions
				imageList.push {"path":index,files:@zip.files[index]}
		imageList
	setImage: (path,data) ->
		@zip.files[path].data= data
	applyTemplateVars:()->
		for fileName in @templatedFiles when @zip.files[fileName]?
			currentFile= new XmlTemplater(@zip.files[fileName].data,this,@templateVars,@intelligentTagging)
			@zip.files[fileName].data= currentFile.applyTemplateVars().content
	getTemplateVars:()->
		usedTemplateVars=[]
		for fileName in @templatedFiles when @zip.files[fileName]?
			currentFile= new XmlTemplater(@zip.files[fileName].data,this,@templateVars,@intelligentTagging)
			usedTemplateVars.push {fileName,vars:currentFile.applyTemplateVars().usedTemplateVars}
		usedTemplateVars
	setTemplateVars: (@templateVars) ->
	#output all files, if docx has been loaded via javascript, it will be available
	output: (download = true) ->
		@calcZip()
		document.location.href= "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,#{@zip.generate()}"
	calcZip: () ->
		zip = new JSZip()
		console.log @zip.files
		for index of @zip.files
			file= @zip.files[index]
			zip.file file.name,file.data,file.options
		@zip=zip
	getFullText:(path="word/document.xml",data="") ->
		if data==""
			currentFile= new XmlTemplater(@zip.files[path].data,this,@templateVars,@intelligentTagging)
		else
			currentFile= new XmlTemplater(data,this,@templateVars,@intelligentTagging)
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