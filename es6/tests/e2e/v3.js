const {
	resolveSoon,
	createDocV3,
	captureLogs,
	makeDocx,
	expect,
	shouldBeSame,
	expectToThrow,
	wrapMultiError,
} = require("../utils.js");
const Errors = require("../../errors.js");
const rawXMLValue = require("../data/raw-xml-pptx.js");

describe("V3 API", function () {
	it("should work with setOptions", function () {
		const doc = createDocV3("tag-multiline.docx");
		expect(() => doc.setOptions()).to.throw(
			"setOptions should be called with an object as first parameter"
		);
	});

	it("should work when the delimiters are passed", function () {
		const options = {
			delimiters: {
				start: "<",
				end: ">",
			},
		};
		const doc = createDocV3("delimiter-gt.docx", options);
		doc.compile();
		doc.render({
			user: "John",
		});
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("Hello John");
	});

	it("should work when setting from the Docxtemplater interface", function () {
		const doc = createDocV3("tag-example.docx", {
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

	it("should work with simple raw pptx async", function () {
		let scope, meta, tag;
		let calls = 0;
		const doc = createDocV3("raw-xml-example.pptx", {
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
		return doc.resolveData({ raw: resolveSoon(rawXMLValue) }).then(function () {
			doc.render();
			expect(calls).to.equal(1);
			expect(meta).to.be.an("object");
			expect(meta.part).to.be.an("object");
			expect(meta.part.expanded).to.be.an("array");
			expect(doc.getFullText()).to.be.equal("Hello World");
			shouldBeSame({ doc, expectedName: "expected-raw-xml-example.pptx" });
		});
	});

	it("should fail when tag unclosed", function () {
		const content = "<w:t>{user {name}</w:t>";
		const expectedError = {
			name: "TemplateError",
			message: "Unclosed tag",
			properties: {
				file: "word/document.xml",
				id: "unclosed_tag",
				context: "{user ",
				xtag: "user",
				offset: 0,
			},
		};
		const doc = makeDocx(content, { errorLogging: false });
		const capture = captureLogs();
		expectToThrow(
			() => doc.compile(),
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		);
		capture.stop();
	});
});
