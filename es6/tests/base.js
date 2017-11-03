const JSZip = require("jszip");
const {merge} = require("lodash");
const expressions = require("angular-expressions");

const Docxtemplater = require("../docxtemplater.js");
const {expect, createXmlTemplaterDocx, createDoc, imageData, getContent} = require("./utils");
const inspectModule = require("./inspect-module.js");

function angularParser(tag) {
	const expr = expressions.compile(tag.replace(/’/g, "'"));
	return {
		get(scope) {
			return expr(scope);
		},
	};
}

function getLength(obj) {
	if (obj instanceof ArrayBuffer) {
		return obj.byteLength;
	}
	return obj.length;
}

describe("DocxtemplaterLoading", function () {
	describe("ajax done correctly", function () {
		it("doc and img Data should have the expected length", function () {
			const doc = createDoc("image-example.docx");
			expect(getLength(doc.loadedContent)).to.be.equal(729580);
			expect(getLength(imageData["image.png"])).to.be.equal(18062);
		});
		it("should have the right number of files (the docx unzipped)", function () {
			const doc = createDoc("image-example.docx");
			expect(Object.keys(doc.zip.files).length).to.be.equal(16);
		});
	});
	describe("basic loading", function () {
		it("should load file image-example.docx", function () {
			const doc = createDoc("image-example.docx");
			expect(typeof doc).to.be.equal("object");
		});
	});
	describe("content_loading", function () {
		it("should load the right content for the footer", function () {
			const doc = createDoc("image-example.docx");
			const fullText = (doc.getFullText("word/footer1.xml"));
			expect(fullText.length).not.to.be.equal(0);
			expect(fullText).to.be.equal("{last_name}{first_name}{phone}");
		});
		it("should load the right content for the document", function () {
			const doc = createDoc("image-example.docx");
			const fullText = (doc.getFullText());
			expect(fullText).to.be.equal("");
		});
		it("should load the right template files for the document", function () {
			const doc = createDoc("tag-example.docx");
			const templatedFiles = (doc.getTemplatedFiles());
			expect(templatedFiles).to.be.eql(["word/header1.xml", "word/footer1.xml", "docProps/core.xml", "docProps/app.xml", "word/document.xml"]);
		});
	});
	describe("output and input", function () {
		it("should be the same", function () {
			const zip = new JSZip(createDoc("tag-example.docx").loadedContent);
			const doc = new Docxtemplater().loadZip(zip);
			const output = doc.getZip().generate({type: "base64"});
			expect(output.length).to.be.equal(90732);
			expect(output.substr(0, 50)).to.be.equal("UEsDBAoAAAAAAAAAIQAMTxYSlgcAAJYHAAATAAAAW0NvbnRlbn");
		});
	});
});

describe("inspect module", function () {
	it("should work", function () {
		function getTags(postParsed) {
			return postParsed.filter(function (part) {
				return part.type === "placeholder";
			}).reduce(function (tags, part) {
				tags[part.value] = {};
				if (part.subparsed) {
					tags[part.value] = getTags(part.subparsed);
				}
				return tags;
			}, {});
		}
		const doc = createDoc("tag-loop-example.docx");
		const iModule = inspectModule();
		doc.attachModule(iModule);
		doc.compile();
		const postParsed = iModule.fullInspected["word/document.xml"].postparsed;
		const tags = getTags(postParsed);
		expect(tags).to.be.deep.equal({
			offre: {
				nom: {},
				prix: {},
				titre: {},
			},
			nom: {},
			prenom: {},
		});
	});
});

describe("DocxtemplaterTemplatingForLoop", function () {
	describe("textLoop templating", function () {
		it("should replace all the tags", function () {
			const tags = {
				nom: "Hipp",
				prenom: "Edgar",
				telephone: "0652455478",
				description: "New Website",
				offre: [{titre: "titre1", prix: "1250"}, {titre: "titre2", prix: "2000"}, {titre: "titre3", prix: "1400", nom: "Offre"}],
			};
			const doc = createDoc("tag-loop-example.docx");
			doc.setData(tags);
			doc.render();
			expect(doc.getFullText()).to.be.equal("Votre proposition commercialeHippPrix: 1250Titre titre1HippPrix: 2000Titre titre2OffrePrix: 1400Titre titre3HippEdgar");
		});
		it("should work with loops inside loops", function () {
			const tags = {products: [{title: "Microsoft", name: "DOS", reference: "Win7", avantages: [{title: "Everyone uses it", proof: [{reason: "it is quite cheap"}, {reason: "it is quit simple"}, {reason: "it works on a lot of different Hardware"}]}]}, {title: "Linux", name: "Ubuntu", reference: "Ubuntu10", avantages: [{title: "It's very powerful", proof: [{reason: "the terminal is your friend"}, {reason: "Hello world"}, {reason: "it's free"}]}]}, {title: "Apple", name: "Mac", reference: "OSX", avantages: [{title: "It's very easy", proof: [{reason: "you can do a lot just with the mouse"}, {reason: "It's nicely designed"}]}]}]};
			const doc = createDoc("tag-product-loop.docx");
			doc.setData(tags);
			doc.render();
			const text = doc.getFullText();
			const expectedText = "MicrosoftProduct name : DOSProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed";
			expect(text.length).to.be.equal(expectedText.length);
			expect(text).to.be.equal(expectedText);
		});
		it("should work with object value", function () {
			const content = "<w:t>{#todo}{todo}{/todo}</w:t>";
			const expectedContent = '<w:t xml:space="preserve">abc</w:t>';
			const scope = {todo: {todo: "abc"}};
			const xmlTemplater = createXmlTemplaterDocx(content, {tags: scope});
			xmlTemplater.render();
			expect(getContent(xmlTemplater)).to.be.deep.equal(expectedContent);
		});
		it("should work with string value", function () {
			const content = "<w:t>{#todo}{todo}{/todo}</w:t>";
			const expectedContent = '<w:t xml:space="preserve">abc</w:t>';
			const scope = {todo: "abc"};
			const xmlTemplater = createXmlTemplaterDocx(content, {tags: scope});
			xmlTemplater.render();
			const c = getContent(xmlTemplater);
			expect(c).to.be.deep.equal(expectedContent);
		});
		it("should not have sideeffects with inverted with array length 3", function () {
			const content = "<w:t>{^todos}No {/todos}Todos</w:t><w:t>{#todos}{.}{/todos}</w:t>";
			const expectedContent = '<w:t>Todos</w:t><w:t xml:space="preserve">ABC</w:t>';
			const scope = {todos: ["A", "B", "C"]};
			const xmlTemplater = createXmlTemplaterDocx(content, {tags: scope});
			const c = getContent(xmlTemplater);
			expect(c).to.be.deep.equal(expectedContent);
		});
		it("should not have sideeffects with inverted with empty array", function () {
			const content = `<w:t>{^todos}No {/todos}Todos</w:t>
			<w:t>{#todos}{.}{/todos}</w:t>`;
			const expectedContent = `<w:t>No Todos</w:t>
			<w:t xml:space="preserve"></w:t>`;
			const scope = {todos: []};
			const xmlTemplater = createXmlTemplaterDocx(content, {tags: scope});
			const c = getContent(xmlTemplater);
			expect(c).to.be.deep.equal(expectedContent);
		});

		it("should provide inverted loops", function () {
			const content = "<w:t>{^products}No products found{/products}</w:t>";
			[
				{products: []},
				{products: false},
				{},
			].forEach(function (tags) {
				const doc = createXmlTemplaterDocx(content, {tags});
				doc.render();
				expect(doc.getFullText()).to.be.equal("No products found");
			});

			[
				{products: [{name: "Bread"}]},
				{products: true},
				{products: "Bread"},
				{products: {name: "Bread"}},
			].forEach(function (tags) {
				const doc = createXmlTemplaterDocx(content, {tags});
				doc.render();
				expect(doc.getFullText()).to.be.equal("");
			});
		});

		it("should be possible to close loops with {/}", function () {
			const content = "<w:t>{#products}Product {name}{/}</w:t>";
			const tags = {products: [{name: "Bread"}]};
			const doc = createXmlTemplaterDocx(content, {tags});
			doc.render();
			expect(doc.getFullText()).to.be.equal("Product Bread");
		});

		it("should be possible to close double loops with {/}", function () {
			const content = "<w:t>{#companies}{#products}Product {name}{/}{/}</w:t>";
			const tags = {companies: [{products: [{name: "Bread"}]}]};
			const doc = createXmlTemplaterDocx(content, {tags});
			doc.render();
			expect(doc.getFullText()).to.be.equal("Product Bread");
		});

		it("should work with complex loops", function () {
			const content = "<w:t>{title} {#users} {name} friends are : {#friends} {.</w:t>TAG..TAG<w:t>},{/friends} {/users</w:t>TAG2<w:t>}</w:t>";
			const scope = {title: "###Title###", users: [{name: "John Doe", friends: ["Jane", "Henry"]}, {}], name: "Default", friends: ["None"]};
			const doc = createXmlTemplaterDocx(content, {tags: scope});
			doc.render();
			expect(doc.getFullText()).to.be.equal("###Title###  John Doe friends are :  Jane, Henry,  Default friends are :  None, ");
		});
	});
});

describe("Changing the parser", function () {
	it("should work with uppercassing", function () {
		const content = "<w:t>Hello {name}</w:t>";
		const scope = {name: "Edgar"};
		function parser(tag) {
			return {["get"](scope) { return scope[tag].toUpperCase(); }};
		}
		const xmlTemplater = createXmlTemplaterDocx(content, {tags: scope, parser});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello EDGAR");
	});
	it("should work when setting from the Docxtemplater interface", function () {
		const doc = createDoc("tag-example.docx");
		const zip = new JSZip(doc.loadedContent);
		const d = new Docxtemplater().loadZip(zip);
		const tags = {
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
		const tags = {person: {first_name: "Hipp", last_name: "Edgar", birth_year: 1955, age: 59}};
		const doc = createDoc("angular-example.docx");
		doc.setData(tags);
		doc.parser = angularParser;
		doc.render();
		expect(doc.getFullText()).to.be.equal("Hipp Edgar 2014");
	});

	it("should work with loops", function () {
		const content = "<w:t>Hello {#person.adult}you{/person.adult}</w:t>";
		const scope = {person: {name: "Edgar", adult: true}};
		const xmlTemplater = createXmlTemplaterDocx(content, {tags: scope, parser: angularParser});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello you");
	});
});

describe("Special characters", function () {
	it("should parse placeholder containing special characters", function () {
		const content = "<w:t>Hello {&gt;name}</w:t>";
		const scope = {">name": "Edgar"};
		const xmlTemplater = createXmlTemplaterDocx(content, {tags: scope});
		const c = getContent(xmlTemplater);
		expect(c).to.be.deep.equal('<w:t xml:space="preserve">Hello Edgar</w:t>');
	});

	it("should render placeholder containing special characters", function () {
		const content = "<w:t>Hello {name}</w:t>";
		const scope = {name: "<Edgar>"};
		const xmlTemplater = createXmlTemplaterDocx(content, {tags: scope});
		const c = getContent(xmlTemplater);
		expect(c).to.be.deep.equal('<w:t xml:space="preserve">Hello &lt;Edgar&gt;</w:t>');
	});

	it("should read full text correctly", function () {
		const doc = createDoc("cyrillic.docx");
		const fullText = doc.getFullText();
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
		const doc = createDoc("cyrillic.docx");
		doc.setData({name: "Edgar"});
		doc.render();
		const fullText = doc.getFullText();
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
		const russianText = [1055, 1091, 1087, 1082, 1080, 1085, 1072];
		const russian = russianText.map(function (char) {
			return String.fromCharCode(char);
		}).join("");
		const doc = createDoc("tag-example.docx");
		const zip = new JSZip(doc.loadedContent);
		const d = new Docxtemplater().loadZip(zip);
		d.setData({last_name: russian});
		d.render();
		const outputText = d.getFullText();
		expect(outputText.substr(0, 7)).to.be.equal(russian);
	});
});

describe("Complex table example", function () {
	it("should not do anything special when loop outside of table", function () {
		["<w:t>{#tables}</w:t><w:table><w:tr><w:tc><w:t>{user}</w:t></w:tc></w:tr></w:table><w:t>{/tables}</w:t>"].forEach(function (content) {
			const scope = {
				tables: [
					{user: "John"},
					{user: "Jane"},
				],
			};
			const doc = createXmlTemplaterDocx(content, {tags: scope});
			doc.render();
			const c = getContent(doc);
			expect(c).to.be.equal('<w:t></w:t><w:table><w:tr><w:tc><w:t xml:space="preserve">John</w:t></w:tc></w:tr></w:table><w:t></w:t><w:table><w:tr><w:tc><w:t xml:space="preserve">Jane</w:t></w:tc></w:tr></w:table><w:t></w:t>');
		});
	});

	it("should work when looping inside tables", function () {
		const tags = {
			table1: [1],
			key: "value",
		};
		const template = `<w:tr>
		<w:tc><w:t>{#table1}Hi</w:t></w:tc>
		<w:tc><w:t>{/table1}</w:t> </w:tc>
		</w:tr>
		<w:tr>
		<w:tc><w:p><w:t>{#table1}Ho</w:t></w:p></w:tc>
		<w:tc><w:p><w:t>{/table1}</w:t></w:p></w:tc>
		</w:tr>
		<w:t>{key}</w:t>
		`;
		const doc = createXmlTemplaterDocx(template, {tags});
		doc.render();
		const fullText = doc.getFullText();

		expect(fullText).to.be.equal("HiHovalue");
		const expected = `<w:tr>
		<w:tc><w:t>Hi</w:t></w:tc>
		<w:tc><w:t></w:t> </w:tc>
		</w:tr>
		<w:tr>
		<w:tc><w:p><w:t>Ho</w:t></w:p></w:tc>
		<w:tc><w:p><w:t></w:t></w:p></w:tc>
		</w:tr>
		<w:t xml:space="preserve">value</w:t>
		`;
		const c = getContent(doc);
		expect(c).to.be.equal(expected);
	});
});
describe("Raw Xml Insertion", function () {
	it("should work with simple example", function () {
		const inner = "<w:p><w:r><w:t>{@complexXml}</w:t></w:r></w:p>";
		const content = `<w:document>${inner}</w:document>`;
		const scope = {complexXml: "<w:p w:rsidR=\"00612058\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val=\"FF0000\"/></w:rPr><w:t>My custom XML</w:t></w:r></w:p><w:tbl><w:tblPr><w:tblStyle w: val=\"Grilledutableau\"/><w:tblW w: w=\"0\" w:type=\"auto\"/><w:tblLook w: val=\"04A0\" w: firstRow=\"1\" w: lastRow=\"0\" w: firstColumn=\"1\" w: lastColumn=\"0\" w: noHBand=\"0\" w: noVBand=\"1\"/></w:tblPr><w:tblGrid><w: gridCol w: w=\"2952\"/><w: gridCol w: w=\"2952\"/><w: gridCol w: w=\"2952\"/></w:tblGrid><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"DDD9C3\" w:themeFill=\"background2\" w:themeFillShade=\"E6\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: b/><w: color w: val=\"000000\" w:themeColor=\"text1\"/></w:rPr></w:pPr><w:r><w:rPr><w: b/><w: color w: val=\"000000\" w:themeColor=\"text1\"/></w:rPr><w:t>Test</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"DDD9C3\" w:themeFill=\"background2\" w:themeFillShade=\"E6\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: b/><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w: b/><w: color w: val=\"FF0000\"/></w:rPr><w:t>Xml</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"DDD9C3\" w:themeFill=\"background2\" w:themeFillShade=\"E6\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val=\"FF0000\"/></w:rPr><w:t>Generated</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"C6D9F1\" w:themeFill=\"text2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"000000\" w:themeColor=\"text1\"/><w: u w: val=\"single\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w: color w: val=\"000000\" w:themeColor=\"text1\"/><w: u w: val=\"single\"/></w:rPr><w:t>Underline</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"C6D9F1\" w:themeFill=\"text2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w: color w: val=\"FF0000\"/><w: highlight w: val=\"yellow\"/></w:rPr><w:t>Highlighting</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"C6D9F1\" w:themeFill=\"text2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:rFonts w: ascii=\"Bauhaus 93\" w: hAnsi=\"Bauhaus 93\"/><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w:rFonts w: ascii=\"Bauhaus 93\" w: hAnsi=\"Bauhaus 93\"/><w: color w: val=\"FF0000\"/></w:rPr><w:t>Font</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"F2DBDB\" w:themeFill=\"accent2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00EA4B08\"><w:pPr><w: jc w: val=\"center\"/><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val=\"FF0000\"/></w:rPr><w:t>Centering</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"F2DBDB\" w:themeFill=\"accent2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: i/><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w: i/><w: color w: val=\"FF0000\"/></w:rPr><w:t>Italic</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"F2DBDB\" w:themeFill=\"accent2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"E5DFEC\" w:themeFill=\"accent4\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"E5DFEC\" w:themeFill=\"accent4\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"E5DFEC\" w:themeFill=\"accent4\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"FDE9D9\" w:themeFill=\"accent6\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"FDE9D9\" w:themeFill=\"accent6\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"FDE9D9\" w:themeFill=\"accent6\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc></w:tr></w:tbl>"};
		const doc = createXmlTemplaterDocx(content, {tags: scope});
		doc.render();
		const c = getContent(doc);
		expect(c.length).to.be.equal(content.length + scope.complexXml.length - (inner.length));
		expect(c).to.contain(scope.complexXml);
	});

	it("should work even when tags are after the xml", function () {
		const content = `<w:tbl>
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
		const scope = {
			complexXml: "<w:p><w:r><w:t>Hello</w:t></w:r></w:p>",
			name: "John",
			first_name: "Doe",
			products: [
				{year: 1550, name: "Moto", company: "Fein"},
				{year: 1987, name: "Water", company: "Test"},
				{year: 2010, name: "Bread", company: "Yu"},
			],
		};
		const doc = createXmlTemplaterDocx(content, {tags: scope});
		doc.render();
		const c = getContent(doc);
		expect(c).to.contain(scope.complexXml);
		expect(doc.getFullText()).to.be.equal("HelloJohnDoe 1550MotoFein 1987WaterTest 2010BreadYu");
	});

	it("should work with closing tag in the form of <w:t>}{/body}</w:t>", function () {
		const scope = {body: [{paragraph: "hello"}]};
		const content = `<w:t>{#body}</w:t>
		<w:t>{paragraph</w:t>
			<w:t>}{/body}</w:t>`;
		const xmlTemplater = createXmlTemplaterDocx(content, {tags: scope});

		xmlTemplater.render();
		const c = getContent(xmlTemplater);
		expect(c).not.to.contain("</w:t></w:t>");
	});
	it("should work with simple example and given options", function () {
		const scope = {xmlTag: '<w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>My custom</w:t></w:r><w:r><w:rPr><w:color w:val="00FF00"/></w:rPr><w:t>XML</w:t></w:r>'};
		const doc = createDoc("one-raw-xml-tag.docx");
		doc.setOptions({
			fileTypeConfig: merge({}, Docxtemplater.FileTypeConfig.docx, {tagRawXml: "w:r"}),
		});
		doc.setData(scope);
		doc.render();
		expect(doc.getFullText()).to.be.equal("asdfMy customXMLqwery");
	});
});

describe("Serialization", function () {
	it("should be serialiazable (useful for logging)", function () {
		const doc = createDoc("tag-example.docx");
		JSON.stringify(doc);
	});
});
