###
Docxgen.coffee
Created by Edgar HIPP
03/06/2013
###

DocxGen = class DocxGen
	imageExtensions=['gif','jpeg','jpg','emf','png']
	constructor: (content, @templateVars={},@intelligentTagging=off,@qrCode=off,@localImageCreator,@finishedCallback) ->
		@finishedCallback= (() -> console.log 'document ready!') unless @finishedCallback?
		@localImageCreator= (arg,callback) ->
			result=JSZipBase64.decode("iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAIAAABvSEP3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACXSURBVDhPtY7BDYAwDAMZhCf7b8YMxeCoatOQJhWc/KGxT2zlCyaWcz8Y+X7Bs1TFVJSwIHIYyFkQufWIRVX9cNJyW1QpEo4rixaEe7JuQagAUctb7ZFYFh5MVJPBe84CVBnB42//YsZRgKjFDBVg3cI9WbRwXLktQJX8cNIiFhM1ZuTWk7PIYSBhkVcLzwIiCjCxhCjlAkBqYnqFoQQ2AAAAAElFTkSuQmCC")
			callback(result)	
		@templatedFiles=["word/document.xml"
		"word/footer1.xml",
		"word/footer2.xml",
		"word/footer3.xml",
		"word/header1.xml",
		"word/header2.xml",
		"word/header3.xml"
		]
		@filesProcessed=0
		@qrCodeNumCallBack=0
		@qrCodeWaitingFor= []
		if content? then @load(content)
	qrCodeCallBack:(num,add=true) ->
		if add==true
			@qrCodeWaitingFor.push num
		else if add == false
			index = @qrCodeWaitingFor.indexOf(num)
			@qrCodeWaitingFor.splice(index, 1)
		@testReady()
	testReady:()->
		if @qrCodeWaitingFor.length==0 && @filesProcessed== @templatedFiles.length
			@ready=true
			@finishedCallback()
	load: (content)->
		@zip = new JSZip content
		@loadImageRels()
	loadImageRels: () ->
		content= DocUtils.decode_utf8 @zip.files["word/_rels/document.xml.rels"].data
		@xmlDoc= DocUtils.Str2xml content
		RidArray = ((parseInt tag.getAttribute("Id").substr(3)) for tag in @xmlDoc.getElementsByTagName('Relationship'))
		@maxRid=RidArray.max()
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
	getImageByRid:(rId)->
		relationships= @xmlDoc.getElementsByTagName('Relationship')
		for relationship in relationships
			cRId= relationship.getAttribute('Id')
			if rId==cRId
				path=relationship.getAttribute('Target')
				if path.substr(0,6)=='media/'
					return @zip.files["word/#{path}"]
		return null
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
	applyTemplateVars:(@templateVars=@templateVars,qrCodeCallback=null)->
		for fileName in @templatedFiles when !@zip.files[fileName]?
			@filesProcessed++ #count  files that don't exist as processed
		for fileName in @templatedFiles when @zip.files[fileName]?
			currentFile= new DocXTemplater(@zip.files[fileName].data,this,@templateVars,@intelligentTagging,[],{},0,qrCodeCallback,@localImageCreator)
			@zip.files[fileName].data= currentFile.applyTemplateVars().content
			@filesProcessed++
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
		# for (i in (docX["CUSTemplate.docx"].getTemplateVars()[0].vars)) {cont+=i+";"}
	getTemplateVars:()->
		usedTemplateVars=[]
		for fileName in @templatedFiles when @zip.files[fileName]?
			currentFile= new DocXTemplater(@zip.files[fileName].data,this,@templateVars,@intelligentTagging)
			usedTemplateVars.push {fileName,vars:currentFile.applyTemplateVars().usedTemplateVars}
		usedTemplateVars
	setTemplateVars: (@templateVars) ->
	#output all files, if docx has been loaded via javascript, it will be available
	output: (download = true,name="output.docx") ->
		@calcZip()
		result= @zip.generate()
		if download
			if global?
				fs.writeFile name, result, 'base64', (err) ->
					console.log(err)
			if window?
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

if window?
	window.DocxGen=DocxGen
else 
	global.DocxGen=DocxGen