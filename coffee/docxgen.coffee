###
Docxgen.coffee
Created by Edgar HIPP
###

DocxGen = class DocxGen
	###*
	 * [constructor description]
	 * @param  {[type]} content [description]
	 * @param  {[type]} options [description]
	 * @return {[type]}         [description]
	###
	constructor: (content,options) ->
		@moduleManager = new DocxGen.ModuleManager()
		@moduleManager.gen = this
		@templateClass = @getTemplateClass()
		@setOptions({})
		if content? then @load(content,options)
	###*
	 * [attachModule description]
	 * @param  {[type]} module [description]
	 * @return {[type]}        [description]
	###
	attachModule: (module) ->
		@moduleManager.attachModule(module)
		this
	###*
	 * [setOptions description]
	 * @param {[type]} @options={} [description]
	###
	setOptions: (@options={}) ->
		@intelligentTagging = if @options.intelligentTagging? then @options.intelligentTagging else on
		if @options.parser? then @parser=@options.parser
		if @options.delimiters? then DocxGen.DocUtils.tags=@options.delimiters
		this
	###*
	 * [getTemplateClass description]
	 * @return {[type]} [description]
	###
	getTemplateClass: -> DocxGen.DocXTemplater
	###*
	 * [getTemplatedFiles description]
	 * @return {[type]} [description]
	###
	getTemplatedFiles: () ->
		slideTemplates = @zip.file(/word\/(header|footer)\d+\.xml/).map (file) -> file.name
		slideTemplates.concat ["word/document.xml"]
	###*
	 * [load description]
	 * @param  {[type]} content [description]
	 * @param  {[type]} options [description]
	 * @return {[type]}         [description]
	###
	load: (content,options) ->
		@moduleManager.sendEvent('loading')
		if content.file?
			@zip = content
		else
			@zip = new DocxGen.JSZip content,options
		@moduleManager.sendEvent('loaded')
		@templatedFiles = @getTemplatedFiles()
		return this
	###*
	 * [renderFile description]
	 * @param  {[type]} fileName [description]
	 * @return {[type]}          [description]
	###
	renderFile: (fileName) ->
		@moduleManager.sendEvent('rendering-file', fileName)
		currentFile= @createTemplateClass(fileName)
		@zip.file(fileName,currentFile.render().content)
		@moduleManager.sendEvent('rendered-file', fileName)
	###*
	 * [render description]
	 * @return {[type]} [description]
	###
	render: () ->
		@moduleManager.sendEvent('rendering')
		#Loop inside all templatedFiles (basically xml files with content). Sometimes they dont't exist (footer.xml for example)
		for fileName in @templatedFiles when @zip.files[fileName]?
			@renderFile(fileName)
		@moduleManager.sendEvent('rendered')
		return this
	###*
	 * [getTags description]
	 * @return {[type]} [description]
	###
	getTags: () ->
		usedTags=[]
		for fileName in @templatedFiles when @zip.files[fileName]?
			currentFile = @createTemplateClass(fileName)
			usedTemplateV= currentFile.render().usedTags
			if DocxGen.DocUtils.sizeOfObject(usedTemplateV)
				usedTags.push {fileName,vars:usedTemplateV}
		return usedTags
	###*
	 * [setData description]
	 * @param {[type]} @Tags [description]
	###
	setData: (@Tags) ->
		this
	###*
	 * output all files, if docx has been loaded via javascript, it will be available
	 * @return {[type]} [description]
	###
	getZip: () ->
		@zip
	###*
	 * [createTemplateClass description]
	 * @param  {[type]} path [description]
	 * @return {[type]}      [description]
	###
	createTemplateClass: (path)->
		usedData = @zip.files[path].asText()
		new @templateClass(usedData, {
			Tags: @Tags,
			intelligentTagging: @intelligentTagging,
			parser: @parser,
			moduleManager: @moduleManager
		})
	###*
	 * [getFullText description]
	 * @param  {[type]} path="word/document.xml" [description]
	 * @return {[type]}                          [description]
	###
	getFullText: (path="word/document.xml") ->
		@createTemplateClass(path).getFullText()

DocxGen.DocUtils = require('./docUtils')
DocxGen.DocXTemplater = require('./docxTemplater')
DocxGen.JSZip = require('jszip')
DocxGen.ModuleManager = require('./moduleManager')
DocxGen.XmlTemplater = require('./xmlTemplater')
DocxGen.XmlMatcher = require('./xmlMatcher')
DocxGen.XmlUtil = require('./xmlUtil')
DocxGen.SubContent = require('./subContent')
module.exports = DocxGen
