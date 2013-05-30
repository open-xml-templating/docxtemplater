Object.size = (obj) ->
	size=0
	log = 0
	for key of obj
		size++
	size

describe "DocxGenBasis", () ->
	it "should be defined", () ->
		expect(DocxGen).not.toBe(undefined);
	it "should construct", () ->
		a= new DocxGen();
		expect(a).not.toBe(undefined);

describe "DocxGenLoading", () ->
	#wait till this function has been called twice (once for the docx and once for the image)
	callbackLoadedDocxImage = jasmine.createSpy();

	#load docx
	xhrDoc= new XMLHttpRequest()
	xhrDoc.open('GET', '../examples/imageExample.docx', true)
	if xhrDoc.overrideMimeType
		xhrDoc.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDoc.onreadystatechange =(e)->
		if this.readyState == 4 and this.status == 200
			window.docData=this.response
			window.docx=new DocxGen(docData)
			callbackLoadedDocxImage()
	xhrDoc.send()

	#load image
	xhrImage= new XMLHttpRequest()
	xhrImage.open('GET', '../examples/image.png', true)
	if xhrImage.overrideMimeType
		xhrImage.overrideMimeType('text/plain; charset=x-user-defined')
	xhrImage.onreadystatechange =(e)->
		if this.readyState == 4 and this.status == 200
			window.imgData=this.response
			callbackLoadedDocxImage()
	xhrImage.send()

	waitsFor () ->
		callbackLoadedDocxImage.callCount>=2 #loaded docx and image

	describe "ajax done correctly", () ->
		it "doc and img Data should have the expected length", () ->
			expect(docData.length).toEqual(729580)
			expect(imgData.length).toEqual(18062)
		it "should have the right number of files (the docx unzipped)", ()->
			expect(Object.size(docx.files)).toEqual(22)

	describe "basic loading", () ->
		it "should load file imageExample.docx", () ->
			expect(typeof docx).toBe('object');
	describe "content_loading", () ->
		it "should load the right content for the footer", () ->
			fullText=(docx.getFullText("word/footer1.xml"))
			expect(fullText.length).not.toBe(0)
			expect(fullText).toBe('{last_name}{first_name}{phone}')
		it "should load the right content for the document", () ->
			fullText=(docx.getFullText()) #default value document.xml
			expect(fullText).toBe("")
	describe "image loading", () ->
		it "should find one image (and not more than 1)", () ->
				expect(docx.getImageList().length).toEqual(1)
		it "should find the image named with the good name", () ->
			expect((docx.getImageList())[0].path).toEqual('word/media/image1.jpeg')
		it "should change the image with another one", () ->
			oldImageData=docx.files['word/media/image1.jpeg'].data
			docx.setImage('word/media/image1.jpeg',imgData)
			newImageData=docx.files['word/media/image1.jpeg'].data
			expect(oldImageData).not.toEqual(newImageData)
			expect(imgData).toEqual(newImageData)

describe "DocxGenTemplating", () ->
	callbackLoadedTaggedDocx = jasmine.createSpy();
	xhrDoc= new XMLHttpRequest()
	xhrDoc.open('GET', '../examples/tagExample.docx', true)
	if xhrDoc.overrideMimeType
		xhrDoc.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDoc.onreadystatechange =(e)->
		if this.readyState == 4 and this.status == 200
			docData=this.response
			window.taggedDocx=new DocxGen(docData)
			callbackLoadedTaggedDocx()
	xhrDoc.send()

	xhrDocExpected= new XMLHttpRequest()
	xhrDocExpected.open('GET', '../examples/tagExampleExpected.docx', true)
	if xhrDocExpected.overrideMimeType
		xhrDocExpected.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDocExpected.onreadystatechange =(e)->
		if this.readyState == 4 and this.status == 200
			window.docDataExpected=this.response
			callbackLoadedTaggedDocx()
	xhrDocExpected.send()

	waitsFor () ->
		callbackLoadedTaggedDocx.callCount>=2  #loaded both startDocx and expectedDocx

	describe "text templating", () ->
		it "should change values with template vars", () ->
			templateVars=
				"first_name":"Hipp"
				"last_name":"Edgar",
				"phone":"0652455478"
				"description":"New Website"
			taggedDocx.setTemplateVars templateVars
			taggedDocx.applyTemplateVars()
			expect(taggedDocx.getFullText()).toEqual('Edgar Hipp')
			expect(taggedDocx.getFullText("word/header1.xml")).toEqual('Edgar Hipp0652455478New Website')
			expect(taggedDocx.getFullText("word/footer1.xml")).toEqual('EdgarHipp0652455478')
		it "should export the good file", () ->
			outputExpected= new DocxGen(docDataExpected)
			for i of taggedDocx.files
				#Everything but the date should be different
				# console.log typeof taggedDocx.files[i].data
				# console.log taggedDocx.files[i].data

				expect(taggedDocx.files[i].data).toBe(outputExpected.files[i].data)
				expect(taggedDocx.files[i].name).toBe(outputExpected.files[i].name)
				expect(taggedDocx.files[i].options.base64).toBe(outputExpected.files[i].options.base64)
				expect(taggedDocx.files[i].options.binary).toBe(outputExpected.files[i].options.binary)
				expect(taggedDocx.files[i].options.compression).toBe(outputExpected.files[i].options.compression)
				expect(taggedDocx.files[i].options.dir).toBe(outputExpected.files[i].options.dir)
				expect(taggedDocx.files[i].options.date).not.toBe(outputExpected.files[i].options.date)

describe "DocxGenTemplatingForLoop", () ->
	callbackLoadedTaggedDocx = jasmine.createSpy();
	xhrDoc= new XMLHttpRequest()
	xhrDoc.open('GET', '../examples/tagLoopExample.docx', true)
	if xhrDoc.overrideMimeType
		xhrDoc.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDoc.onreadystatechange =(e)->
		if this.readyState == 4 and this.status == 200
			docData=this.response
			window.taggedForDocx= new DocxGen(docData)
			callbackLoadedTaggedDocx()
	xhrDoc.send()

	xhrDocMultipleLoop= new XMLHttpRequest()
	xhrDocMultipleLoop.open('GET', '../examples/tagProduitLoop.docx', true)
	if xhrDocMultipleLoop.overrideMimeType
		xhrDocMultipleLoop.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDocMultipleLoop.onreadystatechange =(e)->
		if this.readyState == 4 and this.status == 200
			docData=this.response
			window.MultipleTaggedDocx= new DocxGen(docData)
			console.log MultipleTaggedDocx
			callbackLoadedTaggedDocx()
	xhrDocMultipleLoop.send()

	waitsFor () ->
		console.log callbackLoadedTaggedDocx.callCount
		callbackLoadedTaggedDocx.callCount>=2  #loaded tagLoopExample

	describe "textLoop templating", () ->
		it "should replace all the tags", () ->
			templateVars =
				"nom":"Hipp"
				"prenom":"Edgar"
				"telephone":"0652455478"
				"description":"New Website"
				"offre":[{"titre":"titre1","prix":"1250"},{"titre":"titre2","prix":"2000"},{"titre":"titre3","prix":"1400"}]
			taggedForDocx.setTemplateVars templateVars
			taggedForDocx.applyTemplateVars()
			expect(taggedForDocx.getFullText()).toEqual('Votre proposition commercialePrix: 1250Titre titre1Prix: 2000Titre titre2Prix: 1400Titre titre3HippEdgar')
			window.content= taggedForDocx.files["word/document.xml"].data

		it "should work with loops inside loops", () ->
			console.log "test"
			templateVars = {"products":[{"title":"Microsoft","name":"Windows","reference":"Win7","avantages":[{"title":"Everyone uses it","proof":[{"reason":"it is quite cheap"},{"reason":"it is quit simple"},{"reason":"it works on a lot of different Hardware"}]}]},{"title":"Linux","name":"Ubuntu","reference":"Ubuntu10","avantages":[{"title":"It's very powerful","proof":[{"reason":"the terminal is your friend"},{"reason":"Hello world"},{"reason":"it's free"}]}]},{"title":"Apple","name":"Mac","reference":"OSX","avantages":[{"title":"It's very easy","proof":[{"reason":"you can do a lot just with the mouse"},{"reason":"It's nicely designed"}]}]},]}
			window.MultipleTaggedDocx.setTemplateVars templateVars
			window.MultipleTaggedDocx.applyTemplateVars()
			text= window.MultipleTaggedDocx.getFullText()
			expectedText= "MicrosoftProduct name : WindowsProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed"
			expect(text.length).toEqual(expectedText.length)
			expect(text).toEqual(expectedText)


