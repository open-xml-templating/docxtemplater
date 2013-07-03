window.DocxQrCode = class DocxQrCode
	constructor:(imageData, @DocxGen,@imgName="",@num,@callback)->
		@data=imageData
		@base64Data=JSZipBase64.encode(@data)
		@ready=false
		@result=null
		console.log "data:image/png;base64,#{@base64Data}"
	decode:(@callback) ->
		_this= this
		console.log this

		@qr= new QrCode()

		@qr.callback= () ->
			_this.ready= true
			_this.result= this.result
			window.testdoc= new _this.DocxGen.class this.result, _this.DocxGen.toJson()
			testdoc.applyTemplateVars()
			_this.result=testdoc.content
			_this.searchImage()
		@qr.decode("data:image/png;base64,#{@base64Data}")
	searchImage:() ->
		if @result!=null and @result!= 'error decoding QR Code'
			console.log 'loaded'
			loadDocCallback= (fail=false) =>
				if not fail
					@data=docXData[@result]
					@callback(this,@imgName,@num)
				else
					console.log 'failed'
					console.log @callback
					console.log this
					@callback(this,@imgName,@num)
					# @DocxGen.localImageCreator(@result,callback)
			DocUtils.loadDoc(@result,true,false,false,loadDocCallback)
		else
			console.log 'notloaded'
			@callback(this,@imgName,@num)	
			