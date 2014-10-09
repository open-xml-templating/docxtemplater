###
Docxgen.coffee
Created by Edgar HIPP
###

DocUtils=require('./docUtils')
DocXTemplater=require('./docxTemplater')
JSZip=require('jszip')

DocxGen=class DocxGen
	templatedFiles=["word/document.xml","word/footer1.xml","word/footer2.xml","word/footer3.xml","word/header1.xml","word/header2.xml","word/header3.xml"]
	constructor:(content) ->
		@setOptions({})
		if content? then if content.length>0 then @load(content)
	setOptions:(@options={})->
		@intelligentTagging= if @options.intelligentTagging? then @options.intelligentTagging else on
		if @options.parser? then @parser=options.parser
		this
	load: (content)->
		@zip = new JSZip content
		this
	applyTags:(@Tags=@Tags)->
		#Loop inside all templatedFiles (basically xml files with content). Sometimes they dont't exist (footer.xml for example)
		for fileName in templatedFiles when @zip.files[fileName]?
			currentFile= new DocXTemplater(@zip.files[fileName].asText(),{
				DocxGen:this
				Tags:@Tags
				intelligentTagging:@intelligentTagging
				parser:@parser
				fileName:fileName
			})
			@setData(fileName,currentFile.applyTags().content)
		this
	setData:(fileName,data,options={})->
		@zip.file(fileName,data,options)
	getTags:()->
		usedTags=[]
		for fileName in templatedFiles when @zip.files[fileName]?
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
		if !options.type? then options.type="base64"
		if !options.compression? then options.compression="DEFLATE"
		@zip.generate({type:options.type, compression:options.compression})
	getFullText:(path="word/document.xml") ->
		usedData=@zip.files[path].asText()
		(new DocXTemplater(usedData,{DocxGen:this,Tags:@Tags,intelligentTagging:@intelligentTagging})).getFullText()

DocxGen.DocUtils=DocUtils

module.exports=DocxGen
