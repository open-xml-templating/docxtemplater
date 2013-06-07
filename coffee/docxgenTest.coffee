Object.size = (obj) ->
	size=0
	log = 0
	for key of obj
		size++
	size

window.docxCallback=[]
window.docX=[]
window.docXData=[]

loadDoc= (path,callBack,noDocx=false) ->
	docsToload++
	xhrDoc= new XMLHttpRequest()
	docxCallback[path]=callBack
	xhrDoc.open('GET', "../examples/#{path}", false)
	if xhrDoc.overrideMimeType
		xhrDoc.overrideMimeType('text/plain; charset=x-user-defined')
	xhrDoc.onreadystatechange =(e)->
		if this.readyState == 4 and this.status == 200
			window.docXData[path]=this.response
			if noDocx==false
				window.docX[path]=new DocxGen(this.response)
			docxCallback[path]()
	xhrDoc.send()

docsToload=0;

globalcallBack= ()->
	docsToload--;
	console.log "docs #{docsToload}"


loadDoc('imageExample.docx',globalcallBack)
loadDoc('image.png',globalcallBack,true)
loadDoc('tagExample.docx',globalcallBack)
loadDoc('tagExampleExpected.docx',globalcallBack)
loadDoc('tagLoopExample.docx',globalcallBack)
loadDoc('tagProduitLoop.docx',globalcallBack)
loadDoc('tagDashLoop.docx',globalcallBack)
loadDoc('tagDashLoopList.docx',globalcallBack)
loadDoc('tagDashLoopTable.docx',globalcallBack)
loadDoc('tagIntelligentLoopTable.docx',globalcallBack)
loadDoc('tagIntelligentLoopTableExpected.docx',globalcallBack)
loadDoc('tagDashLoop.docx',globalcallBack)


endTime= false

count=0

setTimeout (()-> endTime = true; console.log endTime), 5000

count=0


describe "DocxGenBasis", () ->
	it "should be defined", () ->
		expect(DocxGen).not.toBe(undefined);

	it "should construct", () ->
		a= new DocxGen();
		expect(a).not.toBe(undefined);
describe "DocxGenLoading", () ->
	#wait till this function has been called twice (once for the docx and once for the image)
	describe "ajax done correctly", () ->
		it "doc and img Data should have the expected length", () ->
			expect(docXData['imageExample.docx'].length).toEqual(729580)
			expect(docXData['image.png'].length).toEqual(18062)
		it "should have the right number of files (the docx unzipped)", ()->
			expect(Object.size(docX['imageExample.docx'].files)).toEqual(22)

	describe "basic loading", () ->
		it "should load file imageExample.docx", () ->
			expect(typeof docX['imageExample.docx']).toBe('object');
	describe "content_loading", () ->
		it "should load the right content for the footer", () ->
			fullText=(docX['imageExample.docx'].getFullText("word/footer1.xml"))
			expect(fullText.length).not.toBe(0)
			expect(fullText).toBe('{last_name}{first_name}{phone}')
		it "should load the right content for the document", () ->
			fullText=(docX['imageExample.docx'].getFullText()) #default value document.xml
			expect(fullText).toBe("")
	describe "image loading", () ->
		it "should find one image (and not more than 1)", () ->
				expect(docX['imageExample.docx'].getImageList().length).toEqual(1)
		it "should find the image named with the good name", () ->
			expect((docX['imageExample.docx'].getImageList())[0].path).toEqual('word/media/image1.jpeg')
		it "should change the image with another one", () ->
			oldImageData= docX['imageExample.docx'].files['word/media/image1.jpeg'].data
			docX['imageExample.docx'].setImage('word/media/image1.jpeg',docXData['image.png'])
			newImageData= docX['imageExample.docx'].files['word/media/image1.jpeg'].data
			expect(oldImageData).not.toEqual(newImageData)
			expect(docXData['image.png']).toEqual(newImageData)

describe "DocxGenTemplating", () ->

	describe "text templating", () ->
		it "should change values with template vars", () ->
			templateVars=
				"first_name":"Hipp"
				"last_name":"Edgar",
				"phone":"0652455478"
				"description":"New Website"
			docX['tagExample.docx'].setTemplateVars templateVars
			docX['tagExample.docx'].applyTemplateVars()
			expect(docX['tagExample.docx'].getFullText()).toEqual('Edgar Hipp')
			expect(docX['tagExample.docx'].getFullText("word/header1.xml")).toEqual('Edgar Hipp0652455478New Website')
			expect(docX['tagExample.docx'].getFullText("word/footer1.xml")).toEqual('EdgarHipp0652455478')
		it "should export the good file", () ->
			outputExpected= new DocxGen(docXData['tagExampleExpected.docx'])
			for i of docX['tagExample.docx'].files
				#Everything but the date should be different
				expect(docX['tagExample.docx'].files[i].data).toBe(docX['tagExampleExpected.docx'].files[i].data)
				expect(docX['tagExample.docx'].files[i].name).toBe(docX['tagExampleExpected.docx'].files[i].name)
				expect(docX['tagExample.docx'].files[i].options.base64).toBe(docX['tagExampleExpected.docx'].files[i].options.base64)
				expect(docX['tagExample.docx'].files[i].options.binary).toBe(docX['tagExampleExpected.docx'].files[i].options.binary)
				expect(docX['tagExample.docx'].files[i].options.compression).toBe(docX['tagExampleExpected.docx'].files[i].options.compression)
				expect(docX['tagExample.docx'].files[i].options.dir).toBe(docX['tagExampleExpected.docx'].files[i].options.dir)
				expect(docX['tagExample.docx'].files[i].options.date).not.toBe(docX['tagExampleExpected.docx'].files[i].options.date)

describe "DocxGenTemplatingForLoop", () ->

	describe "textLoop templating", () ->
		it "should replace all the tags", () ->
			templateVars =
				"nom":"Hipp"
				"prenom":"Edgar"
				"telephone":"0652455478"
				"description":"New Website"
				"offre":[{"titre":"titre1","prix":"1250"},{"titre":"titre2","prix":"2000"},{"titre":"titre3","prix":"1400"}]
			docX['tagLoopExample.docx'].setTemplateVars templateVars
			docX['tagLoopExample.docx'].applyTemplateVars()
			expect(docX['tagLoopExample.docx'].getFullText()).toEqual('Votre proposition commercialePrix: 1250Titre titre1Prix: 2000Titre titre2Prix: 1400Titre titre3HippEdgar')
			window.content= docX['tagLoopExample.docx'].files["word/document.xml"].data

		it "should work with loops inside loops", () ->
			templateVars = {"products":[{"title":"Microsoft","name":"Windows","reference":"Win7","avantages":[{"title":"Everyone uses it","proof":[{"reason":"it is quite cheap"},{"reason":"it is quit simple"},{"reason":"it works on a lot of different Hardware"}]}]},{"title":"Linux","name":"Ubuntu","reference":"Ubuntu10","avantages":[{"title":"It's very powerful","proof":[{"reason":"the terminal is your friend"},{"reason":"Hello world"},{"reason":"it's free"}]}]},{"title":"Apple","name":"Mac","reference":"OSX","avantages":[{"title":"It's very easy","proof":[{"reason":"you can do a lot just with the mouse"},{"reason":"It's nicely designed"}]}]},]}
			window.docX['tagProduitLoop.docx'].setTemplateVars templateVars
			window.docX['tagProduitLoop.docx'].applyTemplateVars()
			text= window.docX['tagProduitLoop.docx'].getFullText()
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
	it "should find the scope" , () ->	
		xmlTemplater= new XmlTemplater()
		docX['tagProduitLoop.docx']= new DocxGen(docXData['tagProduitLoop.docx'])
		scope= xmlTemplater.calcInnerTextScope docX['tagProduitLoop.docx'].files["word/document.xml"].data ,1195,1245,'w:p'
		obj= { text : """<w:p w:rsidR="00923B77" w:rsidRDefault="00923B77"><w:r><w:t>{#</w:t></w:r><w:r w:rsidR="00713414"><w:t>products</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p>""", startTag : 1134, endTag : 1286 }
		expect(scope.endTag).toEqual(obj.endTag)
		expect(scope.startTag).toEqual(obj.startTag)
		expect(scope.text.length).toEqual(obj.text.length)
		expect(scope.text).toEqual(obj.text)

describe "Dash Loop Testing", () ->

	it "dash loop ok on simple table -> w:tr" , () ->	
		templateVars=
			"os":[{"type":"linux","price":"0","reference":"Ubuntu10"},{"type":"windows","price":"500","reference":"Win7"},{"type":"apple","price":"1200","reference":"MACOSX"}]
		docX['tagDashLoop.docx'].setTemplateVars(templateVars)
		docX['tagDashLoop.docx'].applyTemplateVars()
		expectedText= "linux0Ubuntu10windows500Win7apple1200MACOSX"
		text=docX['tagDashLoop.docx'].getFullText()
		expect(text).toBe(expectedText)

	it "dash loop ok on simple table -> w:table" , () ->	
		templateVars=
			"os":[{"type":"linux","price":"0","reference":"Ubuntu10"},{"type":"windows","price":"500","reference":"Win7"},{"type":"apple","price":"1200","reference":"MACOSX"}]
		docX['tagDashLoopTable.docx'].setTemplateVars(templateVars)
		docX['tagDashLoopTable.docx'].applyTemplateVars()
		expectedText= "linux0Ubuntu10windows500Win7apple1200MACOSX"
		text=docX['tagDashLoopTable.docx'].getFullText()
		expect(text).toBe(expectedText)

	it "dash loop ok on simple list -> w:p" , () ->	
		templateVars=
			"os":[{"type":"linux","price":"0","reference":"Ubuntu10"},{"type":"windows","price":"500","reference":"Win7"},{"type":"apple","price":"1200","reference":"MACOSX"}]
		docX['tagDashLoopList.docx'].setTemplateVars(templateVars)
		docX['tagDashLoopList.docx'].applyTemplateVars()
		expectedText= 'linux 0 Ubuntu10 windows 500 Win7 apple 1200 MACOSX '
		text=docX['tagDashLoopList.docx'].getFullText()
		expect(text).toBe(expectedText)

describe "Intelligent Loop Tagging", () ->
	it "should work with tables" , () ->	
		templateVars=
			"os":[{"type":"linux","price":"0","reference":"Ubuntu10"},{"type":"windows","price":"500","reference":"Win7"},{"type":"apple","price":"1200","reference":"MACOSX"}]
		docX['tagIntelligentLoopTable.docx'].setTemplateVars(templateVars)
		docX['tagIntelligentLoopTable.docx'].applyTemplateVars()
		expectedText= 'linux0Ubuntu10windows500Win7apple1200MACOSX'
		text=docX['tagIntelligentLoopTableExpected.docx'].getFullText()
		expect(text).toBe(expectedText)

		for i of docX['tagIntelligentLoopTableExpected.docx'].files
			#Everything but the date should be different
			# if docX['tagIntelligentLoopTable.docx'].files[i].data!=docX['tagIntelligentLoopTableExpected.docx'].files[i].data
			# 	a= docX['tagIntelligentLoopTable.docx'].files[i].data
			# 	b=docX['tagIntelligentLoopTableExpected.docx'].files[i].data
			# 	console.log a
			# 	console.log b
			# 	for char,j in docX['tagIntelligentLoopTable.docx'].files[i].data when j<2000
			# 		a= docX['tagIntelligentLoopTable.docx'].files[i].data[j]
			# 		b=docX['tagIntelligentLoopTableExpected.docx'].files[i].data[j]
			# 		if a!=b then console.log "#{a}+#{b}+#{j}"
			
			expect(docX['tagIntelligentLoopTable.docx'].files[i].data).toBe(docX['tagIntelligentLoopTableExpected.docx'].files[i].data)
			expect(docX['tagIntelligentLoopTable.docx'].files[i].name).toBe(docX['tagIntelligentLoopTableExpected.docx'].files[i].name)
			expect(docX['tagIntelligentLoopTable.docx'].files[i].options.base64).toBe(docX['tagIntelligentLoopTableExpected.docx'].files[i].options.base64)
			expect(docX['tagIntelligentLoopTable.docx'].files[i].options.binary).toBe(docX['tagIntelligentLoopTableExpected.docx'].files[i].options.binary)
			expect(docX['tagIntelligentLoopTable.docx'].files[i].options.compression).toBe(docX['tagIntelligentLoopTableExpected.docx'].files[i].options.compression)
			expect(docX['tagIntelligentLoopTable.docx'].files[i].options.dir).toBe(docX['tagIntelligentLoopTableExpected.docx'].files[i].options.dir)
			expect(docX['tagIntelligentLoopTable.docx'].files[i].options.date).not.toBe(docX['tagIntelligentLoopTableExpected.docx'].files[i].options.date)

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