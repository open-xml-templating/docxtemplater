###
PptxGen.coffee
Created by @contextmatters, based on DocxGen by Edgar HIPP
###

DocUtils=require('./docUtils')
DocxGen=require('./docxgen')
PptXTemplater=require('./pptxTemplater')
JSZip=require('jszip')

PptxGen = class PptxGen extends DocxGen
	render:()->
		for fileName in @templatedFiles() when @zip.files[fileName]?
			currentFile= new PptXTemplater(@zip.files[fileName].asText(),{
				PptxGen:this
				Tags:@Tags
				intelligentTagging:@intelligentTagging
				parser:@parser
				fileName:fileName
			})
			@zip.file(fileName,currentFile.render().content)
		this
	getTags:()->
		usedTags=[]
		for fileName in @templatedFiles() when @zip.files[fileName]?
			currentFile= new PptXTemplater(@zip.files[fileName].asText(),{
				PptxGen:this
				Tags:@Tags
				intelligentTagging:@intelligentTagging
				parser:@parser
			})
			usedTemplateV= currentFile.render().usedTags
			if DocUtils.sizeOfObject(usedTemplateV)
				usedTags.push {fileName,vars:usedTemplateV}
		usedTags
	getFullText:(path="ppt/presentation.xml") ->
		usedData=@zip.files[path].asText()
		(new PptXTemplater(usedData,{PptxGen:this,Tags:@Tags,intelligentTagging:@intelligentTagging})).getFullText()
	templatedFiles: ()->
		["ppt/presentation.xml"].concat @slideTemplates()
	slideTemplates: ()->
		@slides ||= @zip.file(/ppt\/slides\/slide\d\.xml/).map (file) -> file.name

module.exports=PptxGen
