###
Docxgen.coffee
Created by Edgar HIPP
###

DocUtils=require('./docUtils')
ImgManager=require('./imgManager')
DocXTemplater=require('./docxTemplater')
JSZip=require('jszip')
fs= require('fs')

module.exports=class DocxGen
	templatedFilesforDOCX = ["word/document.xml","word/footer1.xml","word/footer2.xml","word/footer3.xml","word/header1.xml","word/header2.xml","word/header3.xml"]
	fileExts = ["pptx", "docx"]
	constructor: (content, @Tags={},@options) ->
		@setOptions(@options)
		@finishedCallback=()->
		@filesProcessed=0  # This is the number of files that were processed, When all files are processed and all qrcodes are decoded, the finished Callback is called
		@qrCodeNumCallBack=0 #This is the order of the qrcode
		@qrCodeWaitingFor= [] #The templater waits till all the qrcodes are decoded, This is the list of the remaining qrcodes to decode (only their order in the document is stored)
		if content? then if content.length>0 then @load(content)
	setOptions:(@options={})->
		@intelligentTagging= if @options.intelligentTagging? then @options.intelligentTagging else on
		@qrCode= if @options.qrCode? then @options.qrCode else off
		if @qrCode==true then @qrCode=DocUtils.unsecureQrCode
		if @options.parser? then @parser=options.parser
		@fileType = @fileTypeFromPath(@options.path) if @options.path? and @options.path != ""
		@templateFileStructure()
		this
	loadFromFile:(path,options={})->
		options.path = path
		@setOptions(options)
		promise=
			success:(fun)->
				this.successFun=fun
			successFun:()->
		if !options.docx? then options.docx=false
		if !options.async? then options.async=false
		if !options.callback? then options.callback=(rawData) =>
			@load rawData
			promise.successFun(this)
		DocUtils.loadDoc(path,options)
		if options.async==false then return this else return promise
		this
	fileTypeFromPath:(path)->
		extensions_found = fileExts.filter (extension) -> ~path.indexOf "."+extension
		if extensions_found.length == 0
			throw new Error("Invalid file extension; allowed types are: "+fileExts.join(", "))
		else
			extensions_found[0]
	templateFileStructure: ->
		if @fileType == "pptx"
			@templatedFiles = @templatedFilesforPPTX()
			@baseDoc = "ppt/presentation.xml"
		else
			@baseDoc = "word/document.xml"
			@templatedFiles = templatedFilesforDOCX
		this
	templatedFilesforPPTX:->
		templateArray = [1..100].map (i) -> "ppt/slides/slide"+i+".xml"
		templateArray.unshift("ppt/presentation.xml")
		templateArray
	qrCodeCallBack:(id,add=true)->
		if add==true
			@qrCodeWaitingFor.push id
		else if add == false
			index = @qrCodeWaitingFor.indexOf(id)
			@qrCodeWaitingFor.splice(index, 1)
		@testReady()
	testReady:()->
		if @qrCodeWaitingFor.length==0 and @filesProcessed== @templatedFiles.length ## When all files are processed and all qrCodes are processed too, the finished callback can be called
			@ready=true
			@finishedCallback()
	load: (content)->
		@loadedContent=content
		@zip = new JSZip content
		this
	applyTags:(@Tags=@Tags)->
		#Loop inside all templatedFiles (basically xml files with content). Sometimes they dont't exist (footer.xml for example)
		for fileName in @templatedFiles when !@zip.files[fileName]?
			@filesProcessed++ #count  files that don't exist as processed
		for fileName in @templatedFiles when @zip.files[fileName]?
			imgManager=new ImgManager(@zip,fileName)
			imgManager.loadImageRels()
			currentFile= new DocXTemplater(@zip.files[fileName].asText(),{
				DocxGen:this
				Tags:@Tags
				intelligentTagging:@intelligentTagging
				parser:@parser
				imgManager:imgManager
				fileName:fileName
				fileType: @fileType
			})
			@setData(fileName,currentFile.applyTags().content)
			@filesProcessed++
		#When all files have been processed, check if the document is ready
		@testReady()
	setData:(fileName,data,options={})->
		@zip.file(fileName,data,options)
	getTags:()->
		usedTags=[]
		for fileName in @templatedFiles when @zip.files[fileName]?
			currentFile= new DocXTemplater(@zip.files[fileName].asText(),{
				DocxGen:this
				Tags:@Tags
				intelligentTagging:@intelligentTagging
				parser:@parser
			})
			usedTemplateV= currentFile.applyTags().usedTags
			if DocUtils.sizeOfObject(usedTemplateV)
				usedTags.push {fileName,vars:usedTemplateV}
		usedTags
	setTags: (@Tags) ->
		this
	#output all files, if docx has been loaded via javascript, it will be available
	output: (options={}) ->
		if !options.download? then options.download=true
		if !options.name? then options.name="output.docx"
		if !options.type? then options.type="base64"
		if !options.compression? then options.compression="DEFLATE"
		result = @zip.generate({type:options.type, compression:options.compression})
		if options.download
			if DocUtils.env=='node'
				fs.writeFile process.cwd()+'/'+options.name, result, 'base64', (err) ->
					if err then throw err
					if options.callback? then options.callback()
			else
				#Be aware that data-uri doesn't work for too big files: More Info http://stackoverflow.com/questions/17082286/getting-max-data-uri-size-in-javascript
				document.location.href= "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,#{result}"
		result
	getFullText:(path="") ->
		path = @baseDoc if not path? or path == ""
		usedData=@zip.files[path].asText()
		(new DocXTemplater(usedData,{DocxGen:this,Tags:@Tags,intelligentTagging:@intelligentTagging})).getFullText()
	download: (swfpath, imgpath, filename="default.docx") ->
		output=@zip.generate({compression: "DEFLATE"})
		Downloadify.create 'downloadify',
			filename: () ->return filename
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
