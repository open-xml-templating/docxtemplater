###
PptxGen.coffee
Created by @contextmatters, based on DocxGen by Edgar HIPP
###

DocUtils = require('./docUtils')
DocxGen = require('./docxgen')
PptXTemplater = require('./pptxTemplater')
JSZip = require('jszip')

PptxGen = class PptxGen extends DocxGen
	###*
	 * [getTemplateClass description]
	 * @return {[type]} [description]
	###
	getTemplateClass: -> PptXTemplater

	###*
	 * [getTemplatedFiles description]
	 * @return {[type]} [description]
	###
	getTemplatedFiles: () ->
		slideTemplates = @zip.file(/ppt\/(slides|slideMasters)\/(slide|slideMaster)\d+\.xml/).map (file) -> file.name
		slideTemplates.concat ["ppt/presentation.xml"]

	###*
	 * [getFullText description]
	 * @param  {[type]} path =             "ppt/slides/slide1.xml" [description]
	 * @return {[type]}      [description]
	###
	getFullText: (path = "ppt/slides/slide1.xml") ->
		super(path)

module.exports = PptxGen
