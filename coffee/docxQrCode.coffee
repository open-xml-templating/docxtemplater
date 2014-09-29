DocUtils=require('./docUtils')
DocXTemplater=require('./docxTemplater')

vm=require('vm')
JSZip=require('jszip')

QrCode=require('qrcode-reader')

module.exports= class DocxQrCode
	constructor:(imageData, @xmlTemplater,@imgName="",@num,@callback)->
		@callbacked=false
		@data=imageData
		if @data==undefined then throw new Error("data of qrcode can't be undefined")
		if DocUtils.env=='browser'
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
		if DocUtils.env=='browser'
			@qr.decode("data:image/png;base64,#{@base64Data}")
		else
			@qr.decode(@data,@data.decoded)
	searchImage:() ->
		cb=(err,data)=>
			@data=data
			@callback(this,@imgName,@num)
		if !@result? then cb(null,@data)
		@xmlTemplater.DocxGen.qrCode(@result,cb)
