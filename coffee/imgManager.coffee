DocUtils=require('./docUtils')

module.exports = class ImgManager
	imageExtensions=['gif','jpeg','jpg','emf','png']
	constructor:(@zip,@fileName)->
		@endFileName=@fileName.replace(/^.*?([a-z0-9]+)\.xml$/,"$1")
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
	hasImage:(fileName)->
		@zip.files[fileName]?
	loadImageRels: () ->
		file=@zip.files["word/_rels/#{@endFileName}.xml.rels"]
		if file==undefined then return
		content= DocUtils.decode_utf8 file.asText()
		@xmlDoc= DocUtils.Str2xml content
		RidArray = ((parseInt tag.getAttribute("Id").substr(3)) for tag in @xmlDoc.getElementsByTagName('Relationship')) #Get all Rids
		@maxRid=DocUtils.maxArray(RidArray)
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
	addImageRels: (imageName,imageData,i=0) -> #Adding an image and returns it's Rid
		realImageName=if i==0 then imageName else imageName+"(#{i})"
		if @zip.files["word/media/#{realImageName}"]?
			return @addImageRels(imageName,imageData,i+1)
		@maxRid++
		file=
			'name':"word/media/#{realImageName}"
			'data':imageData
			'options':
				base64: false
				binary: true
				compression: null
				date: new Date()
				dir: false
		@zip.file file.name,file.data,file.options
		extension= realImageName.replace(/[^.]+\.([^.]+)/,'$1')
		@addExtensionRels("image/#{extension}",extension)
		relationships= @xmlDoc.getElementsByTagName("Relationships")[0]
		newTag= @xmlDoc.createElement 'Relationship' #,relationships.namespaceURI
		newTag.namespaceURI= null
		newTag.setAttribute('Id',"rId#{@maxRid}")
		newTag.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/image')
		newTag.setAttribute('Target',"media/#{realImageName}")
		relationships.appendChild newTag
		@setImage("word/_rels/#{@endFileName}.xml.rels",DocUtils.encode_utf8 DocUtils.xml2Str @xmlDoc)
		@maxRid
	getImageName:(id)->
		nameCandidate="Copie_"+id+".png"
		fullPath=@getFullPath(nameCandidate)
		if @hasImage(fullPath)
			return @getImageName(id+1)
		nameCandidate
	getFullPath:(imgName)->"word/media/#{imgName}"
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
