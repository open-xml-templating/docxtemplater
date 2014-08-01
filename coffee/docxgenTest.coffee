root= global ? window
env= if global? then 'node' else 'browser'

root.docX={}
root.docXData={}

expressions= require('angular-expressions')
angularParser= (tag) ->
	expr=expressions.compile(tag)
	{get:expr}

if env=='node'
	path=require('path')
	root.DocxGen= require(path.join(__dirname,'/../../js/docxgen.js'))

DocUtils.pathConfig=
	"browser":'../examples/'

if env=='node'
	DocUtils.pathConfig.node=__dirname+'/../../examples/'

fileNames=["loopGraphs.docx","graphAndImage.docx","header.docx","graph.docx","qrCodeAndNonQrCodeExample.docx","imageExample.docx","tagExample.docx","tagExampleExpected.docx","tagLoopExample.docx","tagInvertedLoopExample.docx", "tagExampleExpected.docx","tagLoopExampleImageExpected.docx","tagProduitLoop.docx","tagDashLoop.docx","tagDashLoopList.docx","tagDashLoopTable.docx",'tagDashLoop.docx','qrCodeExample.docx','qrCodeExampleExpected.docx','qrCodeTaggingExample.docx','qrCodeTaggingExampleExpected.docx','qrCodeTaggingLoopExample.docx','qrCodeTaggingLoopExampleExpected.docx','tagIntelligentLoopTableExpected.docx','cyrillic.docx','tableComplex2Example.docx','tableComplexExample.docx','tableComplex3Example.docx','xmlInsertionExpected.docx','xmlInsertionExample.docx',"angularExample.docx","xmlInsertionComplexExpected.docx","xmlInsertionComplexExample.docx","qrCodeCustomGen.docx"]


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
			docX['imageExample.docx'].setData('word/media/image1.jpeg',docXData['image.png'],{binary:false})
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
		it "should provide inverted loops", () ->
			# shows if the key is []
			docX['tagInvertedLoopExample.docx'].setTags products: []
			docX['tagInvertedLoopExample.docx'].applyTags()
			expect(docX['tagInvertedLoopExample.docx'].getFullText()).toEqual('No products found')

			#shows if the key is false
			docX['tagInvertedLoopExample.docx']=new DocxGen docX['tagInvertedLoopExample.docx'].loadedContent
			docX['tagInvertedLoopExample.docx'].setTags products: false
			docX['tagInvertedLoopExample.docx'].applyTags()
			expect(docX['tagInvertedLoopExample.docx'].getFullText()).toEqual('No products found')

			#shows if the key doesn't exist
			docX['tagInvertedLoopExample.docx']=new DocxGen docX['tagInvertedLoopExample.docx'].loadedContent
			docX['tagInvertedLoopExample.docx'].setTags {}
			docX['tagInvertedLoopExample.docx'].applyTags()
			expect(docX['tagInvertedLoopExample.docx'].getFullText()).toEqual('No products found')

			#doesn't show if the key is an array with length>1
			docX['tagInvertedLoopExample.docx']=new DocxGen docX['tagInvertedLoopExample.docx'].loadedContent
			docX['tagInvertedLoopExample.docx'].setTags products: [ name: "Bread" ]
			docX['tagInvertedLoopExample.docx'].applyTags()
			expect(docX['tagInvertedLoopExample.docx'].getFullText()).toEqual('')

			#doesn't show if the key is true
			docX['tagInvertedLoopExample.docx']=new DocxGen docX['tagInvertedLoopExample.docx'].loadedContent
			docX['tagInvertedLoopExample.docx'].setTags products: true
			docX['tagInvertedLoopExample.docx'].applyTags()
			expect(docX['tagInvertedLoopExample.docx'].getFullText()).toEqual('')

			#doesn't show if the key is a string or object
			docX['tagInvertedLoopExample.docx']=new DocxGen docX['tagInvertedLoopExample.docx'].loadedContent
			docX['tagInvertedLoopExample.docx'].setTags products: "Bread"
			docX['tagInvertedLoopExample.docx'].applyTags()
			expect(docX['tagInvertedLoopExample.docx'].getFullText()).toEqual('')

			docX['tagInvertedLoopExample.docx']=new DocxGen docX['tagInvertedLoopExample.docx'].loadedContent
			docX['tagInvertedLoopExample.docx'].setTags products: {name: "Bread"}
			docX['tagInvertedLoopExample.docx'].applyTags()
			expect(docX['tagInvertedLoopExample.docx'].getFullText()).toEqual('')

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
		scope= xmlTemplater.getOuterXml docX['tagProduitLoop.docx'].zip.files["word/document.xml"].asText() ,1195,1245,'w:p'
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
		expect(xmlTemplater.getFullText()).toBe('Hello Edgar,')

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
		content= """Start </w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:pStyle w:val="Titre1"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRPr="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00923B77" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR="00713414"><w:t>oof</w:t></w:r><w:r><w:t xml:space="preserve">} </w:t></w:r><w:r w:rsidR="00713414"><w:t>It works because</w:t></w:r><w:r><w:t xml:space="preserve"> {</w:t></w:r><w:r w:rsidR="006F26AC"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00FD04E9" w:rsidRDefault="00923B77"><w:r><w:t> End"""
		scope= {"title":"Everyone uses it","proof":[{"reason":"it is quite cheap"},{"reason":"it is quit simple"},{"reason":"it works on a lot of different Hardware"}]}
		xmlTemplater= new DocXTemplater(content,{Tags:scope})
		xmlTemplater.applyTags()
		expect(xmlTemplater.getFullText()).toBe('Start Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware End')
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
			data=qrcodezip.files['blabla.png'].asBinary()
			expect(data.length).toBe(1305)
			base64data=JSZip.base64.encode(data)
			expect(base64data.length).toBe(1740)
			expect(base64data.substr(0,50)).toBe("iVBORw0KGgoAAAANSUhEUgAAAPgAAAD4CAIAAABOs7xcAAAABn")
			expect(base64data).toBe("iVBORw0KGgoAAAANSUhEUgAAAPgAAAD4CAIAAABOs7xcAAAABnRSTlMA/gABAP1bbA07AAAEzklEQVR4nO3dQY5bKRRA0Xar97/l6g0UAyII4HvONNaPY10xeH7Bn5+fn3/g2/17+g3A3yB0EoROgtBJEDoJQidB6CT8N/qDz+fzN9/HHxt9DzB6/6u+N1j1/FWf8+7vQ17vwYlOgtBJEDoJQidB6CQInQShkzCco4+c2l+fneOummfvnou//j3AKz040UkQOglCJ0HoJAidBKGTIHQSpufoI7ftVc/OiVf9vbNz8dnP7bbPeeS29+lEJ0HoJAidBKGTIHQShE6C0ElYNke/zak98lmvvM/XOdFJEDoJQidB6CQInQShkyB0Er52jj5r9x787OvNv9dyopMgdBKEToLQSRA6CUInQegkLJuj3zb3PXWvyLf+zuis296PE50EoZMgdBKEToLQSRA6CUInYXqOvmrue8rs/eUjs3vkr79+5JUenOgkCJ0EoZMgdBKEToLQSRA6CZ/b9oZ32z0/XjWnH9n9Pr+VE50EoZMgdBKEToLQSRA6CUInYbiPfmq/efb9jOyeE6+al5+aZ5/6PmHVc2Zf70QnQegkCJ0EoZMgdBKEToLQSRjO0U/dBzJ6zm374rftc+++X2X383d/nk50EoROgtBJEDoJQidB6CQInYTpffTZ15+ai696zu75+iv3ruy+N90cHRYQOglCJ0HoJAidBKGTIHQSpu9HP3V/y233n8y67f3v/t5g93NmP08nOglCJ0HoJAidBKGTIHQShE7CcI7+yv3Zr7jtPpnb5uu7/14nOglCJ0HoJAidBKGTIHQShE7C8F6XkVP74qvmrKv+3t3PH/27ds+hT9n973KikyB0EoROgtBJEDoJQidB6CRMz9Fn58q37U+vmluvcurzvO3+9d2c6CQInQShkyB0EoROgtBJEDoJ03P03Vbtu5+aE5+a06/6XdiRU3v5q17vRCdB6CQInQShkyB0EoROgtBJGM7Rb7sn5NTvfe6+x/3Ufvmpe8pPcaKTIHQShE6C0EkQOglCJ0HoJCy71+XUnHvVHvZtc9+R1+9HP3XPjxOdBKGTIHQShE6C0EkQOglCJ2E4Rz+1f/zK3vOqefzsc3bvi+9+zqrXz3KikyB0EoROgtBJEDoJQidB6CR8ds+hd8/FT819Z9/Pt+67n3q+fXT4hdBJEDoJQidB6CQInQShk7BsH31k9+9urnr+qT3pV/b+X78X34lOgtBJEDoJQidB6CQInQShk7B9H/2U2+45mXVqj//U+x9xrwtMEDoJQidB6CQInQShkyB0Erbvo+926nuAV+burzx/lntd4BdCJ0HoJAidBKGTIHQShE7CcB/99bnpbc85dU/OqufPuu33Yp3oJAidBKGTIHQShE6C0EkQOgnDffRZt81xdz//1D767v8n8Mr/Q5jlRCdB6CQInQShkyB0EoROgtBJWDZH/1aze+e798VHds/jX9n7H3GikyB0EoROgtBJEDoJQidB6CR87Rx91fz11P767Jx+5JX98tn36X50+IXQSRA6CUInQegkCJ0EoZPgfvQ/fM4pt93v/srn70QnQegkCJ0EoZMgdBKEToLQSZjeR399v3n3vPbU74+u8sr3DPbR4RdCJ0HoJAidBKGTIHQShE7CcB8dvokTnQShkyB0EoROgtBJEDoJQifhf99MLPyIbss5AAAAAElFTkSuQmCC")

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



describe "file Loop Replacing", () ->
	describe 'rels', () ->
		it 'should load', () ->
			expect(docX['imageExample.docx'].fileManager.loadFileRels().imageRels).toEqual([])
			expect(docX['imageExample.docx'].fileManager.maxRid).toEqual(10)
		it 'should add images', () ->
			oldData= docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].asText()
			expect(docX['imageExample.docx'].fileManager.addFileRels('media/image1.png',docXData['bootstrap_logo.png'],'Image')).toBe(11)
			expect(docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].asText()).not.toBe(oldData)
			relsData = docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].asText()
			contentTypeData = docX['imageExample.docx'].zip.files['[Content_Types].xml'].asText()
			relsXml= DocUtils.Str2xml(relsData)
			contentTypeXml= DocUtils.Str2xml(contentTypeData)
			relationships= relsXml.getElementsByTagName('Relationship')
			contentTypes= contentTypeXml.getElementsByTagName('Default')
			expect(relationships.length).toEqual(11)
			expect(contentTypes.length).toBe(4)
		it 'should add charts', () ->
			expect(docX['graph.docx'].fileManager.addFileRels('charts/chart2.xml',docXData['chart.xml'],'Chart')).toBe(7)
			relsData = docX['graph.docx'].zip.files['word/_rels/document.xml.rels'].asText()
			relsXml= DocUtils.Str2xml(relsData)
			relationships= relsXml.getElementsByTagName('Relationship')
			expect(relationships.length).toEqual(7)
			

describe 'qr code testing', () ->
	it 'should work with local QRCODE without tags', () ->
		docX['qrCodeExample.docx']=new DocxGen(docX['qrCodeExample.docx'].loadedContent,{},{intelligentTagging:off,qrCode:true})
		endcallback= () -> 1
		docX['qrCodeExample.docx'].applyTags({},endcallback)

		waitsFor () -> docX['qrCodeExample.docx'].ready?

		runs () ->
			expect(docX['qrCodeExample.docx'].zip.files['word/media/Copie_0.png']?).toBeTruthy()
			for i of docX['qrCodeExample.docx'].zip.files
				#Everything but the date should be different
				expect(docX['qrCodeExample.docx'].zip.files[i].options.date).not.toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].options.date)
				expect(docX['qrCodeExample.docx'].zip.files[i].name).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].name)
				expect(docX['qrCodeExample.docx'].zip.files[i].options.dir).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].options.dir)


	it 'should work with local QRCODE with {tags}', () ->
		docX['qrCodeTaggingExample.docx']=new DocxGen(docX['qrCodeTaggingExample.docx'].loadedContent,{'image':'Firefox_logo'},{intelligentTagging:off,qrCode:true})
		endcallback= () -> 1
		docX['qrCodeTaggingExample.docx'].applyTags({'image':'Firefox_logo'},endcallback)

		waitsFor () -> docX['qrCodeTaggingExample.docx'].ready?

		runs () ->
			expect(docX['qrCodeTaggingExample.docx'].zip.files['word/media/Copie_0.png']?).toBeTruthy()
			for i of docX['qrCodeTaggingExample.docx'].zip.files
				#Everything but the date should be different
				expect(docX['qrCodeTaggingExample.docx'].zip.files[i].options.date).not.toBe(docX['qrCodeTaggingExampleExpected.docx'].zip.files[i].options.date)
				expect(docX['qrCodeTaggingExample.docx'].zip.files[i].name).toBe(docX['qrCodeTaggingExampleExpected.docx'].zip.files[i].name)
				expect(docX['qrCodeTaggingExample.docx'].zip.files[i].options.dir).toBe(docX['qrCodeTaggingExampleExpected.docx'].zip.files[i].options.dir)

				if (docX['qrCodeTaggingExample.docx'].zip.files[i].asText())!=null and i!="word/document.xml" and i!="word/_rels/document.xml.rels"
					expect(docX['qrCodeTaggingExample.docx'].zip.files[i].asText().length).toBe(docX['qrCodeTaggingExampleExpected.docx'].zip.files[i].asText().length)
					expect(docX['qrCodeExample.docx'].zip.files[i].asText()).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].asText())

			createdText=docX['qrCodeTaggingExample.docx'].zip.files['word/_rels/document.xml.rels'].asText().replace(/\x20/g,"").replace(/\x0a/g,"")
			expectedText=docX['qrCodeTaggingExampleExpected.docx'].zip.files['word/_rels/document.xml.rels'].asText().replace(/\x20/g,"").replace(/\x0a/g,"")
			expect(createdText).toEqual(expectedText)

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

describe 'Changing the parser', () ->
	it 'should work with uppercassing', () ->
		content= """<w:t>Hello {name}</w:t>"""
		scope= {"name":"Edgar"}
		parser= (tag) ->
			return {'get':(scope) -> scope[tag].toUpperCase()}
		xmlTemplater= new DocXTemplater(content,{Tags:scope,parser:parser})
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

	it 'should work with angular parser', () ->
		Tags=
			person:{first_name:"Hipp",last_name:"Edgar",birth_year:1955,age:59}
		docX["angularExample.docx"].setTags Tags
		docX["angularExample.docx"].parser=angularParser
		docX["angularExample.docx"].applyTags()
		expect(docX["angularExample.docx"].getFullText()).toEqual('Hipp Edgar 2014')

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
	it 'should insert russian characters', () ->
		russianText=[1055, 1091, 1087, 1082, 1080, 1085, 1072]
		russian= (String.fromCharCode(char) for char in russianText)
		russian=russian.join('')
		docX["tagExample.docx"].applyTags({last_name:russian})
		outputText=docX["tagExample.docx"].getFullText()
		expect(outputText.substr(0,7)).toBe(russian)

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

		expect(fullText).toBe("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-dataTABLE2COLUMN1COLUMN2COLUMN3COLUMN4t2-1row-data1t2-1row-data2t2-1row-data3t2-1row-data4t2-2row-data1t2-2row-data2t2-2row-data3t2-2row-data4TOTALt2total1-datat2total2-datat2total3-data")

describe 'Raw Xml Insertion' , () ->
	docX["xmlInsertionExample.docx"].setTags({"complexXml":"""<w:p w:rsidR="00612058" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>My custom XML</w:t></w:r></w:p><w:tbl><w:tblPr><w:tblStyle w:val="Grilledutableau"/><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid><w:gridCol w:w="2952"/><w:gridCol w:w="2952"/><w:gridCol w:w="2952"/></w:tblGrid><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:b/><w:color w:val="000000" w:themeColor="text1"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:color w:val="000000" w:themeColor="text1"/></w:rPr><w:t>Test</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:b/><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FF0000"/></w:rPr><w:t>Xml</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>Generated</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="000000" w:themeColor="text1"/><w:u w:val="single"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w:color w:val="000000" w:themeColor="text1"/><w:u w:val="single"/></w:rPr><w:t>Underline</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w:color w:val="FF0000"/><w:highlight w:val="yellow"/></w:rPr><w:t>Highlighting</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:rFonts w:ascii="Bauhaus 93" w:hAnsi="Bauhaus 93"/><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w:rFonts w:ascii="Bauhaus 93" w:hAnsi="Bauhaus 93"/><w:color w:val="FF0000"/></w:rPr><w:t>Font</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00EA4B08"><w:pPr><w:jc w:val="center"/><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>Centering</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:i/><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w:i/><w:color w:val="FF0000"/></w:rPr><w:t>Italic</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr></w:tbl>"""}) #apply them
	docX["xmlInsertionExample.docx"].applyTags()

	it "should work with simple example", () ->
		for i of docX['xmlInsertionExample.docx'].zip.files
			#Everything but the date should be different
			expect(docX['xmlInsertionExample.docx'].zip.files[i].options.date).not.toBe(docX['xmlInsertionExpected.docx'].zip.files[i].options.date)
			expect(docX['xmlInsertionExample.docx'].zip.files[i].name).toBe(docX['xmlInsertionExpected.docx'].zip.files[i].name)
			expect(docX['xmlInsertionExample.docx'].zip.files[i].options.dir).toBe(docX['xmlInsertionExpected.docx'].zip.files[i].options.dir)
			expect(docX['xmlInsertionExample.docx'].zip.files[i].asText().length).toBe(docX['xmlInsertionExpected.docx'].zip.files[i].asText().length)
			expect(docX['xmlInsertionExample.docx'].zip.files[i].asText()).toBe(docX['xmlInsertionExpected.docx'].zip.files[i].asText())


	it 'should work even when tags are after the xml', () ->
		docX["xmlInsertionComplexExample.docx"].setTags(
			{
			"complexXml":"<w:p><w:r><w:t>Hello</w:t></w:r></w:p>",
			"name":"Hipp",
			"first_name":"Edgar",
			"products":[
				{"year":1550,"name":"Moto","company":"Fein"},
				{"year":1987,"name":"Water","company":"Test"},
				{"year":2010,"name":"Bread","company":"Yu"}
			]
			})
		docX["xmlInsertionComplexExample.docx"].applyTags()
		for i of docX['xmlInsertionComplexExample.docx'].zip.files
			#Everything but the date should be different
			expect(docX['xmlInsertionComplexExample.docx'].zip.files[i].options.date).not.toBe(docX['xmlInsertionComplexExpected.docx'].zip.files[i].options.date)
			expect(docX['xmlInsertionComplexExample.docx'].zip.files[i].name).toBe(docX['xmlInsertionComplexExpected.docx'].zip.files[i].name)
			expect(docX['xmlInsertionComplexExample.docx'].zip.files[i].options.dir).toBe(docX['xmlInsertionComplexExpected.docx'].zip.files[i].options.dir)
			expect(docX['xmlInsertionComplexExample.docx'].zip.files[i].asText().length).toBe(docX['xmlInsertionComplexExpected.docx'].zip.files[i].asText().length)
			expect(docX['xmlInsertionComplexExample.docx'].zip.files[i].asText()).toBe(docX['xmlInsertionComplexExpected.docx'].zip.files[i].asText())

describe 'SubContent', () ->
	sub=new SubContent("start<w:t>text</w:t>end")
	sub.start=10
	sub.end=14
	sub.refreshText()

	it "should get the text inside the tags correctly", ()->
		expect(sub.text).toBe('text')

	it 'should get the text expanded to the outer xml', () ->
		sub.getOuterXml('w:t')
		expect(sub.text).toBe('<w:t>text</w:t>')
	it 'should replace the inner text', () ->
		sub.replace('<w:table>Sample Table</w:table>')
		expect(sub.fullText).toBe('start<w:table>Sample Table</w:table>end')
		expect(sub.text).toBe('<w:table>Sample Table</w:table>')
	it "shouldn't bug if some images don't contain a qrcode",()->
		docX['imageExample.docx']=new DocxGen(docX['imageExample.docx'].loadedContent,{},{intelligentTagging:off,qrCode:true})
		expect(docX['imageExample.docx'].zip.files['word/media/image1.jpeg'].asBinary().length).toBe(713625)
		endcallback= () -> 1
		docX['imageExample.docx'].applyTags({},endcallback)
		waitsFor () -> docX['imageExample.docx'].ready?
		runs () ->
			expect(docX['imageExample.docx'].zip.files['word/media/Copie_0.png'].asBinary().length).toBe(713625)


	it 'should work with some images containing a qrcode, some not', () ->
		testDocx=new DocxGen(docX["qrCodeAndNonQrCodeExample.docx"].loadedContent,{},{intelligentTagging:off,qrCode:true})
		testDocx.applyTags({"image":"image"})
		waitsFor () -> testDocx.ready?
		runs () ->
			expect(testDocx.zip.files["word/media/Copie_1.png"].asBinary().length).toBe(561513)
			expect(testDocx.zip.files["word/media/Copie_0.png"].asBinary().length).toBe(18062)

	it 'should work with custom generation', () ->
		testDocx=new DocxGen(docX["qrCodeCustomGen.docx"].loadedContent,{},{intelligentTagging:off,qrCode:true})
		testDocx.applyTags()
		waitsFor () -> testDocx.ready?
		runs () ->
			expect(testDocx.zip.files["word/media/Copie_0.png"].asBinary().length).toBe(258)

	it 'should work with custom tags', () ->
		content= """<w:t>Hello {name}</w:t>"""
		scope= {"name":"Edgar"}
		xmlTemplater= new DocXTemplater(content,{Tags:scope})
		xmlTemplater.applyTags()
		expect(xmlTemplater.getFullText()).toBe('Hello Edgar')

		DocUtils.tags=
			start:'['
			end:']'
		content= """<w:t>Hello [name]</w:t>"""
		scope= {"name":"Edgar"}
		xmlTemplater= new DocXTemplater(content,{Tags:scope})
		xmlTemplater.applyTags()
		expect(xmlTemplater.getFullText()).toBe('Hello Edgar')
		DocUtils.tags=
			start:'{'
			end:'}'

	it 'should work with qrcode in footer', () ->
 		testDocx=new DocxGen(docX["header.docx"].loadedContent,{},{intelligentTagging:off,qrCode:true})
 		testDocx.applyTags()
		
	it 'should work with graphs with qrcode', ()->
		doc=new DocxGen(docX["graph.docx"].loadedContent,{},{qrCode:true})
		doc.applyTags()
		text=doc.getFullText()
		expect(text).toBe('') 
		
describe 'FileManager', () ->
		it 'should work with both graph and image together', () ->
			doc=new DocxGen(docX["graphAndImage.docx"].loadedContent,{},{qrCode:true})
			doc.applyTags()
		it 'should work with graphs in loop', () ->
			oldData= docX['loopGraphs.docx'].zip.files['word/_rels/document.xml.rels'].asText()
			doc=new DocxGen(docX["loopGraphs.docx"].loadedContent,{},{qrCode:true})
			Tags =
				"loop":[{"name":"titre1"},{"name":"titre2"},{"name":"titre3"}]
			doc.setTags Tags
			doc.applyTags()

		
		
