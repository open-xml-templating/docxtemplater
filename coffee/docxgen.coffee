###
Docxgen.coffee
Created by Edgar HIPP
02/11/2014
###

root= global ? window
env= if global? then 'node' else 'browser'
root.DocxGen = class DocxGen
	templatedFiles=["word/document.xml","word/footer1.xml","word/footer2.xml","word/footer3.xml","word/header1.xml","word/header2.xml","word/header3.xml"]
	constructor: (content, @templateVars={},@intelligentTagging=on,@qrCode=off) ->
		@finishedCallback= (() -> console.log 'document ready!')
		@localImageCreator= (arg,callback) ->
			#This is the image of an arrow, you can replace this function by whatever you want to generate an image
			result=JSZipBase64.decode("iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAIAAABvSEP3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACXSURBVDhPtY7BDYAwDAMZhCf7b8YMxeCoatOQJhWc/KGxT2zlCyaWcz8Y+X7Bs1TFVJSwIHIYyFkQufWIRVX9cNJyW1QpEo4rixaEe7JuQagAUctb7ZFYFh5MVJPBe84CVBnB42//YsZRgKjFDBVg3cI9WbRwXLktQJX8cNIiFhM1ZuTWk7PIYSBhkVcLzwIiCjCxhCjlAkBqYnqFoQQ2AAAAAElFTkSuQmCC")
			callback(result)
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
		if @qrCodeWaitingFor.length==0 and @filesProcessed== templatedFiles.length ## When all files are processed and all qrCodes are processed too, the finished callback can be called
			@ready=true
			@finishedCallback()
	logUndefined: (tag,scope)->
		console.log("undefinedTag:"+tag)
	getImageList:()-> @imgManager.getImageList()
	setImage: (path,data) -> @imgManager.setImage(path,data)
	load: (content)->
		@zip = new JSZip content
		@imgManager=(new ImgManager(@zip)).loadImageRels()
	applyTemplateVars:(@templateVars=@templateVars,qrCodeCallback=null)->
		#Loop inside all templatedFiles (basically xml files with content). Sometimes they dont't exist (footer.xml for example)
		for fileName in templatedFiles when !@zip.files[fileName]?
			@filesProcessed++ #count  files that don't exist as processed
		for fileName in templatedFiles when @zip.files[fileName]?
			currentFile= new DocXTemplater(@zip.files[fileName].data,{
				DocxGen:this
				templateVars:@templateVars
				intelligentTagging:@intelligentTagging
				qrCodeCallback:qrCodeCallback
				localImageCreator:@localImageCreator
			}
				this,@templateVars,@intelligentTagging,[],{},0,qrCodeCallback,@localImageCreator)
			@zip.files[fileName].data= currentFile.applyTemplateVars().content
			@filesProcessed++
		#When all files have been processed, check if the document is ready
		@testReady()
	getTemplateVars:()->
		usedTemplateVars=[]
		for fileName in templatedFiles when @zip.files[fileName]?
			currentFile= new DocXTemplater(@zip.files[fileName].data,{
				DocxGen:this
				templateVars:@templateVars
				intelligentTagging:@intelligentTagging
			})
			usedTemplateV= currentFile.applyTemplateVars().usedTemplateVars
			if DocUtils.sizeOfObject(usedTemplateV)
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
			usedData=@zip.files[path].data
			return @getFullText(path,usedData)
		(new DocXTemplater(data,{DocxGen:this,templateVars:@templateVars,intelligentTagging:@intelligentTagging})).getFullText()
	download: (swfpath, imgpath, filename="default.docx") ->
		@calcZip()
		output=@zip.generate()
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

