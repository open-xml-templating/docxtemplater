window.DocxQrCode = class DocxQrCode
	constructor:(imageData, @DocxGen,@imgName="",@num,@callback)->
		@data=imageData
		@base64Data=JSZipBase64.encode(@data)
		@ready=false
		@result=null
		console.log "data:image/png;base64,#{@base64Data}"
	decode:(@callback) ->
		_this= this

		# qrcode.callback= () ->
			# _this.ready= true
			# _this.result= this.result
			# window.testdoc= new _this.DocxGen.class this.result, _this.DocxGen.toJson()
			# testdoc.applyTemplateVars()
			# _this.result=testdoc.content
			# _this.searchImage()
		dataUri= "data:image/png;base64,#{@base64Data}"
		# qrcode.decode dataUri
		img = new Image()
		body= document.getElementsByTagName("body")[0];
		canvas_qr = document.createElement('canvas');
		body.appendChild(canvas_qr)
		context = canvas_qr.getContext('2d');
			

		img.onload= () ->
			canvas_qr.width=img.width
			canvas_qr.height=img.height
			context.drawImage(img,0,0)
			imageData=context.getImageData(0,0,img.width,img.height)
			imageData.getPoints = (x,y) ->
				if this.width < x
					throw new Error("point error")
				if this.height < y
					throw new Error("point error");
				point = (x * 4) + (y * this.width * 4);
				p = new RGBColor(this.data[point],this.data[point+1],this.data[point+2],this.data[point+3]);
				p
			qr = new QRCode();
			console.log(img)
			result = qr.getContsnts(imageData,img.width)
			_this.ready= true
			_this.result= result
			window.testdoc= new _this.DocxGen.class result, _this.DocxGen.toJson()
			testdoc.applyTemplateVars()
			_this.result=testdoc.content
			_this.searchImage()

			console.log result
		img.src= dataUri
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
			