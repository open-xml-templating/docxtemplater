###
Docxgen.coffee
Created by Edgar HIPP
###

DocUtils=require('./docUtils')
DocXTemplater=require('./docxTemplater')
JSZip=require('jszip')
ModuleManager=require('./moduleManager')

DocxGen=class DocxGen
	constructor:(content,options) ->
		@templateClass = DocXTemplater
		@moduleManager=new ModuleManager()
		@templatedFiles=["word/document.xml","word/footer1.xml","word/footer2.xml","word/footer3.xml","word/header1.xml","word/header2.xml","word/header3.xml"]
		@setOptions({})
		if content? then @load(content,options)
	attachModule:(module)->@moduleManager.attachModule(module)
	setOptions:(@options={})->
		@intelligentTagging= if @options.intelligentTagging? then @options.intelligentTagging else on
		if @options.parser? then @parser=options.parser
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
		for fileName in @templatedFiles when @zip.files[fileName]?
			currentFile= new @templateClass(@zip.files[fileName].asText(),{
				Gen:this
				Tags:@Tags
				intelligentTagging:@intelligentTagging
				parser:@parser
				fileName:fileName
			})
			@moduleManager.sendEvent('rendering-file',fileName)
			@zip.file(fileName,currentFile.render().content)
			@moduleManager.sendEvent('rendered-file',fileName)
		@moduleManager.sendEvent('rendered')
		this
	getTags:()->
		usedTags=[]
		for fileName in @templatedFiles when @zip.files[fileName]?
			currentFile= new @templateClass(@zip.files[fileName].asText(),{
				Gen:this
				Tags:@Tags
				intelligentTagging:@intelligentTagging
				parser:@parser
			})
			usedTemplateV= currentFile.render().usedTags
			if DocUtils.sizeOfObject(usedTemplateV)
				usedTags.push {fileName,vars:usedTemplateV}
		usedTags
	setData:(@Tags) ->
		this
	#output all files, if docx has been loaded via javascript, it will be available
	getZip:()->
		@zip
	getFullText:(path="word/document.xml") ->
		usedData=@zip.files[path].asText()
		(new @templateClass(usedData,{Gen:this,Tags:@Tags,intelligentTagging:@intelligentTagging})).getFullText()

DocxGen.DocUtils=DocUtils

module.exports=DocxGen
