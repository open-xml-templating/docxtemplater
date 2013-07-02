window.DocxQrCode = class DocxQrCode
	constructor:(imageData, @DocxGen)->
		@data=imageData
		@base64Data=JSZipBase64.encode(@data)
		@ready=false
		@result=null

	decode:(callback) ->
		console.log 'decoding'
		_this= this
		qrcode.callback= () ->
			console.log 'decode'
			_this.ready= true
			_this.result= this.result
			window.testdoc= new _this.DocxGen.class this.result, _this.DocxGen.toJson()
			testdoc.applyTemplateVars()
			_this.result=testdoc.content
			_this.searchImage(callback)

		qrcode.decode("data:image/png;base64,#{@base64Data}")
	searchImage:(callback) ->
		console.log @result
		if @result!=null and @result!= 'error decoding QR Code'
			loadDocCallback= (fail=false) =>
				if not fail				
					@data=docXData[@result]
					callback(this)
				else
					console.log 'searching local'
					callback(this)
					# @DocxGen.localImageCreator(@result,callback)
			DocUtils.loadDoc(@result,true,false,false,loadDocCallback)
		else
			console.log 'no qrcode found'
			callback(this)	
			