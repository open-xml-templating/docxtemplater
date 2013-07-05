window.DocxQrCode = class DocxQrCode
	constructor:(imageData, @xmlTemplater,@imgName="",@num,@callback)->
		@data=imageData
		@base64Data=JSZipBase64.encode(@data)
		@ready=false
		@result=null
	decode:(@callback) ->
		_this= this
		@qr= new QrCode()
		@qr.callback= () ->
			_this.ready= true
			_this.result= this.result
			testdoc= new _this.xmlTemplater.class this.result, _this.xmlTemplater.toJson()
			testdoc.applyTemplateVars()
			_this.result=testdoc.content
			_this.searchImage()
		@qr.decode("data:image/png;base64,#{@base64Data}")
		console.log "data:image/png;base64,#{@base64Data}"
	searchImage:() ->
		console.log @result
		if @result.substr(0,4)=='gen:'
			callback= (data) =>
				@data=data
				@callback(this,@imgName,@num)
			@xmlTemplater.DocxGen.localImageCreator(@result,callback)
		else if @result!=null and @result!= undefined and @result.substr(0,22)!= 'error decoding QR Code'
			_thatiti= this
			loadDocCallback= (fail=false) =>
				if not fail
					@data=docXData[@result]
					@callback(this,@imgName,@num)
				else
					@callback(this,@imgName,@num)
			DocUtils.loadDoc(@result,true,false,false,loadDocCallback)
		else
			@callback(this,@imgName,@num)	
