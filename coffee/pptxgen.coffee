###
PptxGen.coffee
Created by @contextmatters, based on DocxGen by Edgar HIPP
###

DocUtils=require('./docUtils')
DocxGen=require('./docxgen')
PptXTemplater=require('./pptxTemplater')
JSZip=require('jszip')

PptxGen = class PptxGen extends DocxGen
	constructor:(content,options)->
		super(content,options)
		@templateClass = PptXTemplater
		@templatedFiles = @getTemplatedFiles()
	getTemplatedFiles: ()->
		["ppt/presentation.xml"].concat @slideTemplates()
	slideTemplates: ()->
		@slides ||= @zip.file(/ppt\/(slides|slideMasters)\/(slide|slideMaster)\d\.xml/).map (file) -> file.name
	getFullText:(path="ppt/slides/slide1.xml") ->
		super(path)

module.exports=PptxGen
