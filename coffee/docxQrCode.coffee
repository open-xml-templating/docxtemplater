window.DocxQrCode = class DocxQrCode
	constructor:(imageData, @xmlTemplater,@imgName="",@num,@callback)->
		@data=imageData
		@base64Data=JSZipBase64.encode(@data)
		@ready=false
		@result=null
	decode:(@callback) ->
		_this= this
		console.log 'before',@imgName
		@qr= new QrCode()
		@qr.callback= () ->
			console.log this
			console.log "after:", _this.imgName
			_this.ready= true
			_this.result= this.result
			testdoc= new _this.xmlTemplater.class this.result, _this.xmlTemplater.toJson()
			testdoc.applyTemplateVars()
			_this.result=testdoc.content
			_this.searchImage()
		@qr.decode("data:image/png;base64,#{@base64Data}")
	searchImage:() ->
		if @result!=null and @result!= undefined and @result!= 'error decoding QR Code'
			_thatiti= this
			loadDocCallback= (fail=false) =>
				if not fail
					@data=docXData[@result]
					@callback(this,@imgName,@num)
				else
					@callback(this,@imgName,@num)
					# @xmlTemplater.localImageCreator(@result,callback)
			DocUtils.loadDoc(@result,true,false,false,loadDocCallback)
		else
			@callback(this,@imgName,@num)	
			