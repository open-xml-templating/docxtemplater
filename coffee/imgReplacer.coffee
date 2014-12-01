DocUtils=require('./docUtils')
DocxQrCode=require('./docxQrCode')
PNG=require('png-js')
JSZip=require('jszip')

module.exports= class ImgReplacer
	constructor: (@xmlTemplater)->
		@imgMatches=[]
		@xmlTemplater.numQrCode=0
		this
	findImages:() ->
		@imgMatches= DocUtils.preg_match_all ///
		<w:drawing[^>]*>
		.*?<a:blip.r:embed.*?
		</w:drawing>
		///g, @xmlTemplater.content
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
		docxqrCode.xmlTemplater.imgManager.setImage("word/media/#{docxqrCode.imgName}",docxqrCode.data,{binary:true})
		docxqrCode.xmlTemplater.DocxGen.qrCodeCallBack(docxqrCode.xmlTemplater.fileName+'-'+docxqrCode.num,false)
	replaceImage:(match,u)->
		num=@xmlTemplater.DocxGen.qrCodeNumCallBack
		@xmlTemplater.DocxGen.qrCodeNumCallBack++
		try
			xmlImg= DocUtils.Str2xml '<?xml version="1.0" ?><w:document mc:Ignorable="w14 wp14" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">'+match[0]+'</w:document>',(_i,type)->if _i=='fatalError' then throw "fatalError"
		catch e
			return
		tagrId= xmlImg.getElementsByTagName("a:blip")[0]
		if tagrId==undefined then throw new Error('tagRiD undefined !')
		rId = tagrId.getAttribute('r:embed')
		oldFile= @xmlTemplater.imgManager.getImageByRid(rId)
		tag= xmlImg.getElementsByTagName("wp:docPr")[0]
		if tag==undefined then throw new Error('tag undefined')
		if tag.getAttribute("name").substr(0,6)=="Copie_" then return #if image is already a replacement then do nothing
		imgName= @xmlTemplater.imgManager.getImageName(@xmlTemplater.imageId)
		@xmlTemplater.DocxGen.qrCodeCallBack(@xmlTemplater.fileName+'-'+num,true)
		newId= @xmlTemplater.imgManager.addImageRels(imgName,"")
		@xmlTemplater.imageId++
		@xmlTemplater.imgManager.setImage(@xmlTemplater.imgManager.getFullPath(imgName),oldFile.data,{binary:true})
		tag.setAttribute('name',"#{imgName}")
		tagrId.setAttribute('r:embed',"rId#{newId}")
		imageTag=xmlImg.getElementsByTagName('w:drawing')[0]
		if imageTag==undefined then throw new Error('imageTag undefined')
		replacement= DocUtils.xml2Str imageTag
		@xmlTemplater.content= @xmlTemplater.content.replace(match[0], replacement)
		if DocUtils.env=='browser'
			@qr[u]= new DocxQrCode(oldFile.asBinary(),@xmlTemplater,imgName,num)
			@qr[u].decode(@imageSetter)
		else
			mockedQrCode={xmlTemplater:@xmlTemplater,imgName:imgName,data:oldFile.asBinary(),num:num}
			if /\.png$/.test(oldFile.name)
				do (imgName) =>
					base64= JSZip.base64.encode oldFile.asBinary()
					binaryData = new Buffer(base64, 'base64')
					png= new PNG(binaryData)
					finished= (a) =>
						png.decoded= a
						try
							@qr[u]= new DocxQrCode(png,@xmlTemplater,imgName,num)
							@qr[u].decode(@imageSetter)
						catch e
							@imageSetter(mockedQrCode)
					dat= png.decode(finished)
			else
				@imageSetter(mockedQrCode)
