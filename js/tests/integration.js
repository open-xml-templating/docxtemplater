"use strict";

var _require = require("./utils"),
    expectToThrow = _require.expectToThrow,
    createDoc = _require.createDoc,
    shouldBeSame = _require.shouldBeSame,
    expect = _require.expect;

var angularParser = require("./angular-parser");
var Errors = require("../errors.js");

describe("Pptx generation", function () {
	it("should work with title", function () {
		var doc = createDoc("title-example.pptx");
		var con = doc.getZip().files["docProps/app.xml"].asText();
		expect(con).not.to.contain("Edgar");
		doc.setData({ name: "Edgar" }).render();
		con = doc.getZip().files["docProps/app.xml"].asText();
		expect(con).to.contain("Edgar");
	});
	it("should work with simple pptx", function () {
		var doc = createDoc("simple-example.pptx");
		doc.setData({ name: "Edgar" }).render();
		expect(doc.getFullText()).to.be.equal("Hello Edgar");
	});
	it("should work with table pptx", function () {
		var doc = createDoc("table-example.pptx");
		doc.setData({
			users: [{ msg: "hello", name: "mary" }, { msg: "hello", name: "john" }]
		}).render();
		shouldBeSame({ doc: doc, expectedName: "table-example-expected.pptx" });
	});
	it("should work with loop pptx", function () {
		var doc = createDoc("loop-example.pptx");
		doc.setData({ users: [{ name: "Doe" }, { name: "John" }] }).render();
		expect(doc.getFullText()).to.be.equal(" Doe  John ");
		shouldBeSame({ doc: doc, expectedName: "expected-loop-example.pptx" });
	});

	it("should work with simple raw pptx", function () {
		var raw = "<p:sp>\n  <p:nvSpPr>\n    <p:cNvPr id=\"37\" name=\"CustomShape 2\"/>\n    <p:cNvSpPr/>\n    <p:nvPr/>\n  </p:nvSpPr>\n  <p:spPr>\n    <a:xfrm>\n      <a:off x=\"504000\" y=\"1769040\"/>\n      <a:ext cx=\"9071280\" cy=\"4384080\"/>\n    </a:xfrm>\n    <a:prstGeom prst=\"rect\">\n      <a:avLst/>\n    </a:prstGeom>\n    <a:noFill/>\n    <a:ln>\n      <a:noFill/>\n    </a:ln>\n  </p:spPr>\n  <p:style>\n    <a:lnRef idx=\"0\"/>\n    <a:fillRef idx=\"0\"/>\n    <a:effectRef idx=\"0\"/>\n    <a:fontRef idx=\"minor\"/>\n  </p:style>\n  <p:txBody>\n    <a:bodyPr lIns=\"0\" rIns=\"0\" tIns=\"0\" bIns=\"0\" anchor=\"ctr\"/>\n    <a:p>\n      <a:pPr algn=\"ctr\">\n        <a:lnSpc>\n          <a:spcPct val=\"100000\"/>\n        </a:lnSpc>\n      </a:pPr>\n      <a:r>\n        <a:rPr b=\"0\" lang=\"fr-FR\" sz=\"3200\" spc=\"-1\" strike=\"noStrike\">\n          <a:solidFill>\n            <a:srgbClr val=\"000000\"/>\n          </a:solidFill>\n          <a:uFill>\n            <a:solidFill>\n              <a:srgbClr val=\"ffffff\"/>\n            </a:solidFill>\n          </a:uFill>\n          <a:latin typeface=\"Arial\"/>\n        </a:rPr>\n        <a:t>Hello World</a:t>\n      </a:r>\n      <a:endParaRPr b=\"0\" lang=\"fr-FR\" sz=\"1800\" spc=\"-1\" strike=\"noStrike\">\n        <a:solidFill>\n          <a:srgbClr val=\"000000\"/>\n        </a:solidFill>\n        <a:uFill>\n          <a:solidFill>\n            <a:srgbClr val=\"ffffff\"/>\n          </a:solidFill>\n        </a:uFill>\n        <a:latin typeface=\"Arial\"/>\n      </a:endParaRPr>\n    </a:p>\n  </p:txBody>\n</p:sp>";
		var doc = createDoc("raw-xml-example.pptx");
		doc.setData({ raw: raw }).render();
		expect(doc.getFullText()).to.be.equal("Hello World");
		shouldBeSame({ doc: doc, expectedName: "expected-raw-xml-example.pptx" });
	});
});

describe("Table", function () {
	it("should work with selfclosing tag inside table with paragraphLoop", function () {
		var tags = {
			a: [{
				b: {
					c: "Foo",
					d: "Hello "
				}
			}, {
				b: {
					c: "Foo",
					d: "Hello "
				}
			}]
		};
		var doc = createDoc("loop-valid.docx");
		doc.setData(tags);
		doc.setOptions({ paragraphLoop: true });
		doc.render();
		shouldBeSame({ doc: doc, expectedName: "loop-valid-expected.docx" });
	});

	it("should work with tables", function () {
		var tags = {
			clients: [{ first_name: "John", last_name: "Doe", phone: "+33647874513" }, { first_name: "Jane", last_name: "Doe", phone: "+33454540124" }, { first_name: "Phil", last_name: "Kiel", phone: "+44578451245" }, { first_name: "Dave", last_name: "Sto", phone: "+44548787984" }]
		};
		var doc = createDoc("tag-intelligent-loop-table.docx");
		doc.setData(tags);
		doc.render();
		var expectedText = "JohnDoe+33647874513JaneDoe+33454540124PhilKiel+44578451245DaveSto+44548787984";
		var text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
		shouldBeSame({
			doc: doc,
			expectedName: "tag-intelligent-loop-table-expected.docx"
		});
	});

	it("should work with simple table", function () {
		var doc = createDoc("table-complex2-example.docx");
		doc.setData({
			table1: [{
				t1data1: "t1-1row-data1",
				t1data2: "t1-1row-data2",
				t1data3: "t1-1row-data3",
				t1data4: "t1-1row-data4"
			}, {
				t1data1: "t1-2row-data1",
				t1data2: "t1-2row-data2",
				t1data3: "t1-2row-data3",
				t1data4: "t1-2row-data4"
			}, {
				t1data1: "t1-3row-data1",
				t1data2: "t1-3row-data2",
				t1data3: "t1-3row-data3",
				t1data4: "t1-3row-data4"
			}],
			t1total1: "t1total1-data",
			t1total2: "t1total2-data",
			t1total3: "t1total3-data"
		});
		doc.render();
		var fullText = doc.getFullText();
		expect(fullText).to.be.equal("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data");
	});
	it("should work with more complex table", function () {
		var doc = createDoc("table-complex-example.docx");
		doc.setData({
			table2: [{
				t2data1: "t2-1row-data1",
				t2data2: "t2-1row-data2",
				t2data3: "t2-1row-data3",
				t2data4: "t2-1row-data4"
			}, {
				t2data1: "t2-2row-data1",
				t2data2: "t2-2row-data2",
				t2data3: "t2-2row-data3",
				t2data4: "t2-2row-data4"
			}],
			t1total1: "t1total1-data",
			t1total2: "t1total2-data",
			t1total3: "t1total3-data",
			t2total1: "t2total1-data",
			t2total2: "t2total2-data",
			t2total3: "t2total3-data"
		});
		doc.render();
		var fullText = doc.getFullText();
		expect(fullText).to.be.equal("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4TOTALt1total1-datat1total2-datat1total3-dataTABLE2COLUMN1COLUMN2COLUMN3COLUMN4t2-1row-data1t2-1row-data2t2-1row-data3t2-1row-data4t2-2row-data1t2-2row-data2t2-2row-data3t2-2row-data4TOTALt2total1-datat2total2-datat2total3-data");
	});

	it("should work when looping around tables", function () {
		var doc = createDoc("table-repeat.docx");
		doc.setData({
			table: [1, 2, 3, 4]
		});
		doc.render();
		var fullText = doc.getFullText();
		expect(fullText).to.be.equal("1234123412341234");
	});
});

describe("Dash Loop Testing", function () {
	it("dash loop ok on simple table -> w:tr", function () {
		var tags = {
			os: [{ type: "linux", price: "0", reference: "Ubuntu10" }, { type: "DOS", price: "500", reference: "Win7" }, { type: "apple", price: "1200", reference: "MACOSX" }]
		};
		var doc = createDoc("tag-dash-loop.docx");
		doc.setData(tags);
		doc.render();
		var expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
		var text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});
	it("dash loop ok on simple table -> w:table", function () {
		var tags = {
			os: [{ type: "linux", price: "0", reference: "Ubuntu10" }, { type: "DOS", price: "500", reference: "Win7" }, { type: "apple", price: "1200", reference: "MACOSX" }]
		};
		var doc = createDoc("tag-dash-loop-table.docx");
		doc.setData(tags);
		doc.render();
		var expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
		var text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});
	it("dash loop ok on simple list -> w:p", function () {
		var tags = {
			os: [{ type: "linux", price: "0", reference: "Ubuntu10" }, { type: "DOS", price: "500", reference: "Win7" }, { type: "apple", price: "1200", reference: "MACOSX" }]
		};
		var doc = createDoc("tag-dash-loop-list.docx");
		doc.setData(tags);
		doc.render();
		var expectedText = "linux 0 Ubuntu10 DOS 500 Win7 apple 1200 MACOSX ";
		var text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});
});

describe("Templating", function () {
	describe("text templating", function () {
		it("should change values with template data", function () {
			var tags = {
				first_name: "Hipp",
				last_name: "Edgar",
				phone: "0652455478",
				description: "New Website"
			};
			var doc = createDoc("tag-example.docx");
			doc.setData(tags);
			doc.render();
			expect(doc.getFullText()).to.be.equal("Edgar Hipp");
			expect(doc.getFullText("word/header1.xml")).to.be.equal("Edgar Hipp0652455478New Website");
			expect(doc.getFullText("word/footer1.xml")).to.be.equal("EdgarHipp0652455478");
			shouldBeSame({ doc: doc, expectedName: "tag-example-expected.docx" });
		});
	});

	it("should work with paragraphloop", function () {
		var doc = createDoc("users.docx");
		doc.setOptions({
			paragraphLoop: true
		});
		doc.setData({ users: ["John", "Jane", "Louis"] }).render();
		shouldBeSame({ doc: doc, expectedName: "users-expected.docx" });
	});

	it("should work with paragraphloop without removing extra text", function () {
		var doc = createDoc("paragraph-loops.docx");
		doc.setOptions({
			paragraphLoop: true
		});
		doc.setData({
			condition: [1, 2],
			placeholder: "placeholder-value"
		}).render();
		shouldBeSame({ doc: doc, expectedName: "expected-paragraph-loop.docx" });
	});

	it("should work with paragraphloop pptx", function () {
		var doc = createDoc("paragraph-loop.pptx");
		doc.setOptions({
			paragraphLoop: true
		});
		doc.setData({
			users: [{ age: 10, name: "Bar" }, { age: 18, name: "Bar" }, { age: 22, name: "Bar" }]
		}).render();
		shouldBeSame({ doc: doc, expectedName: "expected-paragraph-loop.pptx" });
	});

	it("should fail properly when having lexed + postparsed errors", function () {
		var doc = createDoc("multi-errors.docx");
		doc.setOptions({
			paragraphLoop: true,
			parser: angularParser
		});
		doc.setData({
			users: [{ age: 10, name: "Bar" }, { age: 18, name: "Bar" }, { age: 22, name: "Bar" }]
		});
		var expectedError = {
			message: "Multi error",
			name: "TemplateError",
			properties: {
				id: "multi_error",
				errors: [{
					name: "TemplateError",
					message: "Unclosed tag",
					properties: {
						xtag: "firstName",
						id: "unclosed_tag",
						context: "{firstName ",
						offset: 0
					}
				}, {
					name: "TemplateError",
					message: "Unclosed tag",
					properties: {
						xtag: "error",
						id: "unclosed_tag",
						context: "{error  ",
						offset: 22
					}
				}, {
					name: "TemplateError",
					message: "Unopened tag",
					properties: {
						xtag: "}",
						id: "unopened_tag",
						context: "}",
						offset: 35
					}
				}, {
					name: "TemplateError",
					message: "Unclosed tag",
					properties: {
						xtag: "",
						id: "unclosed_tag",
						context: "{",
						offset: 42
					}
				}]
			}
		};
		var create = doc.render.bind(doc);
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});
});

describe("Load Office 365 file", function () {
	it("should handle files with word/document2.xml", function () {
		var doc = createDoc("office365.docx");
		doc.setOptions({
			paragraphLoop: true
		});
		doc.setData({
			test: "Value",
			test2: "Value2"
		}).render();
		expect(doc.getFullText()).to.be.equal("Value Value2");
		shouldBeSame({ doc: doc, expectedName: "expected-office365.docx" });
	});
});