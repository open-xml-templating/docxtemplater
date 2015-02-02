###
PptxGen.coffee
Created by @contextmatters, based on DocxGen by Edgar HIPP
###

DocUtils=require('./docUtils')
DocxGen=require('./docxgen')
PptXTemplater=require('./pptxTemplater')
JSZip=require('jszip')

PptxGen = class PptxGen extends DocxGen
	getTemplateClass:->PptXTemplater
	getTemplatedFiles:->
		slideTemplates=@zip.file(/ppt\/(slides|slideMasters)\/(slide|slideMaster)\d+\.xml/).map (file) -> file.name
		slideTemplates.concat ["ppt/presentation.xml"]
	getFullText:(path="ppt/slides/slide1.xml") ->
		super(path)

module.exports=PptxGen
