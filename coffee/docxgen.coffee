###
Docxgen.coffee
Created by Edgar HIPP
###

<<<<<<< HEAD
root= global ? window
env= if global? then 'node' else 'browser'

if env=='node'
	global.http= require('http')
	global.https= require('https')
	global.fs= require('fs')
	global.vm = require('vm')
	global.DOMParser = require('xmldom').DOMParser
	global.XMLSerializer= require('xmldom').XMLSerializer
	path=require('path')
	global.PNG= require(path.join(__dirname,'../vendor/pngjs/png-node'))
	global.url= require('url')

	["grid.js","version.js","detector.js","formatinf.js","errorlevel.js","bitmat.js","datablock.js","bmparser.js","datamask.js","rsdecoder.js","gf256poly.js","gf256.js","decoder.js","qrcode.js","findpat.js","alignpat.js","databr.js"].forEach (file) ->
		vm.runInThisContext(global.fs.readFileSync(__dirname + '/../vendor/jsqrcode/' + file), file)
	['jszip.min.js'].forEach (file) ->
		vm.runInThisContext(global.fs.readFileSync(__dirname + '/../vendor/jszip2.0/dist/' + file), file)

root.DocxGen = class DocxGen
	templatedFiles=["word/document.xml","word/footer1.xml","word/footer2.xml","word/footer3.xml","word/header1.xml","word/header2.xml","word/header3.xml"]
	defaultImageCreator=(arg,callback) ->
		#This is the image of an arrow, you can replace this function by whatever you want to generate an image
		result=JSZip.base64.decode("iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAIAAABvSEP3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACXSURBVDhPtY7BDYAwDAMZhCf7b8YMxeCoatOQJhWc/KGxT2zlCyaWcz8Y+X7Bs1TFVJSwIHIYyFkQufWIRVX9cNJyW1QpEo4rixaEe7JuQagAUctb7ZFYFh5MVJPBe84CVBnB42//YsZRgKjFDBVg3cI9WbRwXLktQJX8cNIiFhM1ZuTWk7PIYSBhkVcLzwIiCjCxhCjlAkBqYnqFoQQ2AAAAAElFTkSuQmCC")
		callback(result)
	constructor: (content, @Tags={},@options) ->
		@setOptions(@options)
		@finishedCallback=()->
		@localImageCreator= defaultImageCreator
		@filesProcessed=0  # This is the number of files that were processed, When all files are processed and all qrcodes are decoded, the finished Callback is called
		@qrCodeNumCallBack=0 #This is the order of the qrcode
		@qrCodeWaitingFor= [] #The templater waits till all the qrcodes are decoded, This is the list of the remaining qrcodes to decode (only their order in the document is stored)
		if content? then if content.length>0 then @load(content)
	setOptions:(@options)->
		if @options?
			@intelligentTagging= if @options.intelligentTagging? then @options.intelligentTagging else on
			@qrCode= if @options.qrCode? then @options.qrCode else off
			if @options.parser? then @parser=options.parser
	loadFromFile:(path,options={})->
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
	qrCodeCallBack:(num,add=true) ->
		if add==true
			@qrCodeWaitingFor.push num
		else if add == false
			index = @qrCodeWaitingFor.indexOf(num)
			@qrCodeWaitingFor.splice(index, 1)
		@testReady()
	testReady:()->
		if @qrCodeWaitingFor.length==0 and @filesProcessed== templatedFiles.length ## When all files are processed and all qrCodes are processed too, the finished callback can be called

			@ready=true
			@finishedCallback()
	getImageList:()-> @fileManager.getImageList()
	setImage: (path,data,options={}) ->
		if !options.binary? then options.binary=true
		@fileManager.setFile(path,data,options)

	load: (content)->
		@loadedContent=content
		@zip = new JSZip content
		@fileManager=(new FileManager(@zip)).loadFileRels()
=======
DocUtils=require('./docUtils')
DocXTemplater=require('./docxTemplater')
JSZip=require('jszip')
ModuleManager=require('./moduleManager')

DocxGen=class DocxGen
	constructor:(content,options) ->
		@templateClass = DocXTemplater
		@moduleManager=new ModuleManager()
		@moduleManager.gen=this
		@templatedFiles=["word/document.xml","word/footer1.xml","word/footer2.xml","word/footer3.xml","word/header1.xml","word/header2.xml","word/header3.xml"]
		@setOptions({})
		if content? then @load(content,options)
	attachModule:(module)->
		@moduleManager.attachModule(module)
		this
	setOptions:(@options={})->
		@intelligentTagging= if @options.intelligentTagging? then @options.intelligentTagging else on
		if @options.parser? then @parser=options.parser
>>>>>>> upstream/1.x
		this
	load: (content,options)->
		@moduleManager.sendEvent('loading')
		if content.file?
			@zip=content
		else
			@zip = new JSZip content,options
		@moduleManager.sendEvent('loaded')
		this
	render:()->
		@moduleManager.sendEvent('rendering')
		#Loop inside all templatedFiles (basically xml files with content). Sometimes they dont't exist (footer.xml for example)
<<<<<<< HEAD
		for fileName in templatedFiles when !@zip.files[fileName]?
			@filesProcessed++ #count  files that don't exist as processed
		for fileName in templatedFiles when @zip.files[fileName]?
			currentFile= new DocXTemplater(@zip.files[fileName].asText(),{
				DocxGen:this
				Tags:@Tags
				intelligentTagging:@intelligentTagging
				qrCodeCallback:qrCodeCallback
				parser:@parser
			})

			@setData(fileName,currentFile.applyTags().content)
			@filesProcessed++
		#When all files have been processed, check if the document is ready
		@testReady()
	setData:(fileName,data,options={})->
		@zip.remove(fileName)
		@zip.file(fileName,data,options)
=======
		for fileName in @templatedFiles when @zip.files[fileName]?
			@moduleManager.sendEvent('rendering-file',fileName)
			currentFile= @createTemplateClass(fileName)
			@zip.file(fileName,currentFile.render().content)
			@moduleManager.sendEvent('rendered-file',fileName)
		@moduleManager.sendEvent('rendered')
		this
>>>>>>> upstream/1.x
	getTags:()->
		usedTags=[]
		for fileName in @templatedFiles when @zip.files[fileName]?
			currentFile = @createTemplateClass(fileName)
			usedTemplateV= currentFile.render().usedTags
			if DocUtils.sizeOfObject(usedTemplateV)
				usedTags.push {fileName,vars:usedTemplateV}
		usedTags
	setData:(@Tags) ->
		this
	#output all files, if docx has been loaded via javascript, it will be available
<<<<<<< HEAD
	output: (options={}) ->
		if !options.download? then options.download=true
		if !options.name? then options.name="output.docx"
		if !options.type? then options.type="base64"
		result= @zip.generate({type:options.type})
		if options.download
			if env=='node'
				fs.writeFile process.cwd()+'/'+options.name, result, 'base64', (err) ->
					if err then throw err
					if options.callback? then options.callback()
			else
				#Be aware that data-uri doesn't work for too big files: More Info http://stackoverflow.com/questions/17082286/getting-max-data-uri-size-in-javascript
				document.location.href= "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,#{result}"
		result
	getFullText:(path="word/document.xml") ->
=======
	getZip:()->
		@zip
	createTemplateClass:(path)->
>>>>>>> upstream/1.x
		usedData=@zip.files[path].asText()
		new @templateClass(usedData,{
			Tags:@Tags
			intelligentTagging:@intelligentTagging
			parser:@parser
			moduleManager:@moduleManager
		})
	getFullText:(path="word/document.xml") ->
		@createTemplateClass(path).getFullText()

DocxGen.DocUtils=DocUtils

<<<<<<< HEAD
if env=='node'
	module.exports=root.DocxGen
=======
module.exports=DocxGen
>>>>>>> upstream/1.x
