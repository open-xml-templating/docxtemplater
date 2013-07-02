window.DocxQrCode = class DocxQrCode
	constructor:(imageData, @DocxGen,@imgName="",@num)->
		console.log @imgName
		console.log "num1:#{@num}"
		@data=imageData
		@base64Data=JSZipBase64.encode(@data)
		@ready=false
		@result=null

	decode:(callback) ->
		console.log 'decoding'
		_this= this
		console.log "num2:#{@num}"
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
					console.log 'not Fail!!----------'
					console.log @imgName
					console.log this
					callback(this,@imgName,@num)
				else
					console.log 'searching local'
					callback(this,@imgName,@num)
					# @DocxGen.localImageCreator(@result,callback)
			DocUtils.loadDoc(@result,true,false,false,loadDocCallback)
		else
			console.log 'no qrcode found'
			console.log this
			console.log "num3:#{@num}"
			callback(this,@imgName,@num)	
			