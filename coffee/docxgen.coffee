###
Docxgen.coffee
Created by Edgar HIPP
03/06/2013
###

xml2Str = (xmlNode) ->
	try
		# Gecko- and Webkit-based browsers (Firefox, Chrome), Opera.
		return (new XMLSerializer()).serializeToString(xmlNode);
	catch e
		try
			# Internet Explorer.
			return xmlNode.xml;
		catch e
			#Other browsers without XML Serializer
			alert('Xmlserializer not supported');
	return false;

Str2xml= (str) ->
	if window.DOMParser
		parser=new DOMParser();
		xmlDoc=parser.parseFromString(str,"text/xml")
	else # Internet Explorer
		xmlDoc=new ActiveXObject("Microsoft.XMLDOM")
		xmlDoc.async=false
		xmlDoc.loadXML(str)
	xmlDoc

encode_utf8 = (s)->
	unescape(encodeURIComponent(s))

decode_utf8= (s) ->
	decodeURIComponent(escape(s)).replace(new RegExp(String.fromCharCode(160),"g")," ") #replace Ascii 160 space by the normal space, Ascii 32

preg_match_all= (regex, content) ->
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
		@files={}
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
		zip = new JSZip content
		@files=zip.files
		@loadImageRels()
	loadImageRels: () ->
		content= decode_utf8 @files["word/_rels/document.xml.rels"].data
		@xmlDoc= Str2xml content
		@maxRid=0
		for tag in @xmlDoc.getElementsByTagName('Relationship')
			@maxRid= Math.max((parseInt tag.getAttribute("Id").substr(3)),@maxRid)
		@imageRels=[]
		this
	addExtensionRels: (contentType,extension) ->
		content = decode_utf8 @files["[Content_Types].xml"].data
		xmlDoc= Str2xml content
		newTag=xmlDoc.createElement('Default')
		newTag.setAttribute('ContentType',contentType)
		newTag.setAttribute('Extension',extension)
		xmlDoc.getElementsByTagName("Types")[0].appendChild newTag
		@files["[Content_Types].xml"].data= encode_utf8 xml2Str xmlDoc
	addImageRels: (imageName,imageData) ->
		if @files["word/media/#{imageName}"]?
			return false
		@maxRid++
		@files["word/media/#{imageName}"]=
			'name':"word/media/#{imageName}"
			'data':imageData
			'options':
				base64: false
				binary: true
				compression: null
				date: new Date()
				dir: false
		extension= imageName.replace(/[^.]+\.([^.]+)/,'$1')
		@addExtensionRels("image/#{extension}",extension)
		newTag= (@xmlDoc.createElement 'Relationship')
		newTag.setAttribute('Id',"rId#{@maxRid}")
		newTag.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/image')
		newTag.setAttribute('Target',"media/#{imageName}")
		@xmlDoc.getElementsByTagName("Relationships")[0].appendChild newTag
		@files["word/_rels/document.xml.rels"].data= encode_utf8 xml2Str @xmlDoc
		@maxRid
	saveImageRels: () ->
		@files["word/_rels/document.xml.rels"].data	
	getImageList: () ->
		regex= ///
		[^.]*  #name
		\.   #dot
		([^.]*)  #extension
		///
		imageList= []
		for index of @files
			extension= index.replace(regex,'$1')
			if extension in imageExtensions
				imageList.push {"path":index,files:@files[index]}
		imageList
	setImage: (path,data) ->
		@files[path].data= data
	applyTemplateVars:()->
		for fileName in @templatedFiles when @files[fileName]?
			currentFile= new XmlTemplater(this,@files[fileName].data,@templateVars,@intelligentTagging)
			@files[fileName].data= currentFile.applyTemplateVars().content
	getTemplateVars:()->
		usedTemplateVars=[]
		for fileName in @templatedFiles when @files[fileName]?
			currentFile= new XmlTemplater(this,@files[fileName].data,@templateVars,@intelligentTagging)
			usedTemplateVars.push {fileName,vars:currentFile.applyTemplateVars().usedTemplateVars}
		usedTemplateVars
	setTemplateVars: (@templateVars) ->
	#output all files, if docx has been loaded via javascript, it will be available
	output: (download = true) ->
		zip = new JSZip()
		doOutput= () ->
			document.location.href= "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,#{outputFile}"
		for index of @files
			file=@files[index]
			zip.file file.name,file.data,file.options
		outputFile= zip.generate()
		if download==true then doOutput()
		outputFile
	getFullText:(path="word/document.xml",data="") ->
		if data==""
			currentFile= new XmlTemplater(this,@files[path].data,@templateVars,@intelligentTagging)
		else
			currentFile= new XmlTemplater(this,data,@templateVars,@intelligentTagging)
		currentFile.getFullText()
	download: (swfpath, imgpath, filename="default.docx") ->
		outputFile= @output(false)
		Downloadify.create 'downloadify',
			filename: () ->	return filename
			data: () ->
				return outputFile
			onCancel: () -> alert 'You have cancelled the saving of this file.'
			onError: () -> alert 'You must put something in the File Contents or there will be nothing to save!'
			swf: swfpath
			downloadImage: imgpath
			width: 100
			height: 30
			transparent: true
			append: false
			dataType:'base64'