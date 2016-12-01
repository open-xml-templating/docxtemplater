const testUtils = require("./utils");
const expect = testUtils.expect;
const JSZip = require("jszip");
const Docxtemplater = require("../docxtemplater.js");
const xmlMatcher = require("../xml-matcher.js");
const DocUtils = require("../doc-utils.js");
const _ = require("lodash");
const InspectModule = require("./inspect-module.js");

const expressions = require("angular-expressions");
function angularParser(tag) {
	const expr = expressions.compile(tag);
	return {
		get(scope) {
			return expr(scope);
		},
	};
}

describe("DocxtemplaterBasis", function () {
	it("should be defined", function () {
		expect(Docxtemplater).not.to.be.equal(undefined);
	});
	it("should construct", function () {
		const doc = new Docxtemplater();
		expect(doc).not.to.be.equal(undefined);
	});
});

describe("xmlMatcher", function () {
	it("should work with simple tag", function () {
		const matcher = xmlMatcher("<w:t>Text</w:t>", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("<w:t>Text</w:t>");
		expect(matcher.matches[0].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[0].array[2]).to.be.equal("Text");
		expect(matcher.matches[0].offset).to.be.equal(0);
	});

	it("should work with multiple tags", function () {
		const matcher = xmlMatcher("<w:t>Text</w:t> TAG <w:t>Text2</w:t>", ["w:t"]);
		expect(matcher.matches[1].array[0]).to.be.equal("<w:t>Text2</w:t>");
		expect(matcher.matches[1].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[1].array[2]).to.be.equal("Text2");
		expect(matcher.matches[1].offset).to.be.equal(20);
	});

	it("should work with no tag, with w:t", function () {
		const matcher = xmlMatcher("Text1</w:t><w:t>Text2", ["w:t"]);
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
		const matcher = xmlMatcher("Text1", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("Text1");
		expect(matcher.matches[0].array[1]).to.be.equal("");
		expect(matcher.matches[0].array[2]).to.be.equal("Text1");
		expect(matcher.matches[0].offset).to.be.equal(0);
	});

	it("should not match with no </w:t> starter", function () {
		const matcher = xmlMatcher("TAG<w:t>Text1</w:t>", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("<w:t>Text1</w:t>");
		expect(matcher.matches[0].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[0].array[2]).to.be.equal("Text1");
		expect(matcher.matches[0].offset).to.be.equal(3);
	});

	it("should not match with no <w:t> ender", function () {
		const matcher = xmlMatcher("<w:t>Text1</w:t>TAG", ["w:t"]);
		expect(matcher.matches.length).to.be.equal(1);
	});
});

function getLength(obj) {
	if (obj instanceof ArrayBuffer) {
		return obj.byteLength;
	}
	return obj.length;
}

describe("DocxtemplaterLoading", function () {
	describe("ajax done correctly", function () {
		it("doc and img Data should have the expected length", function () {
			const doc = testUtils.createDoc("image-example.docx");
			expect(getLength(doc.loadedContent)).to.be.equal(729580);
			expect(getLength(testUtils.imageData["image.png"])).to.be.equal(18062);
		});
		it("should have the right number of files (the docx unzipped)", function () {
			const doc = testUtils.createDoc("image-example.docx");
			expect(DocUtils.sizeOfObject(doc.zip.files)).to.be.equal(16);
		});
	});
	describe("basic loading", function () {
		it("should load file image-example.docx", function () {
			const doc = testUtils.createDoc("image-example.docx");
			expect(typeof doc).to.be.equal("object");
		});
	});
	describe("content_loading", function () {
		it("should load the right content for the footer", function () {
			const doc = testUtils.createDoc("image-example.docx");
			const fullText = (doc.getFullText("word/footer1.xml"));
			expect(fullText.length).not.to.be.equal(0);
			expect(fullText).to.be.equal("{last_name}{first_name}{phone}");
		});
		it("should load the right content for the document", function () {
			const doc = testUtils.createDoc("image-example.docx");
			// default value document.xml
			const fullText = (doc.getFullText());
			expect(fullText).to.be.equal("");
		});
		it("should load the right template files for the document", function () {
			const doc = testUtils.createDoc("tag-example.docx");
			const templatedFiles = (doc.getTemplatedFiles());
			expect(templatedFiles).to.be.eql(["word/header1.xml", "word/footer1.xml", "word/document.xml"]);
		});
	});
	describe("output and input", function () {
		it("should be the same", function () {
			const zip = new JSZip(testUtils.createDoc("tag-example.docx").loadedContent);
			const doc = new Docxtemplater().loadZip(zip);
			const output = doc.getZip().generate({type: "base64"});
			expect(output.length).to.be.equal(90732);
			expect(output.substr(0, 50)).to.be.equal("UEsDBAoAAAAAAAAAIQAMTxYSlgcAAJYHAAATAAAAW0NvbnRlbn");
		});
	});
});

describe("DocxtemplaterTemplating", function () {
	describe("text templating", function () {
		it("should change values with template data", function () {
			const tags = {
				first_name: "Hipp",
				last_name: "Edgar",
				phone: "0652455478",
				description: "New Website",
			};
			const doc = testUtils.createDoc("tag-example.docx");
			doc.setData(tags);
			doc.render();
			expect(doc.getFullText()).to.be.equal("Edgar Hipp");
			expect(doc.getFullText("word/header1.xml")).to.be.equal("Edgar Hipp0652455478New Website");
			expect(doc.getFullText("word/footer1.xml")).to.be.equal("EdgarHipp0652455478");
			testUtils.shouldBeSame({doc, expectedName: "tag-example-expected.docx"});
		});
	});
});

describe("inspect module", function () {
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
	const doc = testUtils.createDoc("tag-loop-example.docx");
	const inspectModule = new InspectModule();
	doc.attachModule(inspectModule);
	doc.render();
	const postParsed = inspectModule.fullInspected["word/document.xml"].postparsed;
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
			const doc = testUtils.createDoc("tag-loop-example.docx");
			doc.setData(tags);
			doc.render();
			expect(doc.getFullText()).to.be.equal("Votre proposition commercialeHippPrix: 1250Titre titre1HippPrix: 2000Titre titre2OffrePrix: 1400Titre titre3HippEdgar");
		});
		it("should work with loops inside loops", function () {
			const tags = {products: [{title: "Microsoft", name: "DOS", reference: "Win7", avantages: [{title: "Everyone uses it", proof: [{reason: "it is quite cheap"}, {reason: "it is quit simple"}, {reason: "it works on a lot of different Hardware"}]}]}, {title: "Linux", name: "Ubuntu", reference: "Ubuntu10", avantages: [{title: "It's very powerful", proof: [{reason: "the terminal is your friend"}, {reason: "Hello world"}, {reason: "it's free"}]}]}, {title: "Apple", name: "Mac", reference: "OSX", avantages: [{title: "It's very easy", proof: [{reason: "you can do a lot just with the mouse"}, {reason: "It's nicely designed"}]}]}]};
			const doc = testUtils.createDoc("tag-produit-loop.docx");
			doc.setData(tags);
			doc.render();
			const text = doc.getFullText();
			const expectedText = "MicrosoftProduct name : DOSProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed";
			expect(text.length).to.be.equal(expectedText.length);
			expect(text).to.be.equal(expectedText);
		});
		it("should not have sideeffects with inverted with array length 3", function () {
			const content = "<w:t>{^todos}No {/todos}Todos</w:t><w:t>{#todos}{.}{/todos}</w:t>";
			const expectedContent = '<w:t>Todos</w:t><w:t xml:space="preserve">ABC</w:t>';
			const scope = {todos: ["A", "B", "C"]};
			const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.content).to.be.deep.equal(expectedContent);
		});
		it("should not have sideeffects with inverted with empty array", function () {
			const content = `<w:t>{^todos}No {/todos}Todos</w:t>
			<w:t>{#todos}{.}{/todos}</w:t>`;
			const expectedContent = `<w:t>No Todos</w:t>
			<w:t xml:space="preserve"></w:t>`;
			const scope = {todos: []};
			const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
			xmlTemplater.render();
			expect(xmlTemplater.content).to.be.deep.equal(expectedContent);
		});

		it("should provide inverted loops", function () {
			const content = "<w:t>{^products}No products found{/products}</w:t>";
			[
				{products: []},
				{products: false},
				{},
			].forEach(function (tags) {
				const doc = testUtils.createXmlTemplaterDocx(content, {tags});
				doc.render();
				expect(doc.getFullText()).to.be.equal("No products found");
			});

			[
				{products: [{name: "Bread"}]},
				{products: true},
				{products: "Bread"},
				{products: {name: "Bread"}},
			].forEach(function (tags) {
				const doc = testUtils.createXmlTemplaterDocx(content, {tags});
				doc.render();
				expect(doc.getFullText()).to.be.equal("");
			});
		});

		it("should be possible to close loops with {/}", function () {
			const content = "<w:t>{#products}Product {name}{/}</w:t>";
			const tags = {products: [{name: "Bread"}]};
			const doc = testUtils.createXmlTemplaterDocx(content, {tags});
			doc.render();
			expect(doc.getFullText()).to.be.equal("Product Bread");
		});

		it("should be possible to close double loops with {/}", function () {
			const content = "<w:t>{#companies}{#products}Product {name}{/}{/}</w:t>";
			const tags = {companies: [{products: [{name: "Bread"}]}]};
			const doc = testUtils.createXmlTemplaterDocx(content, {tags});
			doc.render();
			expect(doc.getFullText()).to.be.equal("Product Bread");
		});

		it("should work with complex loops", function () {
			const content = "<w:t>{title} {#users} {name} friends are : {#friends} {.</w:t>TAG..TAG<w:t>},{/friends} {/users</w:t>TAG2<w:t>}</w:t>";
			const scope = {title: "###Title###", users: [{name: "John Doe", friends: ["Jane", "Henry"]}, {}], name: "Default", friends: ["None"]};
			const doc = testUtils.createXmlTemplaterDocx(content, {tags: scope});
			doc.render();
			expect(doc.getFullText()).to.be.equal("###Title###  John Doe friends are :  Jane, Henry,  Default friends are :  None, ");
		});
	});
});

describe("Dash Loop Testing", function () {
	it("dash loop ok on simple table -> w:tr", function () {
		const tags = {os: [{type: "linux", price: "0", reference: "Ubuntu10"}, {type: "DOS", price: "500", reference: "Win7"}, {type: "apple", price: "1200", reference: "MACOSX"}]};
		const doc = testUtils.createDoc("tag-dash-loop.docx");
		doc.setData(tags);
		doc.render();
		const expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});
	it("dash loop ok on simple table -> w:table", function () {
		const tags = {os: [{type: "linux", price: "0", reference: "Ubuntu10"}, {type: "DOS", price: "500", reference: "Win7"}, {type: "apple", price: "1200", reference: "MACOSX"}]};
		const doc = testUtils.createDoc("tag-dash-loop-table.docx");
		doc.setData(tags);
		doc.render();
		const expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});
	it("dash loop ok on simple list -> w:p", function () {
		const tags = {os: [{type: "linux", price: "0", reference: "Ubuntu10"}, {type: "DOS", price: "500", reference: "Win7"}, {type: "apple", price: "1200", reference: "MACOSX"}]};
		const doc = testUtils.createDoc("tag-dash-loop-list.docx");
		doc.setData(tags);
		doc.render();
		const expectedText = "linux 0 Ubuntu10 DOS 500 Win7 apple 1200 MACOSX ";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});
});

describe("Intelligent Loop Tagging", function () {
	it("should work with tables", function () {
		const tags = {clients: [{first_name: "John", last_name: "Doe", phone: "+33647874513"}, {first_name: "Jane", last_name: "Doe", phone: "+33454540124"}, {first_name: "Phil", last_name: "Kiel", phone: "+44578451245"}, {first_name: "Dave", last_name: "Sto", phone: "+44548787984"}]};
		const doc = testUtils.createDoc("tag-intelligent-loop-table.docx");
		doc.setData(tags);
		doc.render();
		const expectedText = "JohnDoe+33647874513JaneDoe+33454540124PhilKiel+44578451245DaveSto+44548787984";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
		testUtils.shouldBeSame({doc, expectedName: "tag-intelligent-loop-table-expected.docx"});
	});

	it("should not do anything special when loop outside of table", function () {
		["<w:t>{#tables}</w:t><w:table><w:tr><w:tc><w:t>{user}</w:t></w:tc></w:tr></w:table><w:t>{/tables}</w:t>"].forEach(function (content) {
			const scope = {
				tables: [
					{user: "John"},
					{user: "Jane"},
				],
			};
			const doc = testUtils.createXmlTemplaterDocx(content, {tags: scope});
			doc.render();
			expect(doc.content).to.be.equal('<w:t></w:t><w:table><w:tr><w:tc><w:t xml:space="preserve">John</w:t></w:tc></w:tr></w:table><w:t></w:t><w:table><w:tr><w:tc><w:t xml:space="preserve">Jane</w:t></w:tc></w:tr></w:table><w:t></w:t>');
		});
	});
});

describe("intelligent tagging multiple tables", function () {
	it("should work with multiple rows", function () {
		const content = `<w:tbl>
		<w:tr>
		<w:tc>
		<w:p>
		<w:r>
		<w:t>{#clauses} Clause {.}</w:t>
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
		`.replace(/\t|\n/g, "");
		const scope = {clauses: ["Foo", "Bar", "Baz"]};
		const doc = testUtils.createXmlTemplaterDocx(content, {tags: scope, intelligentTagging: true});
		doc.render();
		expect(doc.content).to.be.equal('<w:tbl><w:tr><w:tc><w:p><w:r><w:t xml:space="preserve"> Clause Foo</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t xml:space="preserve"> Clause Bar</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t xml:space="preserve"> Clause Baz</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc></w:tr></w:tbl>');
	});
});

describe("xmlTemplater", function () {
	it("should work with simpleContent", function () {
		const content = "<w:t>Hello {name}</w:t>";
		const scope = {name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with doublecontent in w:t", function () {
		const content = "<w:t>Hello {name}, you're {age} years old</w:t>";
		const scope = {name: "Edgar", age: "foo"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar, you're foo years old");
	});

	it("should work with {.} for this", function () {
		const content = "<w:t>Hello {.}</w:t>";
		const scope = "Edgar";
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with {.} for this inside loop", function () {
		const content = "<w:t>Hello {#names}{.},{/names}</w:t>";
		const scope = {names: ["Edgar", "John"]};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,John,");
	});

	it("should work with non w:t content", function () {
		const content = "<w:t>{#loop}Hello {name}{/loop}</w:t>";
		const scope = {loop: {name: "edgar"}};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.content).to.be.equal('<w:t xml:space="preserve">Hello edgar</w:t>');
	});
	it("should work with tag in two elements", function () {
		const content = "<w:t>Hello {</w:t><w:t>name}</w:t>";
		const scope = {name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with splitted tag in three elements", function () {
		const content = "<w:t>Hello {</w:t><w:t>name</w:t><w:t>}</w:t>";
		const scope = {name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with simple loop with object value", function () {
		const content = "<w:t>Hello {#person}{name}{/person}</w:t>";
		const scope = {person: {name: "Edgar"}};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with simple Loop", function () {
		const content = "<w:t>Hello {#names}{name},{/names}</w:t>";
		const scope = {names: [{name: "Edgar"}, {name: "Mary"}, {name: "John"}]};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,Mary,John,");
	});
	it("should work with simple Loop with boolean value truthy", function () {
		const content = "<w:t>Hello {#showName}{name},{/showName}</w:t>";
		const scope = {showName: true, name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,");
	});
	it("should work with simple Loop with boolean value falsy", function () {
		const content = "<w:t>Hello {#showName}{name},{/showName}</w:t>";
		const scope = {showName: false, name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello ");
	});
	it("should work with dash Loop", function () {
		const content = "<w:p><w:t>Hello {-w:p names}{name},{/names}</w:t></w:p>";
		const scope = {names: [{name: "Edgar"}, {name: "Mary"}, {name: "John"}]};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,Hello Mary,Hello John,");
	});
	it("should work with loop and innerContent", function () {
		const content = "<w:t>{#loop}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:pStyle w:val=\"Titre1\"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRPr=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00923B77\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>oof</w:t></w:r><w:r><w:t xml:space=\"preserve\">} </w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>It works because</w:t></w:r><w:r><w:t xml:space=\"preserve\"> {</w:t></w:r><w:r w:rsidR=\"006F26AC\"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00FD04E9\" w:rsidRDefault=\"00923B77\"><w:r><w:t>{/loop}</w:t>";
		const scope = {loop: {title: "Everyone uses it", proof: [{reason: "it is quite cheap"}, {reason: "it is quit simple"}, {reason: "it works on a lot of different Hardware"}]}};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware");
	});
	it("should work with loop and innerContent (with last)", function () {
		const content = "<w:t>{#loop}Start </w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:pStyle w:val=\"Titre1\"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRPr=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00923B77\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>oof</w:t></w:r><w:r><w:t xml:space=\"preserve\">} </w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>It works because</w:t></w:r><w:r><w:t xml:space=\"preserve\"> {</w:t></w:r><w:r w:rsidR=\"006F26AC\"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00FD04E9\" w:rsidRDefault=\"00923B77\"><w:r><w:t> End{/loop}</w:t>";
		const scope = {loop: {title: "Everyone uses it", proof: [{reason: "it is quite cheap"}, {reason: "it is quit simple"}, {reason: "it works on a lot of different Hardware"}]}};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Start Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware End");
	});
	it("should work with not w:t tag (if the for loop is like {#forloop} text {/forloop}) ", function () {
		const content = "<w:t>{#loop}Hello {#names}{name},{/names}{/loop}</w:t>";
		const scope = {loop: {names: [{name: "Edgar"}, {name: "Mary"}, {name: "John"}]}};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.content).to.be.equal('<w:t xml:space="preserve">Hello Edgar,Mary,John,</w:t>');
	});
	it("should work with delimiter in value", function () {
		const content = "<w:t>Hello {name}</w:t>";
		const scope = {name: "{edgar}"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello {edgar}");
	});
	it("should work with delimiter in value with loop)", function () {
		const content = "<w:t>Hello {#names}{name},{/names}</w:t>";
		const scope = {names: [{name: "{John}"}, {name: "M}}{ary"}, {name: "Di{{{gory"}]};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello {John},M}}{ary,Di{{{gory,");
	});
	it("should work when replacing with exact same value", function () {
		const content = "<w:p><w:t xml:space=\"preserve\">Hello {name}</w:t></w:p>";
		const scope = {name: "{name}"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		xmlTemplater.getFullText();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello {name}");
	});

	it("should work with equations", function () {
		const content = `<w:p>
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
		const scope = {name: "John", foo: "MyFoo", bar: "MyBar", baz: "MyBaz"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		expect(xmlTemplater.getFullText()).to.be.equal("y{bar}*cos⁡( {foo}+{baz})Hello {name}");
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("yMyBar*cos⁡( MyFoo+MyBaz)Hello John");
	});
});

describe("Change the nullGetter", function () {
	it("should work with null", function () {
		const content = "<w:t>Hello {name}</w:t>";
		const scope = {};
		function nullGetter() { return "null"; }
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope, nullGetter});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello null");
	});
});
describe("Changing the parser", function () {
	it("should work with uppercassing", function () {
		const content = "<w:t>Hello {name}</w:t>";
		const scope = {name: "Edgar"};
		function parser(tag) {
			return {["get"](scope) { return scope[tag].toUpperCase(); }};
		}
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope, parser});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello EDGAR");
	});
	it("should work when setting from the Docxtemplater interface", function () {
		const doc = testUtils.createDoc("tag-example.docx");
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
		const doc = testUtils.createDoc("angular-example.docx");
		doc.setData(tags);
		doc.parser = angularParser;
		doc.render();
		expect(doc.getFullText()).to.be.equal("Hipp Edgar 2014");
	});

	it("should work with loops", function () {
		const content = "<w:t>Hello {#person.adult}you{/person.adult}</w:t>";
		const scope = {person: {name: "Edgar", adult: true}};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope, parser: angularParser});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello you");
	});
});

describe("Special characters", function () {
	it("should parse placeholder containing special characters", function () {
		const content = "<w:t>Hello {&gt;name}</w:t>";
		const scope = {">name": "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.content).to.be.deep.equal('<w:t xml:space="preserve">Hello Edgar</w:t>');
	});

	it("should render placeholder containing special characters", function () {
		const content = "<w:t>Hello {name}</w:t>";
		const scope = {name: "<Edgar>"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.content).to.be.deep.equal('<w:t xml:space="preserve">Hello &lt;Edgar&gt;</w:t>');
	});

	it("should read full text correctly", function () {
		const doc = testUtils.createDoc("cyrillic.docx");
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
		const doc = testUtils.createDoc("cyrillic.docx");
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
		const doc = testUtils.createDoc("tag-example.docx");
		const zip = new JSZip(doc.loadedContent);
		const d = new Docxtemplater().loadZip(zip);
		d.setData({last_name: russian});
		d.render();
		const outputText = d.getFullText();
		expect(outputText.substr(0, 7)).to.be.equal(russian);
	});
});

describe("Complex table example", function () {
	it("should work with simple table", function () {
		const doc = testUtils.createDoc("table-complex2-example.docx");
		doc.setData({
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
		doc.render();
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data");
	});
	it("should work with more complex table", function () {
		// set the templateData
		const doc = testUtils.createDoc("table-complex-example.docx");
		doc.setData({
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
		doc.render();
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4TOTALt1total1-datat1total2-datat1total3-dataTABLE2COLUMN1COLUMN2COLUMN3COLUMN4t2-1row-data1t2-1row-data2t2-1row-data3t2-1row-data4t2-2row-data1t2-2row-data2t2-2row-data3t2-2row-data4TOTALt2total1-datat2total2-datat2total3-data");
	});
	it("should work with two tables and intelligentTagging", function () {
		const tags = {
			table1: [1],
			key: "value",
		};
		const template = `<w:tr>
		<w:tc><w:t>{#table1}Hi</w:t></w:tc>
		<w:tc><w:t>{/table1}</w:t> </w:tc>
		</w:tr>
		<w:tr>
		<w:tc><w:t>{#table1}Ho</w:t></w:tc>
		<w:tc><w:p><w:t>{/table1}</w:t> </w:p>
		</w:tc>
		</w:tr>
		<w:t>{key}</w:t>
		`;
		const doc = testUtils.createXmlTemplaterDocx(template, {tags, intelligentTagging: true});
		doc.render();
		const fullText = doc.getFullText();

		expect(fullText).to.be.equal("HiHovalue");
		const expected = `<w:tr>
		<w:tc><w:t>Hi</w:t></w:tc>
		<w:tc><w:t></w:t> </w:tc>
		</w:tr>
		<w:tr>
		<w:tc><w:t>Ho</w:t></w:tc>
		<w:tc><w:p><w:t></w:t> </w:p>
		</w:tc>
		</w:tr>
		<w:t xml:space="preserve">value</w:t>
		`;
		expect(doc.content).to.be.equal(expected);
	});
});
describe("Raw Xml Insertion", function () {
	it("should work with simple example", function () {
		const inner = "<w:p><w:r><w:t>{@complexXml}</w:t></w:r></w:p>";
		const content = `<w:document>${inner}</w:document>`;
		const scope = {complexXml: "<w:p w:rsidR=\"00612058\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val=\"FF0000\"/></w:rPr><w:t>My custom XML</w:t></w:r></w:p><w:tbl><w:tblPr><w:tblStyle w: val=\"Grilledutableau\"/><w:tblW w: w=\"0\" w:type=\"auto\"/><w:tblLook w: val=\"04A0\" w: firstRow=\"1\" w: lastRow=\"0\" w: firstColumn=\"1\" w: lastColumn=\"0\" w: noHBand=\"0\" w: noVBand=\"1\"/></w:tblPr><w:tblGrid><w: gridCol w: w=\"2952\"/><w: gridCol w: w=\"2952\"/><w: gridCol w: w=\"2952\"/></w:tblGrid><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"DDD9C3\" w:themeFill=\"background2\" w:themeFillShade=\"E6\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: b/><w: color w: val=\"000000\" w:themeColor=\"text1\"/></w:rPr></w:pPr><w:r><w:rPr><w: b/><w: color w: val=\"000000\" w:themeColor=\"text1\"/></w:rPr><w:t>Test</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"DDD9C3\" w:themeFill=\"background2\" w:themeFillShade=\"E6\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: b/><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w: b/><w: color w: val=\"FF0000\"/></w:rPr><w:t>Xml</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"DDD9C3\" w:themeFill=\"background2\" w:themeFillShade=\"E6\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val=\"FF0000\"/></w:rPr><w:t>Generated</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"C6D9F1\" w:themeFill=\"text2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"000000\" w:themeColor=\"text1\"/><w: u w: val=\"single\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w: color w: val=\"000000\" w:themeColor=\"text1\"/><w: u w: val=\"single\"/></w:rPr><w:t>Underline</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"C6D9F1\" w:themeFill=\"text2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w: color w: val=\"FF0000\"/><w: highlight w: val=\"yellow\"/></w:rPr><w:t>Highlighting</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"C6D9F1\" w:themeFill=\"text2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:rFonts w: ascii=\"Bauhaus 93\" w: hAnsi=\"Bauhaus 93\"/><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w:rFonts w: ascii=\"Bauhaus 93\" w: hAnsi=\"Bauhaus 93\"/><w: color w: val=\"FF0000\"/></w:rPr><w:t>Font</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"F2DBDB\" w:themeFill=\"accent2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00EA4B08\"><w:pPr><w: jc w: val=\"center\"/><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val=\"FF0000\"/></w:rPr><w:t>Centering</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"F2DBDB\" w:themeFill=\"accent2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: i/><w: color w: val=\"FF0000\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w: i/><w: color w: val=\"FF0000\"/></w:rPr><w:t>Italic</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"F2DBDB\" w:themeFill=\"accent2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"E5DFEC\" w:themeFill=\"accent4\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"E5DFEC\" w:themeFill=\"accent4\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"E5DFEC\" w:themeFill=\"accent4\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"FDE9D9\" w:themeFill=\"accent6\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"FDE9D9\" w:themeFill=\"accent6\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w=\"2952\" w:type=\"dxa\"/><w: shd w: val=\"clear\" w: color=\"auto\" w: fill=\"FDE9D9\" w:themeFill=\"accent6\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w: color w: val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc></w:tr></w:tbl>"};
		const doc = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		doc.render();
		expect(doc.content.length).to.be.equal(content.length + scope.complexXml.length - (inner.length));
		expect(doc.content).to.contain(scope.complexXml);
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
		const doc = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		doc.render();
		expect(doc.content).to.contain(scope.complexXml);
		expect(doc.getFullText()).to.be.equal("HelloJohnDoe 1550MotoFein 1987WaterTest 2010BreadYu");
	});

	it("should work with closing tag in the form of <w:t>}{/body}</w:t>", function () {
		const scope = {body: [{paragraph: "hello"}]};
		const content = `<w:t>{#body}</w:t>
		<w:t>{paragraph</w:t>
			<w:t>}{/body}</w:t>`;
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});

		xmlTemplater.render();
		expect(xmlTemplater.content).not.to.contain("</w:t></w:t>");
	});
	it("should work with simple example and given options", function () {
		const scope = {xmlTag: '<w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>My custom</w:t></w:r><w:r><w:rPr><w:color w:val="00FF00"/></w:rPr><w:t>XML</w:t></w:r>'};
		const doc = testUtils.createDoc("one-raw-xml-tag.docx");
		doc.setOptions({
			fileTypeConfig: _.merge({}, Docxtemplater.FileTypeConfig.docx, {tagRawXml: "w:r"}),
		});
		doc.setData(scope);
		doc.render();
		expect(doc.getFullText()).to.be.equal("asdfMy customXMLqwery");
	});
});

describe("Custom delimiters", function () {
	it("should work with custom tags", function () {
		const delimiters = {
			start: "[",
			end: "]",
		};
		const content = "<w:t>Hello [name]</w:t>";
		const scope = {name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope, delimiters});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with custom delimiters with two chars", function () {
		const delimiters = {
			start: "[[",
			end: "]]",
		};
		const content = "<w:t>Hello [[name]]</w:t>";
		const scope = {name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope, delimiters});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.eql("Hello Edgar");
	});

	it("should work with custom delimiters as strings with different length", function () {
		const delimiters = {
			start: "[[[",
			end: "]]",
		};
		const content = "<w:t>Hello [[[name]]</w:t>";
		const scope = {name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope, delimiters});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.eql("Hello Edgar");
	});

	it("should work with custom tags and loops", function () {
		const delimiters = {
			start: "[[[",
			end: "]]",
		};
		const content = "<w:t>Hello [[[#names]][[[.]],[[[/names]]</w:t>";
		const scope = {names: ["Edgar", "Mary", "John"]};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope, delimiters});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,Mary,John,");
	});

	it("should work with loops", function () {
		const content = "<w:t>{#loop}{innertag</w:t><w:t>} {/loop}</w:t>";
		const xmlt = testUtils.createXmlTemplaterDocx(content, {tags: {loop: [{innertag: 10}, {innertag: 5}]}}).render();
		expect(xmlt.content).to.be.equal('<w:t xml:space="preserve">10</w:t><w:t> 5</w:t><w:t> </w:t>');
	});

	it("should work with complex loops (1)", function () {
		const content = "<w:t>{#looptag}{innertag</w:t><w:t>}{/looptag}</w:t>";
		const xmlt = testUtils.createXmlTemplaterDocx(content, {tags: {looptag: true, innertag: "foo"}}).render();
		expect(xmlt.content).not.to.contain("</w:t></w:t>");
		expect(xmlt.content).to.be.equal('<w:t xml:space="preserve">foo</w:t><w:t></w:t>');
	});

	it("should work with complex loops (2)", function () {
		const content = "<w:t>{#person}</w:t><w:t>{name}{/person}</w:t>";
		const xmlt = testUtils.createXmlTemplaterDocx(content, {tags: {person: [{name: "Henry"}]}}).render();
		expect(xmlt.content).to.contain("Henry</w:t>");
		expect(xmlt.content).not.to.contain("</w:t>Henry</w:t>");
	});
});

describe("getting parents context", function () {
	it("should work with simple loops", function () {
		const content = "<w:t>{#loop}{name}{/loop}</w:t>";
		const xmlt = testUtils.createXmlTemplaterDocx(content, {tags: {loop: [1], name: "Henry"}}).render();
		expect(xmlt.content).to.be.equal('<w:t xml:space="preserve">Henry</w:t>');
	});

	it("should work with double loops", function () {
		const content = "<w:t>{#loop_first}{#loop_second}{name_inner} {name_outer}{/loop_second}{/loop_first}</w:t>";
		const xmlt = testUtils.createXmlTemplaterDocx(content, {tags: {loop_first: [1], loop_second: [{name_inner: "John"}], name_outer: "Henry"}}).render();
		expect(xmlt.content).to.be.equal('<w:t xml:space="preserve">John Henry</w:t>');
	});
});

describe("pptx generation", function () {
	it("should work with simple pptx", function () {
		const doc = testUtils.createPpt("simple-example.pptx");
		const p = doc.setData({name: "Edgar"}).render();
		expect(p.getFullText()).to.be.equal("Hello Edgar");
	});
});

describe("Serialization", function () {
	it("should be serialiazable", function () {
		const doc = testUtils.createDoc("tag-example.docx");
		JSON.stringify(doc);
	});
});
