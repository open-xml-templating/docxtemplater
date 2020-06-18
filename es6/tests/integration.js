const {
	expectToThrow,
	createDoc,
	shouldBeSame,
	expect,
	resolveSoon,
	createXmlTemplaterDocxNoRender,
	cleanRecursive,
} = require("./utils");

const printy = require("./printy");
const { cloneDeep } = require("lodash");
const { expectedPrintedPostParsed, rawXMLValue } = require("./data-fixtures");

const angularParser = require("./angular-parser");
const Errors = require("../errors.js");

describe("Simple templating", function () {
	describe("text templating", function () {
		it("should change values with template data", function () {
			const tags = {
				first_name: "Hipp",
				last_name: "Edgar",
				phone: "0652455478",
				description: "New Website",
			};
			const doc = createDoc("tag-example.docx");
			doc.setData(tags);
			doc.render();
			expect(doc.getFullText()).to.be.equal("Edgar Hipp");
			expect(doc.getFullText("word/header1.xml")).to.be.equal(
				"Edgar Hipp0652455478New Website"
			);
			expect(doc.getFullText("word/footer1.xml")).to.be.equal(
				"EdgarHipp0652455478"
			);
			shouldBeSame({ doc, expectedName: "expected-tag-example.docx" });
		});
	});

	it("should replace custom properties text", function () {
		const doc = createDoc("properties.docx");
		let app = doc.getZip().files["docProps/app.xml"].asText();
		let core = doc.getZip().files["docProps/core.xml"].asText();
		expect(app).to.contain("{tag1}");
		expect(core).to.contain("{tag1}");
		expect(core).to.contain("{tag2}");
		expect(core).to.contain("{tag3}");
		expect(app).to.contain("{tag4}");
		expect(app).to.contain("{tag5}");
		expect(core).to.contain("{tag6}");
		expect(core).to.contain("{tag7}");
		expect(core).to.contain("{tag8}");
		expect(app).to.contain("{tag9}");
		doc
			.setData({
				tag1: "resolvedvalue1",
				tag2: "resolvedvalue2",
				tag3: "resolvedvalue3",
				tag4: "resolvedvalue4",
				tag5: "resolvedvalue5",
				tag6: "resolvedvalue6",
				tag7: "resolvedvalue7",
				tag8: "resolvedvalue8",
				tag9: "resolvedvalue9",
			})
			.render();
		app = doc.getZip().files["docProps/app.xml"].asText();
		core = doc.getZip().files["docProps/core.xml"].asText();
		expect(app).to.contain("resolvedvalue1");
		expect(core).to.contain("resolvedvalue1");
		expect(core).to.contain("resolvedvalue2");
		expect(core).to.contain("resolvedvalue3");
		expect(app).to.contain("resolvedvalue4");
		expect(app).to.contain("resolvedvalue5");
		expect(core).to.contain("resolvedvalue6");
		expect(core).to.contain("resolvedvalue7");
		expect(core).to.contain("resolvedvalue8");
		expect(app).to.contain("resolvedvalue9");
	});
});

describe("Spacing/Linebreaks", function () {
	it("should show spaces with linebreak option", function () {
		const doc = createDoc("tag-multiline.docx");
		doc.setData({
			description: `hello there
    deep indentation
       goes here
    end`,
		});
		doc.setOptions({ linebreaks: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-multiline-indent.docx" });
	});

	it("should be possible to have linebreaks if setting the option", function () {
		const doc = createDoc("tag-multiline.docx");
		doc.setData({
			description: "The description,\nmultiline",
		});
		doc.setOptions({ linebreaks: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-multiline.docx" });
	});

	it("should work with linebreaks without changing the style", function () {
		const doc = createDoc("multi-tags.docx");
		doc.setData({
			test: "The tag1,\nmultiline\nfoobaz",
			test2: "The tag2,\nmultiline\nfoobar",
		});
		doc.setOptions({ linebreaks: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-two-multiline.docx" });
	});
	it("should be possible to have linebreaks if setting the option", function () {
		const doc = createDoc("tag-multiline.pptx");
		doc.setData({
			description: "The description,\nmultiline",
		});
		doc.setOptions({ linebreaks: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-multiline.pptx" });
	});

	it("should not fail when using linebreaks and tagvalue not a string", function () {
		const doc = createDoc("tag-multiline.pptx");
		doc.setData({
			description: true,
		});
		doc.setOptions({ linebreaks: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-regression-multiline.pptx" });
	});
});

describe("Assignment", function () {
	it("should be possible to assign a value from the template", function () {
		const doc = createDoc("assignment.docx");
		doc.setData({
			first_name: "Jane",
			last_name: "Doe",
		});
		doc.setOptions({
			paragraphLoop: true,
			parser: angularParser,
		});
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-assignment.docx" });
	});
});

describe("Docm/Pptm generation", function () {
	it("should work with docm", function () {
		const tags = {
			user: "John",
		};
		const doc = createDoc("input.docm");
		doc.setData(tags);
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-docm.docx" });
	});

	it("should work with pptm", function () {
		const tags = {
			user: "John",
		};
		const doc = createDoc("input.pptm");
		doc.setData(tags);
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-pptm.pptx" });
	});
});

describe("Dotm/dotx generation", function () {
	it("should work with dotx", function () {
		const tags = {
			user: "John",
		};
		const doc = createDoc("input.dotx");
		doc.setData(tags);
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-dotx.docx" });
	});

	it("should work with dotm", function () {
		const tags = {
			user: "John",
		};
		const doc = createDoc("input.dotm");
		doc.setData(tags);
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-dotm.docx" });
	});
});

describe("Pptx generation", function () {
	it("should work with title", function () {
		const doc = createDoc("title-example.pptx");
		let con = doc.getZip().files["docProps/app.xml"].asText();
		expect(con).not.to.contain("Edgar");
		doc.setData({ name: "Edgar" }).render();
		con = doc.getZip().files["docProps/app.xml"].asText();
		expect(con).to.contain("Edgar");
	});
	it("should work with simple pptx", function () {
		const doc = createDoc("simple-example.pptx");
		doc.setData({ name: "Edgar" }).render();
		expect(doc.getFullText()).to.be.equal("Hello Edgar");
	});
	it("should work with table pptx", function () {
		const doc = createDoc("table-example.pptx");
		doc
			.setData({
				users: [
					{ msg: "hello", name: "mary" },
					{ msg: "hello", name: "john" },
				],
			})
			.render();
		shouldBeSame({ doc, expectedName: "expected-table-example.pptx" });
	});
	it("should work with loop pptx", function () {
		const doc = createDoc("loop-example.pptx");
		doc.setData({ users: [{ name: "Doe" }, { name: "John" }] }).render();
		expect(doc.getFullText()).to.be.equal(" Doe  John ");
		shouldBeSame({ doc, expectedName: "expected-loop-example.pptx" });
	});

	it("should work with simple raw pptx", function () {
		const doc = createDoc("raw-xml-example.pptx");
		let scope, meta, tag;
		let calls = 0;
		doc.setOptions({
			parser: (t) => {
				tag = t;
				return {
					get: (s, m) => {
						scope = s;
						meta = m.meta;
						calls++;
						return scope[tag];
					},
				};
			},
		});
		doc.setData({ raw: rawXMLValue }).render();
		expect(calls).to.equal(1);
		expect(scope.raw).to.be.a("string");
		expect(meta).to.be.an("object");
		expect(meta.part).to.be.an("object");
		expect(meta.part.expanded).to.be.an("array");
		expect(doc.getFullText()).to.be.equal("Hello World");
		shouldBeSame({ doc, expectedName: "expected-raw-xml-example.pptx" });
	});

	it("should work with simple raw pptx async", function () {
		const doc = createDoc("raw-xml-example.pptx");
		let scope, meta, tag;
		let calls = 0;
		doc.setOptions({
			parser: (t) => {
				tag = t;
				return {
					get: (s, m) => {
						scope = s;
						meta = m.meta;
						calls++;
						return scope[tag];
					},
				};
			},
		});
		doc.compile();
		return doc.resolveData({ raw: rawXMLValue }).then(function () {
			doc.render();
			expect(calls).to.equal(1);
			expect(scope.raw).to.be.a("string");
			expect(meta).to.be.an("object");
			expect(meta.part).to.be.an("object");
			expect(meta.part.expanded).to.be.an("array");
			expect(doc.getFullText()).to.be.equal("Hello World");
			shouldBeSame({ doc, expectedName: "expected-raw-xml-example.pptx" });
		});
	});
});

describe("Table", function () {
	it("should work with selfclosing tag inside table with paragraphLoop", function () {
		const tags = {
			a: [
				{
					b: {
						c: "Foo",
						d: "Hello ",
					},
				},
				{
					b: {
						c: "Foo",
						d: "Hello ",
					},
				},
			],
		};
		const doc = createDoc("loop-valid.docx");
		doc.setData(tags);
		doc.setOptions({ paragraphLoop: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-loop-valid.docx" });
	});

	it("should work with tables", function () {
		const tags = {
			clients: [
				{ first_name: "John", last_name: "Doe", phone: "+33647874513" },
				{ first_name: "Jane", last_name: "Doe", phone: "+33454540124" },
				{ first_name: "Phil", last_name: "Kiel", phone: "+44578451245" },
				{ first_name: "Dave", last_name: "Sto", phone: "+44548787984" },
			],
		};
		const doc = createDoc("tag-intelligent-loop-table.docx");
		doc.setData(tags);
		doc.render();
		const expectedText =
			"JohnDoe+33647874513JaneDoe+33454540124PhilKiel+44578451245DaveSto+44548787984";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
		shouldBeSame({
			doc,
			expectedName: "expected-tag-intelligent-loop-table.docx",
		});
	});

	it("should work with simple table", function () {
		const doc = createDoc("table-complex2-example.docx");
		doc.setData({
			table1: [
				{
					t1data1: "t1-1row-data1",
					t1data2: "t1-1row-data2",
					t1data3: "t1-1row-data3",
					t1data4: "t1-1row-data4",
				},
				{
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
				},
			],
			t1total1: "t1total1-data",
			t1total2: "t1total2-data",
			t1total3: "t1total3-data",
		});
		doc.render();
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal(
			"TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data"
		);
	});

	it("should work with more complex table", function () {
		const doc = createDoc("table-complex-example.docx");
		doc.setData({
			table2: [
				{
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
				},
			],
			t1total1: "t1total1-data",
			t1total2: "t1total2-data",
			t1total3: "t1total3-data",
			t2total1: "t2total1-data",
			t2total2: "t2total2-data",
			t2total3: "t2total3-data",
		});
		doc.render();
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal(
			"TABLE1COLUMN1COLUMN2COLUMN3COLUMN4TOTALt1total1-datat1total2-datat1total3-dataTABLE2COLUMN1COLUMN2COLUMN3COLUMN4t2-1row-data1t2-1row-data2t2-1row-data3t2-1row-data4t2-2row-data1t2-2row-data2t2-2row-data3t2-2row-data4TOTALt2total1-datat2total2-datat2total3-data"
		);
	});

	it("should work when looping around tables", function () {
		const doc = createDoc("table-repeat.docx");
		doc.setData({
			table: [1, 2, 3, 4],
		});
		doc.render();
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("1234123412341234");
	});

	it("should not corrupt table with empty rawxml", function () {
		const doc = createDoc("table-raw-xml.docx");
		doc.setData({});
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-raw-xml.docx" });
	});

	it("should not corrupt loop containing section", function () {
		const doc = createDoc("loop-with-section.docx");
		doc.setData({
			loop1: [
				{
					loop2: [1, 2],
				},
				{
					loop2: [],
				},
				{
					loop2: [3, 4, 5],
				},
			],
		});
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-multi-section.docx" });
	});

	it("should not corrupt sdtcontent", function () {
		const doc = createDoc("regression-sdtcontent-paragraph.docx");
		doc.setData({
			loop: {
				name: "foo",
				Id: "bar",
			},
		});
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-sdtcontent-valid.docx" });
	});

	it("should not corrupt table with empty rawxml within loop", function () {
		const doc = createDoc("loops-with-table-raw-xml.docx");
		doc.setData({
			loop: [
				{ loop2: [] },
				{ loop2: {}, raw: "<w:p><w:r><w:t>RAW</w:t></w:r></w:p>" },
			],
		});
		doc.setOptions({ paragraphLoop: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-loop-raw-xml.docx" });
	});

	it("should not corrupt table with empty loop", function () {
		const doc = createDoc("table-loop.docx");
		doc.setData({});
		doc.setOptions({ paragraphLoop: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-empty-table.docx" });
	});
});

describe("Dash Loop", function () {
	it("should work on simple table -> w:tr", function () {
		const tags = {
			os: [
				{ type: "linux", price: "0", reference: "Ubuntu10" },
				{ type: "DOS", price: "500", reference: "Win7" },
				{ type: "apple", price: "1200", reference: "MACOSX" },
			],
		};
		const doc = createDoc("tag-dash-loop.docx");
		doc.setData(tags);
		doc.render();
		const expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});
	it("should work on simple table -> w:table", function () {
		const tags = {
			os: [
				{ type: "linux", price: "0", reference: "Ubuntu10" },
				{ type: "DOS", price: "500", reference: "Win7" },
				{ type: "apple", price: "1200", reference: "MACOSX" },
			],
		};
		const doc = createDoc("tag-dash-loop-table.docx");
		doc.setData(tags);
		doc.render();
		const expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});
	it("should work on simple list -> w:p", function () {
		const tags = {
			os: [
				{ type: "linux", price: "0", reference: "Ubuntu10" },
				{ type: "DOS", price: "500", reference: "Win7" },
				{ type: "apple", price: "1200", reference: "MACOSX" },
			],
		};
		const doc = createDoc("tag-dash-loop-list.docx");
		doc.setData(tags);
		doc.render();
		const expectedText = "linux 0 Ubuntu10 DOS 500 Win7 apple 1200 MACOSX ";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});

	it("should not corrupt document if using empty {-a:p} inside table cell", function () {
		const doc = createDoc("regression-dash-loop-in-table-cell.pptx");
		doc.setData().render();
		shouldBeSame({ doc, expectedName: "expected-table-3-cells.pptx" });
	});

	it("should not corrupt document if using empty {-a:p} inside table cell", function () {
		const doc = createDoc("regression-dash-loop-in-table-cell.pptx");
		doc.setData({ cond: [1, 2, 3] }).render();
		shouldBeSame({ doc, expectedName: "expected-table-3-true-cells.pptx" });
	});
});

describe("Pagebreaks inside loops", function () {
	it("should work at beginning of paragraph loop with 3 elements", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		const doc = createDoc("page-break-inside-condition.docx");
		doc.setOptions({ paragraphLoop: true });
		doc.setData({ cond: [1, 2, 3] }).render();
		shouldBeSame({ doc, expectedName: "expected-with-page-break-3-els.docx" });
	});
	it("should work at beginning of paragraph loop with false", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		const doc = createDoc("page-break-inside-condition.docx");
		doc.setOptions({ paragraphLoop: true });
		doc.setData({ cond: false }).render();
		shouldBeSame({ doc, expectedName: "expected-with-page-break-falsy.docx" });
	});

	it("should work at beginning of std loop with false", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		const doc = createDoc("page-break-inside-condition.docx");
		doc.setData({ cond: false }).render();
		shouldBeSame({
			doc,
			expectedName: "expected-page-break-falsy-std-loop.docx",
		});
	});

	it("should work at beginning of std loop with 3 elements", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		const doc = createDoc("page-break-inside-condition.docx");
		doc.setData({ cond: [1, 2, 3] }).render();
		shouldBeSame({
			doc,
			expectedName: "expected-page-break-3-els-std-loop.docx",
		});
	});

	it("should work at beginning of std loop with truthy", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		const doc = createDoc("page-break-inside-condition.docx");
		doc.setData({ cond: true }).render();
		shouldBeSame({
			doc,
			expectedName: "expected-page-break-truthy-std-loop.docx",
		});
	});

	it("should work with table inside paragraph loop", function () {
		const doc = createDoc("pagebreak-table-loop.docx");
		doc.setOptions({ paragraphLoop: true });
		doc.setData({ loop: [1, 2, 3] }).render();
		shouldBeSame({
			doc,
			expectedName: "expected-pagebreak-table-loop.docx",
		});
	});

	it("should work at end of std loop", function () {
		const doc = createDoc("paragraph-loop-with-pagebreak.docx");
		doc
			.setData({
				users: [{ name: "Bar" }, { name: "John" }, { name: "Baz" }],
			})
			.render();
		shouldBeSame({
			doc,
			expectedName: "expected-noparagraph-loop-with-pagebreak.docx",
		});
	});

	it("should work at end of paragraph loop", function () {
		const doc = createDoc("paragraph-loop-with-pagebreak.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc
			.setData({
				users: [{ name: "Bar" }, { name: "John" }, { name: "Baz" }],
			})
			.render();
		shouldBeSame({
			doc,
			expectedName: "expected-paragraph-loop-with-pagebreak.docx",
		});
	});

	it("should work with pagebreak afterwards with falsy value", function () {
		const doc = createDoc("paragraph-loop-with-pagebreak.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc
			.setData({
				users: false,
			})
			.render();
		shouldBeSame({
			doc,
			expectedName: "expected-paragraph-loop-empty-with-pagebreak.docx",
		});
	});
});

describe("ParagraphLoop", function () {
	it("should work with docx", function () {
		const doc = createDoc("users.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc.setData({ users: ["John", "Jane", "Louis"] }).render();
		shouldBeSame({ doc, expectedName: "expected-users.docx" });
	});

	it("should work without removing extra text", function () {
		const doc = createDoc("paragraph-loops.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc
			.setData({
				condition: [1, 2],
				l1: [
					{
						l2: ["a", "b", "c"],
					},
					{
						l2: ["d", "e", "f"],
					},
				],
				placeholder: "placeholder-value",
			})
			.render();
		shouldBeSame({ doc, expectedName: "expected-paragraph-loop.docx" });
	});

	it("should work with pptx", function () {
		const doc = createDoc("paragraph-loop.pptx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc
			.setData({
				users: [
					{ age: 10, name: "Bar" },
					{ age: 18, name: "Bar" },
					{ age: 22, name: "Bar" },
				],
			})
			.render();
		shouldBeSame({ doc, expectedName: "expected-paragraph-loop.pptx" });
	});

	it("should not fail when having paragraph in paragraph", function () {
		const doc = createDoc("regression-par-in-par.docx");
		const printedPostparsed = [];
		let filePath = "";
		doc.attachModule({
			set(obj) {
				if (obj.inspect) {
					if (obj.inspect.filePath) {
						filePath = obj.inspect.filePath;
					}
					if (obj.inspect.postparsed) {
						printedPostparsed[filePath] = printy(obj.inspect.postparsed);
					}
				}
			},
		});

		doc.setOptions({
			paragraphLoop: true,
			parser: () => ({
				get: () => "foo",
			}),
		});
		doc.setData({});
		doc.render();
		expect(printedPostparsed["word/document.xml"]).to.be.equal(
			expectedPrintedPostParsed
		);
		shouldBeSame({ doc, expectedName: "expected-rendered-par-in-par.docx" });
	});

	it("should work with spacing at the end", function () {
		const doc = createDoc("spacing-end.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc.setData({ name: "John" }).render();
		shouldBeSame({ doc, expectedName: "expected-spacing-end.docx" });
	});

	it("should fail properly when having lexed + postparsed errors", function () {
		const doc = createDoc("multi-errors.docx");
		doc.setOptions({
			paragraphLoop: true,
			parser: angularParser,
		});
		doc.setData({
			users: [
				{ age: 10, name: "Bar" },
				{ age: 18, name: "Bar" },
				{ age: 22, name: "Bar" },
			],
		});
		const expectedError = {
			message: "Multi error",
			name: "TemplateError",
			properties: {
				id: "multi_error",
				errors: [
					{
						name: "TemplateError",
						message: "Unclosed tag",
						properties: {
							file: "word/document.xml",
							xtag: "firstName",
							id: "unclosed_tag",
							context: "{firstName ",
							offset: 0,
						},
					},
					{
						name: "TemplateError",
						message: "Unclosed tag",
						properties: {
							file: "word/document.xml",
							xtag: "error",
							id: "unclosed_tag",
							context: "{error  ",
							offset: 22,
						},
					},
					{
						name: "TemplateError",
						message: "Duplicate close tag, expected one close tag",
						properties: {
							file: "word/document.xml",
							xtag: "{tag}}",
							id: "duplicate_close_tag",
							context: "{tag}}",
							offset: 34,
						},
					},
					{
						name: "TemplateError",
						message: "Duplicate open tag, expected one open tag",
						properties: {
							file: "word/document.xml",
							xtag: "{{bar}",
							id: "duplicate_open_tag",
							context: "{{bar}",
							offset: 42,
						},
					},
				],
			},
		};
		const create = doc.render.bind(doc);
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should fail when placing paragraph loop inside normal loop", function () {
		const doc = createDoc("paragraph-loop-error.docx");
		doc.setData({});
		const expectedError = {
			message: "Multi error",
			name: "TemplateError",
			properties: {
				id: "multi_error",
				errors: [
					{
						name: "TemplateError",
						message: 'No tag "w:p" was found at the left',
						properties: {
							file: "word/document.xml",
							id: "no_xml_tag_found_at_left",
							element: "w:p",
							index: 1,
							parsedLength: 4,
							offset: 12,
							part: {
								endLindex: 17,
								expandTo: "w:p",
								inverted: false,
								lIndex: 17,
								location: "start",
								module: "loop",
								offset: 12,
								raw: "-w:p loop",
								type: "placeholder",
								value: "loop",
							},
						},
					},
					{
						name: "TemplateError",
						message: 'No tag "w:p" was found at the right',
						properties: {
							file: "word/document.xml",
							id: "no_xml_tag_found_at_right",
							element: "w:p",
							index: 3,
							parsedLength: 4,
							offset: 26,
							part: {
								endLindex: 21,
								lIndex: 21,
								location: "end",
								module: "loop",
								offset: 26,
								raw: "/",
								type: "placeholder",
								value: "",
							},
						},
					},
				],
			},
		};
		const create = doc.compile.bind(doc);
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});
});

describe("Prefixes", function () {
	it("should be possible to change the prefix of the loop module", function () {
		const content = "<w:t>{##tables}{user}{/tables}</w:t>";
		const scope = {
			tables: [{ user: "John" }, { user: "Jane" }],
		};
		const doc = createXmlTemplaterDocxNoRender(content, { tags: scope });
		doc.modules.forEach(function (module) {
			if (module.name === "LoopModule") {
				module.prefix.start = "##";
			}
		});
		doc.render();
		expect(doc.getFullText()).to.be.equal("JohnJane");
	});

	it("should be possible to change the prefix of the loop module to a regexp", function () {
		const content =
			"<w:t>{##tables}{user}{/tables}{#tables}{user}{/tables}</w:t>";
		const scope = {
			tables: [{ user: "A" }, { user: "B" }],
		};
		const doc = createXmlTemplaterDocxNoRender(content, { tags: scope });
		doc.modules.forEach(function (module) {
			if (module.name === "LoopModule") {
				module.prefix.start = /^##?(.*)$/;
			}
		});
		doc.render();
		expect(doc.getFullText()).to.be.equal("ABAB");
	});

	it("should be possible to change the prefix of the raw xml module to a regexp", function () {
		const content = "<w:p><w:t>{!!raw}</w:t></w:p>";
		const scope = {
			raw: "<w:p><w:t>HoHo</w:t></w:p>",
		};
		const doc = createXmlTemplaterDocxNoRender(content, { tags: scope });
		doc.modules.forEach(function (module) {
			if (module.name === "RawXmlModule") {
				module.prefix = /^!!?(.*)$/;
			}
		});
		doc.render();

		expect(doc.getFullText()).to.be.equal("HoHo");
	});
});

describe("Load Office 365 file", function () {
	it("should handle files with word/document2.xml", function () {
		const doc = createDoc("office365.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc
			.setData({
				test: "Value",
				test2: "Value2",
			})
			.render();
		expect(doc.getFullText()).to.be.equal("Value Value2");
		shouldBeSame({ doc, expectedName: "expected-office365.docx" });
	});
});

describe("Resolver", function () {
	it("should work", function () {
		const doc = createDoc("office365.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc.compile();
		return doc
			.resolveData({
				test: resolveSoon("Value"),
				test2: "Value2",
			})
			.then(function () {
				doc.render();
				expect(doc.getFullText()).to.be.equal("Value Value2");
				shouldBeSame({ doc, expectedName: "expected-office365.docx" });
			});
	});

	it("should work at parent level", function () {
		const doc = createDoc("office365.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc.compile();
		return doc
			.resolveData(
				resolveSoon({
					test: resolveSoon("Value"),
					test2: "Value2",
				})
			)
			.then(function () {
				doc.render();
				expect(doc.getFullText()).to.be.equal("Value Value2");
				shouldBeSame({ doc, expectedName: "expected-office365.docx" });
			});
	});

	it("should resolve loops", function () {
		const doc = createDoc("multi-loop.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc.compile();
		return doc
			.resolveData({
				companies: resolveSoon([
					{
						name: "Acme",
						users: resolveSoon([
							{
								name: "John",
							},
							{
								name: "James",
							},
						]),
					},
					{
						name: resolveSoon("Emca"),
						users: resolveSoon([
							{
								name: "Mary",
							},
							{
								name: "Liz",
							},
						]),
					},
				]),
				test2: "Value2",
			})
			.then(function () {
				doc.render();
				shouldBeSame({ doc, expectedName: "expected-multi-loop.docx" });
			});
	});

	it("should resolve with simple table", function () {
		const doc = createDoc("table-complex2-example.docx");
		doc.compile();
		return doc
			.resolveData({
				table1: [
					{
						t1data1: "t1-1row-data1",
						t1data2: "t1-1row-data2",
						t1data3: "t1-1row-data3",
						t1data4: "t1-1row-data4",
					},
					{
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
					},
				],
				t1total1: "t1total1-data",
				t1total2: "t1total2-data",
				t1total3: "t1total3-data",
			})
			.then(function (resolved) {
				const myresolved = cloneDeep(resolved);
				cleanRecursive(myresolved);
				expect(myresolved).to.be.deep.equal([
					{
						tag: "t1total1",
						value: "t1total1-data",
					},
					{
						tag: "t1total2",
						value: "t1total2-data",
					},
					{
						tag: "t1total3",
						value: "t1total3-data",
					},
					{
						tag: "table1",
						value: [
							[
								{
									tag: "t1data1",
									value: "t1-1row-data1",
								},
								{
									tag: "t1data2",
									value: "t1-1row-data2",
								},
								{
									tag: "t1data3",
									value: "t1-1row-data3",
								},
								{
									tag: "t1data4",
									value: "t1-1row-data4",
								},
							],
							[
								{
									tag: "t1data1",
									value: "t1-2row-data1",
								},
								{
									tag: "t1data2",
									value: "t1-2row-data2",
								},
								{
									tag: "t1data3",
									value: "t1-2row-data3",
								},
								{
									tag: "t1data4",
									value: "t1-2row-data4",
								},
							],
							[
								{
									tag: "t1data1",
									value: "t1-3row-data1",
								},
								{
									tag: "t1data2",
									value: "t1-3row-data2",
								},
								{
									tag: "t1data3",
									value: "t1-3row-data3",
								},
								{
									tag: "t1data4",
									value: "t1-3row-data4",
								},
							],
						],
					},
				]);
				doc.render();
				const fullText = doc.getFullText();
				expect(fullText).to.be.equal(
					"TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data"
				);
			});
	});

	const dataNestedLoops = { a: [{ d: "Hello world" }] };

	it("should not regress with nested loops sync", function () {
		const doc = createDoc("regression-complex-loops.docx");
		doc.compile();
		doc.setData(dataNestedLoops);
		doc.render();
		shouldBeSame({
			doc,
			expectedName: "expected-regression-complex-loops.docx",
		});
	});

	it("should not regress when having [Content_Types.xml] contain Default instead of Override", function () {
		const doc = createDoc("with-default-contenttype.docx");
		doc.compile();
		doc.setData({});
		doc.render();
		shouldBeSame({
			doc,
			expectedName: "expected-with-default-contenttype.docx",
		});
	});

	it("should not regress with nested loops async", function () {
		const doc = createDoc("regression-complex-loops.docx");
		doc.compile();
		return doc.resolveData(dataNestedLoops).then(function () {
			doc.render();
			shouldBeSame({
				doc,
				expectedName: "expected-regression-complex-loops.docx",
			});
		});
	});

	const regress2Data = {
		amount_wheels_car_1: "4",
		amount_wheels_motorcycle_1: "2",
		amount_wheels_car_2: "6",
		amount_wheels_motorcycle_2: "3",
		id: [
			{
				car: "1",
				motorcycle: "",
			},
		],
	};

	it("should not regress with multiple loops sync", function () {
		const doc = createDoc("regression-loops-resolve.docx");
		doc.compile();
		doc.setData(regress2Data);
		doc.render();
		shouldBeSame({
			doc,
			expectedName: "expected-regression-loops-resolve.docx",
		});
	});

	it("should not regress with multiple loops async", function () {
		const doc = createDoc("regression-loops-resolve.docx");
		doc.compile();
		return doc.resolveData(regress2Data).then(function () {
			doc.render();
			shouldBeSame({
				doc,
				expectedName: "expected-regression-loops-resolve.docx",
			});
		});
	});
});
