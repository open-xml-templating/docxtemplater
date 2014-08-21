env= if global? then 'node' else 'browser'

DocUtils=require('./docUtils')
DocXTemplater=require('./docxTemplater')

vm=require('vm')
fs=require('fs')

QrCode=require('qrcode-reader')

module.exports= class DocxQrCode
	constructor:(imageData, @xmlTemplater,@imgName="",@num,@callback)->
		@callbacked=false
		@data=imageData
		if @data==undefined then throw new Error("data of qrcode can't be undefined")
		if env=='browser'
			@base64Data=JSZip.base64.encode(@data)
		@ready=false
		@result=null
	decode:(@callback) ->
		_this= this
		@qr= new QrCode()
		@qr.callback= () ->
			_this.ready= true
			_this.result= this.result
			testdoc= new _this.xmlTemplater.currentClass this.result, _this.xmlTemplater.toJson()
			testdoc.applyTags()
			_this.result=testdoc.content
			_this.searchImage()
		if env=='browser'
			@qr.decode("data:image/png;base64,#{@base64Data}")
		else
			@qr.decode(@data,@data.decoded)

	searchImage:() ->
		if @result.substr(0,4)=='gen:'
			callback= (data) =>
				@data=data
				@callback(this,@imgName,@num)
			@xmlTemplater.DocxGen.localImageCreator(@result,callback)
		else if @result!=null and @result!= undefined and @result.substr(0,22)!= 'error decoding QR Code'
			loadDocCallback= (err,data) =>
				@data=data
				@callback(this,@imgName,@num)
			fs.readFile(DocUtils.pathConfig.node+@result,loadDocCallback)
		else
			@callback(this,@imgName,@num)
