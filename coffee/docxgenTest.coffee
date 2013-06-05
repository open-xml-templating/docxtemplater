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
			callbackLoadedTaggedDocx()
	xhrDocMultipleLoop.send()

	waitsFor () ->
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
			templateVars = {"products":[{"title":"Microsoft","name":"Windows","reference":"Win7","avantages":[{"title":"Everyone uses it","proof":[{"reason":"it is quite cheap"},{"reason":"it is quit simple"},{"reason":"it works on a lot of different Hardware"}]}]},{"title":"Linux","name":"Ubuntu","reference":"Ubuntu10","avantages":[{"title":"It's very powerful","proof":[{"reason":"the terminal is your friend"},{"reason":"Hello world"},{"reason":"it's free"}]}]},{"title":"Apple","name":"Mac","reference":"OSX","avantages":[{"title":"It's very easy","proof":[{"reason":"you can do a lot just with the mouse"},{"reason":"It's nicely designed"}]}]},]}
			window.MultipleTaggedDocx.setTemplateVars templateVars
			window.MultipleTaggedDocx.applyTemplateVars()
			text= window.MultipleTaggedDocx.getFullText()
			expectedText= "MicrosoftProduct name : WindowsProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed"
			expect(text.length).toEqual(expectedText.length)
			expect(text).toEqual(expectedText)

describe "scope calculation" , () ->
	xmlTemplater= new XmlTemplater()
	it "should compute the scope between 2 <w:t>" , () ->
		scope= xmlTemplater.calcScopeText """undefined</w:t></w:r></w:p><w:p w:rsidP="008A4B3C" w:rsidR="007929C1" w:rsidRDefault="007929C1" w:rsidRPr="008A4B3C"><w:pPr><w:pStyle w:val="Sous-titre"/></w:pPr><w:r w:rsidRPr="008A4B3C"><w:t xml:space="preserve">Audit réalisé le """
		expect(scope).toEqual([ { tag : '</w:t>', offset : 9 }, { tag : '</w:r>', offset : 15 }, { tag : '</w:p>', offset : 21 }, { tag : '<w:p>', offset : 27 }, { tag : '<w:r>', offset : 162 }, { tag : '<w:t>', offset : 188 } ])

	it "should compute the scope between 2 <w:t> in an Array", () ->
		scope= xmlTemplater.calcScopeText """urs</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type="dxa" w:w="4140"/></w:tcPr><w:p w:rsidP="00CE524B" w:rsidR="00CE524B" w:rsidRDefault="00CE524B"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="auto"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="auto"/></w:rPr><w:t>Sur exté"""
		expect(scope).toEqual([ { tag : '</w:t>', offset : 3 }, { tag : '</w:r>', offset : 9 }, { tag : '</w:p>', offset : 15 }, { tag : '</w:tc>', offset : 21 }, { tag : '<w:tc>', offset : 28 }, { tag : '<w:p>', offset : 83 }, { tag : '<w:r>', offset : 268 }, { tag : '<w:t>', offset : 374 } ])

	it 'should compute the scope between a w:t in an array and the other outside', () ->
		scope= xmlTemplater.calcScopeText """defined €</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p w:rsidP="00CA7135" w:rsidR="00BE3585" w:rsidRDefault="00BE3585"/><w:p w:rsidP="00CA7135" w:rsidR="00BE3585" w:rsidRDefault="00BE3585"/><w:p w:rsidP="00CA7135" w:rsidR="00137C91" w:rsidRDefault="00137C91"><w:r w:rsidRPr="00B12C70"><w:rPr><w:bCs/></w:rPr><w:t>Coût ressources """
		expect(scope).toEqual( [ { tag : '</w:t>', offset : 11 }, { tag : '</w:r>', offset : 17 }, { tag : '</w:p>', offset : 23 }, { tag : '</w:tc>', offset : 29 }, { tag : '</w:tr>', offset : 36 }, { tag : '</w:tbl>', offset : 43 }, { tag : '<w:p>', offset : 191 }, { tag : '<w:r>', offset : 260 }, { tag : '<w:t>', offset : 309 } ])


describe "scope diff calculation", () ->
	xmlTemplater= new XmlTemplater()
	it "should compute the scope between 2 <w:t>" , () ->
		scope= xmlTemplater.calcScopeDifference """undefined</w:t></w:r></w:p><w:p w:rsidP="008A4B3C" w:rsidR="007929C1" w:rsidRDefault="007929C1" w:rsidRPr="008A4B3C"><w:pPr><w:pStyle w:val="Sous-titre"/></w:pPr><w:r w:rsidRPr="008A4B3C"><w:t xml:space="preserve">Audit réalisé le """
		expect(scope).toEqual([])

	it "should compute the scope between 2 <w:t> in an Array", () ->
		scope= xmlTemplater.calcScopeDifference """urs</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type="dxa" w:w="4140"/></w:tcPr><w:p w:rsidP="00CE524B" w:rsidR="00CE524B" w:rsidRDefault="00CE524B"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="auto"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="auto"/></w:rPr><w:t>Sur exté"""
		expect(scope).toEqual([])

	it 'should compute the scope between a w:t in an array and the other outside', () ->
		scope= xmlTemplater.calcScopeDifference """defined €</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p w:rsidP="00CA7135" w:rsidR="00BE3585" w:rsidRDefault="00BE3585"/><w:p w:rsidP="00CA7135" w:rsidR="00BE3585" w:rsidRDefault="00BE3585"/><w:p w:rsidP="00CA7135" w:rsidR="00137C91" w:rsidRDefault="00137C91"><w:r w:rsidRPr="00B12C70"><w:rPr><w:bCs/></w:rPr><w:t>Coût ressources """
		expect(scope).toEqual([ { tag : '</w:tc>', offset : 29 }, { tag : '</w:tr>', offset : 36 }, { tag : '</w:tbl>', offset : 43 } ])

describe "scope inner text", () ->
	callbackLoadedTaggedDocx = jasmine.createSpy();
	xhrDocMultipleLoop= new XMLHttpRequest()
	xhrDocMultipleLoop.open('GET', '../examples/tagProduitLoop.docx', true)
	if xhrDocMultipleLoop.overrideMimeType
		xhrDocMultipleLoop.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDocMultipleLoop.onreadystatechange =(e)->
		if this.readyState == 4 and this.status == 200
			docData=this.response
			window.taggedProduct= new DocxGen(docData)
			callbackLoadedTaggedDocx()
	xhrDocMultipleLoop.send()

	waitsFor () ->
		callbackLoadedTaggedDocx.callCount>=1  #loaded tagLoopExample

	it "should find the scope" , () ->	
		xmlTemplater= new XmlTemplater()
		scope= xmlTemplater.calcInnerTextScope taggedProduct.files["word/document.xml"].data ,1195,1245,'w:p'
		obj= { text : """<w:p w:rsidR="00923B77" w:rsidRDefault="00923B77"><w:r><w:t>{#</w:t></w:r><w:r w:rsidR="00713414"><w:t>products</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p>""", startTag : 1134, endTag : 1286 }
		expect(scope.endTag).toEqual(obj.endTag)
		expect(scope.startTag).toEqual(obj.startTag)
		expect(scope.text.length).toEqual(obj.text.length)
		expect(scope.text).toEqual(obj.text)

describe "Dash Loop Testing", () ->
	callbackLoadedTaggedDocx = jasmine.createSpy();
	xhrDocMultipleLoop= new XMLHttpRequest()
	xhrDocMultipleLoop.open('GET', '../examples/tagDashLoop.docx', true)
	if xhrDocMultipleLoop.overrideMimeType
		xhrDocMultipleLoop.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDocMultipleLoop.onreadystatechange =(e)->
		if this.readyState == 4 and this.status == 200
			docData=this.response
			window.taggedDashLoop= new DocxGen(docData)
			callbackLoadedTaggedDocx()
	xhrDocMultipleLoop.send()

	xhrDashLoopTable= new XMLHttpRequest()
	xhrDashLoopTable.open('GET', '../examples/tagDashLoopTable.docx', true)
	if xhrDashLoopTable.overrideMimeType
		xhrDashLoopTable.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDashLoopTable.onreadystatechange =(e)->
		if this.readyState == 4 and this.status == 200
			docData=this.response
			window.taggedDashLoopTable= new DocxGen(docData)
			callbackLoadedTaggedDocx()
	xhrDashLoopTable.send()

	xhrDashLoopList= new XMLHttpRequest()
	xhrDashLoopList.open('GET', '../examples/tagDashLoopList.docx', true)
	if xhrDashLoopList.overrideMimeType
		xhrDashLoopList.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDashLoopList.onreadystatechange =(e)->
		if this.readyState == 4 and this.status == 200
			docData=this.response
			window.taggedDashLoopList= new DocxGen(docData)
			callbackLoadedTaggedDocx()
	xhrDashLoopList.send()

	waitsFor () ->
		callbackLoadedTaggedDocx.callCount>=3  #loaded tagLoopExample

	it "dash loop ok on simple table -> w:tr" , () ->	
		templateVars=
			"os":[{"type":"linux","price":"0","reference":"Ubuntu10"},{"type":"windows","price":"500","reference":"Win7"},{"type":"apple","price":"1200","reference":"MACOSX"}]
		taggedDashLoop.setTemplateVars(templateVars)
		taggedDashLoop.applyTemplateVars()
		expectedText= "linux0Ubuntu10windows500Win7apple1200MACOSX"
		text=taggedDashLoop.getFullText()
		expect(text).toBe(expectedText)

	it "dash loop ok on simple table -> w:table" , () ->	
		templateVars=
			"os":[{"type":"linux","price":"0","reference":"Ubuntu10"},{"type":"windows","price":"500","reference":"Win7"},{"type":"apple","price":"1200","reference":"MACOSX"}]
		taggedDashLoopTable.setTemplateVars(templateVars)
		taggedDashLoopTable.applyTemplateVars()
		expectedText= "linux0Ubuntu10windows500Win7apple1200MACOSX"
		text=taggedDashLoopTable.getFullText()
		expect(text).toBe(expectedText)

	it "dash loop ok on simple list -> w:p" , () ->	
		templateVars=
			"os":[{"type":"linux","price":"0","reference":"Ubuntu10"},{"type":"windows","price":"500","reference":"Win7"},{"type":"apple","price":"1200","reference":"MACOSX"}]
		taggedDashLoopList.setTemplateVars(templateVars)
		taggedDashLoopList.applyTemplateVars()
		expectedText= 'linux 0 Ubuntu10 windows 500 Win7 apple 1200 MACOSX '
		text=taggedDashLoopList.getFullText()
		expect(text).toBe(expectedText)

describe "Intelligent Loop Tagging", () ->
	callbackLoadedTaggedDocx = jasmine.createSpy();
	
	xhrDocMultipleLoop= new XMLHttpRequest()
	xhrDocMultipleLoop.open('GET', '../examples/tagIntelligentLoopTable.docx', true)
	if xhrDocMultipleLoop.overrideMimeType
		xhrDocMultipleLoop.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDocMultipleLoop.onreadystatechange =(e)->
		if this.readyState == 4 and this.status == 200
			docData=this.response
			window.tagIntelligentTableDocx= new DocxGen(docData,{},true)
			callbackLoadedTaggedDocx()
	xhrDocMultipleLoop.send()

	callbackLoadedTaggedDocx = jasmine.createSpy();
	
	xhrDocExpected= new XMLHttpRequest()
	xhrDocExpected.open('GET', '../examples/tagIntelligentLoopTableExpected.docx', true)
	if xhrDocExpected.overrideMimeType
		xhrDocExpected.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDocExpected.onreadystatechange =(e)->
		if this.readyState == 4 and this.status == 200
			docData=this.response
			window.tagIntelligentTableDocxExpected= new DocxGen(docData,{},true)
			callbackLoadedTaggedDocx()
	xhrDocExpected.send()

	waitsFor () ->
		callbackLoadedTaggedDocx.callCount>=2  #loaded tagLoopExample

	it "should work with tables" , () ->	
		templateVars=
			"os":[{"type":"linux","price":"0","reference":"Ubuntu10"},{"type":"windows","price":"500","reference":"Win7"},{"type":"apple","price":"1200","reference":"MACOSX"}]
		tagIntelligentTableDocx.setTemplateVars(templateVars)
		tagIntelligentTableDocx.applyTemplateVars()
		expectedText= 'linux0Ubuntu10windows500Win7apple1200MACOSX'
		text=tagIntelligentTableDocx.getFullText()
		expect(text).toBe(expectedText)

		for i of tagIntelligentTableDocx.files
			#Everything but the date should be different
			expect(tagIntelligentTableDocx.files[i].data).toBe(tagIntelligentTableDocxExpected.files[i].data)
			expect(tagIntelligentTableDocx.files[i].name).toBe(tagIntelligentTableDocxExpected.files[i].name)
			expect(tagIntelligentTableDocx.files[i].options.base64).toBe(tagIntelligentTableDocxExpected.files[i].options.base64)
			expect(tagIntelligentTableDocx.files[i].options.binary).toBe(tagIntelligentTableDocxExpected.files[i].options.binary)
			expect(tagIntelligentTableDocx.files[i].options.compression).toBe(tagIntelligentTableDocxExpected.files[i].options.compression)
			expect(tagIntelligentTableDocx.files[i].options.dir).toBe(tagIntelligentTableDocxExpected.files[i].options.dir)
			expect(tagIntelligentTableDocx.files[i].options.date).not.toBe(tagIntelligentTableDocxExpected.files[i].options.date)

describe "xmlTemplater", ()->
	it "should work with simpleContent", ()->
		content= """<w:t>Hello {name}</w:t>"""
		scope= {"name":"Edgar"} 
		xmlTemplater= new XmlTemplater(content,scope)
		xmlTemplater.applyTemplateVars()
		expect(xmlTemplater.getFullText()).toBe('Hello Edgar')

	it "should work with tag in two elements", ()->
		content= """<w:t>Hello {</w:t><w:t>name}</w:t>"""
		scope= {"name":"Edgar"} 
		xmlTemplater= new XmlTemplater(content,scope)
		xmlTemplater.applyTemplateVars()
		expect(xmlTemplater.getFullText()).toBe('Hello Edgar')

	# it "should work with simple Loop", ()->
	# 	content= """<w:t>Hello {#names}{name},{/names}</w:t>"""
	# 	scope= {"names":[{"name":"Edgar"},{"name":"Mary"},{"name":"John"}]} 
	# 	xmlTemplater= new XmlTemplater(content,scope)
	# 	xmlTemplater.applyTemplateVars()
	# 	expect(xmlTemplater.getFullText()).toBe('Hello Edgar,Mary,John,')

	it "should work with loop and innerContent", ()->
		content= """</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:pStyle w:val="Titre1"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRPr="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00923B77" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR="00713414"><w:t>oof</w:t></w:r><w:r><w:t xml:space="preserve">} </w:t></w:r><w:r w:rsidR="00713414"><w:t>It works because</w:t></w:r><w:r><w:t xml:space="preserve"> {</w:t></w:r><w:r w:rsidR="006F26AC"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00FD04E9" w:rsidRDefault="00923B77"><w:r><w:t> """
		scope= {"title":"Everyone uses it","proof":[{"reason":"it is quite cheap"},{"reason":"it is quit simple"},{"reason":"it works on a lot of different Hardware"}]} 
		xmlTemplater= new XmlTemplater(content,scope)
		xmlTemplater.applyTemplateVars()
		expect(xmlTemplater.getFullText()).toBe('Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware')