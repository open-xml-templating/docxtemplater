window.DocxQrCode = class DocxQrCode
	constructor:(imageData, @DocxGen)->
		@data=imageData
		@base64Data=JSZipBase64.encode(@data)
		@ready=false
		@result=null

	decode:(callback) ->
		_this= this
		qrcode.callback= () ->
			_this.ready= true
			_this.result= this.result
			window.testdoc= new _this.DocxGen.class this.result, _this.DocxGen.toJson()
			testdoc.applyTemplateVars()
			_this.result=testdoc.content
			_this.searchImage(callback)

		qrcode.decode("data:image/png;base64,#{@base64Data}")
	searchImage:(callback) ->
		if @result!=null
			loadDocCallback= () =>
				@data=docXData[@result]
				callback(this)
			DocUtils.loadDoc(@result,true,false,false,loadDocCallback)