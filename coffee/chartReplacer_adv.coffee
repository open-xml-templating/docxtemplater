root= global ? window
env= if global? then 'node' else 'browser'

ManageCharts = class ManageCharts
	constructor: (finalXML)->
		content= finalXML
		@chartMatches=[]
		@xmlTemplater.numQrCode=0
		this
	findCharts:() ->
		@chartMatches= DocUtils.preg_match_all ///
		<w:drawing[^>]*>
		.*?<c:chart.*?
		</w:drawing>
		///g, content
		this
	replaceCharts: ()->
		@chart=[]
		@replaceChart(match,u) for match,u in @chartMatches
		this
	chartSetter:(data) ->
		xmlTemplater.DocxGen.setChart("word/charts/#{chartName}",data)

	replaceChart:(match,u)->
		xmlChart= DocUtils.Str2xml '<?xml version="1.0" ?><w:document mc:Ignorable="w14 wp14" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">'+match[0]+'</w:document>'
		if env=='browser' then tagrId= xmlChart.getElementsByTagNameNS('*','chart')[0]
		if env=='node' then tagrId= xmlChart.getElementsByTagName("c:chart")[0]
		if tagrId==undefined then throw new Error('tagRiD undefined !')
		rId = tagrId.getAttribute('r:id')
		
		#oldFile= @xmlTemplater.DocxGen.imgManager.getImageByRid(rId)		
		try
			oldFile= @xmlTemplater.DocxGen.chartManager.getChartByRid(rId)
		catch e
			return

		if env=='browser' then tag= xmlChart.getElementsByTagNameNS('*','docPr')[0]
		if env=='node' then tag= xmlChart.getElementsByTagName("wp:docPr")[0]
		if tag==undefined then throw new Error('tag undefined')
		#if tag.getAttribute("name").substr(0,5)=="Chart" then return #if image is already a replacement then do nothing
		chartName= ("Chart"+@xmlTemplater.chartId+".xml").replace(/\x20/,"")
		newId= @xmlTemplater.DocxGen.chartManager.addChartRels(chartName,"")
		@xmlTemplater.chartId++
		@xmlTemplater.DocxGen.setChart("word/charts/#{chartName}",oldFile.data)
		tag.setAttribute('name',"#{imgName}")
		tagrId.setAttribute('r:id',"rId#{newId}")
		if env=='browser' then chartTag= xmlChart.getElementsByTagNameNS('*','drawing')[0]
		if env=='node' then chartTag=xmlChart.getElementsByTagName('w:drawing')[0]
		if chartTag==undefined then throw new Error('chartTag undefined')
		replacement= DocUtils.xml2Str chartTag
		@xmlTemplater.content= @xmlTemplater.content.replace(match[0], replacement)
		if env=='browser'
			#@qr[u]= new DocxQrCode(oldFile.asBinary(),@xmlTemplater,imgName,@xmlTemplater.DocxGen.qrCodeNumCallBack)
			@chart[u].decode(@chartSetter)
		else
			#if /\.png$/.test(oldFile.name)
			do (chartName) =>
				base64= JSZip.base64.encode oldFile.asBinary()
				binaryData = new Buffer(base64, 'base64')
				#png= new PNG(binaryData)
				# finished= (a) =>
					# png.decoded= a
				try
					#@qr[u]= new DocxQrCode(png,@xmlTemplater,imgName,@xmlTemplater.DocxGen.qrCodeNumCallBack)
					@chart[u].decode(@chartSetter)
					@chartSetter(binaryData)
				catch e
					#mockedQrCode={xmlTemplater:@xmlTemplater,chartName:chartName,data:oldFile.asBinary()}
					@chartSetter('<w:p><w:pPr><w:pStyle w:val="Normal"/><w:spacing w:after="160" w:before="0"/><w:rPr/></w:pPr><w:r><w:rPr/><w:drawing><wp:inline distR="0" distL="0" distB="0" distT="0"><wp:extent cy="3239770" cx="5759450"/><wp:effectExtent r="0" b="0" t="0" l="0"/><wp:docPr name="Object1" id="1"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId3" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"/></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>')
			#else
				#mockedQrCode={xmlTemplater:@xmlTemplater,chartName:chartName,data:oldFile.asBinary()}
				# @chartSetter('<w:p><w:pPr><w:pStyle w:val="Normal"/><w:spacing w:after="160" w:before="0"/><w:rPr/></w:pPr><w:r><w:rPr/><w:drawing><wp:inline distR="0" distL="0" distB="0" distT="0"><wp:extent cy="3239770" cx="5759450"/><wp:effectExtent r="0" b="0" t="0" l="0"/><wp:docPr name="Object1" id="1"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId2" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"/></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>')

root.ManageChart=ManageChart
