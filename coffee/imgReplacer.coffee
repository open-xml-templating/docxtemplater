window.ImgReplacer = class ImgReplacer
	constructor: (@xmlTemplater)->
		@imgMatches=[]
	findImages:() ->
		@imgMatches= DocUtils.preg_match_all ///
		<w:drawing>
		.*?
		</w:drawing>
		///g, @xmlTemplater.content
	replaceImages: ()->
		console.log @imgMatches
		for match,u in @imgMatches
			xmlImg= DocUtils.Str2xml '<?xml version="1.0" ?><w:document mc:Ignorable="w14 wp14" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">'+match[0]+'</w:document>'

			if @xmlTemplater.DocxGen.qrCode
				console.log xmlImg
				tagrId= xmlImg.getElementsByTagNameNS('*','blip')[0]
				
				console.log tagrId
				if tagrId!=undefined
					rId = tagrId.getAttribute('r:embed')
					console.log rId
					oldFile= @xmlTemplater.DocxGen.getImageByRid(rId)

					if oldFile!=null
						tag= xmlImg.getElementsByTagNameNS('*','docPr')[0]
						imgName= (tag.getAttribute('name')+"_Copie_"+@xmlTemplater.imageId+".png").replace(/\x20/,"")
						console.log 'before callback'+imgName
						qr= new DocxQrCode(oldFile.data,@xmlTemplater,imgName)
						newId= @xmlTemplater.DocxGen.addImageRels(imgName,"")
						@xmlTemplater.imageId++
						@xmlTemplater.DocxGen.setImage("word/media/#{imgName}",oldFile.data)
						# tag.setAttribute('id',@xmlTemplater.imageId)
						tag.setAttribute('name',"#{imgName}")
						tagrId.setAttribute('r:embed',"rId#{newId}")
						imageTag= xmlImg.getElementsByTagNameNS('*','drawing')[0]
						@xmlTemplater.content=@xmlTemplater.content.replace(match[0], DocUtils.xml2Str imageTag)
						@xmlTemplater.numQrCode++

						callback= (qr,newImgName) =>
							console.log 'callback qrcode:'+newImgName
							@xmlTemplater.numQrCode--
							@xmlTemplater.DocxGen.setImage("word/media/#{newImgName}",qr.data)
							if @xmlTemplater.numQrCode==0 then @xmlTemplater.qrcodeCallback()
						qr.decode(callback)

			else if @xmlTemplater.currentScope["img"]? then if @xmlTemplater.currentScope["img"][u]?
				
				imgName= @xmlTemplater.currentScope["img"][u].name
				imgData= @xmlTemplater.currentScope["img"][u].data
				throw 'DocxGen not defined' unless @xmlTemplater.DocxGen?
				newId= @xmlTemplater.DocxGen.addImageRels(imgName,imgData)
				tag= xmlImg.getElementsByTagNameNS('*','docPr')[0]

				@xmlTemplater.imageId++
				tag.setAttribute('id',@xmlTemplater.imageId)
				tag.setAttribute('name',"#{imgName}")

				tagrId= xmlImg.getElementsByTagNameNS('*','blip')[0]

				tagrId.setAttribute('r:embed',"rId#{newId}")

				imageTag= xmlImg.getElementsByTagNameNS('*','drawing')[0]
				@xmlTemplater.content=@xmlTemplater.content.replace(match[0], DocUtils.xml2Str imageTag)