window.DocxQrCode = class DocxQrCode
	constructor:(imageData)->
		@data=imageData
		@base64Data=JSZipBase64.encode(@data)
		@ready=false
		@result=null

	decode:() ->
		_this= this
		qrcode.callback= () ->
			console.log 1
			_this.ready=true
			_this.result=this.result
			_this.searchImage()
		qrcode.decode("data:image/png;base64,#{@base64Data}")
	searchImage:() ->
		if @result!=null
			DocUtils.loadDoc(@result,true,false,true)
			console.log docXData[@result]
			@data=docXData[@result]