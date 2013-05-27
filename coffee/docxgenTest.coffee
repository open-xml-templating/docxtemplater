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
				expect(taggedDocx.files[i].data).toBe(outputExpected.files[i].data)
				expect(taggedDocx.files[i].name).toBe(outputExpected.files[i].name)
				expect(taggedDocx.files[i].options.base64).toBe(outputExpected.files[i].options.base64)
				expect(taggedDocx.files[i].options.binary).toBe(outputExpected.files[i].options.binary)
				expect(taggedDocx.files[i].options.compression).toBe(outputExpected.files[i].options.compression)
				expect(taggedDocx.files[i].options.dir).toBe(outputExpected.files[i].options.dir)
				expect(taggedDocx.files[i].options.date).not.toBe(outputExpected.files[i].options.date)

# describe "DocxGenTemplatingForLoop", () ->
# 	callbackLoadedTaggedDocx = jasmine.createSpy();
# 	xhrDoc= new XMLHttpRequest()
# 	xhrDoc.open('GET', '../examples/tagLoopExample.docx', true)
# 	if xhrDoc.overrideMimeType
# 		xhrDoc.overrideMimeType('text/plain; charset=x-user-defined')
# 	xhrDoc.onreadystatechange =(e)->
# 		if this.readyState == 4 and this.status == 200
# 			docData=this.response
# 			window.taggedForDocx= new DocxGen(docData)
# 			callbackLoadedTaggedDocx()
# 	xhrDoc.send()

# 	waitsFor () ->
# 		callbackLoadedTaggedDocx.callCount>=1  #loaded tagLoopExample

	# describe "textLoop templating", () ->
	# 	it "should replace all the tags", () ->
	# 		templateVars={}
	# 		taggedForDocx.setTemplateVars templateVars
	# 		taggedForDocx.applyTemplateVars()
	# 		expect(taggedForDocx.getFullText()).toEqual('Votre proposition commercialeundefinedMon titreTitre undefinedBonjourLe prix total est de undefined, et le nombre de semaines de undefinedLala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolorLes avantages sont:La rapiditÃ©La simplicitÃ©Lalasit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit ametundefinedundefinedundefined')
	# 		window.content= taggedForDocx.files["word/document.xml"].data


