root= global ? window
env= if global? then 'node' else 'browser'

root.FileManager = class FileManager
	imageExtensions=['gif','jpeg','jpg','emf','png']
	constructor:(@zip)->
		#@currentClass=root.FileManager
	getImageList: () ->
		regex= ///
		[^.]+  #name
		\.   #dot
		([^.]+)  #extension
		///
		imageList= []
		for index of @zip.files
			extension= index.replace(regex,'$1')
			if extension in imageExtensions #Defined in constructor
				imageList.push {"path":index,files:@zip.files[index]}
		imageList	
	setFile:(fileName,data,options={})->
		@zip.remove(fileName)
		if !options.binary? then options.binary=true
		@zip.file(fileName,data,options)
	loadFileRels: () ->
		content = DocUtils.decode_utf8 @zip.files["word/_rels/document.xml.rels"].asText()
		@xmlDoc= DocUtils.Str2xml content
		RidArray = ((parseInt tag.getAttribute("Id").substr(3)) for tag in @xmlDoc.getElementsByTagName('Relationship')) #Get all Rids
		@maxRid=RidArray.max()
		@imageRels=[]
		this
	addFileRels: (fullPath,fileData, fileType) -> #Adding an image and returns it's Rid
		if @zip.files["word/#{fullPath}"]?
			throw new Error('file already exists')
			return false
		@maxRid++
		file=
			'name':"word/#{fullPath}"
			'data':fileData
			'options':
				base64: false  
				binary: true
				compression: null
				date: new Date()
				dir: false   
		@zip.file file.name,file.data,file.options
		relationships= @xmlDoc.getElementsByTagName("Relationships")[0]
		newTag= @xmlDoc.createElement 'Relationship' #,relationships.namespaceURI
		newTag.namespaceURI= null  
		newTag.setAttribute('Id',"rId#{@maxRid}")
		if fileType=="Chart"
			@addChartExtensionRels("application/vnd.openxmlformats-officedocument.drawingml.chart+xml", "/word/#{fullPath}")
			newTag.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart')
		else if fileType=="Image"
			extension= fullPath.substring(6,fullPath.length).replace(/[^.]+\.([^.]+)/,'$1')
			@addImageExtensionRels("image/#{extension}",extension)
			newTag.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/image')
		newTag.setAttribute('Target',"#{fullPath}")
		relationships.appendChild newTag
		@setFile("word/_rels/document.xml.rels",DocUtils.encode_utf8 DocUtils.xml2Str @xmlDoc)
		@maxRid
	addChartExtensionRels: (contentType,partName) -> #Add an extension type in the [Content_Types.xml], is used if for example you want word to be able to read png files (for every extension you add you need a contentType)
		#content = DocUtils.decode_utf8 @zip.files["[Content_Types].xml"].asText()
		content = @zip.files["[Content_Types].xml"].asText()
		xmlDoc= DocUtils.Str2xml content
		types=xmlDoc.getElementsByTagName("Types")[0]
		newTag=xmlDoc.createElement 'Override'
		newTag.namespaceURI= null   
		newTag.setAttribute('ContentType',contentType)
		newTag.setAttribute('PartName',partName)
		types.appendChild newTag
		@setFile "[Content_Types].xml",DocUtils.encode_utf8 DocUtils.xml2Str xmlDoc
	addImageExtensionRels: (contentType,extension) -> #Add an extension type in the [Content_Types.xml], is used if for example you want word to be able to read png files (for every extension you add you need a contentType)
		#content = DocUtils.decode_utf8 @zip.files["[Content_Types].xml"].asText()
		content = @zip.files["[Content_Types].xml"].asText()
		xmlDoc= DocUtils.Str2xml content
		addTag= true 
		defaultTags=xmlDoc.getElementsByTagName('Default')
		for tag in defaultTags
			if tag.getAttribute('Extension')==extension then addTag= false
		if addTag
			types=xmlDoc.getElementsByTagName("Types")[0]
			newTag=xmlDoc.createElement 'Default'
			newTag.namespaceURI= null
			newTag.setAttribute('ContentType',contentType)
			newTag.setAttribute('Extension',extension)
			types.appendChild newTag
			@setFile "[Content_Types].xml",DocUtils.encode_utf8 DocUtils.xml2Str xmlDoc
	getFileByRid:(rId, fileType)-> #This is to get an image by it's rId (returns null if no img was found) 
		relationships= @xmlDoc.getElementsByTagName('Relationship')
		for relationship in relationships
			cRId= relationship.getAttribute('Id')
			if rId==cRId
				path=relationship.getAttribute('Target')
				if fileType=='Chart'
					if path.substr(0,7)=='charts/'
						return @zip.files["word/#{path}"]
					else
						throw new Error("Rid is not a chart")
				else
					if path.substr(0,6)=='media/'
						return @zip.files["word/#{path}"]
					else
						throw new Error("Rid is not an image")
		throw new Error("No Media with this Rid found")
	
	#Returns chart's relationships
	getOldChartRels:(oldFileName)->
		try
			return @zip.files["word/charts/_rels/#{oldFileName}.rels"]
		catch e
			return
			
	#Word creates a seperate worksheet for charts, stored in embeddings folder
	getOldWorksheet:(oldFileName)->
		try
			return @zip.files["word/embeddings/#{oldFileName}.rels"]
		catch e
			return