root= global ? window
env= if global? then 'node' else 'browser'

ImgReplacer = class ImgReplacer
	constructor: (@xmlTemplater)->
		@imgMatches=[]
		this
	findImages:() ->
		@imgMatches= DocUtils.preg_match_all ///
		<w:drawing[^>]*>
		.*?
		</w:drawing>
		///g, @xmlTemplater.content
		this
	imageSetter:(docxqrCode) ->
		docxqrCode.xmlTemplater.numQrCode--
		docxqrCode.xmlTemplater.DocxGen.setImage("word/media/#{docxqrCode.imgName}",docxqrCode.data)
		docxqrCode.xmlTemplater.DocxGen.qrCodeCallBack(docxqrCode.num,false)

	replaceImage:(match,u)->
		xmlImg= DocUtils.Str2xml '<?xml version="1.0" ?><w:document mc:Ignorable="w14 wp14" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">'+match[0]+'</w:document>'

		if @xmlTemplater.DocxGen.qrCode
			tagrId= xmlImg.getElementsByTagNameNS('*','blip')[0]

			if tagrId==undefined
				#console.log 'tagRid not defined, trying alternate method'
				tagrId= xmlImg.getElementsByTagName("a:blip")[0]
			if tagrId!=undefined
				rId = tagrId.getAttribute('r:embed')
				oldFile= @xmlTemplater.DocxGen.imgManager.getImageByRid(rId)

				if oldFile!=null
					tag= xmlImg.getElementsByTagNameNS('*','docPr')[0]
					if tag==undefined
						#console.log 'tag not defined, trying alternate method'
						tag=xmlImg.getElementsByTagName('wp:docPr')[0]
					if tag!=undefined

						if tag.getAttribute("name").substr(0,6)!="Copie_" #if image is not already a replacement

							imgName= ("Copie_"+@xmlTemplater.imageId+".png").replace(/\x20/,"")
							@xmlTemplater.DocxGen.qrCodeNumCallBack++

							@xmlTemplater.DocxGen.qrCodeCallBack(@xmlTemplater.DocxGen.qrCodeNumCallBack,true)

							newId= @xmlTemplater.DocxGen.imgManager.addImageRels(imgName,"")
							@xmlTemplater.imageId++
							@xmlTemplater.DocxGen.setImage("word/media/#{imgName}",oldFile.data)
							# tag.setAttribute('id',@xmlTemplater.imageId)



							tag.setAttribute('name',"#{imgName}")
							tagrId.setAttribute('r:embed',"rId#{newId}")
							#console.log "tagrId:"+tagrId.getAttribute('r:embed')
							imageTag= xmlImg.getElementsByTagNameNS('*','drawing')[0]

							if imageTag==undefined
								#console.log 'imagetag not defined, trying alternate method'
								imageTag=xmlImg.getElementsByTagName('w:drawing')[0]

							replacement= DocUtils.xml2Str imageTag
							@xmlTemplater.content= @xmlTemplater.content.replace(match[0], replacement)

							@xmlTemplater.numQrCode++

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
											@qr[u]= new DocxQrCode(png,@xmlTemplater,imgName,@xmlTemplater.DocxGen.qrCodeNumCallBack)
											@qr[u].decode(@imageSetter)
										dat= png.decode(finished)
								else
									#remove the image from the list of images to be tested
									@xmlTemplater.DocxGen.qrCodeCallBack(@xmlTemplater.DocxGen.qrCodeNumCallBack,false)


		else if @xmlTemplater.currentScope["img"]? then if @xmlTemplater.currentScope["img"][u]?

			imgName= @xmlTemplater.currentScope["img"][u].name
			imgData= @xmlTemplater.currentScope["img"][u].data
			throw 'DocxGen not defined' unless @xmlTemplater.DocxGen?
			newId= @xmlTemplater.DocxGen.imgManager.addImageRels(imgName,imgData)
			tag= xmlImg.getElementsByTagNameNS('*','docPr')[0]
			if tag==undefined
				#console.log 'tag not defined, trying alternate method'
				tag=xmlImg.getElementsByTagName('wp:docPr')[0]
			if tag!=undefined

				@xmlTemplater.imageId++
				tag.setAttribute('id',@xmlTemplater.imageId)
				tag.setAttribute('name',"#{imgName}")

				tagrId= xmlImg.getElementsByTagNameNS('*','blip')[0]
				if tagrId==undefined
					#console.log 'tagRid not defined, trying alternate method'
					tagrId= xmlImg.getElementsByTagName("a:blip")[0]
				if tagrId!=undefined
					tagrId.setAttribute('r:embed',"rId#{newId}")
					imageTag= xmlImg.getElementsByTagNameNS('*','drawing')[0]
					if imageTag==undefined
						#console.log 'imagetag not defined, trying alternate method'
						imageTag=xmlImg.getElementsByTagName('w:drawing')[0]

					@xmlTemplater.content=@xmlTemplater.content.replace(match[0], DocUtils.xml2Str imageTag)
	replaceImages: ()->
		@qr=[]
		@replaceImage(match,u) for match,u in @imgMatches
		this

root.ImgReplacer=ImgReplacer
