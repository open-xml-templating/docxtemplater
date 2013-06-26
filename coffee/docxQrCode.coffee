window.DocxQrCode = class DocxQrCode
	constructor:(imageData)->
		@data=imageData
		@base64Data=JSZipBase64.encode(@data)
		@ready=false
		@result=null

	decode:(callback) ->
		_this= this
		qrcode.callback= () ->
			_this.ready=true
			_this.result=this.result
			_this.searchImage(callback)
		qrcode.decode("data:image/png;base64,#{@base64Data}")
	searchImage:(callback) ->
		if @result!=null
			console.log 'searchinImage'
			loadDocCallback= () =>
				@data=docXData[@result]
				callback(this)
			DocUtils.loadDoc(@result,true,false,false,loadDocCallback)
			
			