"use strict";

var docX = {};
var expect = require("chai").expect;

var expressions = require("angular-expressions");
function angularParser(tag) {
	var expr = expressions.compile(tag);
	return {
		get(scope) {
			return expr(scope);
		},
	};
}

function shouldBeSame(zip1, zip2) {
	if (typeof zip1 === "string") { zip1 = docX[zip1].getZip(); }
	if (typeof zip2 === "string") { zip2 = docX[zip2].getZip(); }

	return (() => {
		var result = [];
		Object.keys(zip1.files).map(function (filePath) {
			expect(zip1.files[filePath].options.date).not.to.be.equal(zip2.files[filePath].options.date, "Date differs");
			expect(zip1.files[filePath].name).to.be.equal(zip2.files[filePath].name, "Name differs");
			expect(zip1.files[filePath].options.dir).to.be.equal(zip2.files[filePath].options.dir, "IsDir differs");
			expect(zip1.files[filePath].asText().length).to.be.equal(zip2.files[filePath].asText().length, "Content differs");
			result.push(expect(zip1.files[filePath].asText()).to.be.equal(zip2.files[filePath].asText(), "Content differs"));
		});
		return result;
	})();
}

var xmlMatcher = require("../xmlMatcher.js");
var Docxtemplater = require("../index.js");
var DocUtils = require("../docUtils.js");
var XmlTemplater = require("../xmlTemplater.js");
var FileTypeConfig = require("../fileTypeConfig.js");

docX = {};
var pptX = {};
var data = {};
var SubContent = Docxtemplater.SubContent;
var xmlUtil = Docxtemplater.XmlUtil;
var fs = require("fs");

var fileNames = [
	"angularExample.docx",
	"cyrillic.docx",
	"imageExample.docx",
	"tableComplex2Example.docx",
	"tableComplexExample.docx",
	"tagDashLoop.docx",
	"tagDashLoopList.docx",
	"tagDashLoopTable.docx",
	"tagExample.docx",
	"tagExampleExpected.docx",
	"tagIntelligentLoopTable.docx",
	"tagIntelligentLoopTableExpected.docx",
	"tagLoopExample.docx",
	"tagProduitLoop.docx",
];

function getLength(d) {
	if ((d.length != null)) {
		return d.length;
	}
	return d.byteLength;
}

function startTest() {
	describe("DocxtemplaterBasis", function () {
		it("should be defined", function () {
			expect(Docxtemplater).not.to.be.equal(undefined);
		});
		it("should construct", function () {
			var a = new Docxtemplater();
			expect(a).not.to.be.equal(undefined);
		});
	});

	describe("xmlMatcher", function () {
		it("should work with simple tag", function () {
			var matcher = xmlMatcher("<w:t>Text</w:t>", ["w:t"]);
			expect(matcher.matches[0].array[0]).to.be.equal("<w:t>Text</w:t>");
			expect(matcher.matches[0].array[1]).to.be.equal("<w:t>");
			expect(matcher.matches[0].array[2]).to.be.equal("Text");
			expect(matcher.matches[0].offset).to.be.equal(0);
		});

		it("should work with multiple tags", function () {
			var matcher = xmlMatcher("<w:t>Text</w:t> TAG <w:t>Text2</w:t>", ["w:t"]);
			expect(matcher.matches[1].array[0]).to.be.equal("<w:t>Text2</w:t>");
			expect(matcher.matches[1].array[1]).to.be.equal("<w:t>");
			expect(matcher.matches[1].array[2]).to.be.equal("Text2");
			expect(matcher.matches[1].offset).to.be.equal(20);
		});

		it("should work with no tag, with w:t", function () {
			var matcher = xmlMatcher("Text1</w:t><w:t>Text2", ["w:t"]);
			expect(matcher.matches[0].array[0]).to.be.equal("Text1");
			expect(matcher.matches[0].array[1]).to.be.equal("");
			expect(matcher.matches[0].array[2]).to.be.equal("Text1");
			expect(matcher.matches[0].offset).to.be.equal(0);

			expect(matcher.matches[1].array[0]).to.be.equal("<w:t>Text2");
			expect(matcher.matches[1].array[1]).to.be.equal("<w:t>");
			expect(matcher.matches[1].array[2]).to.be.equal("Text2");
			expect(matcher.matches[1].offset).to.be.equal(11);
		});

		it("should work with no tag, no w:t", function () {
			var matcher = xmlMatcher("Text1", ["w:t"]);
			expect(matcher.matches[0].array[0]).to.be.equal("Text1");
			expect(matcher.matches[0].array[1]).to.be.equal("");
			expect(matcher.matches[0].array[2]).to.be.equal("Text1");
			expect(matcher.matches[0].offset).to.be.equal(0);
		});

		it("should not match with no </w:t> starter", function () {
			var matcher = xmlMatcher("TAG<w:t>Text1</w:t>", ["w:t"]);
			expect(matcher.matches[0].array[0]).to.be.equal("<w:t>Text1</w:t>");
			expect(matcher.matches[0].array[1]).to.be.equal("<w:t>");
			expect(matcher.matches[0].array[2]).to.be.equal("Text1");
			expect(matcher.matches[0].offset).to.be.equal(3);
		});

		it("should not match with no <w:t> ender", function () {
			var matcher = xmlMatcher("<w:t>Text1</w:t>TAG", ["w:t"]);
			expect(matcher.matches.length).to.be.equal(1);
		});
	});

	describe("DocxtemplaterLoading", function () {
		describe("ajax done correctly", function () {
			it("doc and img Data should have the expected length", function () {
				expect(getLength(docX["imageExample.docx"].loadedContent)).to.be.equal(729580);
				expect(getLength(data["image.png"])).to.be.equal(18062);
			});
			it("should have the right number of files (the docx unzipped)", function () {
				var doc = new Docxtemplater(docX["imageExample.docx"].loadedContent);
				expect(DocUtils.sizeOfObject(doc.zip.files)).to.be.equal(16);
			});
		});
		describe("basic loading", function () {
			it("should load file imageExample.docx", function () {
				expect(typeof docX["imageExample.docx"]).to.be.equal("object");
			});
		});
		describe("content_loading", function () {
			it("should load the right content for the footer", function () {
				var fullText = (docX["imageExample.docx"].getFullText("word/footer1.xml"));
				expect(fullText.length).not.to.be.equal(0);
				expect(fullText).to.be.equal("{last_name}{first_name}{phone}");
			});
			it("should load the right content for the document", function () {
				// default value document.xml
				var fullText = (docX["imageExample.docx"].getFullText());
				expect(fullText).to.be.equal("");
			});
		});
		describe("output and input", function () {
			it("should be the same", function () {
				var doc = new Docxtemplater(docX["tagExample.docx"].loadedContent);
				var output = doc.getZip().generate({type: "base64"});
				expect(output.length).to.be.equal(90732);
				expect(output.substr(0, 50)).to.be.equal("UEsDBAoAAAAAAAAAIQAMTxYSlgcAAJYHAAATAAAAW0NvbnRlbn");
			});
		});
	});

	describe("DocxtemplaterTemplating", function () {
		describe("text templating", function () {
			it("should change values with template vars", function () {
				var tags = {
					first_name: "Hipp",
					last_name: "Edgar",
					phone: "0652455478",
					description: "New Website",
				};
				docX["tagExample.docx"].setData(tags);
				docX["tagExample.docx"].render();
				expect(docX["tagExample.docx"].getFullText()).to.be.equal("Edgar Hipp");
				expect(docX["tagExample.docx"].getFullText("word/header1.xml")).to.be.equal("Edgar Hipp0652455478New Website");
				expect(docX["tagExample.docx"].getFullText("word/footer1.xml")).to.be.equal("EdgarHipp0652455478");
			});
			it("should export the good file", function () {
				return shouldBeSame("tagExample.docx", "tagExampleExpected.docx");
			});
		});
	});

	describe("DocxtemplaterTemplatingForLoop", function () {
		describe("textLoop templating", function () {
			it("should replace all the tags", function () {
				var tags = {
					nom: "Hipp",
					prenom: "Edgar",
					telephone: "0652455478",
					description: "New Website",
					offre: [{titre: "titre1", prix: "1250"}, {titre: "titre2", prix: "2000"}, {titre: "titre3", prix: "1400", nom: "Offre"}],
				};
				docX["tagLoopExample.docx"].setData(tags);
				docX["tagLoopExample.docx"].render();
				expect(docX["tagLoopExample.docx"].getFullText()).to.be.equal("Votre proposition commercialeHippPrix: 1250Titre titre1HippPrix: 2000Titre titre2OffrePrix: 1400Titre titre3HippEdgar");
			});
			it("should work with loops inside loops", function () {
				var tags = {products: [{title: "Microsoft", name: "DOS", reference: "Win7", avantages: [{title: "Everyone uses it", proof: [{reason: "it is quite cheap"}, {reason: "it is quit simple"}, {reason: "it works on a lot of different Hardware"}]}]}, {title: "Linux", name: "Ubuntu", reference: "Ubuntu10", avantages: [{title: "It's very powerful", proof: [{reason: "the terminal is your friend"}, {reason: "Hello world"}, {reason: "it's free"}]}]}, {title: "Apple", name: "Mac", reference: "OSX", avantages: [{title: "It's very easy", proof: [{reason: "you can do a lot just with the mouse"}, {reason: "It's nicely designed"}]}]}]};
				docX["tagProduitLoop.docx"].setData(tags);
				docX["tagProduitLoop.docx"].render();
				var text = docX["tagProduitLoop.docx"].getFullText();
				var expectedText = "MicrosoftProduct name : DOSProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed";
				expect(text.length).to.be.equal(expectedText.length);
				expect(text).to.be.equal(expectedText);
			});
			it("should not have sideeffects with inverted with array length 3", function () {
				var content = `<w:t>{^todos}No {/todos}Todos</w:t>
<w:t>{#todos}{.}{/todos}</w:t>`;
				var expectedContent = `<w:t>Todos</w:t>
<w:t>ABC</w:t>`;
				var scope = {todos: ["A", "B", "C"]};
				var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
				xmlTemplater.render();
				expect(xmlTemplater.content).to.be.deep.equal(expectedContent);
			});
			it("should not have sideeffects with inverted with empty array", function () {
				var content = `<w:t>{^todos}No {/todos}Todos</w:t>
<w:t>{#todos}{.}{/todos}</w:t>`;
				var expectedContent = `<w:t>No Todos</w:t>
<w:t></w:t>`;
				var scope = {todos: []};
				var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
				xmlTemplater.render();
				expect(xmlTemplater.content).to.be.deep.equal(expectedContent);
			});

			it("should provide inverted loops", function () {
				var content = "<w:t>{^products}No products found{/products}</w:t>";
				[
					{products: []},
					{products: false},
					{},
				].forEach(function (tags) {
					var doc = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: tags});
					doc.render();
					expect(doc.getFullText()).to.be.equal("No products found");
				});

				return [
					{products: [{name: "Bread"}]},
					{products: true},
					{products: "Bread"},
					{products: {name: "Bread"}},
				].forEach(function (tags) {
					var doc = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: tags});
					doc.render();
					expect(doc.getFullText()).to.be.equal("");
				});
			});
		});
	});

	describe("Xml Util", function () {
		it("should compute the scope between 2 <w:t>", function () {
			var c = "undefined</w:t></w:r></w:p><w:p w:rsidP=\"008A4B3C\" w:rsidR=\"007929C1\" w:rsidRDefault=\"007929C1\" w:rsidRPr=\"008A4B3C\"><w:pPr><w:pStyle w:val=\"Sous-titre\"/></w:pPr><w:r w:rsidRPr=\"008A4B3C\"><w:t xml:space=\"preserve\">Audit réalisé le ";
			var scope = xmlUtil.getListXmlElements(c);
			expect(scope).to.be.eql([{tag: "</w:t>", offset: 9}, {tag: "</w:r>", offset: 15}, {tag: "</w:p>", offset: 21}, {tag: "<w:p>", offset: 27}, {tag: "<w:r>", offset: 162}, {tag: "<w:t>", offset: 188}]);
		});
		it("should compute the scope between 2 <w:t> in an Array", function () {
			var c = "urs</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type=\"dxa\" w:w=\"4140\"/></w:tcPr><w:p w:rsidP=\"00CE524B\" w:rsidR=\"00CE524B\" w:rsidRDefault=\"00CE524B\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\"/><w:color w:val=\"auto\"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\"/><w:color w:val=\"auto\"/></w:rPr><w:t>Sur exté";
			var scope = xmlUtil.getListXmlElements(c);
			expect(scope).to.be.eql([{tag: "</w:t>", offset: 3}, {tag: "</w:r>", offset: 9}, {tag: "</w:p>", offset: 15}, {tag: "</w:tc>", offset: 21}, {tag: "<w:tc>", offset: 28}, {tag: "<w:p>", offset: 83}, {tag: "<w:r>", offset: 268}, {tag: "<w:t>", offset: 374}]);
		});
		it("should compute the scope between a w:t in an array and the other outside", function () {
			var c = "defined </w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00137C91\" w:rsidRDefault=\"00137C91\"><w:r w:rsidRPr=\"00B12C70\"><w:rPr><w:bCs/></w:rPr><w:t>Coût ressources ";
			var scope = xmlUtil.getListXmlElements(c);
			expect(scope).to.be.eql([{tag: "</w:t>", offset: 8}, {tag: "</w:r>", offset: 14}, {tag: "</w:p>", offset: 20}, {tag: "</w:tc>", offset: 26}, {tag: "</w:tr>", offset: 33}, {tag: "</w:tbl>", offset: 40}, {tag: "<w:p>", offset: 188}, {tag: "<w:r>", offset: 257}, {tag: "<w:t>", offset: 306}]);
		});
	});

	describe("Dash Loop Testing", function () {
		it("dash loop ok on simple table -> w:tr", function () {
			var tags = {os: [{type: "linux", price: "0", reference: "Ubuntu10"}, {type: "DOS", price: "500", reference: "Win7"}, {type: "apple", price: "1200", reference: "MACOSX"}]};
			docX["tagDashLoop.docx"].setData(tags);
			docX["tagDashLoop.docx"].render();
			var expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
			var text = docX["tagDashLoop.docx"].getFullText();
			expect(text).to.be.equal(expectedText);
		});
		it("dash loop ok on simple table -> w:table", function () {
			var tags = {os: [{type: "linux", price: "0", reference: "Ubuntu10"}, {type: "DOS", price: "500", reference: "Win7"}, {type: "apple", price: "1200", reference: "MACOSX"}]};
			docX["tagDashLoopTable.docx"].setData(tags);
			docX["tagDashLoopTable.docx"].render();
			var expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
			var text = docX["tagDashLoopTable.docx"].getFullText();
			expect(text).to.be.equal(expectedText);
		});
		it("dash loop ok on simple list -> w:p", function () {
			var tags = {os: [{type: "linux", price: "0", reference: "Ubuntu10"}, {type: "DOS", price: "500", reference: "Win7"}, {type: "apple", price: "1200", reference: "MACOSX"}]};
			docX["tagDashLoopList.docx"].setData(tags);
			docX["tagDashLoopList.docx"].render();
			var expectedText = "linux 0 Ubuntu10 DOS 500 Win7 apple 1200 MACOSX ";
			var text = docX["tagDashLoopList.docx"].getFullText();
			expect(text).to.be.equal(expectedText);
		});
	});

	describe("Intelligent Loop Tagging", function () {
		it("should work with tables", function () {
			var tags = {clients: [{first_name: "John", last_name: "Doe", phone: "+33647874513"}, {first_name: "Jane", last_name: "Doe", phone: "+33454540124"}, {first_name: "Phil", last_name: "Kiel", phone: "+44578451245"}, {first_name: "Dave", last_name: "Sto", phone: "+44548787984"}]};
			docX["tagIntelligentLoopTable.docx"].setData(tags);
			docX["tagIntelligentLoopTable.docx"].render();
			var expectedText = "JohnDoe+33647874513JaneDoe+33454540124PhilKiel+44578451245DaveSto+44548787984";
			var text = docX["tagIntelligentLoopTableExpected.docx"].getFullText();
			expect(text).to.be.equal(expectedText);
			return shouldBeSame("tagIntelligentLoopTable.docx", "tagIntelligentLoopTableExpected.docx");
		});
	});

	describe("intelligent tagging multiple tables", function () {
		it("should work with multiple rows", function () {
			var content = `<w:tbl>
	<w:tr>
		<w:tc>
			<w:p>
				<w:r>
					<w:t>{#clauses} Clause</w:t>
				</w:r>
			</w:p>
		</w:tc>
	</w:tr>
	<w:tr>
		<w:tc>
			<w:p>
				<w:r>
					<w:t>{/clauses}</w:t>
				</w:r>
			</w:p>
		</w:tc>
	</w:tr>
</w:tbl>
			`;
			var scope = {};
			var doc = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope, intelligentTagging: true});
			return doc.render();
		});
	});

	describe("getTags", function () {
		it("should work with simple document", function () {
			var d = new Docxtemplater(docX["tagExample.docx"].loadedContent, {}, {intelligentTagging: false});
			var tempVars = d.getTags();
			expect(tempVars).to.be.eql([{fileName: "word/header1.xml", vars: {def: { }, undef: {last_name: true, first_name: true, phone: true, description: true}}}, {fileName: "word/footer1.xml", vars: {def: { }, undef: {last_name: true, first_name: true, phone: true}}}, {fileName: "word/document.xml", vars: {def: { }, undef: {last_name: true, first_name: true}}}]);
		});
		it("should work with loop document", function () {
			docX["tagLoopExample.docx"] = new Docxtemplater(docX["tagLoopExample.docx"].loadedContent, {}, {intelligentTagging: false});
			var tempVars = docX["tagLoopExample.docx"].getTags();
			expect(tempVars).to.be.eql([{fileName: "word/header1.xml", vars: {def: { }, undef: {nom: true, prenom: true}}}, {fileName: "word/footer1.xml", vars: {def: { }, undef: {nom: true, prenom: true, telephone: true}}}, {fileName: "word/document.xml", vars: {def: { }, undef: {offre: {nom: true, prix: true, titre: true}, nom: true, prenom: true}}}]);
		});
	});

	describe("xmlTemplater", function () {
		it("should work with simpleContent", function () {
			var content = "<w:t>Hello {name}</w:t>";
			var scope = {name: "Edgar"};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
		});
		it("should work with {.} for this", function () {
			var content = "<w:t>Hello {.}</w:t>";
			var scope = "Edgar";
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
		});

		it("should work with {.} for this inside loop", function () {
			var content = "<w:t>Hello {#names}{.},{/names}</w:t>";
			var scope = {names: ["Edgar", "John"]};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,John,");
		});

		it("should work with non w:t content", function () {
			var content = "Hello {name}";
			var scope = {name: "edgar"};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.content).to.be.equal("Hello edgar");
		});
		it("should work with tag in two elements", function () {
			var content = "<w:t>Hello {</w:t><w:t>name}</w:t>";
			var scope = {name: "Edgar"};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
		});

		it("should work with splitted tag in three elements", function () {
			var content = "<w:t>Hello {</w:t><w:t>name</w:t><w:t>}</w:t>";
			var scope = {name: "Edgar"};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
		});

		it("should work with simple loop with object value", function () {
			var content = "<w:t>Hello {#person}{name}{/person}</w:t>";
			var scope = {person: {name: "Edgar"}};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
		});

		it("should work with simple Loop", function () {
			var content = "<w:t>Hello {#names}{name},{/names}</w:t>";
			var scope = {names: [{name: "Edgar"}, {name: "Mary"}, {name: "John"}]};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,Mary,John,");
		});
		it("should work with simple Loop with boolean value", function () {
			var content = "<w:t>Hello {#showName}{name},{/showName}</w:t>";
			var scope = {showName: true, name: "Edgar"};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,");
			scope = {showName: false, name: "Edgar"};
			xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello ");
		});
		it("should work with dash Loop", function () {
			var content = "<w:p><w:t>Hello {-w:p names}{name},{/names}</w:t></w:p>";
			var scope = {names: [{name: "Edgar"}, {name: "Mary"}, {name: "John"}]};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,Hello Mary,Hello John,");
		});
		it("should work with loop and innerContent", function () {
			var content = "</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:pStyle w:val=\"Titre1\"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRPr=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00923B77\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>oof</w:t></w:r><w:r><w:t xml:space=\"preserve\">} </w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>It works because</w:t></w:r><w:r><w:t xml:space=\"preserve\"> {</w:t></w:r><w:r w:rsidR=\"006F26AC\"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00FD04E9\" w:rsidRDefault=\"00923B77\"><w:r><w:t>";
			var scope = {title: "Everyone uses it", proof: [{reason: "it is quite cheap"}, {reason: "it is quit simple"}, {reason: "it works on a lot of different Hardware"}]};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware");
		});
		it("should work with loop and innerContent (with last)", function () {
			var content = "Start </w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:pStyle w:val=\"Titre1\"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRPr=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00923B77\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>oof</w:t></w:r><w:r><w:t xml:space=\"preserve\">} </w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>It works because</w:t></w:r><w:r><w:t xml:space=\"preserve\"> {</w:t></w:r><w:r w:rsidR=\"006F26AC\"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00FD04E9\" w:rsidRDefault=\"00923B77\"><w:r><w:t> End";
			var scope = {title: "Everyone uses it", proof: [{reason: "it is quite cheap"}, {reason: "it is quit simple"}, {reason: "it works on a lot of different Hardware"}]};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Start Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware End");
		});
		it("should work with not w:t tag (if the for loop is like {#forloop} text {/forloop}) ", function () {
			var content = "Hello {#names}{name},{/names}";
			var scope = {names: [{name: "Edgar"}, {name: "Mary"}, {name: "John"}]};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.content).to.be.equal("Hello Edgar,Mary,John,");
		});
		it("should work with delimiter in value", function () {
			var content = "<w:t>Hello {name}</w:t>";
			var scope = {name: "{edgar}"};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello {edgar}");
		});
		it("should work with delimiter in value )with loop)", function () {
			var content = "Hello {#names}{name},{/names}";
			var scope = {names: [{name: "{John}"}, {name: "M}}{ary"}, {name: "Di{{{gory"}]};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello {John},M}}{ary,Di{{{gory,");
		});
		it("should work when replacing with exact same value", function () {
			var content = "<w:p><w:t xml:space=\"preserve\">Hello {name}</w:t></w:p>";
			var scope = {name: "{name}"};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			xmlTemplater.render();
			xmlTemplater.getFullText();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello {name}");
		});

		it("should work with equations", function () {
			var content = `<w:p>
	<m:oMathPara>
		<m:oMath>
		<m:sSup>
			<m:e>
			<m:r>
				<m:t>y</m:t>
			</m:r>
			</m:e>
			<m:sup>
			<m:r>
				<m:t>{bar}</m:t>
			</m:r>
			</m:sup>
		</m:sSup>
		<m:r>
			<m:t>*</m:t>
		</m:r>
		<m:r>
			<m:t>cos⁡</m:t>
		</m:r>
		<m:r>
			<m:t>(</m:t>
		</m:r>
		<m:r>
			<m:t xml:space="preserve"> {foo}</m:t>
		</m:r>
		<m:r>
			<m:t>+{baz})</m:t>
		</m:r>
		</m:oMath>
	</m:oMathPara>
	</w:p>
	<w:p>
		<w:t>Hello {</w:t>
		<w:t>name</w:t>
		<w:t>}</w:t>
</w:p>
			`;
			var scope = {name: "John", foo: "MyFoo", bar: "MyBar", baz: "MyBaz"};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			expect(xmlTemplater.getFullText()).to.be.equal("y{bar}*cos⁡( {foo}+{baz})Hello {name}");
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("yMyBar*cos⁡( MyFoo+MyBaz)Hello John");
		});
	});

	describe("Change the nullGetter", function () {
		it("should work with null", function () {
			var content = "<w:t>Hello {name}</w:t>";
			var scope = {};
			function parser() { return "null"; }
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope, nullGetter: parser});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello null");
		});
	});
	describe("Changing the parser", function () {
		it("should work with uppercassing", function () {
			var content = "<w:t>Hello {name}</w:t>";
			var scope = {name: "Edgar"};
			function parser(tag) {
				return {["get"](scope) { return scope[tag].toUpperCase(); }};
			}
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope, parser: parser});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello EDGAR");
		});
		it("should work when setting from the DocXGen interface", function () {
			var d = new Docxtemplater(docX["tagExample.docx"].loadedContent);
			var tags = {
				first_name: "Hipp",
				last_name: "Edgar",
				phone: "0652455478",
				description: "New Website",
			};
			d.setData(tags);
			d.parser = function (tag) {
				return {["get"](scope) { return scope[tag].toUpperCase(); }};
			};
			d.render();
			expect(d.getFullText()).to.be.equal("EDGAR HIPP");
			expect(d.getFullText("word/header1.xml")).to.be.equal("EDGAR HIPP0652455478NEW WEBSITE");
			expect(d.getFullText("word/footer1.xml")).to.be.equal("EDGARHIPP0652455478");
		});

		it("should work with angular parser", function () {
			var tags = {person: {first_name: "Hipp", last_name: "Edgar", birth_year: 1955, age: 59}};
			docX["angularExample.docx"].setData(tags);
			docX["angularExample.docx"].parser = angularParser;
			docX["angularExample.docx"].render();
			expect(docX["angularExample.docx"].getFullText()).to.be.equal("Hipp Edgar 2014");
		});

		it("should work with loops", function () {
			var content = "<w:t>Hello {#person.adult}you{/person.adult}</w:t>";
			var scope = {person: {name: "Edgar", adult: true}};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope, parser: angularParser});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello you");
		});
	});

	describe("Non Utf-8 characters", function () {
		it("should read full text correctly", function () {
			var fullText = docX["cyrillic.docx"].getFullText();
			expect(fullText.charCodeAt(0)).to.be.equal(1024);
			expect(fullText.charCodeAt(1)).to.be.equal(1050);
			expect(fullText.charCodeAt(2)).to.be.equal(1048);
			expect(fullText.charCodeAt(3)).to.be.equal(1046);
			expect(fullText.charCodeAt(4)).to.be.equal(1044);
			expect(fullText.charCodeAt(5)).to.be.equal(1045);
			expect(fullText.charCodeAt(6)).to.be.equal(1039);
			expect(fullText.charCodeAt(7)).to.be.equal(1040);
		});
		it("should still read full text after applying tags", function () {
			docX["cyrillic.docx"].setData({name: "Edgar"});
			docX["cyrillic.docx"].render();
			var fullText = docX["cyrillic.docx"].getFullText();
			expect(fullText.charCodeAt(0)).to.be.equal(1024);
			expect(fullText.charCodeAt(1)).to.be.equal(1050);
			expect(fullText.charCodeAt(2)).to.be.equal(1048);
			expect(fullText.charCodeAt(3)).to.be.equal(1046);
			expect(fullText.charCodeAt(4)).to.be.equal(1044);
			expect(fullText.charCodeAt(5)).to.be.equal(1045);
			expect(fullText.charCodeAt(6)).to.be.equal(1039);
			expect(fullText.charCodeAt(7)).to.be.equal(1040);
			expect(fullText.indexOf("Edgar")).to.be.equal(9);
		});
		it("should insert russian characters", function () {
			var russianText = [1055, 1091, 1087, 1082, 1080, 1085, 1072];
			var russian = ((() => {
				var result = [];
				for (var i = 0, char; i < russianText.length; i++) {
					char = russianText[i];
					result.push(String.fromCharCode(char));
				}
				return result;
			})());
			russian = russian.join("");
			var d = new Docxtemplater(docX["tagExample.docx"].loadedContent);
			d.setData({last_name: russian});
			d.render();
			var outputText = d.getFullText();
			expect(outputText.substr(0, 7)).to.be.equal(russian);
		});
	});

	describe("Complex table example", function () {
		it("should work with simple table", function () {
			docX["tableComplex2Example.docx"].setData({
				table1: [{
					t1data1: "t1-1row-data1",
					t1data2: "t1-1row-data2",
					t1data3: "t1-1row-data3",
					t1data4: "t1-1row-data4",
				}, {
					t1data1: "t1-2row-data1",
					t1data2: "t1-2row-data2",
					t1data3: "t1-2row-data3",
					t1data4: "t1-2row-data4",
				},
				{
					t1data1: "t1-3row-data1",
					t1data2: "t1-3row-data2",
					t1data3: "t1-3row-data3",
					t1data4: "t1-3row-data4",
				}],
				t1total1: "t1total1-data",
				t1total2: "t1total2-data",
				t1total3: "t1total3-data",
			});
			docX["tableComplex2Example.docx"].render();
			var fullText = docX["tableComplex2Example.docx"].getFullText();
			expect(fullText).to.be.equal("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data");
		});
		it("should work with more complex table", function () {
			// set the templateVariables
			docX["tableComplexExample.docx"].setData({
				table2: [{
					t2data1: "t2-1row-data1",
					t2data2: "t2-1row-data2",
					t2data3: "t2-1row-data3",
					t2data4: "t2-1row-data4",
				},
				{
					t2data1: "t2-2row-data1",
					t2data2: "t2-2row-data2",
					t2data3: "t2-2row-data3",
					t2data4: "t2-2row-data4",
				}],
				t1total1: "t1total1-data",
				t1total2: "t1total2-data",
				t1total3: "t1total3-data",
				t2total1: "t2total1-data",
				t2total2: "t2total2-data",
				t2total3: "t2total3-data",
			});
			// apply them
			docX["tableComplexExample.docx"].render();
			// apply them
			var fullText = docX["tableComplexExample.docx"].getFullText();
			expect(fullText).to.be.equal("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4TOTALt1total1-datat1total2-datat1total3-dataTABLE2COLUMN1COLUMN2COLUMN3COLUMN4t2-1row-data1t2-1row-data2t2-1row-data3t2-1row-data4t2-2row-data1t2-2row-data2t2-2row-data3t2-2row-data4TOTALt2total1-datat2total2-datat2total3-data");
		});
		it("should work with two tables and intelligentTagging", function () {
			var tags = {
				table1: [1],
				key: "value",
			};
			var template = `TAG
<w:tr>
<w:tc><w:t>{#table1}Hi</w:t></w:tc>
<w:tc><w:t>{/table1}</w:t> </w:tc>
</w:tr>
<w:tr>
<w:tc><w:t>{#table1}Ho</w:t></w:tc>
<w:tc><w:p><w:t>{/table1}</w:t> </w:p>
</w:tc>
</w:tr>
<w:t>{key}</w:t>
TAG`;
			var doc = new XmlTemplater(template, {fileTypeConfig: FileTypeConfig.docx, tags: tags, intelligentTagging: true});
			doc.render();
			var fullText = doc.getFullText();

			expect(fullText).to.be.equal("HiHovalue");
			var expected = `TAG
<w:tr>
<w:tc><w:t xml:space="preserve">Hi</w:t></w:tc>
<w:tc><w:t xml:space="preserve"></w:t> </w:tc>
</w:tr>
<w:tr>
<w:tc><w:t xml:space="preserve">Ho</w:t></w:tc>
<w:tc><w:p><w:t xml:space="preserve"></w:t> </w:p>
</w:tc>
</w:tr>
<w:t xml:space="preserve">value</w:t>
TAG`;
			expect(doc.content).to.be.equal(expected);
		});
	});
	describe("Raw Xml Insertion", function () {
		it("should work with simple example", function () {
			var inner = "<w:p><w:r><w:t>{@complexXml}</w:t></w:r></w:p>";
			var content = `<w:document>${inner}</w:document>`;
			var scope = {complexXml: "<w:p w:rsidR=\"00612058\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val=\"FF0000\"/></w:rPr><w:t>My custom XML</w:t></w:r></w:p><w:tbl><w:tblPr><w:tblStyle w: val=\"Grilledutableau\"/><w:tblW w: w=\"0\" w:type=\"auto\"/><w:tblLook w: val=\"04A0\" w: firstRow=\"1\" w: lastRow=\"0\" w: firstColumn=\"1\" w: lastColumn=\"0\" w: noHBand=\"0\" w: noVBand=\"1\"/></w:tblPr><w:tblGrid><w: gridCol w: w=\"2952\"/><w: gridCol w: w=\"2952\"/><w: gridCol w: w=\"2952\"/></w:tblGrid><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"DDD9C3\" w:themeFill=\"background2\" w:themeFillShade=\"E6\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: b/><w: color w: val=\"000000\" w:themeColor=\"text1\"/></w:rPr></w:pPr><w:r><w:rPr><w: b/><w: color w: val=\"000000\" w:themeColor=\"text1\"/></w:rPr><w:t>Test</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"DDD9C3\" w:themeFill=\"background2\" w:themeFillShade=\"E6\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: b/><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w: b/><w: color w: val=\"FF0000\"/></w:rPr><w:t>Xml</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"DDD9C3\" w:themeFill=\"background2\" w:themeFillShade=\"E6\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val=\"FF0000\"/></w:rPr><w:t>Generated</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"C6D9F1\" w:themeFill=\"text2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"000000\" w:themeColor=\"text1\"/><w: u w: val=\"single\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w: color w: val=\"000000\" w:themeColor=\"text1\"/><w: u w: val=\"single\"/></w:rPr><w:t>Underline</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"C6D9F1\" w:themeFill=\"text2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w: color w: val=\"FF0000\"/><w: highlight w: val=\"yellow\"/></w:rPr><w:t>Highlighting</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"C6D9F1\" w:themeFill=\"text2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:rFonts w: ascii=\"Bauhaus 93\" w: hAnsi=\"Bauhaus 93\"/><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w:rFonts w: ascii=\"Bauhaus 93\" w: hAnsi=\"Bauhaus 93\"/><w: color w: val=\"FF0000\"/></w:rPr><w:t>Font</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"F2DBDB\" w:themeFill=\"accent2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00EA4B08\"><w:pPr><w: jc w: val=\"center\"/><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val=\"FF0000\"/></w:rPr><w:t>Centering</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"F2DBDB\" w:themeFill=\"accent2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: i/><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w: i/><w: color w: val=\"FF0000\"/></w:rPr><w:t>Italic</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"F2DBDB\" w:themeFill=\"accent2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"E5DFEC\" w:themeFill=\"accent4\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"E5DFEC\" w:themeFill=\"accent4\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"E5DFEC\" w:themeFill=\"accent4\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"FDE9D9\" w:themeFill=\"accent6\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"FDE9D9\" w:themeFill=\"accent6\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"FDE9D9\" w:themeFill=\"accent6\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc></w:tr></w:tbl>"};
			var doc = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			doc.render();
			expect(doc.content.length).to.be.equal(content.length + scope.complexXml.length - (inner.length));
			expect(doc.content).to.contain(scope.complexXml);
		});

		it("should work even when tags are after the xml", function () {
			var content = `<w:tbl>
	<w:tr>
		<w:tc>
			<w:p>
				<w:r>
					<w:t>{@complexXml}</w:t>
				</w:r>
			</w:p>
		</w:tc>
	</w:tr>
	<w:tr>
		<w:tc>
			<w:p>
				<w:r>
					<w:t>{name}</w:t>
				</w:r>
			</w:p>
		</w:tc>
	</w:tr>
	<w:tr>
		<w:tc>
			<w:p>
				<w:r>
					<w:t>{first_name}</w:t>
				</w:r>
			</w:p>
		</w:tc>
	</w:tr>
	<w:tr>
		<w:tc>
			<w:p>
				<w:r>
					<w:t>{#products} {year}</w:t>
				</w:r>
			</w:p>
		</w:tc>
		<w:tc>
			<w:p>
				<w:r>
					<w:t>{name}</w:t>
				</w:r>
			</w:p>
		</w:tc>
		<w:tc>
			<w:p>
				<w:r>
					<w:t>{company}{/products}</w:t>
				</w:r>
			</w:p>
		</w:tc>
	</w:tr>
</w:tbl>
			`;
			var scope = {
				complexXml: "<w:p><w:r><w:t>Hello</w:t></w:r></w:p>",
				name: "John",
				first_name: "Doe",
				products: [
					{year: 1550, name: "Moto", company: "Fein"},
					{year: 1987, name: "Water", company: "Test"},
					{year: 2010, name: "Bread", company: "Yu"},
				],
			};
			var doc = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
			doc.render();
			expect(doc.content).to.contain(scope.complexXml);
			expect(doc.getFullText()).to.be.equal("HelloJohnDoe 1550MotoFein 1987WaterTest 2010BreadYu");
		});

		it("should work with closing tag in the form of <w:t>}{/body}</w:t>", function () {
			var scope = {body: [{paragraph: "hello"}]};
			var content = `<w:t>{#body}</w:t>
<w:t>{paragraph</w:t>
<w:t>}{/body}</w:t>`;
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});

			xmlTemplater.render();
			expect(xmlTemplater.content).not.to.contain("</w:t></w:t>");
		});
	});

	describe("SubContent", function () {
		var sub = null;
		beforeEach(function () {
			sub = new SubContent("start<w:t>text</w:t>end");
			sub.start = 10;
			sub.end = 14;
			return sub.refreshText();
		});

		it("should get the text inside the tags correctly", function () {
			expect(sub.text).to.be.equal("text");
		});

		it("should get the text expanded to the outer xml", function () {
			sub.getOuterXml("w:t");
			expect(sub.text).to.be.equal("<w:t>text</w:t>");
		});
		it("should replace the inner text", function () {
			sub.getOuterXml("w:t");
			sub.replace("<w:table>Sample Table</w:table>");
			expect(sub.fullText).to.be.equal("start<w:table>Sample Table</w:table>end");
			expect(sub.text).to.be.equal("<w:table>Sample Table</w:table>");
		});

		it("should work with custom tags", function () {
			var delimiters = {
				start: "[",
				end: "]",
			};
			var content = "<w:t>Hello [name]</w:t>";
			var scope = {name: "Edgar"};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope, delimiters});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
		});

		it("should work with custom tags as strings", function () {
			var delimiters = {
				start: "[[",
				end: "]]",
			};
			var content = "<w:t>Hello [[name]]</w:t>";
			var scope = {name: "Edgar"};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope, delimiters});
			xmlTemplater.render();
			expect(xmlTemplater.usedTags.def).to.be.eql({name: true});
			expect(xmlTemplater.getFullText()).to.be.eql("Hello Edgar");
		});

		it("should work with custom tags as strings with different length", function () {
			var delimiters = {
				start: "[[[",
				end: "]]",
			};
			var content = "<w:t>Hello [[[name]]</w:t>";
			var scope = {name: "Edgar"};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope, delimiters});
			xmlTemplater.render();
			expect(xmlTemplater.usedTags.def).to.be.eql({name: true});
			expect(xmlTemplater.getFullText()).to.be.eql("Hello Edgar");
		});

		it("should work with custom tags and loops", function () {
			var delimiters = {
				start: "[[[",
				end: "]]",
			};
			var content = "<w:t>Hello [[[#names]][[[.]],[[[/names]]</w:t>";
			var scope = {names: ["Edgar", "Mary", "John"]};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope, delimiters});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,Mary,John,");
		});

		it("should work with custom tags, same for start and end", function () {
			var delimiters = {
				start: "@",
				end: "@",
			};
			var content = "<w:t>Hello @name@</w:t>";
			var scope = {name: "Edgar"};
			var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope, delimiters});
			xmlTemplater.render();
			expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
		});

		it("should work with loops", function () {
			var content = "{innertag</w:t><w:t>}";
			var xmlt = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: {innertag: 5}}).render();
			expect(xmlt.content).to.be.equal('5</w:t><w:t xml:space="preserve">');
		});

		it("should work with complex loops (1)", function () {
			var content = "<w:t>{#looptag}{innertag</w:t><w:t>}{/looptag}</w:t>";
			var xmlt = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: {looptag: true}}).render();
			expect(xmlt.content).not.to.contain("</w:t></w:t>");
		});

		it("should work with complex loops (2)", function () {
			var content = "<w:t>{#person}</w:t><w:t>{name}{/person}</w:t>";
			var xmlt = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: {person: [{name: "Henry"}]}}).render();
			expect(xmlt.content).to.contain("Henry</w:t>");
			expect(xmlt.content).not.to.contain("</w:t>Henry</w:t>");
		});

		it("should work with start and end (1)", function () {
			var content = "a</w:t><w:t>{name}";
			var xmlt = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: {name: "Henry"}}).render();
			expect(xmlt.content).to.contain("a</w:t><w:t");
		});

		it("should work with start and end (2)", function () {
			var content = "{name}</w:t><w:t>a";
			var xmlt = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: {name: "Henry"}}).render();
			expect(xmlt.content).to.contain("Henry</w:t><w:t");
		});
	});

	describe("getting parents context", function () {
		it("should work with simple loops", function () {
			var content = "<w:t>{#loop}{name}{/loop}</w:t>";
			var xmlt = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: {loop: [1], name: "Henry"}}).render();
			expect(xmlt.content).to.be.equal("<w:t>Henry</w:t>");
		});

		it("should work with double loops", function () {
			var content = "<w:t>{#loop_first}{#loop_second}{name_inner} {name_outer}{/loop_second}{/loop_first}</w:t>";
			var xmlt = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: {loop_first: [1], loop_second: [{name_inner: "John"}], name_outer: "Henry"}}).render();
			expect(xmlt.content).to.be.equal("<w:t>John Henry</w:t>");
		});
	});

	require("./compilation");
	require("./errors");
	require("./speed");

	describe("pptx generation", function () {
		it("should work with simple pptx", function () {
			var p = pptX["simpleExample.pptx"].setData({name: "Edgar"}).render();
			expect(p.getFullText()).to.be.equal("Hello Edgar");
		});
	});
	if ((typeof window !== "undefined" && window != null)) {
		return window.mocha.run();
	}

	describe("Serialization", function () {
		it("should be serialiazable", function () {
			JSON.stringify(docX["tagExample.docx"]);
		});
	});
}

var countFiles = 0;
var allStarted = false;

function loadDocx(name, content) {
	docX[name] = new Docxtemplater();
	docX[name].setOptions({fileType: "docx"});
	docX[name].load(content);
	docX[name].loadedContent = content;
}

function loadPptx(name, content) {
	pptX[name] = new Docxtemplater();
	pptX[name].setOptions({fileType: "pptx"});
	pptX[name].load(content);
	pptX[name].loadedContent = content;
}

function loadImage(name, content) {
	data[name] = content;
}

function endLoadFile(change) {
	change = change || 0;
	countFiles += change;
	if (countFiles === 0 && allStarted === true) {
		return startTest();
	}
}

function loadFile(name, callback) {
	countFiles += 1;
	if ((fs.readFileSync != null)) {
		var path = require("path");
		var buffer = fs.readFileSync(path.join(__dirname, "/../../examples/", name), "binary");
		endLoadFile(-1);
		return callback(name, buffer);
	}
	return JSZipUtils.getBinaryContent("../examples/" + name, function (err, data) {
		if (err) {
			throw err;
		}
		callback(name, data);
		return endLoadFile(-1);
	});
}

fileNames.map(function (fileName) {
	loadFile(fileName, loadDocx);
});

loadFile("simpleExample.pptx", loadPptx);

var pngFiles = ["image.png"];

for (var j = 0, file; j < pngFiles.length; j++) {
	file = pngFiles[j];
	loadFile(file, loadImage);
}

allStarted = true;
if ((typeof window !== "undefined" && window != null)) {
	setTimeout(endLoadFile, 200);
}
else {
	endLoadFile();
}
