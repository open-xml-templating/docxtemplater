root= global ? window
env= if global? then 'node' else 'browser'

ImgManager = class ImgManager
	imageExtensions=['gif','jpeg','jpg','emf','png']
	constructor:(@zip)->
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
	setImage:(fileName,data,options={})->
		@zip.remove(fileName)
		@zip.file(fileName,data,options)
	loadImageRels: () ->
		content= DocUtils.decode_utf8 @zip.files["word/_rels/document.xml.rels"].asText()
		@xmlDoc= DocUtils.Str2xml content
		RidArray = ((parseInt tag.getAttribute("Id").substr(3)) for tag in @xmlDoc.getElementsByTagName('Relationship')) #Get all Rids
		@maxRid=RidArray.max()
		@imageRels=[]
		this

	addExtensionRels: (contentType,extension) -> #Add an extension type in the [Content_Types.xml], is used if for example you want word to be able to read png files (for every extension you add you need a contentType)
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
			@setImage "[Content_Types].xml",DocUtils.encode_utf8 DocUtils.xml2Str xmlDoc
	addImageRels: (imageName,imageData) -> #Adding an image and returns it's Rid
		if @zip.files["word/media/#{imageName}"]?
			throw new Error('file already exists')
			return false
		@maxRid++
		file=
			'name':"word/media/#{imageName}"
			'data':imageData
			'options':
				base64: false
				binary: true
				compression: null
				date: new Date()
				dir: false
		@zip.file file.name,file.data,file.options
		extension= imageName.replace(/[^.]+\.([^.]+)/,'$1')
		@addExtensionRels("image/#{extension}",extension)
		relationships= @xmlDoc.getElementsByTagName("Relationships")[0]
		newTag= @xmlDoc.createElement 'Relationship' #,relationships.namespaceURI
		newTag.namespaceURI= null
		newTag.setAttribute('Id',"rId#{@maxRid}")
		newTag.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/image')
		newTag.setAttribute('Target',"media/#{imageName}")
		relationships.appendChild newTag
		@setImage("word/_rels/document.xml.rels",DocUtils.encode_utf8 DocUtils.xml2Str @xmlDoc)
		@maxRid
	getImageByRid:(rId)-> #This is to get an image by it's rId (returns null if no img was found)
		relationships= @xmlDoc.getElementsByTagName('Relationship')
		for relationship in relationships
			cRId= relationship.getAttribute('Id')
			if rId==cRId
				path=relationship.getAttribute('Target')
				if path.substr(0,6)=='media/'
					return @zip.files["word/#{path}"]
				else
					throw new Error("Rid is not an image")
		throw new Error("No Media with this Rid found")

root.ImgManager=ImgManager
