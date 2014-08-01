root= global ? window
env= if global? then 'node' else 'browser'

ImgReplacer = class ImgReplacer
	constructor: (@xmlTemplater)->
		@imgMatches=[]
		@xmlTemplater.numQrCode=0
		this
	findImages:() ->
		@imgMatches= DocUtils.preg_match_all ///
		<w:drawing[^>]*>
		(?:(?!<\/w:drawing>).)*?<a:blip.r:embed.*? 
		</w:drawing>
		///g, @xmlTemplater.content #(?:(?!<\/w:drawing>).) is added to avoid chart and image tags to be loaded together
		this
	replaceImages: ()->
		@qr=[]
		@xmlTemplater.numQrCode+=@imgMatches.length
		@replaceImage(match,u) for match,u in @imgMatches
		this
	imageSetter:(docxqrCode) ->
		if docxqrCode.callbacked==true then return
		docxqrCode.callbacked=true
		docxqrCode.xmlTemplater.numQrCode--
		docxqrCode.xmlTemplater.DocxGen.fileManager.setFile("word/media/#{docxqrCode.imgName}",docxqrCode.data)
		docxqrCode.xmlTemplater.DocxGen.qrCodeCallBack(docxqrCode.num,false)
	replaceImage:(match,u)->
		xmlImg= DocUtils.Str2xml '<?xml version="1.0" ?><w:document mc:Ignorable="w14 wp14" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">'+match[0]+'</w:document>'
		
		if env=='browser' then tag= xmlImg.getElementsByTagNameNS('*','docPr')[0]
		if env=='node' then tag= xmlImg.getElementsByTagName("wp:docPr")[0]
		if tag==undefined then throw new Error('tag undefined')
		if tag.getAttribute("name").substr(0,6)=="Copie_" then return #if image is already a replacement then do nothing
	
		if env=='browser' then tagrId= xmlImg.getElementsByTagNameNS('*','blip')[0]
		if env=='node' then tagrId= xmlImg.getElementsByTagName("a:blip")[0]
		if tagrId==undefined then throw new Error('tagRiD undefined !')
		rId = tagrId.getAttribute('r:embed')		
		#oldFile= @xmlTemplater.DocxGen.imgManager.getImageByRid(rId)		
		try
			oldFile= @xmlTemplater.DocxGen.fileManager.getFileByRid(rId,'Image')
		catch e
			return
		
		imgName= ("Copie_"+@xmlTemplater.imageId+".png").replace(/\x20/,"")
		@xmlTemplater.DocxGen.qrCodeNumCallBack++
		@xmlTemplater.DocxGen.qrCodeCallBack(@xmlTemplater.DocxGen.qrCodeNumCallBack,true)
		newId= @xmlTemplater.DocxGen.fileManager.addFileRels("media/#{imgName}","","Image")
		@xmlTemplater.imageId++
		@xmlTemplater.DocxGen.fileManager.setFile("word/media/#{imgName}",oldFile.data,oldFile.options)
		tag.setAttribute('name',"#{imgName}")
		tagrId.setAttribute('r:embed',"rId#{newId}")
		if env=='browser' then imageTag= xmlImg.getElementsByTagNameNS('*','drawing')[0]
		if env=='node' then imageTag=xmlImg.getElementsByTagName('w:drawing')[0]
		if imageTag==undefined then throw new Error('imageTag undefined')
		replacement= DocUtils.xml2Str imageTag
		@xmlTemplater.content= @xmlTemplater.content.replace(match[0], replacement)
		if env=='browser'
			@qr[u]= new DocxQrCode(oldFile.asBinary(),@xmlTemplater,imgName,@xmlTemplater.DocxGen.qrCodeNumCallBack)
			@qr[u].decode(@imageSetter)
		else
			if /\.png$/.test(oldFile.name)
				do (imgName) =>
					base64= JSZip.base64.encode oldFile.asBinary()
					binaryData = new Buffer(base64, 'base64')
					png= new PNG(binaryData)
					finished= (a) =>
						png.decoded= a
						try
							@qr[u]= new DocxQrCode(png,@xmlTemplater,imgName,@xmlTemplater.DocxGen.qrCodeNumCallBack)
							@qr[u].decode(@imageSetter)
						catch e
							mockedQrCode={xmlTemplater:@xmlTemplater,imgName:imgName,data:oldFile.asBinary()}
							@imageSetter(mockedQrCode)
					dat= png.decode(finished)
			else
				mockedQrCode={xmlTemplater:@xmlTemplater,imgName:imgName,data:oldFile.asBinary()}
				@imageSetter(mockedQrCode)

root.ImgReplacer=ImgReplacer
