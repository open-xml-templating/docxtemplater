root= global ? window
env= if global? then 'node' else 'browser'

ChartReplacer = class ChartReplacer
	constructor:(@xmlTemplater)->
	findCharts:() ->
		@chartMatches= DocUtils.preg_match_all ///
		<w:drawing[^>]*>
		(?:(?!<\/w:drawing>).)*?<c:chart.*?
		</w:drawing>
		///g, @xmlTemplater.content  #(?:(?!<\/w:drawing>).) is added to avoid chart and image tags to be loaded together
		this
	replaceCharts:()->
		newXml=@xmlTemplater.content
		for chart in @chartMatches
			@replaceChart(chart)
		newXml
	replaceChart:(match)->
		matchXml = DocUtils.Str2xml '<?xml version="1.0" ?><w:document mc:Ignorable="w14 wp14" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">'+match[0]+'</w:document>'

		if env=='browser' then tag= matchXml.getElementsByTagNameNS('*','docPr')[0]
		if env=='node' then tag= matchXml.getElementsByTagName("wp:docPr")[0]
		if tag==undefined then throw new Error('tag undefined')
		if tag.getAttribute("name").substr(0,6)=="Copie_" then return #if image is already a replacement then do nothing
		
		if env=='browser' then tagrId= matchXml.getElementsByTagNameNS('*','chart')[0]
		if env=='node' then tagrId= matchXml.getElementsByTagName("c:chart")[0]
		if tagrId==undefined then throw new Error('tagRiD undefined !')
		rId = tagrId.getAttribute('r:id')			
		#oldFile= @xmlTemplater.DocxGen.imgManager.getImageByRid(rId)		
		try
			oldFile= @xmlTemplater.DocxGen.fileManager.getFileByRid(rId,'Chart')
		catch e
			return
		@chartName= ("Copie_"+@xmlTemplater.chartId+".xml").replace(/\x20/,"")
		newId= @xmlTemplater.DocxGen.fileManager.addFileRels("charts/#{@chartName}","","Chart")
		@xmlTemplater.chartId++
		@xmlTemplater.DocxGen.fileManager.setFile("word/charts/#{@chartName}", oldFile.asText(),oldFile.options)
		@oldFileName = oldFile.name.substr(12,oldFile.name.length)
		@createChartRels()
		tag.setAttribute('name',"#{@chartName}")
		tagrId.setAttribute('r:id',"rId#{newId}")
		if env=='browser' then imageTag= matchXml.getElementsByTagNameNS('*','drawing')[0]
		if env=='node' then imageTag=matchXml.getElementsByTagName('w:drawing')[0]
		if imageTag==undefined then throw new Error('imageTag undefined')
		replacement= DocUtils.xml2Str imageTag
		@xmlTemplater.content= @xmlTemplater.content.replace(match[0], replacement)
	
	#Docx has seperate rels file for Chart style, data and color
	createChartRels:() ->
		name = @chartName.substr(0,@chartName.length-4)
		_rels = @xmlTemplater.DocxGen.fileManager.getOldChartRels(@oldFileName)
		if _rels==undefined then return #No worksheet present, do nothing
		oldXml = DocUtils.Str2xml _rels.asText()
		relationships= oldXml.getElementsByTagName('Relationship')
		for relationship in relationships
			type= relationship.getAttribute('Type')
			if 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/package'==type
				relationship.setAttribute('Target',"../embeddings/#{name}.xlsx")
			else
				return
		newXml = DocUtils.xml2Str oldXml
		@xmlTemplater.DocxGen.fileManager.setFile("word/charts/_rels/#{@chartName}.rels", newXml, _rels.options)
		@createWorksheet()
		
	createWorksheet:()->
		name = @chartName.substr(0,@chartName.length-4)
		oldXlsx = @xmlTemplater.DocxGen.fileManager.getOldWorksheet(@oldFileName)
		@xmlTemplater.DocxGen.fileManager.setFile("word/embeddings/#{name}.xlsx",oldXlsx.data,oldXlsx.options)
	
root.ChartReplacer = ChartReplacer