docX={}

expressions= require('angular-expressions')
angularParser= (tag) ->
	try
		expr=expressions.compile(tag)
	catch e
		console.error "parsing didn't work with #{tag}"
	{get:(scope)->
		if !scope?
			console.warn 'warning: scope undefined'
		try
			return expr(scope)
		catch e
			console.error "parsing didn't work with #{tag}"
			return "undefined"
}

shouldBeSame = (zip1,zip2)->
	if typeof zip1 == "string" then zip1 = docX[zip1].getZip()
	if typeof zip2 == "string" then zip2 = docX[zip2].getZip()

	for i of zip1.files
		expect(zip1.files[i].options.date).not.to.be.equal(zip2.files[i].options.date, "Date differs")
		expect(zip1.files[i].name).to.be.equal(zip2.files[i].name, "Name differs")
		expect(zip1.files[i].options.dir).to.be.equal(zip2.files[i].options.dir, "IsDir differs")
		expect(zip1.files[i].asText().length).to.be.equal(zip2.files[i].asText().length, "Content differs")
		expect(zip1.files[i].asText()).to.be.equal(zip2.files[i].asText(), "Content differs")

expect = require('chai').expect

XmlMatcher= require('../../js/xmlMatcher.js')
DocxGen= require('../../js/index.js')
PptxGen=DocxGen.PptxGen
DocUtils=DocxGen.DocUtils
docX={}
pptX={}
data={}
SubContent=DocxGen.SubContent
DocXTemplater=DocxGen.DocXTemplater
xmlUtil=DocxGen.XmlUtil
fs=require('fs')

fileNames=["graph.docx",
"imageExample.docx",
"tagExample.docx",
"tagExampleExpected.docx",
"tagLoopExample.docx",
"tagInvertedLoopExample.docx",
"tagExampleExpected.docx",
"tagLoopExampleImageExpected.docx",
"tagProduitLoop.docx",
"tagDashLoop.docx",
"tagDashLoopList.docx",
"tagDashLoopTable.docx",
'tagIntelligentLoopTableExpected.docx',
'cyrillic.docx',
'tableComplex2Example.docx',
'tableComplexExample.docx',
'tableComplex3Example.docx',
'xmlInsertionExpected.docx',
'xmlInsertionExample.docx',
"angularExample.docx",
'tagIntelligentLoopTable.docx',
"xmlInsertionComplexExpected.docx",
"xmlInsertionComplexExample.docx"]

getLength=(d)->if d.length? then d.length else d.byteLength

startTest=->
	describe "DocxGenBasis", () ->
		it "should be defined", () ->
			expect(DocxGen).not.to.be.equal(undefined)
		it "should construct", () ->
			a= new DocxGen()
			expect(a).not.to.be.equal(undefined)

	describe "XmlMatcher", () ->
		it 'should work with simple tag',->
			tag='w:t'
			matcher=new XmlMatcher('<w:t>Text</w:t>')
			matcher.parse('w:t')
			expect(matcher.matches[0][0]).to.be.equal('<w:t>Text</w:t>')
			expect(matcher.matches[0][1]).to.be.equal('<w:t>')
			expect(matcher.matches[0][2]).to.be.equal('Text')
			expect(matcher.matches[0].offset).to.be.equal(0)

		it 'should work with multiple tags',->
			tag='w:t'
			matcher=new XmlMatcher('<w:t>Text</w:t> TAG <w:t>Text2</w:t>')
			matcher.parse('w:t')
			expect(matcher.matches[1][0]).to.be.equal('<w:t>Text2</w:t>')
			expect(matcher.matches[1][1]).to.be.equal('<w:t>')
			expect(matcher.matches[1][2]).to.be.equal('Text2')
			expect(matcher.matches[1].offset).to.be.equal(20)

		it 'should work with no tag, with w:t',->
			tag='w:t'
			matcher=new XmlMatcher('Text1</w:t><w:t>Text2')
			matcher.parse('w:t')
			expect(matcher.matches[0][0]).to.be.equal('Text1')
			expect(matcher.matches[0][1]).to.be.equal('')
			expect(matcher.matches[0][2]).to.be.equal('Text1')
			expect(matcher.matches[0].offset).to.be.equal(0)

			expect(matcher.matches[1][0]).to.be.equal('<w:t>Text2')
			expect(matcher.matches[1][1]).to.be.equal('<w:t>')
			expect(matcher.matches[1][2]).to.be.equal('Text2')
			expect(matcher.matches[1].offset).to.be.equal(11)

		it 'should work with no tag, no w:t',->
			tag='w:t'
			matcher=new XmlMatcher('Text1')
			matcher.parse('w:t')
			expect(matcher.matches[0][0]).to.be.equal('Text1')
			expect(matcher.matches[0][1]).to.be.equal('')
			expect(matcher.matches[0][2]).to.be.equal('Text1')
			expect(matcher.matches[0].offset).to.be.equal(0)

		it 'should not match with no </w:t> starter',->
			tag='w:t'
			matcher=new XmlMatcher('TAG<w:t>Text1</w:t>')
			matcher.parse('w:t')
			expect(matcher.matches[0][0]).to.be.equal('<w:t>Text1</w:t>')
			expect(matcher.matches[0][1]).to.be.equal('<w:t>')
			expect(matcher.matches[0][2]).to.be.equal('Text1')
			expect(matcher.matches[0].offset).to.be.equal(3)

		it 'should not match with no <w:t> ender',->
			tag='w:t'
			matcher=new XmlMatcher('<w:t>Text1</w:t>TAG')
			matcher.parse('w:t')
			expect(matcher.matches.length).to.be.equal(1)

	describe "DocxGenLoading", () ->
		describe "ajax done correctly", () ->
			it "doc and img Data should have the expected length", () ->
				expect(getLength(docX['imageExample.docx'].loadedContent)).to.be.equal(729580)
				expect(getLength(data['image.png'])).to.be.equal(18062)
			it "should have the right number of files (the docx unzipped)", ()->
				docX['imageExample.docx']=new DocxGen(docX['imageExample.docx'].loadedContent)
				expect(DocUtils.sizeOfObject(docX['imageExample.docx'].zip.files)).to.be.equal(16)
		describe "basic loading", () ->
			it "should load file imageExample.docx", () ->
				expect(typeof docX['imageExample.docx']).to.be.equal('object');
		describe "content_loading", () ->
			it "should load the right content for the footer", () ->
				fullText=(docX['imageExample.docx'].getFullText("word/footer1.xml"))
				expect(fullText.length).not.to.be.equal(0)
				expect(fullText).to.be.equal('{last_name}{first_name}{phone}')
			it "should load the right content for the document", () ->
				fullText=(docX['imageExample.docx'].getFullText()) #default value document.xml
				expect(fullText).to.be.equal("")
		describe "output and input", () ->
			it "should be the same" , () ->
				doc=new DocxGen(docX['tagExample.docx'].loadedContent)
				output=doc.getZip().generate({type:"base64"})
				expect(output.length).to.be.equal(90732)
				expect(output.substr(0,50)).to.be.equal('UEsDBAoAAAAAAAAAIQAMTxYSlgcAAJYHAAATAAAAW0NvbnRlbn')

	describe "DocxGenTemplating", () ->
		describe "text templating", () ->
			it "should change values with template vars", () ->
				Tags=
					"first_name":"Hipp"
					"last_name":"Edgar",
					"phone":"0652455478"
					"description":"New Website"
				docX['tagExample.docx'].setData Tags
				docX['tagExample.docx'].render()
				expect(docX['tagExample.docx'].getFullText()).to.be.equal('Edgar Hipp')
				expect(docX['tagExample.docx'].getFullText("word/header1.xml")).to.be.equal('Edgar Hipp0652455478New Website')
				expect(docX['tagExample.docx'].getFullText("word/footer1.xml")).to.be.equal('EdgarHipp0652455478')
			it "should export the good file", () ->
				shouldBeSame('tagExample.docx', 'tagExampleExpected.docx')

	describe "DocxGenTemplatingForLoop", () ->
		describe "textLoop templating", () ->
			it "should replace all the tags", () ->
				Tags =
					"nom":"Hipp"
					"prenom":"Edgar"
					"telephone":"0652455478"
					"description":"New Website"
					"offre":[{"titre":"titre1","prix":"1250"},{"titre":"titre2","prix":"2000"},{"titre":"titre3","prix":"1400", "nom": "Offre"}]
				docX['tagLoopExample.docx'].setData Tags
				docX['tagLoopExample.docx'].render()
				expect(docX['tagLoopExample.docx'].getFullText()).to.be.equal('Votre proposition commercialeHippPrix: 1250Titre titre1HippPrix: 2000Titre titre2OffrePrix: 1400Titre titre3HippEdgar')
			it "should work with loops inside loops", () ->
				Tags = {"products":[{"title":"Microsoft","name":"DOS","reference":"Win7","avantages":[{"title":"Everyone uses it","proof":[{"reason":"it is quite cheap"},{"reason":"it is quit simple"},{"reason":"it works on a lot of different Hardware"}]}]},{"title":"Linux","name":"Ubuntu","reference":"Ubuntu10","avantages":[{"title":"It's very powerful","proof":[{"reason":"the terminal is your friend"},{"reason":"Hello world"},{"reason":"it's free"}]}]},{"title":"Apple","name":"Mac","reference":"OSX","avantages":[{"title":"It's very easy","proof":[{"reason":"you can do a lot just with the mouse"},{"reason":"It's nicely designed"}]}]},]}
				docX['tagProduitLoop.docx'].setData Tags
				docX['tagProduitLoop.docx'].render()
				text= docX['tagProduitLoop.docx'].getFullText()
				expectedText= "MicrosoftProduct name : DOSProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed"
				expect(text.length).to.be.equal(expectedText.length)
				expect(text).to.be.equal(expectedText)
			it "should provide inverted loops", () ->
				# shows if the key is []
				docX['tagInvertedLoopExample.docx'].setData products: []
				docX['tagInvertedLoopExample.docx'].render()
				expect(docX['tagInvertedLoopExample.docx'].getFullText()).to.be.equal('No products found')

				#shows if the key is false
				d=new DocxGen docX['tagInvertedLoopExample.docx'].loadedContent
				d.setData products: false
				d.render()
				expect(d.getFullText()).to.be.equal('No products found')

				#shows if the key doesn't exist
				d=new DocxGen docX['tagInvertedLoopExample.docx'].loadedContent
				d.setData {}
				d.render()
				expect(d.getFullText()).to.be.equal('No products found')

				#doesn't show if the key is an array with length>1
				d=new DocxGen docX['tagInvertedLoopExample.docx'].loadedContent
				d.setData products: [ name: "Bread" ]
				d.render()
				expect(d.getFullText()).to.be.equal('')

				#doesn't show if the key is true
				d=new DocxGen docX['tagInvertedLoopExample.docx'].loadedContent
				d.setData products: true
				d.render()
				expect(d.getFullText()).to.be.equal('')

				#doesn't show if the key is a string or object
				d=new DocxGen docX['tagInvertedLoopExample.docx'].loadedContent
				d.setData products: "Bread"
				d.render()
				expect(d.getFullText()).to.be.equal('')

				d=new DocxGen docX['tagInvertedLoopExample.docx'].loadedContent
				d.setData products: {name: "Bread"}
				d.render()
				expect(d.getFullText()).to.be.equal('')

	describe "Xml Util" , () ->
		it "should compute the scope between 2 <w:t>" , () ->
			scope= xmlUtil.getListXmlElements """undefined</w:t></w:r></w:p><w:p w:rsidP="008A4B3C" w:rsidR="007929C1" w:rsidRDefault="007929C1" w:rsidRPr="008A4B3C"><w:pPr><w:pStyle w:val="Sous-titre"/></w:pPr><w:r w:rsidRPr="008A4B3C"><w:t xml:space="preserve">Audit réalisé le """
			expect(scope).to.be.eql([ { tag : '</w:t>', offset : 9 }, { tag : '</w:r>', offset : 15 }, { tag : '</w:p>', offset : 21 }, { tag : '<w:p>', offset : 27 }, { tag : '<w:r>', offset : 162 }, { tag : '<w:t>', offset : 188 } ])
		it "should compute the scope between 2 <w:t> in an Array", () ->
			scope= xmlUtil.getListXmlElements """urs</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type="dxa" w:w="4140"/></w:tcPr><w:p w:rsidP="00CE524B" w:rsidR="00CE524B" w:rsidRDefault="00CE524B"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="auto"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="auto"/></w:rPr><w:t>Sur exté"""
			expect(scope).to.be.eql([ { tag : '</w:t>', offset : 3 }, { tag : '</w:r>', offset : 9 }, { tag : '</w:p>', offset : 15 }, { tag : '</w:tc>', offset : 21 }, { tag : '<w:tc>', offset : 28 }, { tag : '<w:p>', offset : 83 }, { tag : '<w:r>', offset : 268 }, { tag : '<w:t>', offset : 374 } ])
		it 'should compute the scope between a w:t in an array and the other outside', () ->
			scope= xmlUtil.getListXmlElements """defined </w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p w:rsidP="00CA7135" w:rsidR="00BE3585" w:rsidRDefault="00BE3585"/><w:p w:rsidP="00CA7135" w:rsidR="00BE3585" w:rsidRDefault="00BE3585"/><w:p w:rsidP="00CA7135" w:rsidR="00137C91" w:rsidRDefault="00137C91"><w:r w:rsidRPr="00B12C70"><w:rPr><w:bCs/></w:rPr><w:t>Coût ressources """
			expect(scope).to.be.eql([ { tag : '</w:t>', offset : 8 }, { tag : '</w:r>', offset : 14 }, { tag : '</w:p>', offset : 20 }, { tag : '</w:tc>', offset : 26 }, { tag : '</w:tr>', offset : 33 }, { tag : '</w:tbl>', offset : 40 }, { tag : '<w:p>', offset : 188 }, { tag : '<w:r>', offset : 257 }, { tag : '<w:t>', offset : 306 } ])

	describe "scope diff calculation", () ->
		it "should compute the scopeDiff between 2 <w:t>" , () ->
			scope= xmlUtil.getListDifferenceXmlElements """undefined</w:t></w:r></w:p><w:p w:rsidP="008A4B3C" w:rsidR="007929C1" w:rsidRDefault="007929C1" w:rsidRPr="008A4B3C"><w:pPr><w:pStyle w:val="Sous-titre"/></w:pPr><w:r w:rsidRPr="008A4B3C"><w:t xml:space="preserve">Audit réalisé le """
			expect(scope).to.be.eql([])
		it "should compute the scopeDiff between 2 <w:t> in an Array", () ->
			scope= xmlUtil.getListDifferenceXmlElements """urs</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type="dxa" w:w="4140"/></w:tcPr><w:p w:rsidP="00CE524B" w:rsidR="00CE524B" w:rsidRDefault="00CE524B"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="auto"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="auto"/></w:rPr><w:t>Sur exté"""
			expect(scope).to.be.eql([])
		it 'should compute the scopeDiff between a w:t in an array and the other outside', () ->
			scope= xmlUtil.getListDifferenceXmlElements """defined </w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p w:rsidP="00CA7135" w:rsidR="00BE3585" w:rsidRDefault="00BE3585"/><w:p w:rsidP="00CA7135" w:rsidR="00BE3585" w:rsidRDefault="00BE3585"/><w:p w:rsidP="00CA7135" w:rsidR="00137C91" w:rsidRDefault="00137C91"><w:r w:rsidRPr="00B12C70"><w:rPr><w:bCs/></w:rPr><w:t>Coût ressources """
			expect(scope).to.be.eql([ { tag : '</w:tc>', offset : 26 }, { tag : '</w:tr>', offset : 33 }, { tag : '</w:tbl>', offset : 40 } ])

	describe "scope inner text", () ->
		it "should find the scope" , () ->
			xmlTemplater= new DocXTemplater()
			docX['tagProduitLoop.docx'].load(docX['tagProduitLoop.docx'].loadedContent)
			scope= DocUtils.getOuterXml docX['tagProduitLoop.docx'].zip.files["word/document.xml"].asText() ,1195,1245,'w:p'
			obj= { text : """<w:p w:rsidR="00923B77" w:rsidRDefault="00923B77"><w:r><w:t>{#</w:t></w:r><w:r w:rsidR="00713414"><w:t>products</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p>""", startTag : 1134, endTag : 1286 }
			expect(scope.endTag).to.be.equal(obj.endTag)
			expect(scope.startTag).to.be.equal(obj.startTag)
			expect(scope.text.length).to.be.equal(obj.text.length)
			expect(scope.text).to.be.equal(obj.text)

	describe "Dash Loop Testing", () ->
		it "dash loop ok on simple table -> w:tr" , () ->
			Tags=
				"os":[{"type":"linux","price":"0","reference":"Ubuntu10"},{"type":"DOS","price":"500","reference":"Win7"},{"type":"apple","price":"1200","reference":"MACOSX"}]
			docX['tagDashLoop.docx'].setData(Tags)
			docX['tagDashLoop.docx'].render()
			expectedText= "linux0Ubuntu10DOS500Win7apple1200MACOSX"
			text=docX['tagDashLoop.docx'].getFullText()
			expect(text).to.be.equal(expectedText)
		it "dash loop ok on simple table -> w:table" , () ->
			Tags=
				"os":[{"type":"linux","price":"0","reference":"Ubuntu10"},{"type":"DOS","price":"500","reference":"Win7"},{"type":"apple","price":"1200","reference":"MACOSX"}]
			docX['tagDashLoopTable.docx'].setData(Tags)
			docX['tagDashLoopTable.docx'].render()
			expectedText= "linux0Ubuntu10DOS500Win7apple1200MACOSX"
			text=docX['tagDashLoopTable.docx'].getFullText()
			expect(text).to.be.equal(expectedText)
		it "dash loop ok on simple list -> w:p" , () ->
			Tags=
				"os":[{"type":"linux","price":"0","reference":"Ubuntu10"},{"type":"DOS","price":"500","reference":"Win7"},{"type":"apple","price":"1200","reference":"MACOSX"}]
			docX['tagDashLoopList.docx'].setData(Tags)
			docX['tagDashLoopList.docx'].render()
			expectedText= 'linux 0 Ubuntu10 DOS 500 Win7 apple 1200 MACOSX '
			text=docX['tagDashLoopList.docx'].getFullText()
			expect(text).to.be.equal(expectedText)

	describe "Intelligent Loop Tagging", () ->
		it "should work with tables" , () ->
			Tags={clients:[{first_name:"John",last_name:"Doe",phone:"+33647874513"},{first_name:"Jane",last_name:"Doe",phone:"+33454540124"},{first_name:"Phil",last_name:"Kiel",phone:"+44578451245"},{first_name:"Dave",last_name:"Sto",phone:"+44548787984"}]}
			docX['tagIntelligentLoopTable.docx'].setData(Tags)
			docX['tagIntelligentLoopTable.docx'].render()
			expectedText= 'JohnDoe+33647874513JaneDoe+33454540124PhilKiel+44578451245DaveSto+44548787984'
			text= docX['tagIntelligentLoopTableExpected.docx'].getFullText()
			expect(text).to.be.equal(expectedText)
			shouldBeSame('tagIntelligentLoopTable.docx', 'tagIntelligentLoopTableExpected.docx')

	describe "getTags", () ->
		it "should work with simple document", () ->
			d=new DocxGen docX['tagExample.docx'].loadedContent,{},{intelligentTagging:off}
			tempVars= d.getTags()
			expect(tempVars).to.be.eql([ { fileName : 'word/header1.xml', vars : { def : {  }, undef : { last_name : true, first_name : true, phone : true, description : true } } }, { fileName : 'word/footer1.xml', vars : { def : {  }, undef : { last_name : true, first_name : true, phone : true } } }, { fileName : 'word/document.xml', vars : { def : {  }, undef : { last_name : true, first_name : true } } } ] )
		it "should work with loop document", () ->
			docX['tagLoopExample.docx']=new DocxGen docX['tagLoopExample.docx'].loadedContent,{},{intelligentTagging:off}
			tempVars= docX['tagLoopExample.docx'].getTags()
			expect(tempVars).to.be.eql([ { fileName : 'word/header1.xml', vars : { def : {  }, undef : { nom : true, prenom : true } } }, { fileName : 'word/footer1.xml', vars : { def : {  }, undef : { nom : true, prenom : true, telephone : true } } }, { fileName : 'word/document.xml', vars : { def : {  }, undef : { offre : { nom : true, prix : true, titre : true }, nom : true, prenom : true } } } ])

	describe "xmlTemplater", ()->
		it "should work with simpleContent", ()->
			content= """<w:t>Hello {name}</w:t>"""
			scope= {"name":"Edgar"}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar')
		it "should work with {.} for this", ()->
			content= """<w:t>Hello {.}</w:t>"""
			scope='Edgar'
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar')

		it "should work with {.} for this inside loop", ()->
			content= """<w:t>Hello {#names}{.},{/names}</w:t>"""
			scope={names:['Edgar','John']}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar,John,')

		it "should work with non w:t content", ()->
			content= """Hello {name}"""
			scope= {"name":"edgar"}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.content).to.be.equal('Hello edgar')
		it "should work with tag in two elements", ()->
			content= """<w:t>Hello {</w:t><w:t>name}</w:t>"""
			scope= {"name":"Edgar"}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar')

		it "should work with simple loop with object value", ()->
			content= """<w:t>Hello {#person}{name}{/person}</w:t>"""
			scope= {"person":{"name":"Edgar"}}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar')

		it "should work with simple Loop", ()->
			content= """<w:t>Hello {#names}{name},{/names}</w:t>"""
			scope= {"names":[{"name":"Edgar"},{"name":"Mary"},{"name":"John"}]}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar,Mary,John,')
		it "should work with simple Loop with boolean value", ()->
			content= """<w:t>Hello {#showName}{name},{/showName}</w:t>"""
			scope= {"showName":true,"name":"Edgar"}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar,')

			scope= {"showName":false,"name":"Edgar"}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Hello ')
		it "should work with dash Loop", ()->
			content= """<w:p><w:t>Hello {-w:p names}{name},{/names}</w:t></w:p>"""
			scope= {"names":[{"name":"Edgar"},{"name":"Mary"},{"name":"John"}]}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar,Hello Mary,Hello John,')
		it "should work with loop and innerContent", ()->
			content= """</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:pStyle w:val="Titre1"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRPr="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00923B77" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR="00713414"><w:t>oof</w:t></w:r><w:r><w:t xml:space="preserve">} </w:t></w:r><w:r w:rsidR="00713414"><w:t>It works because</w:t></w:r><w:r><w:t xml:space="preserve"> {</w:t></w:r><w:r w:rsidR="006F26AC"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00FD04E9" w:rsidRDefault="00923B77"><w:r><w:t>"""
			scope= {"title":"Everyone uses it","proof":[{"reason":"it is quite cheap"},{"reason":"it is quit simple"},{"reason":"it works on a lot of different Hardware"}]}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware')
		it "should work with loop and innerContent (with last)", ()->
			content= """Start </w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:pStyle w:val="Titre1"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRPr="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00923B77" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR="00713414"><w:t>oof</w:t></w:r><w:r><w:t xml:space="preserve">} </w:t></w:r><w:r w:rsidR="00713414"><w:t>It works because</w:t></w:r><w:r><w:t xml:space="preserve"> {</w:t></w:r><w:r w:rsidR="006F26AC"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00FD04E9" w:rsidRDefault="00923B77"><w:r><w:t> End"""
			scope= {"title":"Everyone uses it","proof":[{"reason":"it is quite cheap"},{"reason":"it is quit simple"},{"reason":"it works on a lot of different Hardware"}]}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Start Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware End')
		it 'should work with not w:t tag (if the for loop is like {#forloop} text {/forloop}) ', ()->
			content= """Hello {#names}{name},{/names}"""
			scope= {"names":[{"name":"Edgar"},{"name":"Mary"},{"name":"John"}]}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.content).to.be.equal('Hello Edgar,Mary,John,')

	describe 'Changing the parser', () ->
		it 'should work with uppercassing', () ->
			content= """<w:t>Hello {name}</w:t>"""
			scope= {"name":"Edgar"}
			parser= (tag) ->
				return {'get':(scope) -> scope[tag].toUpperCase()}
			xmlTemplater= new DocXTemplater(content,{Tags:scope,parser:parser})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Hello EDGAR')
		it 'should work when setting from the DocXGen interface', () ->
			d=new DocxGen(docX["tagExample.docx"].loadedContent)
			Tags=
				"first_name":"Hipp"
				"last_name":"Edgar",
				"phone":"0652455478"
				"description":"New Website"
			d.setData Tags
			d.parser= (tag) ->
				return {'get':(scope) -> scope[tag].toUpperCase()}
			d.render()
			expect(d.getFullText()).to.be.equal('EDGAR HIPP')
			expect(d.getFullText("word/header1.xml")).to.be.equal('EDGAR HIPP0652455478NEW WEBSITE')
			expect(d.getFullText("word/footer1.xml")).to.be.equal('EDGARHIPP0652455478')

		it 'should work with angular parser', () ->
			Tags=
				person:{first_name:"Hipp",last_name:"Edgar",birth_year:1955,age:59}
			docX["angularExample.docx"].setData Tags
			docX["angularExample.docx"].parser=angularParser
			docX["angularExample.docx"].render()
			expect(docX["angularExample.docx"].getFullText()).to.be.equal('Hipp Edgar 2014')

		it 'should work with loops', ()->
			content= """<w:t>Hello {#person.adult}you{/person.adult}</w:t>"""
			scope= {"person":{"name":"Edgar","adult":true}}
			xmlTemplater= new DocXTemplater(content,{Tags:scope,parser:angularParser})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Hello you')

	describe 'Non Utf-8 characters', () ->
		it 'should read full text correctly', ()->
			fullText=docX["cyrillic.docx"].getFullText()
			expect(fullText.charCodeAt(0)).to.be.equal(1024)
			expect(fullText.charCodeAt(1)).to.be.equal(1050)
			expect(fullText.charCodeAt(2)).to.be.equal(1048)
			expect(fullText.charCodeAt(3)).to.be.equal(1046)
			expect(fullText.charCodeAt(4)).to.be.equal(1044)
			expect(fullText.charCodeAt(5)).to.be.equal(1045)
			expect(fullText.charCodeAt(6)).to.be.equal(1039)
			expect(fullText.charCodeAt(7)).to.be.equal(1040)
		it 'should still read full text after applying tags',()->
			docX["cyrillic.docx"].setData {name:"Edgar"}
			docX["cyrillic.docx"].render()
			fullText=docX["cyrillic.docx"].getFullText()
			expect(fullText.charCodeAt(0)).to.be.equal(1024)
			expect(fullText.charCodeAt(1)).to.be.equal(1050)
			expect(fullText.charCodeAt(2)).to.be.equal(1048)
			expect(fullText.charCodeAt(3)).to.be.equal(1046)
			expect(fullText.charCodeAt(4)).to.be.equal(1044)
			expect(fullText.charCodeAt(5)).to.be.equal(1045)
			expect(fullText.charCodeAt(6)).to.be.equal(1039)
			expect(fullText.charCodeAt(7)).to.be.equal(1040)
			expect(fullText.indexOf('Edgar')).to.be.equal(9)
		it 'should insert russian characters', () ->
			russianText=[1055, 1091, 1087, 1082, 1080, 1085, 1072]
			russian= (String.fromCharCode(char) for char in russianText)
			russian=russian.join('')
			d=new DocxGen(docX["tagExample.docx"].loadedContent)
			d.setData {last_name:russian}
			d.render()
			outputText=d.getFullText()
			expect(outputText.substr(0,7)).to.be.equal(russian)

	describe 'Complex table example' , () ->
		it 'should work with simple table', () ->
			docX["tableComplex2Example.docx"].setData({
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
			docX["tableComplex2Example.docx"].render()
			fullText=docX["tableComplex2Example.docx"].getFullText()
			expect(fullText).to.be.equal("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data")
		it 'should work with more complex table', () ->
			docX["tableComplexExample.docx"].setData({
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
			docX["tableComplexExample.docx"].render() #apply them
			fullText=docX["tableComplexExample.docx"].getFullText() #apply them
			expect(fullText).to.be.equal("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4TOTALt1total1-datat1total2-datat1total3-dataTABLE2COLUMN1COLUMN2COLUMN3COLUMN4t2-1row-data1t2-1row-data2t2-1row-data3t2-1row-data4t2-2row-data1t2-2row-data2t2-2row-data3t2-2row-data4TOTALt2total1-datat2total2-datat2total3-data")
		it 'should work with two tables', () ->
			docX["tableComplex3Example.docx"].setData({
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
			docX["tableComplex3Example.docx"].render() #apply them
			fullText=docX["tableComplex3Example.docx"].getFullText() #apply them

			expect(fullText).to.be.equal("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-dataTABLE2COLUMN1COLUMN2COLUMN3COLUMN4t2-1row-data1t2-1row-data2t2-1row-data3t2-1row-data4t2-2row-data1t2-2row-data2t2-2row-data3t2-2row-data4TOTALt2total1-datat2total2-datat2total3-data")

	describe 'Raw Xml Insertion' , () ->
		docX["xmlInsertionExample.docx"].setData({"complexXml":"""<w:p w:rsidR="00612058" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>My custom XML</w:t></w:r></w:p><w:tbl><w:tblPr><w:tblStyle w:val="Grilledutableau"/><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid><w:gridCol w:w="2952"/><w:gridCol w:w="2952"/><w:gridCol w:w="2952"/></w:tblGrid><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:b/><w:color w:val="000000" w:themeColor="text1"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:color w:val="000000" w:themeColor="text1"/></w:rPr><w:t>Test</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:b/><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FF0000"/></w:rPr><w:t>Xml</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>Generated</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="000000" w:themeColor="text1"/><w:u w:val="single"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w:color w:val="000000" w:themeColor="text1"/><w:u w:val="single"/></w:rPr><w:t>Underline</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w:color w:val="FF0000"/><w:highlight w:val="yellow"/></w:rPr><w:t>Highlighting</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:rFonts w:ascii="Bauhaus 93" w:hAnsi="Bauhaus 93"/><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w:rFonts w:ascii="Bauhaus 93" w:hAnsi="Bauhaus 93"/><w:color w:val="FF0000"/></w:rPr><w:t>Font</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00EA4B08"><w:pPr><w:jc w:val="center"/><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>Centering</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:i/><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w:i/><w:color w:val="FF0000"/></w:rPr><w:t>Italic</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr></w:tbl>"""}) #apply them
		docX["xmlInsertionExample.docx"].render()

		it "should work with simple example", () ->
			shouldBeSame('xmlInsertionExample.docx','xmlInsertionExpected.docx')

		it 'should work even when tags are after the xml', () ->
			docX["xmlInsertionComplexExample.docx"].setData(
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
			docX["xmlInsertionComplexExample.docx"].render()
			shouldBeSame('xmlInsertionComplexExample.docx','xmlInsertionComplexExpected.docx')
			for i of docX['xmlInsertionComplexExample.docx'].zip.files
				#Everything but the date should be different
				expect(docX['xmlInsertionComplexExample.docx'].zip.files[i].options.date).not.to.be.equal(docX['xmlInsertionComplexExpected.docx'].zip.files[i].options.date)
				expect(docX['xmlInsertionComplexExample.docx'].zip.files[i].name).to.be.equal(docX['xmlInsertionComplexExpected.docx'].zip.files[i].name)
				expect(docX['xmlInsertionComplexExample.docx'].zip.files[i].options.dir).to.be.equal(docX['xmlInsertionComplexExpected.docx'].zip.files[i].options.dir)
				expect(docX['xmlInsertionComplexExample.docx'].zip.files[i].asText().length).to.be.equal(docX['xmlInsertionComplexExpected.docx'].zip.files[i].asText().length)
				expect(docX['xmlInsertionComplexExample.docx'].zip.files[i].asText()).to.be.equal(docX['xmlInsertionComplexExpected.docx'].zip.files[i].asText())

		it 'should work with closing tag in the form of <w:t>}{/body}</w:t>', () ->
			scope = {body:[{paragraph:"hello"}]}
			xmlTemplater= new DocXTemplater("""
			  <w:t>{#body}</w:t>
			  <w:t>{paragraph</w:t>
			  <w:t>}{/body}</w:t>""",{Tags:scope})

			xmlTemplater.render()
			expect(xmlTemplater.content).not.to.contain('</w:t></w:t>')

	describe 'SubContent', () ->
		sub=new SubContent("start<w:t>text</w:t>end")
		sub.start=10
		sub.end=14
		sub.refreshText()

		it "should get the text inside the tags correctly", ()->
			expect(sub.text).to.be.equal('text')

		it 'should get the text expanded to the outer xml', () ->
			sub.getOuterXml('w:t')
			expect(sub.text).to.be.equal('<w:t>text</w:t>')
		it 'should replace the inner text', () ->
			sub.replace('<w:table>Sample Table</w:table>')
			expect(sub.fullText).to.be.equal('start<w:table>Sample Table</w:table>end')
			expect(sub.text).to.be.equal('<w:table>Sample Table</w:table>')

		it 'should work with custom tags', () ->
			DocUtils.tags=
				start:'['
				end:']'
			content= """<w:t>Hello [name]</w:t>"""
			scope= {"name":"Edgar"}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar')
			DocUtils.tags=
				start:'{'
				end:'}'

		it 'should work with custom tags as strings', () ->
			DocUtils.tags=
				start:'[['
				end:']]'
			content= """<w:t>Hello [[name]]</w:t>"""
			scope= {"name":"Edgar"}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.usedTags.def).to.be.eql({'name':true})
			expect(xmlTemplater.getFullText()).to.be.eql('Hello Edgar')

		it 'should work with custom tags as strings with different length', () ->
			DocUtils.tags=
				start:'[[['
				end:']]'
			content= """<w:t>Hello [[[name]]</w:t>"""
			scope= {"name":"Edgar"}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.usedTags.def).to.be.eql({'name':true})
			expect(xmlTemplater.getFullText()).to.be.eql('Hello Edgar')

		it 'should work with custom tags and loops', ()->
			DocUtils.tags=
				start:'[[['
				end:']]'
			content= """<w:t>Hello [[[#names]][[[.]],[[[/names]]</w:t>"""
			scope= {"names":["Edgar","Mary","John"]}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar,Mary,John,')
			DocUtils.tags=
				start:'{'
				end:'}'

		it 'should work with custom tags, same for start and end', () ->
			DocUtils.tags=
				start:'@'
				end:'@'
			content= """<w:t>Hello @name@</w:t>"""
			scope= {"name":"Edgar"}
			xmlTemplater= new DocXTemplater(content,{Tags:scope})
			xmlTemplater.render()
			expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar')
			DocUtils.tags=
				start:'{'
				end:'}'

		it 'should work with loops', ()->
			content="{innertag</w:t><w:t>}"
			xmlt=new DocXTemplater(content,{Tags:{innertag:5}}).render()
			expect(xmlt.content).to.be.equal('5</w:t><w:t xml:space="preserve">')

		it 'should work with complex loops (1)', ()->
			content= """<w:t>{#looptag}{innertag</w:t><w:t>}{/looptag}</w:t>"""
			xmlt=new DocXTemplater(content,{Tags:{looptag:true}}).render()
			expect(xmlt.content).not.to.contain('</w:t></w:t>')

		it 'should work with complex loops (2)', ()->
			content= """<w:t>{#person}</w:t><w:t>{name}{/person}</w:t>"""
			xmlt=new DocXTemplater(content,{Tags:{person:[{name:"Henry"}]}}).render()
			expect(xmlt.content).not.to.contain('</w:t>Henry</w:t>')

		it 'should work with start and end (1)', ()->
			content= """a</w:t><w:t>{name}"""
			xmlt=new DocXTemplater(content,{Tags:{name:"Henry"}}).render()
			expect(xmlt.content).to.contain('a</w:t><w:t')

		it 'should work with start and end (2)', ()->
			content= """{name}</w:t><w:t>a"""
			xmlt=new DocXTemplater(content,{Tags:{name:"Henry"}}).render()
			expect(xmlt.content).to.contain('Henry</w:t><w:t')

	describe 'getting parents context',()->
		it 'should work with simple loops',()->
			content= """{#loop}{name}{/loop}"""
			xmlt=new DocXTemplater(content,{Tags:{loop:[1],name:"Henry"}}).render()
			expect(xmlt.content).to.be.equal("Henry")

		it 'should work with double loops',()->
			content= """{#loop_first}{#loop_second}{name_inner} {name_outer}{/loop_second}{/loop_first}"""
			xmlt=new DocXTemplater(content,{Tags:{loop_first:[1],loop_second:[{name_inner:"John"}],name_outer:"Henry"}}).render()
			expect(xmlt.content).to.be.equal("John Henry")

	describe 'error messages', ()->
		it 'should work with unclosed', ()->
			content= """<w:t>{tag {age}</w:t>"""
			f=()->new DocXTemplater(content).render()
			expect(f).to.throw "Unclosed tag : 'tag '"
		it 'should work with unopened', ()->
			content= """<w:t>tag }age</w:t>"""
			f=()->new DocXTemplater(content).render()
			expect(f).to.throw "Unopened tag near : 'tag }'"

	describe 'pptx generation', ()->
		it 'should work with simple pptx', ()->
			p=pptX['simpleExample.pptx']
				.setData({'name':'Edgar'})
				.render()

			expect(p.getFullText()).to.be.equal('Hello Edgar')

	if window?
		window.jasmineEnv.execute()

countFiles=0
allStarted=false

loadDocx=(name,content)->
	docX[name]=new DocxGen()
	docX[name].load(content)
	docX[name].loadedContent=content

loadPptx=(name,content)->
	pptX[name]=new PptxGen()
	pptX[name].load(content)
	pptX[name].loadedContent=content

loadImage=(name,content)->
	data[name]=content

endLoadFile=(change=0)->
	countFiles+=change
	if countFiles==0 and allStarted==true
		startTest()

loadFile=(name,callback)->
	countFiles+=1
	if fs.readFileSync?
		callback(name,fs.readFileSync(__dirname+"/../../examples/"+name,"binary"))
		return endLoadFile(-1)
	JSZipUtils.getBinaryContent '../examples/'+name,(err,data)->
		callback name,data
		return endLoadFile(-1)

for name in fileNames
	loadFile(name,loadDocx)

loadFile('simpleExample.pptx',loadPptx)

pngFiles=['image.png']

for file in pngFiles
	loadFile(file,loadImage)

allStarted=true
if window?
	setTimeout(endLoadFile,200)
else
	endLoadFile()
