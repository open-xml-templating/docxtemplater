window.DocxQrCode = class DocxQrCode
	constructor:(imageData, @DocxGen,@imgName="",@num)->
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
		if @result!=null and @result!= 'error decoding QR Code'
			loadDocCallback= (fail=false) =>
				if not fail
					@data=docXData[@result]
					callback(this,@imgName,@num)
				else
					callback(this,@imgName,@num)
					# @DocxGen.localImageCreator(@result,callback)
			DocUtils.loadDoc(@result,true,false,false,loadDocCallback)
		else
			callback(this,@imgName,@num)	
			