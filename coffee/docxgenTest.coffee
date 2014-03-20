root= global ? window
env= if global? then 'node' else 'browser'

root.docX={}
root.docXData={}

if env=='node'
	root.DocxGen= require(__dirname+'/../../js/docxgen.js')

DocUtils.pathConfig=
	"node":'../../examples/'
	"browser":'../examples/'

fileNames=["imageExample.docx","tagExample.docx","tagExampleExpected.docx","tagLoopExample.docx","tagExampleExpected.docx","tagLoopExampleImageExpected.docx","tagProduitLoop.docx","tagDashLoop.docx","tagDashLoopList.docx","tagDashLoopTable.docx",'tagDashLoop.docx','qrCodeExample.docx','qrCodeExampleExpected.docx','qrCodeTaggingExample.docx','qrCodeTaggingExampleExpected.docx','qrCodeTaggingLoopExample.docx','qrCodeTaggingLoopExampleExpected.docx','tagIntelligentLoopTableExpected.docx','cyrillic.docx','tableComplex2Example.docx','tableComplexExample.docx','tableComplex3Example.docx']

for name in fileNames
	root.docX[name]=new DocxGen().loadFromFile(name)

root.docX["tagExampleWithParser"]=new DocxGen().loadFromFile("tagExample.docx")

DocUtils.loadDoc('tagIntelligentLoopTable.docx',{intelligentTagging:true})
DocUtils.loadDoc('image.png',{docx:false})
DocUtils.loadDoc('bootstrap_logo.png',{docx:false})
DocUtils.loadDoc('BMW_logo.png',{docx:false})
DocUtils.loadDoc('Firefox_logo.png',{docx:false})
DocUtils.loadDoc('Volkswagen_logo.png',{docx:false})
DocUtils.loadDoc('qrcodeTest.zip',{docx:false})

describe "DocxGenBasis", () ->
	it "should be defined", () ->
		expect(DocxGen).not.toBe(undefined)
	it "should construct", () ->
		a= new DocxGen()
		expect(a).not.toBe(undefined)

describe "DocxGenLoading", () ->
	describe "ajax done correctly", () ->
		it "doc and img Data should have the expected length", () ->
			expect(docX['imageExample.docx'].loadedContent.length).toEqual(729580)
			expect(docXData['image.png'].length).toEqual(18062)
		it "should have the right number of files (the docx unzipped)", ()->
			docX['imageExample.docx']=new DocxGen(docX['imageExample.docx'].loadedContent)
			expect(DocUtils.sizeOfObject(docX['imageExample.docx'].zip.files)).toEqual(22)
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
			oldImageData= docX['imageExample.docx'].zip.files['word/media/image1.jpeg'].asText()
			docX['imageExample.docx'].setImage('word/media/image1.jpeg',docXData['image.png'],{binary:false})
			newImageData= docX['imageExample.docx'].zip.files['word/media/image1.jpeg'].asText()
			expect(oldImageData).not.toEqual(newImageData)
			expect(docXData['image.png']).toEqual(newImageData)
	describe "output and input", () ->
		it "should be the same" , () ->
			doc=new DocxGen(root.docX['tagExample.docx'].loadedContent)
			output=doc.output(false)
			expect(output.length).toEqual(91348)
			expect(output.substr(0,50)).toEqual('UEsDBAoAAAAAAAAAIQAMTxYSlgcAAJYHAAATAAAAW0NvbnRlbn')

describe "DocxGenTemplating", () ->
	describe "text templating", () ->
		it "should change values with template vars", () ->
			Tags=
				"first_name":"Hipp"
				"last_name":"Edgar",
				"phone":"0652455478"
				"description":"New Website"
			docX['tagExample.docx'].setTags Tags
			docX['tagExample.docx'].applyTags()
			expect(docX['tagExample.docx'].getFullText()).toEqual('Edgar Hipp')
			expect(docX['tagExample.docx'].getFullText("word/header1.xml")).toEqual('Edgar Hipp0652455478New Website')
			expect(docX['tagExample.docx'].getFullText("word/footer1.xml")).toEqual('EdgarHipp0652455478')
		it "should export the good file", () ->
			for i of docX['tagExample.docx'].zip.files
				#Everything but the date should be different
				expect(docX['tagExample.docx'].zip.files[i].options.date).not.toBe(docX['tagExampleExpected.docx'].zip.files[i].options.date)
				expect(docX['tagExample.docx'].zip.files[i].name).toBe(docX['tagExampleExpected.docx'].zip.files[i].name)
				#expect(docX['tagExample.docx'].zip.files[i].options.base64).toBe(docX['tagExampleExpected.docx'].zip.files[i].options.base64)
				#expect(docX['tagExample.docx'].zip.files[i].options.binary).toBe(docX['tagExampleExpected.docx'].zip.files[i].options.binary)
				#expect(docX['tagExample.docx'].zip.files[i].options.compression).toBe(docX['tagExampleExpected.docx'].zip.files[i].options.compression)
				expect(docX['tagExample.docx'].zip.files[i].options.dir).toBe(docX['tagExampleExpected.docx'].zip.files[i].options.dir)
				expect(docX['tagExample.docx'].zip.files[i].asText()).toBe(docX['tagExampleExpected.docx'].zip.files[i].asText())

describe "DocxGenTemplatingForLoop", () ->
	describe "textLoop templating", () ->
		it "should replace all the tags", () ->
			Tags =
				"nom":"Hipp"
				"prenom":"Edgar"
				"telephone":"0652455478"
				"description":"New Website"
				"offre":[{"titre":"titre1","prix":"1250"},{"titre":"titre2","prix":"2000"},{"titre":"titre3","prix":"1400"}]
			docX['tagLoopExample.docx'].setTags Tags
			docX['tagLoopExample.docx'].applyTags()
			expect(docX['tagLoopExample.docx'].getFullText()).toEqual('Votre proposition commercialePrix: 1250Titre titre1Prix: 2000Titre titre2Prix: 1400Titre titre3HippEdgar')
		it "should work with loops inside loops", () ->
			Tags = {"products":[{"title":"Microsoft","name":"DOS","reference":"Win7","avantages":[{"title":"Everyone uses it","proof":[{"reason":"it is quite cheap"},{"reason":"it is quit simple"},{"reason":"it works on a lot of different Hardware"}]}]},{"title":"Linux","name":"Ubuntu","reference":"Ubuntu10","avantages":[{"title":"It's very powerful","proof":[{"reason":"the terminal is your friend"},{"reason":"Hello world"},{"reason":"it's free"}]}]},{"title":"Apple","name":"Mac","reference":"OSX","avantages":[{"title":"It's very easy","proof":[{"reason":"you can do a lot just with the mouse"},{"reason":"It's nicely designed"}]}]},]}
			docX['tagProduitLoop.docx'].setTags Tags
			docX['tagProduitLoop.docx'].applyTags()
			text= docX['tagProduitLoop.docx'].getFullText()
			expectedText= "MicrosoftProduct name : DOSProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed"
			expect(text.length).toEqual(expectedText.length)
			expect(text).toEqual(expectedText)
describe "Xml Util" , () ->
	xmlUtil= new XmlUtil()
	it "should compute the scope between 2 <w:t>" , () ->
		scope= xmlUtil.getListXmlElements """undefined</w:t></w:r></w:p><w:p w:rsidP="008A4B3C" w:rsidR="007929C1" w:rsidRDefault="007929C1" w:rsidRPr="008A4B3C"><w:pPr><w:pStyle w:val="Sous-titre"/></w:pPr><w:r w:rsidRPr="008A4B3C"><w:t xml:space="preserve">Audit réalisé le """
		expect(scope).toEqual([ { tag : '</w:t>', offset : 9 }, { tag : '</w:r>', offset : 15 }, { tag : '</w:p>', offset : 21 }, { tag : '<w:p>', offset : 27 }, { tag : '<w:r>', offset : 162 }, { tag : '<w:t>', offset : 188 } ])
	it "should compute the scope between 2 <w:t> in an Array", () ->
		scope= xmlUtil.getListXmlElements """urs</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type="dxa" w:w="4140"/></w:tcPr><w:p w:rsidP="00CE524B" w:rsidR="00CE524B" w:rsidRDefault="00CE524B"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="auto"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="auto"/></w:rPr><w:t>Sur exté"""
		expect(scope).toEqual([ { tag : '</w:t>', offset : 3 }, { tag : '</w:r>', offset : 9 }, { tag : '</w:p>', offset : 15 }, { tag : '</w:tc>', offset : 21 }, { tag : '<w:tc>', offset : 28 }, { tag : '<w:p>', offset : 83 }, { tag : '<w:r>', offset : 268 }, { tag : '<w:t>', offset : 374 } ])
	it 'should compute the scope between a w:t in an array and the other outside', () ->
		scope= xmlUtil.getListXmlElements """defined </w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p w:rsidP="00CA7135" w:rsidR="00BE3585" w:rsidRDefault="00BE3585"/><w:p w:rsidP="00CA7135" w:rsidR="00BE3585" w:rsidRDefault="00BE3585"/><w:p w:rsidP="00CA7135" w:rsidR="00137C91" w:rsidRDefault="00137C91"><w:r w:rsidRPr="00B12C70"><w:rPr><w:bCs/></w:rPr><w:t>Coût ressources """
		expect(scope).toEqual([ { tag : '</w:t>', offset : 8 }, { tag : '</w:r>', offset : 14 }, { tag : '</w:p>', offset : 20 }, { tag : '</w:tc>', offset : 26 }, { tag : '</w:tr>', offset : 33 }, { tag : '</w:tbl>', offset : 40 }, { tag : '<w:p>', offset : 188 }, { tag : '<w:r>', offset : 257 }, { tag : '<w:t>', offset : 306 } ])

describe "scope diff calculation", () ->
	xmlUtil= new XmlUtil()
	it "should compute the scopeDiff between 2 <w:t>" , () ->
		scope= xmlUtil.getListDifferenceXmlElements """undefined</w:t></w:r></w:p><w:p w:rsidP="008A4B3C" w:rsidR="007929C1" w:rsidRDefault="007929C1" w:rsidRPr="008A4B3C"><w:pPr><w:pStyle w:val="Sous-titre"/></w:pPr><w:r w:rsidRPr="008A4B3C"><w:t xml:space="preserve">Audit réalisé le """
		expect(scope).toEqual([])
	it "should compute the scopeDiff between 2 <w:t> in an Array", () ->
		scope= xmlUtil.getListDifferenceXmlElements """urs</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type="dxa" w:w="4140"/></w:tcPr><w:p w:rsidP="00CE524B" w:rsidR="00CE524B" w:rsidRDefault="00CE524B"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="auto"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="auto"/></w:rPr><w:t>Sur exté"""
		expect(scope).toEqual([])
	it 'should compute the scopeDiff between a w:t in an array and the other outside', () ->
		scope= xmlUtil.getListDifferenceXmlElements """defined </w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p w:rsidP="00CA7135" w:rsidR="00BE3585" w:rsidRDefault="00BE3585"/><w:p w:rsidP="00CA7135" w:rsidR="00BE3585" w:rsidRDefault="00BE3585"/><w:p w:rsidP="00CA7135" w:rsidR="00137C91" w:rsidRDefault="00137C91"><w:r w:rsidRPr="00B12C70"><w:rPr><w:bCs/></w:rPr><w:t>Coût ressources """
		expect(scope).toEqual([ { tag : '</w:tc>', offset : 26 }, { tag : '</w:tr>', offset : 33 }, { tag : '</w:tbl>', offset : 40 } ])

describe "scope inner text", () ->
	it "should find the scope" , () ->
		xmlTemplater= new DocXTemplater()
		docX['tagProduitLoop.docx'].load(docX['tagProduitLoop.docx'].loadedContent)
		scope= xmlTemplater.calcOuterXml docX['tagProduitLoop.docx'].zip.files["word/document.xml"].asText() ,1195,1245,'w:p'
		obj= { text : """<w:p w:rsidR="00923B77" w:rsidRDefault="00923B77"><w:r><w:t>{#</w:t></w:r><w:r w:rsidR="00713414"><w:t>products</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p>""", startTag : 1134, endTag : 1286 }
		expect(scope.endTag).toEqual(obj.endTag)
		expect(scope.startTag).toEqual(obj.startTag)
		expect(scope.text.length).toEqual(obj.text.length)
		expect(scope.text).toEqual(obj.text)

describe "Dash Loop Testing", () ->
	it "dash loop ok on simple table -> w:tr" , () ->
		Tags=
			"os":[{"type":"linux","price":"0","reference":"Ubuntu10"},{"type":"DOS","price":"500","reference":"Win7"},{"type":"apple","price":"1200","reference":"MACOSX"}]
		docX['tagDashLoop.docx'].setTags(Tags)
		docX['tagDashLoop.docx'].applyTags()
		expectedText= "linux0Ubuntu10DOS500Win7apple1200MACOSX"
		text=docX['tagDashLoop.docx'].getFullText()
		expect(text).toBe(expectedText)
	it "dash loop ok on simple table -> w:table" , () ->
		Tags=
			"os":[{"type":"linux","price":"0","reference":"Ubuntu10"},{"type":"DOS","price":"500","reference":"Win7"},{"type":"apple","price":"1200","reference":"MACOSX"}]
		docX['tagDashLoopTable.docx'].setTags(Tags)
		docX['tagDashLoopTable.docx'].applyTags()
		expectedText= "linux0Ubuntu10DOS500Win7apple1200MACOSX"
		text=docX['tagDashLoopTable.docx'].getFullText()
		expect(text).toBe(expectedText)
	it "dash loop ok on simple list -> w:p" , () ->
		Tags=
			"os":[{"type":"linux","price":"0","reference":"Ubuntu10"},{"type":"DOS","price":"500","reference":"Win7"},{"type":"apple","price":"1200","reference":"MACOSX"}]
		docX['tagDashLoopList.docx'].setTags(Tags)
		docX['tagDashLoopList.docx'].applyTags()
		expectedText= 'linux 0 Ubuntu10 DOS 500 Win7 apple 1200 MACOSX '
		text=docX['tagDashLoopList.docx'].getFullText()
		expect(text).toBe(expectedText)

describe "Intelligent Loop Tagging", () ->
	it "should work with tables" , () ->
		Tags={clients:[{first_name:"John",last_name:"Doe",phone:"+33647874513"},{first_name:"Jane",last_name:"Doe",phone:"+33454540124"},{first_name:"Phil",last_name:"Kiel",phone:"+44578451245"},{first_name:"Dave",last_name:"Sto",phone:"+44548787984"}]}
		docX['tagIntelligentLoopTable.docx'].setTags(Tags)
		docX['tagIntelligentLoopTable.docx'].applyTags()
		expectedText= 'JohnDoe+33647874513JaneDoe+33454540124PhilKiel+44578451245DaveSto+44548787984'
		text= docX['tagIntelligentLoopTableExpected.docx'].getFullText()
		expect(text).toBe(expectedText)
		for i of docX['tagIntelligentLoopTable.docx'].zip.files
			# Everything but the date should be different
			expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].asText()).toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].asText())
			expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].name).toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].name)
			#expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].options.base64).toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].options.base64)
			#expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].options.binary).toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].options.binary)
			#expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].options.compression).toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].options.compression)
			expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].options.dir).toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].options.dir)
			expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].options.date).not.toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].options.date)

describe "getTags", () ->
	it "should work with simple document", () ->
		docX['tagExample.docx']=new DocxGen docX['tagExample.docx'].loadedContent,{},{intelligentTagging:off}
		tempVars= docX['tagExample.docx'].getTags()
		expect(tempVars).toEqual([ { fileName : 'word/document.xml', vars : { last_name : true, first_name : true } }, { fileName : 'word/footer1.xml', vars : { last_name : true, first_name : true, phone : true } }, { fileName : 'word/header1.xml', vars : { last_name : true, first_name : true, phone : true, description : true } }])
	it "should work with loop document", () ->
		docX['tagLoopExample.docx']=new DocxGen docX['tagLoopExample.docx'].loadedContent,{},{intelligentTagging:off}
		tempVars= docX['tagLoopExample.docx'].getTags()
		expect(tempVars).toEqual([ { fileName : 'word/document.xml', vars : { offre : { prix : true, titre : true }, nom : true, prenom : true } }, { fileName : 'word/footer1.xml', vars : { nom : true, prenom : true, telephone : true } }, { fileName : 'word/header1.xml', vars : { nom : true, prenom : true } } ])
	it 'should work if there are no Tags', () ->
		docX['qrCodeExample.docx']=new DocxGen docX['qrCodeExample.docx'].loadedContent,{},{intelligentTagging:off}
		tempVars= docX['qrCodeExample.docx'].getTags()
		expect(tempVars).toEqual([])



describe "xmlTemplater", ()->
	it "should work with simpleContent", ()->
		content= """<w:t>Hello {name}</w:t>"""
		scope= {"name":"Edgar"}
		xmlTemplater= new DocXTemplater(content,{Tags:scope})
		xmlTemplater.applyTags()
		expect(xmlTemplater.getFullText()).toBe('Hello Edgar')

	it "should work with non w:t content", ()->
		content= """{image}.png"""
		scope= {"image":"edgar"}
		xmlTemplater= new DocXTemplater(content,{Tags:scope})
		xmlTemplater.applyTags()
		expect(xmlTemplater.content).toBe('edgar.png')
	it "should work with tag in two elements", ()->
		content= """<w:t>Hello {</w:t><w:t>name}</w:t>"""
		scope= {"name":"Edgar"}
		xmlTemplater= new DocXTemplater(content,{Tags:scope})
		xmlTemplater.applyTags()
		expect(xmlTemplater.getFullText()).toBe('Hello Edgar')
	it "should work with simple Loop", ()->
		content= """<w:t>Hello {#names}{name},{/names}</w:t>"""
		scope= {"names":[{"name":"Edgar"},{"name":"Mary"},{"name":"John"}]}
		xmlTemplater= new DocXTemplater(content,{Tags:scope})
		xmlTemplater.applyTags()
		expect(xmlTemplater.getFullText()).toBe('Hello Edgar,Mary,John,')
	it "should work with simple Loop with boolean value", ()->
		content= """<w:t>Hello {#showName}{name},{/showName}</w:t>"""
		scope= {"showName":true,"name":"Edgar"}
		xmlTemplater= new DocXTemplater(content,{Tags:scope})
		xmlTemplater.applyTags()

		scope= {"showName":false,"name":"Edgar"}
		xmlTemplater= new DocXTemplater(content,{Tags:scope})
		xmlTemplater.applyTags()
		expect(xmlTemplater.getFullText()).toBe('Hello ')
	it "should work with dash Loop", ()->
		content= """<w:p><w:t>Hello {-w:p names}{name},{/names}</w:t></w:p>"""
		scope= {"names":[{"name":"Edgar"},{"name":"Mary"},{"name":"John"}]}
		xmlTemplater= new DocXTemplater(content,{Tags:scope})
		xmlTemplater.applyTags()
		expect(xmlTemplater.getFullText()).toBe('Hello Edgar,Hello Mary,Hello John,')
	it "should work with loop and innerContent", ()->
		content= """</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:pStyle w:val="Titre1"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRPr="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00923B77" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR="00713414"><w:t>oof</w:t></w:r><w:r><w:t xml:space="preserve">} </w:t></w:r><w:r w:rsidR="00713414"><w:t>It works because</w:t></w:r><w:r><w:t xml:space="preserve"> {</w:t></w:r><w:r w:rsidR="006F26AC"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00FD04E9" w:rsidRDefault="00923B77"><w:r><w:t>"""
		scope= {"title":"Everyone uses it","proof":[{"reason":"it is quite cheap"},{"reason":"it is quit simple"},{"reason":"it works on a lot of different Hardware"}]}
		xmlTemplater= new DocXTemplater(content,{Tags:scope})
		xmlTemplater.applyTags()
		expect(xmlTemplater.getFullText()).toBe('Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware')
	it "should work with loop and innerContent (with last)", ()->
		content= """</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:pStyle w:val="Titre1"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRPr="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00923B77" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR="00713414"><w:t>oof</w:t></w:r><w:r><w:t xml:space="preserve">} </w:t></w:r><w:r w:rsidR="00713414"><w:t>It works because</w:t></w:r><w:r><w:t xml:space="preserve"> {</w:t></w:r><w:r w:rsidR="006F26AC"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00FD04E9" w:rsidRDefault="00923B77"><w:r><w:t> """
		scope= {"title":"Everyone uses it","proof":[{"reason":"it is quite cheap"},{"reason":"it is quit simple"},{"reason":"it works on a lot of different Hardware"}]}
		xmlTemplater= new DocXTemplater(content,{Tags:scope})
		xmlTemplater.applyTags()
		expect(xmlTemplater.getFullText()).toBe('Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware')
	it 'should work with not w:t tag (if the for loop is like {#forloop} text {/forloop}) ', ()->
		content= """Hello {#names}{name},{/names}"""
		scope= {"names":[{"name":"Edgar"},{"name":"Mary"},{"name":"John"}]}
		xmlTemplater= new DocXTemplater(content,{Tags:scope})
		xmlTemplater.applyTags()
		expect(xmlTemplater.content).toBe('Hello Edgar,Mary,John,')


describe 'DocxQrCode module', () ->

	describe "Calculate simple Docx", () ->
		f=null; fCalled=null;qrcodezip=null;obj=null;
		beforeEach () ->
			qrcodezip= new JSZip(docXData['qrcodeTest.zip'])
			docx= new DocxGen()
			obj= new DocXTemplater("",{DocxGen:docx,Tags:{Tag:"tagValue"}})

		it "should do it's thing with JSZip.base64", () ->
			data=qrcodezip.files['blabla.png'].asText()
			base64data=JSZip.base64.encode(data)
			expect(base64data.length).toBe(624)
			expect(base64data.substr(0,50)).toBe("kcNChoKAAAADUlIRFIAAAAAIAAABOAAAAAZ0Uk5TAEAA07AAAE")
			expect(base64data).toBe("kcNChoKAAAADUlIRFIAAAAAIAAABOAAAAAZ0Uk5TAEAA07AAAEURBVHdQkUQ/RQDIg7ON9jXTF4flff17B0EYJEDoJQidBDPcfG30PMH+N1VJTkQOglCJ0Icn0rPTxJEDoJQidB0Egj89PenQhBCVg2Rk9c5RA6CUInQhBOPm8gdBCRA6CUInQfN3dBB0EYJEDoJQidheKSkkC0EYJEDoJs9P141dBB0EYJEDoJQidhm2fVzZlnQhBCRuRTcye633fQSkQOglCJ0IXX6KdHB0WEDoJQidB0Ec/dX/teYY/Tyc6CUInQhBCcv/Xic6CUInQhBCm/f+FP0EYJEDoJQidB9Fnvc1hBCRA6CWve0IQSkYWk3HuPcB0EYJEDoJQidBUcez9HP3fPE0EYJEDoJQidhOEc/p53vf6/PcB0EYJEDoJQidBHfhd8VPWfP59dBJEDoJQidBsH31kpVfkQOglCJ0I0fl1axBA6CUInQhBjn/mHdidB0EJwHPOXVPiAhBCRA6Cf3Xc/8n0EJ0IQSlYNkzedHd+Nfx9xHQSkQOglCJ08+H9QSRA6CUInQh+pnQhBCd/fUcMRdCJ0IQSnAfHhBCRA6CUIn0wsvkAAAAASUVORA")

		it "should work with Blablalalabioeajbiojbepbroji", () ->
			runs () ->
				fCalled= false
				f= {test:() -> fCalled= true}
				spyOn(f,'test').andCallThrough()
				if env=='browser'
					qr=new DocxQrCode(qrcodezip.files['blabla.png'].asBinary(),obj,"custom.png",6)
					qr.decode(f.test)
				else
					base64= JSZip.base64.encode qrcodezip.files['blabla.png'].asBinary()
					binaryData = new Buffer(base64, 'base64') #.toString('binary');
					png= new PNG(binaryData)
					finished= (a) ->
						png.decoded= a
						qr= new DocxQrCode(png,obj,"custom.png",6)
						qr.decode(f.test)
					dat= png.decode(finished)

			waitsFor( ()->fCalled)

			runs () ->
				expect(f.test).toHaveBeenCalled()
				expect(f.test.calls.length).toEqual(1)
				expect(f.test.mostRecentCall.args[0].result).toEqual("Blablalalabioeajbiojbepbroji")
				expect(f.test.mostRecentCall.args[1]).toEqual("custom.png")
				expect(f.test.mostRecentCall.args[2]).toEqual(6)

		it "should work with long texts", () ->

			runs () ->
				fCalled= false
				f= {test:() -> fCalled= true}
				spyOn(f,'test').andCallThrough()
				if env=='browser'
					qr=new DocxQrCode(qrcodezip.files['custom.png'].asBinary(),obj,"custom.png",6)
					qr.decode(f.test)
				else
					base64= JSZip.base64.encode qrcodezip.files['custom.png'].asBinary()
					binaryData = new Buffer(base64, 'base64') #.toString('binary');
					png= new PNG(binaryData)
					finished= (a) ->
						png.decoded= a
						qr= new DocxQrCode(png,obj,"custom.png",6)
						qr.decode(f.test)
					dat= png.decode(finished)

			waitsFor( ()->fCalled)


			runs () ->
				expect(f.test).toHaveBeenCalled();
				expect(f.test.calls.length).toEqual(1);
				expect(f.test.mostRecentCall.args[0].result).toEqual("Some custom text");
				expect(f.test.mostRecentCall.args[1]).toEqual("custom.png");
				expect(f.test.mostRecentCall.args[2]).toEqual(6);


		it "should work with basic image", () ->
			runs () ->
				fCalled= false
				f= {test:() -> fCalled= true}
				spyOn(f,'test').andCallThrough()
				if env=='browser'
					qr=new DocxQrCode(qrcodezip.files['qrcodeTest.png'].asBinary(),obj,"qrcodeTest.png",4)
					qr.decode(f.test)
				else
					base64= JSZip.base64.encode qrcodezip.files['qrcodeTest.png'].asBinary()
					binaryData = new Buffer(base64, 'base64') #.toString('binary');
					png= new PNG(binaryData)
					finished= (a) ->
						png.decoded= a
						qr= new DocxQrCode(png,obj,"qrcodeTest.png",4)
						qr.decode(f.test)
					dat= png.decode(finished)

			waitsFor( ()->fCalled)

			runs () ->
				expect(f.test).toHaveBeenCalled();
				expect(f.test.calls.length).toEqual(1);
				expect(f.test.mostRecentCall.args[0].result).toEqual("test");
				expect(f.test.mostRecentCall.args[1]).toEqual("qrcodeTest.png");
				expect(f.test.mostRecentCall.args[2]).toEqual(4);

		it "should work with image with {tags}", () ->

			runs () ->
				fCalled= false
				f= {test:() -> fCalled= true}
				spyOn(f,'test').andCallThrough()
				if env=='browser'
					qr=new DocxQrCode(qrcodezip.files['qrcodetag.png'].asBinary(),obj,"tag.png",2)
					qr.decode(f.test)
				else
					base64= JSZip.base64.encode qrcodezip.files['qrcodetag.png'].asBinary()
					binaryData = new Buffer(base64, 'base64') #.toString('binary');
					png= new PNG(binaryData)
					finished= (a) ->
						png.decoded= a
						qr= new DocxQrCode(png,obj,"tag.png",2)
						qr.decode(f.test)
					dat= png.decode(finished)

			waitsFor( ()->fCalled)

			runs () ->
				expect(f.test).toHaveBeenCalled();
				expect(f.test.calls.length).toEqual(1);
				expect(f.test.mostRecentCall.args[0].result).toEqual("tagValue");
				expect(f.test.mostRecentCall.args[1]).toEqual("tag.png");
				expect(f.test.mostRecentCall.args[2]).toEqual(2);



describe "image Loop Replacing", () ->
	describe 'rels', () ->
		it 'should load', () ->
			expect(docX['imageExample.docx'].imgManager.loadImageRels().imageRels).toEqual([])
			expect(docX['imageExample.docx'].imgManager.maxRid).toEqual(10)
		it 'should add', () ->
			oldData= docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].asText()
			expect(docX['imageExample.docx'].imgManager.addImageRels('image1.png',docXData['bootstrap_logo.png'])).toBe(11)

			expect(docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].asText()).not.toBe(oldData)

			# expect(docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].asText()).toBe('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/><Relationship Id="rId2" Type="http://schemas.microsoft.com/office/2007/relationships/stylesWithEffects" Target="stylesWithEffects.xml"/><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes" Target="endnotes.xml"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/><Relationship Id="rId10" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings" Target="webSettings.xml"/><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rId11" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/></Relationships>')
			# expect(docX['imageExample.docx'].zip.files['[Content_Types].xml'].asText()).toBe('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/stylesWithEffects.xml" ContentType="application/vnd.ms-word.stylesWithEffects+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/webSettings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml"/><Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/><Override PartName="/word/endnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/><Override PartName="/word/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Default ContentType="image/png" Extension="png"/></Types>')
			# if docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].asText()!='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/><Relationship Id="rId2" Type="http://schemas.microsoft.com/office/2007/relationships/stylesWithEffects" Target="stylesWithEffects.xml"/><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes" Target="endnotes.xml"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/><Relationship Id="rId10" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings" Target="webSettings.xml"/><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rId11" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/></Relationships>'
			# 	for char,j in docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].asText()
			# 		char2= '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/><Relationship Id="rId2" Type="http://schemas.microsoft.com/office/2007/relationships/stylesWithEffects" Target="stylesWithEffects.xml"/><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes" Target="endnotes.xml"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/><Relationship Id="rId10" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings" Target="webSettings.xml"/><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rId11" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/></Relationships>'[j]

			relsData = docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].asText()
			contentTypeData = docX['imageExample.docx'].zip.files['[Content_Types].xml'].asText()

			relsXml= DocUtils.Str2xml(relsData)
			contentTypeXml= DocUtils.Str2xml(contentTypeData)

			relationships= relsXml.getElementsByTagName('Relationship')
			contentTypes= contentTypeXml.getElementsByTagName('Default')

			expect(relationships.length).toEqual(11)
			expect(contentTypes.length).toBe(4)


describe "loop forTagging images", () ->
	it 'should work with a simple loop file', () ->
		docX['tagLoopExample.docx']= new DocxGen(docX['tagLoopExample.docx'].loadedContent)
		tempVars=
			"nom":"Hipp"
			"prenom":"Edgar"
			"telephone":"0652455478"
			"description":"New Website"
			"offre":[
				"titre":"titre1"
				"prix":"1250"
				"img":[{data:docXData['Volkswagen_logo.png'],name:"vw_logo.png"}]
			,
				"titre":"titre2"
				"prix":"2000"
				"img":[{data:docXData['BMW_logo.png'],name:"bmw_logo.png"}]
			,
				"titre":"titre3"
				"prix":"1400"
				"img":[{data:docXData['Firefox_logo.png'],name:"firefox_logo.png"}]
			]
		docX['tagLoopExample.docx'].setTags(tempVars)
		docX['tagLoopExample.docx'].applyTags()

		for i of docX['tagLoopExample.docx'].zip.files
		# 	#Everything but the date should be different
			expect(docX['tagLoopExample.docx'].zip.files[i].options.date).not.toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.date)
			expect(docX['tagLoopExample.docx'].zip.files[i].name).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].name)
			#expect(docX['tagLoopExample.docx'].zip.files[i].options.base64).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.base64)
			#expect(docX['tagLoopExample.docx'].zip.files[i].options.binary).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.binary)
			#expect(docX['tagLoopExample.docx'].zip.files[i].options.compression).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.compression)
			expect(docX['tagLoopExample.docx'].zip.files[i].options.dir).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.dir)

			if i!='word/_rels/document.xml.rels' and i!='[Content_Types].xml'
				if env=='browser' or i!="word/document.xml" #document.xml is not the same on node, so we don't test the data
					if docX['tagLoopExample.docx'].zip.files[i].asText()?0
						expect(docX['tagLoopExample.docx'].zip.files[i].asText().length).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].asText().length)
					expect(docX['tagLoopExample.docx'].zip.files[i].asText()).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].asText())

		relsData = docX['tagLoopExample.docx'].zip.files['word/_rels/document.xml.rels'].asText()
		contentTypeData = docX['tagLoopExample.docx'].zip.files['[Content_Types].xml'].asText()

		relsXml= DocUtils.Str2xml(relsData)
		contentTypeXml= DocUtils.Str2xml(contentTypeData)

		relationships= relsXml.getElementsByTagName('Relationship')
		contentTypes= contentTypeXml.getElementsByTagName('Default')

		expect(relationships.length).toEqual(16)
		expect(contentTypes.length).toBe(3)

describe 'qr code testing', () ->
	it 'should work with local QRCODE without tags', () ->
		docX['qrCodeExample.docx']=new DocxGen(docX['qrCodeExample.docx'].loadedContent,{},{intelligentTagging:off,qrCode:true})
		endcallback= () -> 1
		docX['qrCodeExample.docx'].applyTags({},endcallback)

		waitsFor () -> docX['qrCodeExample.docx'].ready?

		runs () ->

			expect(docX['qrCodeExample.docx'].zip.files['word/media/Copie_0.png']?).toBeTruthy()
			for i of docX['qrCodeExample.docx'].zip.files
			# 	#Everything but the date should be different
				expect(docX['qrCodeExample.docx'].zip.files[i].options.date).not.toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].options.date)
				expect(docX['qrCodeExample.docx'].zip.files[i].name).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].name)
				#expect(docX['qrCodeExample.docx'].zip.files[i].options.base64).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].options.base64)
				#expect(docX['qrCodeExample.docx'].zip.files[i].options.binary).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].options.binary)
				#expect(docX['qrCodeExample.docx'].zip.files[i].options.compression).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].options.compression)
				expect(docX['qrCodeExample.docx'].zip.files[i].options.dir).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].options.dir)
				# if (docX['qrCodeExample.docx'].zip.files[i].asText())!=null
				# 	expect(docX['qrCodeExample.docx'].zip.files[i].asText().length).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].asText().length)
				# expect(docX['qrCodeExample.docx'].zip.files[i].asText()).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].asText())

	it 'should work with local QRCODE with {tags}', () ->
		docX['qrCodeTaggingExample.docx']=new DocxGen(docX['qrCodeTaggingExample.docx'].loadedContent,{'image':'Firefox_logo'},{intelligentTagging:off,qrCode:true})
		endcallback= () -> 1
		docX['qrCodeTaggingExample.docx'].applyTags({'image':'Firefox_logo'},endcallback)

		waitsFor () -> docX['qrCodeTaggingExample.docx'].ready?

		runs () ->
			expect(docX['qrCodeTaggingExample.docx'].zip.files['word/media/Copie_0.png']?).toBeTruthy()
			for i of docX['qrCodeTaggingExample.docx'].zip.files
			# 	#Everything but the date should be different
				expect(docX['qrCodeTaggingExample.docx'].zip.files[i].options.date).not.toBe(docX['qrCodeTaggingExampleExpected.docx'].zip.files[i].options.date)
				expect(docX['qrCodeTaggingExample.docx'].zip.files[i].name).toBe(docX['qrCodeTaggingExampleExpected.docx'].zip.files[i].name)
				expect(docX['qrCodeTaggingExample.docx'].zip.files[i].options.dir).toBe(docX['qrCodeTaggingExampleExpected.docx'].zip.files[i].options.dir)

				if (docX['qrCodeTaggingExample.docx'].zip.files[i].asText())!=null and i!="word/document.xml"
					expect(docX['qrCodeTaggingExample.docx'].zip.files[i].asText().length).toBe(docX['qrCodeTaggingExampleExpected.docx'].zip.files[i].asText().length)
					expect(docX['qrCodeExample.docx'].zip.files[i].asText()).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].asText())

	it 'should work with loop QRCODE with {tags}', () ->
		docX['qrCodeTaggingLoopExample.docx']=new DocxGen(docX['qrCodeTaggingLoopExample.docx'].loadedContent,{},{intelligentTagging:off,qrCode:true})
		endcallback= () -> 1
		docX['qrCodeTaggingLoopExample.docx'].applyTags({'images':[{image:'Firefox_logo'},{image:'image'}]},endcallback)
		docX['qrCodeTaggingLoopExample.docx']

		waitsFor () -> docX['qrCodeTaggingLoopExample.docx'].ready?

		runs () ->

			expect(docX['qrCodeTaggingLoopExample.docx'].zip.files['word/media/Copie_0.png']?).toBeTruthy()
			expect(docX['qrCodeTaggingLoopExample.docx'].zip.files['word/media/Copie_1.png']?).toBeTruthy()
			expect(docX['qrCodeTaggingLoopExample.docx'].zip.files['word/media/Copie_2.png']?).toBeFalsy()

			for i of docX['qrCodeTaggingLoopExample.docx'].zip.files
				#Everything but the date should be different
				expect(docX['qrCodeTaggingLoopExample.docx'].zip.files[i].options.date).not.toBe(docX['qrCodeTaggingLoopExampleExpected.docx'].zip.files[i].options.date)
				expect(docX['qrCodeTaggingLoopExample.docx'].zip.files[i].name).toBe(docX['qrCodeTaggingLoopExampleExpected.docx'].zip.files[i].name)
				expect(docX['qrCodeTaggingLoopExample.docx'].zip.files[i].options.dir).toBe(docX['qrCodeTaggingLoopExampleExpected.docx'].zip.files[i].options.dir)

				#if (docX['qrCodeTaggingLoopExample.docx'].zip.files[i].asText())!=null and i!="word/document.xml"
				#	expect(docX['qrCodeTaggingLoopExample.docx'].zip.files[i].asText().length).toBe(docX['qrCodeTaggingLoopExampleExpected.docx'].zip.files[i].asText().length)
				#	expect(docX['qrCodeTaggingLoopExample.docx'].zip.files[i].asText()).toBe(docX['qrCodeTaggingLoopExampleExpected.docx'].zip.files[i].asText())

describe 'Changing the parser', () ->
	it 'should work with uppercassing', () ->
		content= """<w:t>Hello {name}</w:t>"""
		scope= {"name":"Edgar"}
		xmlTemplater= new DocXTemplater(content,{Tags:scope})
		xmlTemplater.parser= (tag) ->
			return {'get':(scope) -> scope[tag].toUpperCase()}
		xmlTemplater.applyTags()
		expect(xmlTemplater.getFullText()).toBe('Hello EDGAR')
	it 'should work when setting from the DocXGen interface', () ->
		Tags=
			"first_name":"Hipp"
			"last_name":"Edgar",
			"phone":"0652455478"
			"description":"New Website"
		docX["tagExampleWithParser"].setTags Tags
		docX["tagExampleWithParser"].parser= (tag) ->
			return {'get':(scope) -> scope[tag].toUpperCase()}
		docX['tagExampleWithParser'].applyTags()
		expect(docX['tagExampleWithParser'].getFullText()).toEqual('EDGAR HIPP')
		expect(docX['tagExampleWithParser'].getFullText("word/header1.xml")).toEqual('EDGAR HIPP0652455478NEW WEBSITE')
		expect(docX['tagExampleWithParser'].getFullText("word/footer1.xml")).toEqual('EDGARHIPP0652455478')

describe 'Non Utf-8 characters', () ->
	it 'should read full text correctly', ()->
		fullText=docX["cyrillic.docx"].getFullText()
		expect(fullText.charCodeAt(0)).toBe(1024)
		expect(fullText.charCodeAt(1)).toBe(1050)
		expect(fullText.charCodeAt(2)).toBe(1048)
		expect(fullText.charCodeAt(3)).toBe(1046)
		expect(fullText.charCodeAt(4)).toBe(1044)
		expect(fullText.charCodeAt(5)).toBe(1045)
		expect(fullText.charCodeAt(6)).toBe(1039)
		expect(fullText.charCodeAt(7)).toBe(1040)
	it 'should still read full text after applying tags',()->
		docX["cyrillic.docx"].applyTags({name:"Edgar"})
		fullText=docX["cyrillic.docx"].getFullText()
		expect(fullText.charCodeAt(0)).toBe(1024)
		expect(fullText.charCodeAt(1)).toBe(1050)
		expect(fullText.charCodeAt(2)).toBe(1048)
		expect(fullText.charCodeAt(3)).toBe(1046)
		expect(fullText.charCodeAt(4)).toBe(1044)
		expect(fullText.charCodeAt(5)).toBe(1045)
		expect(fullText.charCodeAt(6)).toBe(1039)
		expect(fullText.charCodeAt(7)).toBe(1040)
		expect(fullText.indexOf('Edgar')).toBe(9)

describe 'Complex table example' , () ->
	it 'should work with simple table', () ->
		docX["tableComplex2Example.docx"].setTags({
		"table1":[{
			"t1data1":"t1-1row-data1",
			"t1data2":"t1-1row-data2",
			"t1data3":"t1-1row-data3",
			"t1data4":"t1-1row-data4"
		},{
			"t1data1":"t1-2row-data1",
			"t1data2":"t1-2row-data2",
			"t1data3":"t1-2row-data3",
			"t1data4":"t1-2row-data4"
		},
		{
			"t1data1":"t1-3row-data1",
			"t1data2":"t1-3row-data2",
			"t1data3":"t1-3row-data3",
			"t1data4":"t1-3row-data4"
		}],
		"t1total1":"t1total1-data",
		"t1total2":"t1total2-data",
		"t1total3":"t1total3-data"
		});
		docX["tableComplex2Example.docx"].applyTags()
		fullText=docX["tableComplex2Example.docx"].getFullText()
		expect(fullText).toBe("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data")
	it 'should work with more complex table', () ->
		docX["tableComplexExample.docx"].setTags({
		"table2":[{
			"t2data1":"t2-1row-data1",
			"t2data2":"t2-1row-data2",
			"t2data3":"t2-1row-data3",
			"t2data4":"t2-1row-data4"
		},{
			"t2data1":"t2-2row-data1",
			"t2data2":"t2-2row-data2",
			"t2data3":"t2-2row-data3",
			"t2data4":"t2-2row-data4"
		}],
		"t1total1":"t1total1-data",
		"t1total2":"t1total2-data",
		"t1total3":"t1total3-data",
		"t2total1":"t2total1-data",
		"t2total2":"t2total2-data",
		"t2total3":"t2total3-data"
		}); #set the templateVariables
		docX["tableComplexExample.docx"].applyTags() #apply them
		fullText=docX["tableComplexExample.docx"].getFullText() #apply them
		expect(fullText).toBe("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4TOTALt1total1-datat1total2-datat1total3-dataTABLE2COLUMN1COLUMN2COLUMN3COLUMN4t2-1row-data1t2-1row-data2t2-1row-data3t2-1row-data4t2-2row-data1t2-2row-data2t2-2row-data3t2-2row-data4TOTALt2total1-datat2total2-datat2total3-data")
	it 'should work with two tables', () ->
		docX["tableComplex3Example.docx"].setTags({
		"table1":[{
			"t1data1":"t1-1row-data1",
			"t1data2":"t1-1row-data2",
			"t1data3":"t1-1row-data3",
			"t1data4":"t1-1row-data4"
		},{
			"t1data1":"t1-2row-data1",
			"t1data2":"t1-2row-data2",
			"t1data3":"t1-2row-data3",
			"t1data4":"t1-2row-data4"
		},
		{
			"t1data1":"t1-3row-data1",
			"t1data2":"t1-3row-data2",
			"t1data3":"t1-3row-data3",
			"t1data4":"t1-3row-data4"
		}],
		"table2":[{
			"t2data1":"t2-1row-data1",
			"t2data2":"t2-1row-data2",
			"t2data3":"t2-1row-data3",
			"t2data4":"t2-1row-data4"
		},{
			"t2data1":"t2-2row-data1",
			"t2data2":"t2-2row-data2",
			"t2data3":"t2-2row-data3",
			"t2data4":"t2-2row-data4"
		}],
		"t1total1":"t1total1-data",
		"t1total2":"t1total2-data",
		"t1total3":"t1total3-data",
		"t2total1":"t2total1-data",
		"t2total2":"t2total2-data",
		"t2total3":"t2total3-data"
		}); #set the templateVariables
		docX["tableComplex3Example.docx"].applyTags() #apply them
		fullText=docX["tableComplex3Example.docx"].getFullText() #apply them
		expect(fullText).toBe("")
