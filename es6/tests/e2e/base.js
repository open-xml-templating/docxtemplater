const { assign } = require("lodash");
const expressionParser = require("../../expressions.js");
const expressionParserIE11 = require("../../expressions-ie11.js");
const Docxtemplater = require("../../docxtemplater.js");
const { last } = require("../../utils.js");
const {
	createDocV4,
	createXmlTemplaterDocx,
	expect,
	expectToThrowSnapshot,
	getContent,
	getZip,
} = require("../utils.js");
const inspectModule = require("../../inspect-module.js");

describe("Loading", () => {
	describe("ajax done correctly", () => {
		it("should have the right number of files (the docx unzipped)", () => {
			const doc = createDocV4("tag-example.docx");
			expect(Object.keys(doc.zip.files).length).to.be.equal(16);
		});
	});
	describe("basic loading", () => {
		it("should load file tag-example.docx", () => {
			const doc = createDocV4("tag-example.docx");
			expect(typeof doc).to.be.equal("object");
		});
	});

	describe("output and input", () => {
		it("should be the same", () => {
			const doc = createDocV4("tag-example.docx");
			const output = doc.toBase64();
			expect(output.length).to.be.equal(22808);
			expect(output.substr(0, 50)).to.be.equal(
				"UEsDBAoAAAAIAAAAIQAMTxYSigEAAJYHAAATAAAAW0NvbnRlbn"
			);
		});
	});
});

describe("Zip output", () => {
	if (typeof window === "undefined") {
		it("should work with toBuffer and also verify that the fileorder contains [Content_Types].xml and _rels/.rels in first characters", () => {
			const doc = createDocV4("tag-example.docx");
			doc.render({});
			const buf = doc.toBuffer();
			expect(buf).to.be.instanceof(Buffer);

			// Work on a copy to preserve the original buffer
			const sanitizedBuf = Buffer.from(buf);

			// Replace ZIP local file headers with PK@@ to stabilize snapshot
			const HEADER_SIG = Buffer.from("504b0304", "hex"); // "PK\x03\x04"
			let offset = 0;
			while (offset < sanitizedBuf.length) {
				const idx = sanitizedBuf.indexOf(HEADER_SIG, offset);
				if (idx === -1) {
					break;
				}

				// Zero out mod time + date
				sanitizedBuf.writeUInt16LE(0, idx + 8);
				sanitizedBuf.writeUInt16LE(0, idx + 10);

				/*
				 * Overwrite the 30-byte header with 'PK@@' followed by 26 dashes
				 * This ensures exact replacement without affecting filename
				 */
				sanitizedBuf.write("PK@@--------------------------", idx, 30, "ascii");

				offset = idx + 30;
			}

			// Now convert to safe printable string for snapshot testing
			const allChars = sanitizedBuf
				.toString()
				.replace(/[^@a-zA-Z_1-9[\]./-]/g, "-");

			// Get first ~1KB for snapshot
			const firstChars = allChars.slice(0, 1100);
			expect(firstChars).to.matchSnapshot();

			// Check that expected files appear in expected order
			const expectedFiles = [
				"[Content_Types].xml",
				"_rels/.rels",
				"word/_rels/document.xml.rels",
				"word/document.xml",
				"word/footnotes.xml",
				"word/endnotes.xml",
				"word/header1.xml",
				"word/footer1.xml",
				"word/theme/theme1.xml",
				"word/settings.xml",
				"word/webSettings.xml",
				"word/stylesWithEffects.xml",
				"word/fontTable.xml",
				"docProps/core.xml",
				"word/styles.xml",
				"docProps/app.xml",
			];
			expect(expectedFiles.map((file) => allChars.indexOf(file))).to.deep.equal(
				[
					30, 445, 708, 1094, 1741, 2233, 2764, 6425, 7028, 8678, 9677, 9956,
					11905, 14516, 12426, 14861,
				]
			);
		});
	}
	it("should work with toBlob", () => {
		const doc = createDocV4("tag-example.docx");
		doc.render({});
		const buf = doc.toBlob();
		expect(buf).to.be.instanceof(Blob);
	});
	it("should work with toBase64", () => {
		const doc = createDocV4("tag-example.docx");
		doc.render({});
		const buf = doc.toBase64();
		expect(buf).to.be.a("string");
	});
	it("should work with toUint8Array", () => {
		const doc = createDocV4("tag-example.docx");
		doc.render({});
		const buf = doc.toUint8Array();
		expect(buf).to.be.instanceof(Uint8Array);
	});
	it("should work with toArrayBuffer", () => {
		const doc = createDocV4("tag-example.docx");
		doc.render({});
		const buf = doc.toArrayBuffer();
		expect(buf).to.be.instanceof(ArrayBuffer);
	});
});

describe("Retrieving text content", () => {
	it("should work for the footer", () => {
		const doc = createDocV4("tag-example.docx");
		const fullText = doc.getFullText("word/footer1.xml");
		expect(fullText.length).not.to.be.equal(0);
		expect(fullText).to.be.equal("{last_name}{first_name}{phone}");
	});
	it("should work for the document", () => {
		const doc = createDocV4("tag-example.docx");
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("{last_name} {first_name}");
	});
});

describe("Retrieving list of templated files", () => {
	it("should return 6 templatedFiles for a simple document", () => {
		const doc = createDocV4("tag-example.docx");
		const templatedFiles = doc.getTemplatedFiles();
		expect(templatedFiles).to.be.eql([
			"word/settings.xml",
			"docProps/core.xml",
			"docProps/app.xml",
			"word/header1.xml",
			"word/document.xml",
			"word/footer1.xml",
			"word/footnotes.xml",
		]);
	});
});

describe("Api versioning", () => {
	it("should work with valid numbers", () => {
		const doc = createDocV4("tag-example.docx");
		expect(doc.verifyApiVersion("3.6.0")).to.be.equal(true);
		expect(doc.verifyApiVersion("3.5.0")).to.be.equal(true);
		expect(doc.verifyApiVersion("3.4.2")).to.be.equal(true);
		expect(doc.verifyApiVersion("3.4.22")).to.be.equal(true);
	});

	it("should fail with invalid versions", () => {
		const doc = createDocV4("tag-example.docx");
		expectToThrowSnapshot(() => doc.verifyApiVersion("5.0"));
		expectToThrowSnapshot(() => doc.verifyApiVersion("5.6.0"));
		expectToThrowSnapshot(() => doc.verifyApiVersion("3.47.0"));
		expectToThrowSnapshot(() => doc.verifyApiVersion("3.46.100"));
	});
});

describe("Inspect module", () => {
	it("should get main tags", () => {
		const iModule = inspectModule();
		const doc = createDocV4("tag-loop-example.docx", {
			modules: [iModule],
		});
		expect(iModule.getStructuredTags()).to.matchSnapshot();
		expect(iModule.getTags()).to.be.deep.equal({
			offre: {
				nom: {},
				prix: {},
				titre: {},
			},
			nom: {},
			prenom: {},
		});
		const data = { offre: [{}], prenom: "John" };
		doc.render(data);
		const fi = iModule.fullInspected["word/document.xml"];
		const { summary, detail } = fi.nullValues;
		const { postparsed, parsed, xmllexed } = fi;
		expect(postparsed.length).to.equal(249);
		expect(parsed.length).to.equal(385);
		expect(xmllexed.length).to.equal(383);

		expect(iModule.inspect.tags).to.be.deep.equal(data);
		expect(detail).to.be.an("array");
		expect(detail[0].part.value).to.equal("nom");
		expect(detail[0].scopeManager.scopeList[0].prenom).to.equal("John");
		expect(summary).to.be.deep.equal([
			["offre", "nom"],
			["offre", "prix"],
			["offre", "titre"],
			["nom"],
		]);
	});

	it("should get all tags (pptx file)", () => {
		const iModule = inspectModule();
		createDocV4("multi-page.pptx", { modules: [iModule] });
		expect(iModule.getStructuredTags()).to.matchSnapshot();
		expect(iModule.getFileType()).to.be.deep.equal("pptx");
		expect(iModule.getAllTags()).to.be.deep.equal({
			tag: {},
			users: {
				name: {},
			},
		});
		expect(iModule.getTemplatedFiles().sort()).to.be.deep.equal(
			[
				"ppt/slides/slide1.xml",
				"ppt/slides/slide2.xml",
				"ppt/slideLayouts/slideLayout1.xml",
				"ppt/slideLayouts/slideLayout10.xml",
				"ppt/slideLayouts/slideLayout11.xml",
				"ppt/slideLayouts/slideLayout12.xml",
				"ppt/slideLayouts/slideLayout2.xml",
				"ppt/slideLayouts/slideLayout3.xml",
				"ppt/slideLayouts/slideLayout4.xml",
				"ppt/slideLayouts/slideLayout5.xml",
				"ppt/slideLayouts/slideLayout6.xml",
				"ppt/slideLayouts/slideLayout7.xml",
				"ppt/slideLayouts/slideLayout8.xml",
				"ppt/slideLayouts/slideLayout9.xml",
				"ppt/slideMasters/slideMaster1.xml",
				"ppt/presentation.xml",
				"docProps/app.xml",
				"docProps/core.xml",
			].sort()
		);
	});

	it("should get all tags and merge them", () => {
		const iModule = inspectModule();
		createDocV4("multi-page-to-merge.pptx", {
			modules: [iModule],
		});
		expect(iModule.getAllTags()).to.be.deep.equal({
			tag: {},
			users: {
				name: {},
				age: {},
				company: {},
			},
		});
	});

	it("should get all tags with additional data", () => {
		const iModule = inspectModule();
		createDocV4("tag-product-loop.docx", {
			modules: [iModule],
		});
		expect(iModule.getAllStructuredTags()).to.be.deep.equal([
			{
				type: "placeholder",
				value: "products",
				raw: "#products",
				lIndex: 17,
				sectPrCount: 0,
				module: "loop",
				inverted: false,
				offset: 0,
				lastParagrapSectPr: "",
				endLindex: 216,
				subparsed: [
					{
						type: "placeholder",
						value: "title",
						offset: 11,
						endLindex: 33,
						lIndex: 33,
					},
					{
						type: "placeholder",
						value: "name",
						offset: 33,
						endLindex: 57,
						lIndex: 57,
					},
					{
						type: "placeholder",
						value: "reference",
						offset: 59,
						endLindex: 74,
						lIndex: 74,
					},
					{
						type: "placeholder",
						value: "avantages",
						module: "loop",
						raw: "#avantages",
						inverted: false,
						offset: 70,
						sectPrCount: 0,
						lastParagrapSectPr: "",
						endLindex: 192,
						lIndex: 92,
						subparsed: [
							{
								type: "placeholder",
								value: "title",
								offset: 82,
								endLindex: 108,
								lIndex: 108,
							},
							{
								type: "placeholder",
								value: "proof",
								module: "loop",
								raw: "#proof",
								sectPrCount: 0,
								lastParagrapSectPr: "",
								inverted: false,
								offset: 117,
								endLindex: 174,
								lIndex: 136,
								subparsed: [
									{
										type: "placeholder",
										value: "reason",
										offset: 143,
										endLindex: 158,
										lIndex: 158,
									},
								],
							},
						],
					},
				],
			},
		]);
	});
});

describe("Docxtemplater loops", () => {
	it("should replace all the tags", () => {
		const doc = createDocV4("tag-loop-example.docx");
		doc.render({
			nom: "Hipp",
			prenom: "Edgar",
			telephone: "0652455478",
			description: "New Website",
			offre: [
				{ titre: "titre1", prix: "1260" },
				{ titre: "titre2", prix: "2000" },
				{ titre: "titre3", prix: "1400", nom: "Offre" },
			],
		});
		expect(doc.getFullText()).to.be.equal(
			"Votre proposition commercialeHippPrix: 1260Titre titre1HippPrix: 2000Titre titre2OffrePrix: 1400Titre titre3HippEdgar"
		);
	});
	it("should work with loops inside loops", () => {
		const tags = {
			products: [
				{
					title: "Microsoft",
					name: "DOS",
					reference: "Win7",
					avantages: [
						{
							title: "Everyone uses it",
							proof: [
								{ reason: "it is quite cheap" },
								{ reason: "it is quit simple" },
								{ reason: "it works on a lot of different Hardware" },
							],
						},
					],
				},
				{
					title: "Linux",
					name: "Ubuntu",
					reference: "Ubuntu10",
					avantages: [
						{
							title: "It's very powerful",
							proof: [
								{ reason: "the terminal is your friend" },
								{ reason: "Hello world" },
								{ reason: "it's free" },
							],
						},
					],
				},
				{
					title: "Apple",
					name: "Mac",
					reference: "OSX",
					avantages: [
						{
							title: "It's very easy",
							proof: [
								{ reason: "you can do a lot just with the mouse" },
								{ reason: "It's nicely designed" },
							],
						},
					],
				},
			],
		};
		const doc = createDocV4("tag-product-loop.docx");
		doc.render(tags);
		const text = doc.getFullText();
		const expectedText =
			"MicrosoftProduct name : DOSProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed";
		expect(text.length).to.be.equal(expectedText.length);
		expect(text).to.be.equal(expectedText);
	});
	it("should work with object value", () => {
		const content = "<w:t>{#todo}{todo}{/todo}</w:t>";
		const expectedContent = '<w:t xml:space="preserve">abc</w:t>';
		const scope = { todo: { todo: "abc" } };
		const xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		expect(getContent(xmlTemplater)).to.be.deep.equal(expectedContent);
	});
	it("should work with string value", () => {
		const content = "<w:t>{#todo}{todo}{/todo}</w:t>";
		const expectedContent = '<w:t xml:space="preserve">abc</w:t>';
		const scope = { todo: "abc" };
		const xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		const c = getContent(xmlTemplater);
		expect(c).to.be.deep.equal(expectedContent);
	});
	it("should not have sideeffects with inverted with array length 3", () => {
		const content = `<w:t>{^todos}No {/todos}Todos</w:t>
<w:t>{#todos}{.}{/todos}</w:t>`;
		const expectedContent = `<w:t xml:space="preserve">Todos</w:t>
<w:t xml:space="preserve">ABC</w:t>`;
		const scope = { todos: ["A", "B", "C"] };
		const xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		const c = getContent(xmlTemplater);
		expect(c).to.be.deep.equal(expectedContent);
	});
	it("should not have sideeffects with inverted with empty array", () => {
		const content = `<w:t>{^todos}No {/todos}Todos</w:t>
		<w:t>{#todos}{.}{/todos}</w:t>`;
		const expectedContent = `<w:t xml:space="preserve">No Todos</w:t>
		<w:t/>`;
		const scope = { todos: [] };
		const xmlTemplater = createXmlTemplaterDocx(content, {
			tags: scope,
		});
		const c = getContent(xmlTemplater);
		expect(c).to.be.deep.equal(expectedContent);
	});

	it("should provide inverted loops", () => {
		const content = "<w:t>{^products}No products found{/products}</w:t>";
		const samplesEmpty = [{ products: [] }, { products: false }, {}];

		for (const tags of samplesEmpty) {
			const doc = createXmlTemplaterDocx(content, { tags });
			expect(doc.getFullText()).to.be.equal("No products found");
		}

		const samples = [
			{ products: [{ name: "Bread" }] },
			{ products: true },
			{ products: "Bread" },
			{ products: { name: "Bread" } },
		];

		for (const tags of samples) {
			const doc = createXmlTemplaterDocx(content, { tags });
			expect(doc.getFullText()).to.be.equal("");
		}
	});

	it("should be possible to close loops with {/}", () => {
		const content = "<w:t>{#products}Product {name}{/}</w:t>";
		const tags = { products: [{ name: "Bread" }] };
		const doc = createXmlTemplaterDocx(content, { tags });
		expect(doc.getFullText()).to.be.equal("Product Bread");
	});

	it("should be possible to close double loops with {/}", () => {
		const content = "<w:t>{#companies}{#products}Product {name}{/}{/}</w:t>";
		const tags = { companies: [{ products: [{ name: "Bread" }] }] };
		const doc = createXmlTemplaterDocx(content, { tags });
		expect(doc.getFullText()).to.be.equal("Product Bread");
	});

	it("should work with complex loops", () => {
		const content =
			"<w:t>{title} {#users} {name} friends are : {#friends} {.</w:t>TAG..TAG<w:t>},{/friends} {/users</w:t>TAG2<w:t>}</w:t>";
		const scope = {
			title: "###Title###",
			users: [{ name: "John Doe", friends: ["Jane", "Henry"] }, {}],
			name: "Default",
			friends: ["None"],
		};
		const doc = createXmlTemplaterDocx(content, { tags: scope });
		expect(doc.getFullText()).to.be.equal(
			"###Title###  John Doe friends are :  Jane, Henry,  Default friends are :  None, "
		);
	});
});

describe("Changing the parser", () => {
	it("should work with uppercassing", () => {
		const content = "<w:t>Hello {name}</w:t>";
		const scope = { name: "Edgar" };
		function parser(tag) {
			return {
				["get"](scope) {
					return scope[tag].toUpperCase();
				},
			};
		}
		const xmlTemplater = createXmlTemplaterDocx(content, {
			tags: scope,
			parser,
		});
		expect(xmlTemplater.getFullText()).to.be.equal("Hello EDGAR");
	});

	it("should work when setting from the Docxtemplater interface", () => {
		const doc = createDocV4("tag-example.docx", {
			parser(tag) {
				return {
					["get"](scope) {
						return scope[tag].toUpperCase();
					},
				};
			},
		});
		doc.render({
			first_name: "Hipp",
			last_name: "Edgar",
			phone: "0652455478",
			description: "New Website",
		});
		expect(doc.getFullText()).to.be.equal("EDGAR HIPP");
		expect(doc.getFullText("word/header1.xml")).to.be.equal(
			"EDGAR HIPP0652455478NEW WEBSITE"
		);
		expect(doc.getFullText("word/footer1.xml")).to.be.equal(
			"EDGARHIPP0652455478"
		);
	});

	it("should work with expression parser", () => {
		const tags = {
			person: {
				first_name: "Hipp",
				last_name: "Edgar",
				birth_year: 1955,
				age: 59,
			},
		};
		const doc = createDocV4("angular-example.docx", {
			parser: expressionParser,
		});
		doc.render(tags);
		expect(doc.getFullText()).to.be.equal("Hipp Edgar 2014");
	});

	it("should work with loops", () => {
		const content = "<w:t>Hello {#person.adult}you{/person.adult}</w:t>";
		const scope = { person: { name: "Edgar", adult: true } };
		const xmlTemplater = createXmlTemplaterDocx(content, {
			tags: scope,
			parser: expressionParser,
		});
		expect(xmlTemplater.getFullText()).to.be.equal("Hello you");
	});

	it("should work with loops with expressionParser for ie 11", () => {
		const content = "<w:t>Hello {#person.adult}you{/person.adult}</w:t>";
		const scope = { person: { name: "Edgar", adult: true } };
		const xmlTemplater = createXmlTemplaterDocx(content, {
			tags: scope,
			parser: expressionParserIE11,
		});
		expect(xmlTemplater.getFullText()).to.be.equal("Hello you");
	});

	it("should be able to access meta to get the index", () => {
		const content =
			"<w:t>Hello {#users}{$index} {#$isFirst}@{/}{#$isLast}!{/}{name} {/users}</w:t>";
		const scope = {
			users: [{ name: "Jane" }, { name: "Mary" }],
		};
		const xmlTemplater = createXmlTemplaterDocx(content, {
			tags: scope,
			parser: function parser(tag) {
				return {
					get(scope, context) {
						if (tag === "$index") {
							return last(context.scopePathItem);
						}
						if (tag === "$isLast") {
							const totalLength =
								context.scopePathLength[context.scopePathLength.length - 1];
							const index =
								context.scopePathItem[context.scopePathItem.length - 1];
							return index === totalLength - 1;
						}
						if (tag === "$isFirst") {
							const index =
								context.scopePathItem[context.scopePathItem.length - 1];
							return index === 0;
						}
						return scope[tag];
					},
				};
			},
		});
		expect(xmlTemplater.getFullText()).to.be.equal("Hello 0 @Jane 1 !Mary ");
	});

	it("should be able to disable parent scope inheritance", () => {
		const content = "<w:t>Hello {#users}{companyName}-{name} {/}</w:t>";
		const scope = {
			users: [{ name: "Jane" }, {}],
			companyName: "My company, should not be shown",
			name: "Foo",
		};

		const xmlTemplater = createXmlTemplaterDocx(content, {
			tags: scope,
			nullGetter(part) {
				if (!part.module) {
					return "NULL";
				}
				if (part.module === "rawxml") {
					return "";
				}
				return "";
			},
			parser(tag) {
				return {
					get(scope, context) {
						if (context.num < context.scopePath.length) {
							return null;
						}
						if (context.num > context.scopePath.length) {
							throw new Error("Invalid context num");
						}
						return scope[tag];
					},
				};
			},
		});
		expect(xmlTemplater.getFullText()).to.be.equal(
			"Hello NULL-Jane NULL-NULL "
		);
	});

	it("should be able to retrieve parent scope with .. syntax and ... syntax", () => {
		const content =
			"<w:t>{#loop}{#contractors}{...company} {..company} {company} {/}{/loop}</w:t>";
		const tags = {
			company: "Root company",
			loop: [
				{
					company: "ACME Company",
					contractors: [
						{ company: "The other Company" },
						{ company: "Foobar Company" },
					],
				},
			],
		};
		const options = {
			parser(tag) {
				const matchesParent = /^(\.{2,})(.*)/g;
				let parentCount = 0;
				if (matchesParent.test(tag)) {
					parentCount = tag.replace(matchesParent, "$1").length - 1;
					tag = tag.replace(matchesParent, "$2");
				}
				return {
					get(scope, context) {
						if (context.scopePath.length - context.num < parentCount) {
							return null;
						}
						return scope[tag];
					},
				};
			},
			tags,
		};

		const doc = createXmlTemplaterDocx(content, options);
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal(
			"Root company ACME Company The other Company Root company ACME Company Foobar Company "
		);
	});

	it("should be able to have scopePathItem with different lengths when having conditions", () => {
		const content = "<w:t>{#cond}{name}{/}</w:t>";
		const scope = {
			cond: true,
			name: "John",
		};
		let innerContext = null;
		const xmlTemplater = createXmlTemplaterDocx(content, {
			tags: scope,
			parser: function parser(tag) {
				return {
					get(scope, context) {
						if (tag === "name") {
							innerContext = context;
						}
						return scope[tag];
					},
				};
			},
		});
		expect(xmlTemplater.getFullText()).to.be.equal("John");
		expect(innerContext.scopePath).to.be.deep.equal(["cond"]);
		expect(innerContext.scopePathItem).to.be.deep.equal([0]);
		expect(innerContext.scopeList.length).to.be.equal(2);
		expect(innerContext.scopeList[0]).to.be.deep.equal(
			innerContext.scopeList[1]
		);
	});

	it("should call the parser just once", () => {
		let calls = 0;
		const content = "<w:t>{name}</w:t>";
		const scope = {
			name: "John",
		};
		createXmlTemplaterDocx(content, {
			tags: scope,
			parser: function parser(tag) {
				return {
					get(scope) {
						calls++;
						return scope[tag];
					},
				};
			},
		});
		expect(calls).to.equal(1);
	});

	it("should be able to access meta and context to get the type of tag", () => {
		const content = `<w:p><w:t>Hello {#users}{name}{/users}</w:t></w:p>
		<w:p><w:t>{@rrr}</w:t></w:p>
		`;
		const scope = {
			users: [{ name: "Jane" }],
			rrr: "",
		};
		const contexts = [];
		const pX = [];
		const xmlTemplater = createXmlTemplaterDocx(content, {
			tags: scope,
			parser: function parser(tag, x) {
				pX.push(x);
				return {
					get(scope, context) {
						contexts.push(context);
						if (tag === "$index") {
							return last(context.scopePathItem);
						}
						return scope[tag];
					},
				};
			},
		});
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Jane");
		const values = contexts.map(
			({
				meta: {
					part: { type, value, module },
				},
			}) => ({ type, value, module })
		);
		expect(values).to.be.deep.equal([
			{
				type: "placeholder",
				value: "users",
				module: "loop",
			},
			{
				type: "placeholder",
				value: "name",
				module: undefined,
			},
			{
				type: "placeholder",
				value: "rrr",
				module: "rawxml",
			},
		]);

		expect(
			pX.map(({ tag: { type, value, module } }) => ({ type, value, module }))
		).to.be.deep.equal([
			{
				type: "placeholder",
				value: "name",
				module: undefined,
			},
			{
				type: "placeholder",
				value: "users",
				module: "loop",
			},
			{
				type: "placeholder",
				value: "rrr",
				module: "rawxml",
			},
		]);
	});
});

describe("Change the delimiters", () => {
	it("should work with lt and gt delimiter < and >", () => {
		const doc = createDocV4("delimiter-gt.docx", {
			delimiters: {
				start: "<",
				end: ">",
			},
		});
		doc.render({
			user: "John",
		});
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("Hello John");
	});

	it("should work with delimiter % both sides", () => {
		const doc = createDocV4("delimiter-pct.docx", {
			delimiters: {
				start: "%",
				end: "%",
			},
		});
		doc.render({
			user: "John",
			company: "PCorp",
		});
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("Hello John from PCorp");
	});
});

describe("Special characters", () => {
	it("should parse placeholder containing special characters", () => {
		const content = "<w:t>Hello {&gt;name}</w:t>";
		const scope = { ">name": "Edgar" };
		const xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		const c = getContent(xmlTemplater);
		expect(c).to.be.deep.equal('<w:t xml:space="preserve">Hello Edgar</w:t>');
	});

	it("should not decode xml entities recursively", () => {
		const content = "<w:t>Hello {&amp;lt;}</w:t>";
		const scope = { "&lt;": "good", "<": "bad!!" };
		const xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		const c = getContent(xmlTemplater);
		expect(c).to.be.deep.equal('<w:t xml:space="preserve">Hello good</w:t>');
	});

	it("should render placeholder containing special characters", () => {
		const content = "<w:t>Hello {name}</w:t>";
		const scope = { name: "<Edgar>" };
		const xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		const c = getContent(xmlTemplater);
		expect(c).to.be.deep.equal(
			'<w:t xml:space="preserve">Hello &lt;Edgar&gt;</w:t>'
		);
	});

	it("should read full text correctly", () => {
		const doc = createDocV4("cyrillic.docx");
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
	it("should still read full text after applying tags", () => {
		const doc = createDocV4("cyrillic.docx");
		doc.render({ name: "Edgar" });
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
	it("should insert russian characters", () => {
		const russian = "Пупкина";
		const doc = createDocV4("tag-example.docx");
		doc.render({ last_name: russian });
		const outputText = doc.getFullText();
		expect(outputText.substr(0, 7)).to.be.equal(russian);
	});
});

describe("Complex table example", () => {
	it("should not do anything special when loop outside of table", () => {
		const content = `<w:p><w:t>{#tables}</w:t></w:p>
<w:tbl><w:tr><w:tc>
<w:p><w:t>{user}</w:t></w:p>
</w:tc></w:tr></w:tbl>
<w:p><w:t>{/tables}</w:t></w:p>`;
		const scope = {
			tables: [{ user: "John" }, { user: "Jane" }],
		};
		const doc = createXmlTemplaterDocx(content, { tags: scope });
		const c = getContent(doc);
		expect(c).to.be.equal(
			`<w:p><w:t/></w:p>
<w:tbl><w:tr><w:tc>
<w:p><w:t xml:space="preserve">John</w:t></w:p>
</w:tc></w:tr></w:tbl>
<w:p><w:t/></w:p>
<w:tbl><w:tr><w:tc>
<w:p><w:t xml:space="preserve">Jane</w:t></w:p>
</w:tc></w:tr></w:tbl>
<w:p><w:t/></w:p>`
		);
	});

	it("should work when looping inside tables", () => {
		const tags = {
			table1: [1],
			key: "value",
		};
		const template = `<w:tr>
		<w:tc><w:p><w:t>{#table1}Hi</w:t></w:p></w:tc>
		<w:tc><w:p><w:t>{/table1}</w:t></w:p> </w:tc>
		</w:tr>
		<w:tr>
		<w:tc><w:p><w:t>{#table1}Ho</w:t></w:p></w:tc>
		<w:tc><w:p><w:t>{/table1}</w:t></w:p></w:tc>
		</w:tr>
		<w:p><w:t>{key}</w:t></w:p>
		`;
		const doc = createXmlTemplaterDocx(template, { tags });
		const fullText = doc.getFullText();

		expect(fullText).to.be.equal("HiHovalue");
		const expected = `<w:tr>
		<w:tc><w:p><w:t xml:space="preserve">Hi</w:t></w:p></w:tc>
		<w:tc><w:p><w:t/></w:p> </w:tc>
		</w:tr>
		<w:tr>
		<w:tc><w:p><w:t xml:space="preserve">Ho</w:t></w:p></w:tc>
		<w:tc><w:p><w:t/></w:p></w:tc>
		</w:tr>
		<w:p><w:t xml:space="preserve">value</w:t></w:p>
		`;
		const c = getContent(doc);
		expect(c).to.be.equal(expected);
	});
});
describe("Raw Xml Insertion", () => {
	it("should work with simple example", () => {
		const inner = "<w:p><w:r><w:t>{@complexXml}</w:t></w:r></w:p>";
		const content = `<w:document>${inner}</w:document>`;
		const scope = {
			complexXml:
				'<w:p w:rsidR="00612058" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>My custom XML</w:t></w:r></w:p><w:tbl><w:tblPr><w:tblStyle w:val="Grilledutableau"/><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid><w:gridCol w:w="2952"/><w:gridCol w:w="2952"/><w:gridCol w:w="2952"/></w:tblGrid><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:b/><w:color w:val="000000" w:themeColor="text1"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:color w:val="000000" w:themeColor="text1"/></w:rPr><w:t>Test</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:b/><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FF0000"/></w:rPr><w:t>Xml</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>Generated</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="000000" w:themeColor="text1"/><w:u w:val="single"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w:color w:val="000000" w:themeColor="text1"/><w:u w:val="single"/></w:rPr><w:t>Underline</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w:color w:val="FF0000"/><w:highlight w:val="yellow"/></w:rPr><w:t>Highlighting</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:rFonts w:ascii="Bauhaus 93" w:hAnsi="Bauhaus 93"/><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w:rFonts w:ascii="Bauhaus 93" w:hAnsi="Bauhaus 93"/><w:color w:val="FF0000"/></w:rPr><w:t>Font</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00EA4B08"><w:pPr><w:jc w:val="center"/><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>Centering</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:i/><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w:i/><w:color w:val="FF0000"/></w:rPr><w:t>Italic</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2952" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr></w:tbl>',
		};
		const doc = createXmlTemplaterDocx(content, { tags: scope });
		const c = getContent(doc);
		expect(c.length).to.be.equal(
			content.length + scope.complexXml.length - inner.length + "<w:p/>".length
		);
		expect(c).to.contain(scope.complexXml);
	});

	it("should work even when tags are after the xml", () => {
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
				{ year: 1550, name: "Moto", company: "Fein" },
				{ year: 1987, name: "Water", company: "Test" },
				{ year: 2010, name: "Bread", company: "Yu" },
			],
		};
		const doc = createXmlTemplaterDocx(content, { tags: scope });
		const c = getContent(doc);
		expect(c).to.contain(scope.complexXml);
		expect(doc.getFullText()).to.be.equal(
			"HelloJohnDoe 1550MotoFein 1987WaterTest 2010BreadYu"
		);
	});

	it("should work with false value", () => {
		const content = `
			<w:p><w:r><w:t>{@rawXML}</w:t></w:r></w:p>
			<w:p><w:r><w:t>Hi</w:t></w:r></w:p>
		`;
		const doc = createXmlTemplaterDocx(content, { tags: { rawXML: false } });
		expect(doc.getFullText()).to.be.equal("Hi");
	});

	it("should work with closing tag in the form of <w:t>}{/body}</w:t>", () => {
		const scope = { body: [{ paragraph: "hello" }] };
		const content = `<w:t>{#body}</w:t>
		<w:t>{paragraph</w:t>
			<w:t>}{/body}</w:t>`;
		const xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		const c = getContent(xmlTemplater);
		expect(c).not.to.contain("</w:t></w:t>");
	});
	it("should work with simple example and given options", () => {
		const doc = createDocV4("one-raw-xml-tag.docx", {
			fileTypeConfig: assign({}, Docxtemplater.FileTypeConfig.docx(), {
				tagRawXml: "w:r",
			}),
		});
		doc.render({
			xmlTag:
				'<w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>My custom</w:t></w:r><w:r><w:rPr><w:color w:val="00FF00"/></w:rPr><w:t>XML</w:t></w:r>',
		});
		expect(doc.getFullText()).to.be.equal("asdfMy customXMLqwery");
	});
});

describe("Multi line", () => {
	it("should work when tag spans multiple lines (paragraphs)", function () {
		return this.render({
			name: "tag-spanning-multiline.docx",
			data: {
				first_name: "Hipp",
				last_name: "Edgar",
				phone: "0652455478",
				description: "New Website",
			},
			expectedName: "expected-tag-spanning-multiline.docx",
		});
	});
});

describe("Constructor v4", () => {
	it("should work when modules are attached", () => {
		let isModuleCalled = false;

		const module = {
			name: "TestModule",
			optionsTransformer(options) {
				isModuleCalled = true;
				return options;
			},
		};

		createDocV4("tag-example.docx", { modules: [module] });
		expect(isModuleCalled).to.equal(true);
	});

	it("should throw an error when modules passed is not an array", () => {
		expect(
			() => new Docxtemplater(getZip("tag-example.docx"), { modules: {} })
		).to.throw(
			"The modules argument of docxtemplater's constructor must be an array"
		);
	});

	it("should throw an error when an invalid zip is passed", () => {
		const zip = getZip("tag-example.docx");
		zip.files = null;

		expect(() => new Docxtemplater(zip)).to.throw(
			"The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)"
		);

		expect(() => new Docxtemplater("content")).to.throw(
			"The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)"
		);

		expect(() => new Docxtemplater({ files: [] })).to.throw(
			"The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)"
		);

		if (typeof Buffer !== "undefined") {
			expect(() => new Docxtemplater(Buffer.from("content"))).to.throw(
				"The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)"
			);
		}
	});

	it("should work when the delimiters are passed", () => {
		const options = {
			delimiters: {
				start: "<",
				end: ">",
			},
		};
		const doc = createDocV4("delimiter-gt.docx", options);
		doc.render({
			user: "John",
		});
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("Hello John");
	});

	it("should work when both modules and delimiters are passed and modules should have access to options object", () => {
		let isModuleCalled = false,
			optionsPassedToModule;
		const options = {
			delimiters: {
				start: "%",
				end: "%",
			},
			modules: [
				{
					name: "MyModule",
					optionsTransformer(options) {
						optionsPassedToModule = options;
						isModuleCalled = true;
						return options;
					},
				},
			],
		};
		const doc = createDocV4("delimiter-pct.docx", options);
		expect(isModuleCalled).to.be.equal(true);
		expect(optionsPassedToModule.delimiters.start).to.be.equal("%");
		expect(optionsPassedToModule.delimiters.end).to.be.equal("%");
		// Verify that default options are passed to the modules
		expect(optionsPassedToModule.linebreaks).to.be.equal(false);

		doc.render({
			user: "John",
			company: "Acme",
		});

		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("Hello John from Acme");
	});

	class MyTestModule {
		render(part) {
			return {
				value: part.value,
			};
		}
	}

	it("should throw error when using a non-instanciated class as a module", () => {
		const options = {
			delimiters: {
				start: "%",
				end: "%",
			},
			modules: [MyTestModule],
		};
		expect(() => createDocV4("delimiter-pct.docx", options)).to.throw(
			"Cannot attach a class/function as a module. Most probably you forgot to instantiate the module by using `new` on the module."
		);
	});

	it("should throw if using v4 constructor and setOptions", () => {
		const doc = createDocV4("tag-multiline.docx");
		expect(() => doc.setOptions({ linebreaks: true })).to.throw(
			"setOptions() should not be called manually when using the v4 constructor"
		);
	});

	it("should throw if using v4 constructor and attachModule", () => {
		const doc = createDocV4("tag-multiline.docx");
		expect(() => doc.attachModule({ render() {} })).to.throw(
			"attachModule() should not be called manually when using the v4 constructor"
		);
	});

	it("should throw if using v4 constructor and loadZip", () => {
		const doc = createDocV4("tag-multiline.docx");
		expect(() => doc.loadZip()).to.throw(
			"loadZip() should not be called manually when using the v4 constructor"
		);
	});

	it("should render correctly", () => {
		const doc = new Docxtemplater(getZip("tag-example.docx"));
		doc.render({
			first_name: "John",
			last_name: "Doe",
		});
		expect(doc.getFullText()).to.be.equal("Doe John");
	});

	it("should work when modules are attached with valid filetypes", () => {
		let isModuleCalled = false;
		const module = {
			name: "FooModule",
			optionsTransformer(options) {
				isModuleCalled = true;
				return options;
			},
			supportedFileTypes: ["pptx", "docx"],
		};
		createDocV4("tag-example.docx", { modules: [module] });
		expect(isModuleCalled).to.equal(true);
	});

	it("should throw an error when supportedFieldType property in passed module is not an Array", () => {
		const zip = getZip("tag-example.docx");
		const module = {
			optionsTransformer(options) {
				return options;
			},
			supportedFileTypes: "pptx",
		};
		expect(() => new Docxtemplater(zip, { modules: [module] })).to.throw(
			"The supportedFileTypes field of the module must be an array"
		);
	});

	it("should fail with readable error when using new Docxtemplater(null)", () => {
		expect(() => new Docxtemplater(null, {})).to.throw(
			"The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)"
		);
	});

	it("should fail with readable error when using new Docxtemplater(null, {modules: [inspectModule()]})", () => {
		expect(
			() => new Docxtemplater(null, { modules: [inspectModule()] })
		).to.throw(
			"The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)"
		);
	});
});
