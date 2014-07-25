root= global ? window
env= if global? then 'node' else 'browser'

ChartManager = class ChartManager
	constructor:(@zip)->
	findCharts:(@content) ->
		@chartMatches= DocUtils.preg_match_all ///
		<w:drawing[^>]*>
		.*?<c:chart.*?
		</w:drawing>
		///g, @content
		this
	setChart:(fileName,data,options={})->
		@zip.remove(fileName)
		@zip.file(fileName,data,options)
	loadChartRels: () ->
		content= DocUtils.decode_utf8 @zip.files["word/_rels/document.xml.rels"].asText()
		@xmlDoc= DocUtils.Str2xml content
		RidArray = ((parseInt tag.getAttribute("Id").substr(3)) for tag in @xmlDoc.getElementsByTagName('Relationship')) #Get all Rids
		@maxRid=RidArray.max()
		@chartRels=[]
		this
	changeCharts:(@xml)->
		newXml=@xml
		chartList = @findCharts(@xml)
		for chart in chartList.chartMatches
			temp= @replaceChart(chart[0])
			newXml = newXml.replace(chart,temp)
		newXml
	replaceChart:(match)->
		@maxRid++
		path=""
		rIdRegEx = new RegExp("rId[0-9]","g")
		matchXml = DocUtils.Str2xml '<?xml version="1.0" ?><w:document mc:Ignorable="w14 wp14" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">'+match+'</w:document>'
		rId = (tag.getAttribute("r:id") for tag in matchXml.getElementsByTagName('c:chart'))
		for tag in @xmlDoc.getElementsByTagName('Relationship')
			if tag.getAttribute('Id')==rId[0]
				path = tag.getAttribute("Target") 
		match = match.replace(rIdRegEx, "rId#{@maxRid}")
		data = @zip.file("word/"+path).asText()
		@addChartRels("chart#{@maxRid}.xml", data)
		match

	addChartRels: (chartName,chartData) -> #Adding a chart and returns it's Rid
		if @zip.files["word/charts/#{chartName}"]?
			throw new Error('file already exists')
			return false
		file=
			'name':"word/charts/#{chartName}"
			'data':chartData
			'options':
				base64: false 
				binary: true
				compression: null
				date: new Date()
				dir: false 
		@zip.file file.name,file.data,file.options
		@addExtensionRels("application/vnd.openxmlformats-officedocument.drawingml.chart+xml", "/word/charts/#{chartName}")
		relationships= @xmlDoc.getElementsByTagName("Relationships")[0]
		newTag= @xmlDoc.createElement 'Relationship' #,relationships.namespaceURI
		newTag.namespaceURI= null
		newTag.setAttribute('Id',"rId#{@maxRid}")
		newTag.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart')
		newTag.setAttribute('Target',"charts/#{chartName}")
		relationships.appendChild newTag
		@setChart("word/_rels/document.xml.rels",DocUtils.encode_utf8 DocUtils.xml2Str @xmlDoc)
	addExtensionRels: (contentType,filePath) -> #Add an extension type in the [Content_Types.xml], is used if for example you want word to be able to read png files (for every extension you add you need a contentType)
		#content = DocUtils.decode_utf8 @zip.files["[Content_Types].xml"].asText()
		content = @zip.files["[Content_Types].xml"].asText()
		xmlDoc= DocUtils.Str2xml content
		defaultTags=xmlDoc.getElementsByTagName('Default')
		types=xmlDoc.getElementsByTagName("Types")[0]
		newTag=xmlDoc.createElement 'Override'
		newTag.namespaceURI= null
		newTag.setAttribute('ContentType',contentType)
		newTag.setAttribute('PartName',filePath)
		types.appendChild newTag
		@setChart "[Content_Types].xml",DocUtils.encode_utf8 DocUtils.xml2Str xmlDoc

root.ChartManager=ChartManager
