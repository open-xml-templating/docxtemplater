const {
	expectToThrow,
	createDocV4,
	shouldBeSame,
	expect,
	makeDocxV4,
	captureLogs,
} = require("../utils.js");

const printy = require("../printy.js");

const expressionParser = require("../../expressions.js");
const Errors = require("../../errors.js");

describe("Simple templating", () => {
	describe("text templating", () => {
		it("should change values with template data", () => {
			const doc = createDocV4("tag-example.docx").render({
				first_name: "Hipp",
				last_name: "Edgar",
				phone: "0652455478",
				description: "New Website",
			});
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

	it("should replace custom properties text", () => {
		const filePaths = [];
		const module = {
			name: "Test module",
			requiredAPIVersion: "3.0.0",
			render(a, options) {
				if (filePaths.indexOf(options.filePath) === -1) {
					filePaths.push(options.filePath);
				}
			},
		};
		const doc = createDocV4("properties.docx", { modules: [module] });
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
		doc.render({
			tag1: "resolvedvalue1",
			tag2: "resolvedvalue2",
			tag3: "resolvedvalue3",
			tag4: "resolvedvalue4",
			tag5: "resolvedvalue5",
			tag6: "resolvedvalue6",
			tag7: "resolvedvalue7",
			tag8: "resolvedvalue8",
			tag9: "resolvedvalue9",
		});
		/*
		 * The order here is important !!
		 *
		 * We expect the word/settings.xml templating to happen before the
		 * "word/document.xml"
		 *
		 * This way, users can write assignments in the word/settings.xml, and
		 * use the exposed variables in the word/document.xml
		 *
		 * Fixed since 3.37.6
		 */
		expect(filePaths).to.deep.equal([
			"word/settings.xml",
			"docProps/core.xml",
			"docProps/app.xml",
			"word/document.xml",
		]);
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

describe("Docxtemplater internal properties", () => {
	it("should calculate filesContentTypes and invertedContentTypes", () => {
		const doc = createDocV4("tag-example.docx");
		expect(doc.filesContentTypes).to.deep.equal({
			"_rels/.rels": "application/vnd.openxmlformats-package.relationships+xml",
			"word/_rels/document.xml.rels":
				"application/vnd.openxmlformats-package.relationships+xml",
			"docProps/app.xml":
				"application/vnd.openxmlformats-officedocument.extended-properties+xml",
			"docProps/core.xml":
				"application/vnd.openxmlformats-package.core-properties+xml",
			"word/document.xml":
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
			"word/endnotes.xml":
				"application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml",
			"word/fontTable.xml":
				"application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml",
			"word/footer1.xml":
				"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml",
			"word/footnotes.xml":
				"application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml",
			"word/header1.xml":
				"application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
			"word/settings.xml":
				"application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml",
			"word/styles.xml":
				"application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml",
			"word/stylesWithEffects.xml":
				"application/vnd.ms-word.stylesWithEffects+xml",
			"word/theme/theme1.xml":
				"application/vnd.openxmlformats-officedocument.theme+xml",
			"word/webSettings.xml":
				"application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml",
		});

		expect(doc.invertedContentTypes).to.deep.equal({
			"application/vnd.openxmlformats-package.relationships+xml": [
				"_rels/.rels",
				"word/_rels/document.xml.rels",
			],
			"application/vnd.ms-word.stylesWithEffects+xml": [
				"word/stylesWithEffects.xml",
			],
			"application/vnd.openxmlformats-officedocument.extended-properties+xml": [
				"docProps/app.xml",
			],
			"application/vnd.openxmlformats-officedocument.theme+xml": [
				"word/theme/theme1.xml",
			],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml":
				["word/document.xml"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml":
				["word/endnotes.xml"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml":
				["word/fontTable.xml"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml":
				["word/footer1.xml"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml":
				["word/footnotes.xml"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml":
				["word/header1.xml"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml":
				["word/settings.xml"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml":
				["word/styles.xml"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml":
				["word/webSettings.xml"],
			"application/vnd.openxmlformats-package.core-properties+xml": [
				"docProps/core.xml",
			],
		});
	});

	it("should calculate filesContentTypes and invertedContentTypes", () => {
		const doc = createDocV4("cond-image.docx");

		const jpegImages = doc.invertedContentTypes["image/jpeg"];
		expect(jpegImages).to.deep.equal(["word/media/image1.jpeg"]);
		expect(
			doc.invertedContentTypes[
				"application/vnd.openxmlformats-package.relationships+xml"
			]
		).to.deep.equal(["_rels/.rels", "word/_rels/document.xml.rels"]);
	});

	it("should load relationships with xmlDocuments", () => {
		let xmlDocs = null;
		const mod = {
			name: "XmlDocumentsModule",
			set: (options) => {
				if (options.xmlDocuments) {
					xmlDocs = options.xmlDocuments;
				}
			},
		};
		createDocV4("with-default-contenttype.docx", { modules: [mod] });
		const keys = Object.keys(xmlDocs);
		const ct = "[Content_Types].xml";
		expect(keys).to.deep.equal([ct]);
		const mainDoc = xmlDocs[ct];
		expect(
			mainDoc.getElementsByTagName("Override")[0].getAttribute("PartName")
		).to.equal("/docProps/core.xml");
		expect(mainDoc.getElementsByTagName("parsererror").length).to.equal(0);
	});
});

describe("Special characters", () => {
	it("should not escape tab character", function () {
		return this.renderV4({
			name: "tab-character.pptx",
			expectedName: "expected-tab-character.pptx",
		});
	});

	it("should not double escape loop containing hebrew", function () {
		return this.renderV4({
			name: "loop-hebrew.docx",
			data: {
				title: "Default title",
				products: [
					{
						title: "Duk",
						name: "DukSoftware",
						reference: "DS0",
					},
					{
						title: "Tingerloo",
						name: "Tingerlee",
						reference: "T00",
					},
					{
						title: "Tingerloo",
						name: "Tingerlee",
						reference: "T00",
					},
					{
						title: "Tingerloo",
						name: "Tingerlee",
						reference: "T00",
					},
				],
			},
			expectedName: "expected-loop-hebrew.docx",
		});
	});
});

describe("Regression", () => {
	it("should not corrupt when having sdt content", function () {
		return this.renderV4({
			name: "sdt-content.docx",
			data: {},
			expectedName: "expected-sdt-content.docx",
		});
	});

	it("should not corrupt document with tag inside title with linebreaks #docprops-linebreak", function () {
		// Fixed in version 3.40.3
		return this.render({
			data: {
				title: "Foo\nBar\nBaz",
				creator: "Foo\nBar\nBaz",
				lmb: "Foo\nBar\nBaz",
			},
			name: "tag-in-title.pptx",
			options: {
				paragraphLoop: true,
				linebreaks: true,
			},
			expectedName: "expected-tag-in-title.pptx",
		});
	});

	it("should fail with specific error message with xlsx file", () => {
		/*
		 * Error case handled since v3.60.2
		 * Throw specific error when trying to template xlsx file without xlsxmodule
		 */
		const expectedError = {
			message: 'Filetype "xlsx" is supported only with the paid XlsxModule',
			name: "TemplateError",
			properties: {
				id: "xlsx_filetype_needs_xlsx_module",
			},
		};
		expectToThrow(() => createDocV4("simple.xlsx"), Error, expectedError);
	});
});

describe("Spacing/Linebreaks", () => {
	it("should show spaces with linebreak option", () => {
		const doc = createDocV4("tag-multiline.docx", { linebreaks: true }).render({
			description: `hello there
    deep indentation
       goes here
    end`,
		});
		shouldBeSame({ doc, expectedName: "expected-multiline-indent.docx" });
	});

	it("should be possible to have linebreaks if setting the option", function () {
		return this.render({
			name: "tag-multiline.docx",
			options: { linebreaks: true },
			data: { description: "The description,\nmultiline" },
			expectedName: "expected-multiline.docx",
		});
	});

	it("should not remove section if having normal loop just before", function () {
		return this.render({
			name: "loop-with-section-break-after.docx",
			expectedName: "expected-loop-with-section-break-after.docx",
			options: {
				paragraphLoop: true,
			},
		});
	});

	it("should not remove section if having paragraph loop just before", function () {
		return this.render({
			name: "paragraph-loop-with-section-break-after.docx",
			options: { paragraphLoop: true, linebreaks: true },
			expectedName: "expected-paragraph-loop-kept-section.docx",
		});
	});

	it("should work with linebreaks and copy the run style onto new lines in docx", function () {
		return this.renderV4({
			name: "multi-tags.docx",
			options: { linebreaks: true },
			data: {
				test: "The tag1,\nmultiline\nfoobaz",
				test2: "The tag2,\nmultiline\nfoobar",
			},
			async: true,
			expectedName: "expected-two-multiline.docx",
		});
	});

	it("should work with linebreaks and copy the run style onto new lines in pptx", function () {
		return this.render({
			name: "tag-multiline.pptx",
			options: { linebreaks: true },
			data: {
				description: "The description,\nmultiline",
			},
			expectedName: "expected-multiline.pptx",
		});
	});

	it("should not fail when using linebreaks and tagvalue not a string", function () {
		return this.render({
			name: "tag-multiline.pptx",
			options: { linebreaks: true },
			data: {
				description: true,
			},
			expectedName: "expected-regression-multiline.pptx",
		});
	});

	it("should drop empty lines found inside the tags", function () {
		return this.renderV4({
			name: "tag-spanning-multiple-lines.docx",
			options: {
				parser: () => ({
					get: () => "",
				}),
			},
			expectedName: "expected-no-multiline.docx",
		});
	});

	it("should drop empty lines found inside the tags", function () {
		return this.renderV4({
			name: "tag-spanning-multiple-lines.pptx",
			options: {
				parser: () => ({
					get: () => "",
				}),
			},
			expectedName: "expected-no-multiline.pptx",
		});
	});

	it("should keep run props (font-size) for pptx file", function () {
		return this.renderV4({
			name: "run-props-linebreak.pptx",
			data: {
				data: "blabla\nbloblo\nblublu",
			},
			options: {
				linebreaks: true,
			},
			expectedName: "expected-run-props-linebreak.pptx",
		});
	});
});

describe("Comments", () => {
	it("should be possible to template values in comments", function () {
		return this.renderV4({
			name: "with-comments.docx",
			data: {
				name: "John",
			},
			expectedName: "expected-comments.docx",
		});
	});
});

describe("Assignment", () => {
	it("should be possible to assign a value from the template", function () {
		return this.render({
			name: "assignment.docx",
			data: {
				first_name: "Jane",
				last_name: "Doe",
			},
			options: {
				paragraphLoop: true,
				parser: expressionParser,
			},
			expectedName: "expected-assignment.docx",
		});
	});
});

describe("Unusual document extensions", () => {
	it("should work with docm", function () {
		return this.render({
			name: "input.docm",
			data: { user: "John" },
			expectedName: "expected-docm.docm",
		});
	});

	it("should work with pptm", function () {
		return this.render({
			name: "input.pptm",
			data: { user: "John" },
			expectedName: "expected-pptm.pptm",
		});
	});

	it("should work with dotx", function () {
		return this.render({
			name: "input.dotx",
			data: { user: "John" },
			expectedName: "expected-dotx.dotx",
		});
	});

	it("should work with dotm", function () {
		return this.render({
			name: "input.dotm",
			data: { user: "John" },
			expectedName: "expected-dotm.dotm",
		});
	});
});

describe("Dash Loop", () => {
	it("should work on simple table -> w:tr", () => {
		const doc = createDocV4("tag-dash-loop.docx").render({
			os: [
				{ type: "linux", price: "0", reference: "Ubuntu10" },
				{ type: "DOS", price: "500", reference: "Win7" },
				{ type: "apple", price: "1200", reference: "MACOSX" },
			],
		});
		const expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});

	it("should work on simple table -> w:table", () => {
		const doc = createDocV4("tag-dash-loop-table.docx").render({
			os: [
				{ type: "linux", price: "0", reference: "Ubuntu10" },
				{ type: "DOS", price: "500", reference: "Win7" },
				{ type: "apple", price: "1200", reference: "MACOSX" },
			],
		});
		const expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});

	it("should work on simple list -> w:p", () => {
		const doc = createDocV4("tag-dash-loop-list.docx").render({
			os: [
				{ type: "linux", price: "0", reference: "Ubuntu10" },
				{ type: "DOS", price: "500", reference: "Win7" },
				{ type: "apple", price: "1200", reference: "MACOSX" },
			],
		});
		const expectedText = "linux 0 Ubuntu10 DOS 500 Win7 apple 1200 MACOSX ";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});

	it("should not corrupt document if using empty {-a:p} inside table cell", function () {
		return this.render({
			name: "regression-dash-loop-in-table-cell.pptx",
			expectedName: "expected-table-3-cells.pptx",
		});
	});

	it("should not corrupt document if using empty {-a:p} inside table cell", function () {
		return this.render({
			name: "regression-dash-loop-in-table-cell.pptx",
			data: {
				cond: [1, 2, 3],
			},
			expectedName: "expected-table-3-true-cells.pptx",
		});
	});
});

describe("Section breaks inside loops", () => {
	it("should work at beginning of paragraph loop with 3 elements", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		return this.renderV4({
			name: "page-break-inside-condition.docx",
			data: { cond: [1, 2, 3] },
			options: {
				paragraphLoop: true,
			},
			expectedName: "expected-with-page-break-3-els.docx",
		});
	});
	it("should work at beginning of paragraph loop with false", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		return this.renderV4({
			name: "page-break-inside-condition.docx",
			data: { cond: false },
			options: {
				paragraphLoop: true,
			},
			expectedName: "expected-with-page-break-falsy.docx",
		});
	});

	it("should work at beginning of std loop with false", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		return this.render({
			name: "page-break-inside-condition.docx",
			data: {
				cond: false,
			},
			expectedName: "expected-page-break-falsy-std-loop.docx",
		});
	});

	it("should work at beginning of std loop with 3 elements", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		return this.render({
			name: "page-break-inside-condition.docx",
			data: {
				cond: [1, 2, 3],
			},
			expectedName: "expected-page-break-3-els-std-loop.docx",
		});
	});

	it("should work at beginning of std loop with truthy", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		return this.render({
			name: "page-break-inside-condition.docx",
			data: {
				cond: true,
			},
			expectedName: "expected-page-break-truthy-std-loop.docx",
		});
	});

	it("should work with table inside paragraph loop", function () {
		return this.renderV4({
			name: "pagebreak-table-loop.docx",
			options: {
				paragraphLoop: true,
			},
			data: { loop: [1, 2, 3] },
			expectedName: "expected-pagebreak-table-loop.docx",
		});
	});

	it("should work at end of std loop", function () {
		return this.render({
			name: "paragraph-loop-with-pagebreak.docx",
			data: {
				users: [{ name: "Bar" }, { name: "John" }, { name: "Baz" }],
			},
			expectedName: "expected-noparagraph-loop-with-pagebreak.docx",
		});
	});

	it("should work at end of paragraph loop", function () {
		return this.renderV4({
			name: "paragraph-loop-with-pagebreak.docx",
			options: {
				paragraphLoop: true,
			},
			data: {
				users: [{ name: "Bar" }, { name: "John" }, { name: "Baz" }],
			},
			expectedName: "expected-paragraph-loop-with-pagebreak.docx",
		});
	});

	it("should work with pagebreak afterwards with falsy value", function () {
		return this.renderV4({
			name: "paragraph-loop-with-pagebreak.docx",
			options: {
				paragraphLoop: true,
			},
			data: {
				users: false,
			},
			expectedName: "expected-paragraph-loop-empty-with-pagebreak.docx",
		});
	});

	it("should make first section break of the file continuous", function () {
		return this.renderV4({
			name: "loop-with-continuous-section-break.docx",
			data: {
				loop: [1, 2, 3],
			},
			options: {
				paragraphLoop: true,
				parser: expressionParser,
			},
			expectedName: "expected-loop-with-continuous-section-break.docx",
		});
	});

	it("should work with delimiters << >> when saved in word as &gt;&gt;test>>", function () {
		return this.renderV4({
			name: "gt-delimiters.docx",
			data: {
				my_tag: "Hello John",
			},
			options: {
				parser: expressionParser,
				delimiters: { start: "<<", end: ">>" },
			},
			expectedName: "expected-rendered-hello.docx",
		});
	});

	it("should work with quotes in tag with angular parser", function () {
		return this.renderV4({
			name: "quotes-in-tag.docx",
			data: {
				user: "John",
				hobbies: ["hiking", "reading"],
			},
			options: {
				parser: expressionParser,
				paragraphLoop: true,
			},
			expectedName: "expected-quotes-in-tag.docx",
		});
	});

	it("should make first section break of the file continuous", function () {
		return this.renderV4({
			name: "loop-with-continuous-section-break.docx",
			data: {
				loop: [1, 2, 3],
			},
			options: {
				parser: expressionParser,
			},
			expectedName: "expected-loop-with-continuous-section-break-2.docx",
		});
	});

	it('should work with w:type val="nextPage" section break', function () {
		return this.render({
			name: "nextpage-section-break.docx",
			data: { items: [1, 2, 3, 4] },
			options: {
				paragraphLoop: true,
			},
			expectedName: "expected-nextpage-section-break.docx",
		});
	});
});

describe("ParagraphLoop", () => {
	it("should work with docx", function () {
		return this.render({
			name: "users.docx",
			data: { users: ["John", "Jane", "Louis"] },
			options: {
				paragraphLoop: true,
			},
			expectedName: "expected-users.docx",
		});
	});

	it("should not drop image with text", function () {
		return this.render({
			name: "cond-image.docx",
			data: { cond: true },
			options: {
				paragraphLoop: true,
			},
			expectedName: "expected-cond-image.docx",
		});
	});

	it("should not drop image without text", function () {
		return this.render({
			name: "cond-image-no-innertext.docx",
			data: { cond: true },
			options: {
				paragraphLoop: true,
			},
			expectedName: "expected-cond-image-no-innertext.docx",
		});
	});

	it("should not drop image without text at beginning", function () {
		return this.render({
			name: "cond-image-no-innertext-before.docx",
			data: { cond: true },
			options: {
				paragraphLoop: true,
			},
			expectedName: "expected-cond-image-no-innertext-before.docx",
		});
	});

	it("should work without removing extra text", function () {
		return this.render({
			name: "paragraph-loops.docx",
			data: {
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
			},
			options: {
				paragraphLoop: true,
			},
			expectedName: "expected-paragraph-loop.docx",
		});
	});

	it("should work with pptx", function () {
		return this.render({
			name: "paragraph-loop.pptx",
			data: {
				users: [
					{ age: 10, name: "Bar" },
					{ age: 18, name: "Bar" },
					{ age: 22, name: "Bar" },
				],
			},
			options: {
				paragraphLoop: true,
			},
			expectedName: "expected-paragraph-loop.pptx",
		});
	});

	it("should fail if trying to attach a module that has none of the properties", () => {
		const expectedError = {
			name: "InternalError",
			message:
				"This module cannot be wrapped, because it doesn't define any of the necessary functions",
			properties: {
				id: "module_cannot_be_wrapped",
			},
		};
		expectToThrow(
			() => {
				createDocV4("regression-par-in-par.docx", {
					modules: [Promise.resolve(1)],
				});
			},
			Error,
			expectedError
		);
	});

	it("should not produce corrupt document when having comment inside tag", function () {
		return this.renderV4({
			name: "tag-with-comment.docx",
			expectedName: "expected-tag-with-comment.docx",
		});
	});

	it("should not fail when having paragraph in paragraph", () => {
		const printedPostparsed = [];
		let filePath = "";
		const doc = createDocV4("regression-par-in-par.docx", {
			modules: [
				{
					name: "MyModule",
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
				},
			],
			paragraphLoop: true,
			parser: () => ({
				get: () => "foo",
			}),
		}).render();
		shouldBeSame({ doc, expectedName: "expected-rendered-par-in-par.docx" });
		expect(printedPostparsed["word/document.xml"]).to.matchSnapshot();
	});

	it("should work with spacing at the end", function () {
		return this.render({
			name: "spacing-end.docx",
			data: { name: "John" },
			options: {
				paragraphLoop: true,
			},
			expectedName: "expected-spacing-end.docx",
		});
	});

	it("should throw specific error if calling .render() on document with invalid tags", () => {
		let catched = false;
		const capture = captureLogs();

		try {
			createDocV4("errors-footer-and-header.docx", {
				paragraphLoop: true,
				parser: expressionParser,
			});
		} catch {
			catched = true;
			capture.stop();
		}
		expect(catched).to.equal(true);
	});

	it("should fail with errors from header and footer", () => {
		const expectedError = {
			message: "Multi error",
			name: "TemplateError",
			properties: {
				id: "multi_error",
				errors: [
					{
						name: "TemplateError",
						message: "Duplicate close tag, expected one close tag",
						properties: {
							file: "word/header1.xml",
							xtag: "itle}}",
							id: "duplicate_close_tag",
							context: "itle}}",
							offset: 15,
						},
					},
					{
						name: "TemplateError",
						message: "Closing tag does not match opening tag",
						properties: {
							closingtag: "bang",
							openingtag: "users",
							file: "word/document.xml",
							id: "closing_tag_does_not_match_opening_tag",
							offset: [8, 16],
						},
					},
					{
						name: "TemplateError",
						message: "Unclosed tag",
						properties: {
							file: "word/footer1.xml",
							xtag: "footer",
							id: "unclosed_tag",
							context: "{footer",
							offset: 2,
						},
					},
				],
			},
		};

		expectToThrow(
			() =>
				createDocV4("errors-footer-and-header.docx", {
					paragraphLoop: true,
					errorLogging: false,
					parser: expressionParser,
				}),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should fail properly when having lexed + postparsed errors", () => {
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
		expectToThrow(
			() =>
				createDocV4("multi-errors.docx", {
					paragraphLoop: true,
					errorLogging: false,
					parser: expressionParser,
				}),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should fail when placing paragraph loop inside normal loop", () => {
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
								endLindex: 19,
								expandTo: "w:p",
								inverted: false,
								lIndex: 19,
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
								endLindex: 23,
								lIndex: 23,
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
		expectToThrow(
			() => createDocV4("paragraph-loop-error.docx", { errorLogging: false }),
			Errors.XTTemplateError,
			expectedError
		);
	});
});

describe("Prefixes", () => {
	it("should be possible to change the prefix of the loop module", () => {
		const doc = makeDocxV4("<w:t>{##tables}{user}{/tables}</w:t>", {
			modules: [
				{
					optionsTransformer(options, doc) {
						for (const module of doc.modules) {
							if (module.name === "LoopModule") {
								module.prefix.start = "##";
							}
						}
						return options;
					},
				},
			],
		});
		doc.render({
			tables: [{ user: "John" }, { user: "Jane" }],
		});
		expect(doc.getFullText()).to.be.equal("JohnJane");
	});

	it("should be possible to change the prefix of the loop module to a regexp", () => {
		const doc = makeDocxV4(
			"<w:t>{##tables}{user}{/tables}{#tables}{user}{/tables}</w:t>",
			{
				modules: [
					{
						optionsTransformer(options, doc) {
							for (const module of doc.modules) {
								if (module.name === "LoopModule") {
									module.prefix.start = /^##?(.*)$/;
								}
							}
							return options;
						},
					},
				],
			}
		);
		doc.render({
			tables: [{ user: "A" }, { user: "B" }],
		});
		expect(doc.getFullText()).to.be.equal("ABAB");
	});

	it("should be possible to use FOR and ENDFOR for the prefix of the loop module", () => {
		const doc = makeDocxV4(
			"<w:t>{FOR tables}{user}{ENDFOR tables}{FOR tables}{user}{ENDFOR}</w:t>",
			{
				modules: [
					{
						optionsTransformer(options, doc) {
							for (const module of doc.modules) {
								if (module.name === "LoopModule") {
									module.prefix.start = "FOR ";
									module.prefix.end = /^ENDFOR ?(.*)/;
								}
							}
							return options;
						},
					},
				],
			}
		);
		doc.render({
			tables: [{ user: "A" }, { user: "B" }],
		});
		expect(doc.getFullText()).to.be.equal("ABAB");
	});

	it("should be possible to change the prefix of the raw xml module to a regexp", () => {
		const doc = makeDocxV4("<w:p><w:t>{!!raw}</w:t></w:p>", {
			modules: [
				{
					optionsTransformer(options, doc) {
						for (const module of doc.modules) {
							if (module.name === "RawXmlModule") {
								module.prefix = /^!!?(.*)$/;
							}
						}
						return options;
					},
				},
			],
		});
		doc.render({
			raw: "<w:p><w:t>HoHo</w:t></w:p>",
		});
		expect(doc.getFullText()).to.be.equal("HoHo");
	});

	it("should be possible to change the prefix of the raw xml module to a function", () => {
		const content = "<w:p><w:t>{raw}</w:t></w:p><w:p><w:t> {text}</w:t></w:p>";
		const scope = {
			raw: "<w:p><w:t>HoHo</w:t></w:p>",
			text: "Huhu",
		};
		const doc = makeDocxV4(content, {
			modules: [
				{
					optionsTransformer(options, doc) {
						for (const module of doc.modules) {
							if (module.name === "RawXmlModule") {
								module.prefix = function (placeholderContent) {
									if (placeholderContent === "raw") {
										return "raw";
									}
								};
							}
						}
						return options;
					},
				},
			],
		});
		doc.render(scope);

		expect(doc.zip.file("word/document.xml").asText()).to.be.equal(
			'<w:p><w:t>HoHo</w:t></w:p><w:p><w:t xml:space="preserve"> Huhu</w:t></w:p>'
		);
	});
});

describe("Load Office 365 file", () => {
	it("should handle files with word/document2.xml", function () {
		return this.renderV4({
			name: "office365.docx",
			data: {
				test: "Value",
				test2: "Value2",
			},
			options: {
				paragraphLoop: true,
			},
			expectedName: "expected-office365.docx",
			expectedText: "Value Value2",
		});
	});

	it("should template header.xml (without digit like header1.xml)", function () {
		return this.render({
			name: "header-without-digit.docx",
			data: {
				name: "John",
			},
			expectedName: "expected-header-without-digit.docx",
		});
	});
});

describe("Loops", () => {
	it("should work with template", function () {
		return this.renderV4({
			name: "empty-loop-regression.docx",
			data: {
				ice: [1, 2, 3],
			},
			expectedName: "expected-loop-regression.docx",
		});
	});
});

describe("Smart arts", () => {
	it("should work with smart-art on pptx files", () => {
		const doc = createDocV4("smart-art.pptx");
		doc.render({ user: "John", i: 33, j: "J" });
		shouldBeSame({ doc, expectedName: "expected-smart-art.pptx" });
	});

	it("should work with smart-art on docx files", () => {
		const doc = createDocV4("smart-art.docx");
		doc.render({ name: "Jack", user: "John", i: 33, j: "J" });
		shouldBeSame({ doc, expectedName: "expected-smart-art.docx" });
	});
});

describe("Add module to change justify alignment", () => {
	it("should be possible to add w:doNotExpandShiftReturn to word/settings.xml", () => {
		const doc = createDocV4("justify.docx", {
			linebreaks: true,
			paragraphLoop: true,
			modules: [
				{
					name: "AddDoNotExpandShiftReturn",
					optionsTransformer(options, docxtemplater) {
						docxtemplater.fileTypeConfig.tagsXmlLexedArray.push(
							"w:compat",
							"w:settings",
							"w:doNotExpandShiftReturn"
						);
						return options;
					},
					preparse(xml, options) {
						const { filePath } = options;
						if (filePath === "word/settings.xml") {
							let addedDoNotExpandShiftReturn = false;
							const added = [];
							let addIndex = -1;
							for (let i = 0, len = xml.length; i < len; i++) {
								const part = xml[i];
								if (part.tag === "w:doNotExpandShiftReturn") {
									addedDoNotExpandShiftReturn = true;
								}
								if (part.tag === "w:compat") {
									if (part.position === "end") {
										added.push({
											type: "tag",
											value: "<w:doNotExpandShiftReturn />",
											position: "selfclosing",
											tag: "w:doNotExpandShiftReturn",
										});
										addIndex = i;
										addedDoNotExpandShiftReturn = true;
									}
								}
								if (part.tag === "w:settings") {
									if (part.position === "end") {
										if (!addedDoNotExpandShiftReturn) {
											added.push(
												{
													type: "tag",
													value: "<w:compat>",
													position: "start",
													tag: "w:compat",
												},
												{
													type: "tag",
													value: "<w:doNotExpandShiftReturn />",
													position: "selfclosing",
													tag: "w:doNotExpandShiftReturn",
												},
												{
													type: "tag",
													value: "</w:compat>",
													position: "end",
													tag: "w:compat",
												}
											);
											addIndex = i;
										}
									}
								}
							}
							if (addIndex !== -1) {
								xml.splice(addIndex, 0, ...added);
							}
						}
						return xml;
					},
				},
			],
		}).render({
			text: "Lorem ipsum dolor sit amet\n, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore\n magna aliqua.\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
		});
		shouldBeSame({ doc, expectedName: "expected-tag-justified.docx" });
	});
});

describe("StripInvalidXml", () => {
	it("should be possible to strip invalid xml chars", function () {
		return this.render({
			name: "tag-example.docx",
			data: { first_name: "John" + String.fromCharCode(28) + " Doe" },
			options: {
				paragraphLoop: true,
				errorLogging: false,
				stripInvalidXMLChars: true,
			},
			expectedName: "expected-john-doe.pptx",
		});
	});

	it("should be possible to strip multiple invalid xml chars in same string", function () {
		// Regression fixed 3.61.2
		return this.render({
			name: "tag-example.docx",
			data: {
				first_name:
					"John" + String.fromCharCode(28) + " Doe" + String.fromCharCode(28),
			},
			options: {
				paragraphLoop: true,
				errorLogging: false,
				stripInvalidXMLChars: true,
			},
			expectedName: "expected-john-doe.pptx",
		});
	});

	it("should not throw stack trace if specifying stripInvalidXMLChars and using number or other object", function () {
		return this.render({
			name: "tag-example.docx",
			data: { first_name: 12, last_name: /a/g, phone: false },
			options: {
				paragraphLoop: true,
				errorLogging: false,
				stripInvalidXMLChars: true,
			},
			expectedName: "expected-12.pptx",
		});
	});
});

describe("OptionsTransformer", () => {
	it("should be possible to change delimiter without side effects", () => {
		/*
		 * This was fixed since v3.55.0
		 * Previously, changing options in optionsTransformer would change the default for everyone.
		 */
		const sideEffectDoc = createDocV4("gt-delimiters.docx", {
			modules: [
				{
					name: "TestModule",
					optionsTransformer(options) {
						options.delimiters.start = "<<";
						options.delimiters.end = ">>";
						return options;
					},
				},
			],
			linebreaks: true,
		});

		const doc = createDocV4("tag-example.docx").render({
			first_name: "Hipp",
			last_name: "Edgar",
			phone: "0652455478",
			description: "New Website",
		});
		expect(sideEffectDoc.options.delimiters.start).to.equal("<<");
		expect(doc.options.delimiters.start).to.equal("{");
		expect(doc.getFullText()).to.be.equal("Edgar Hipp");
		expect(doc.getFullText("word/header1.xml")).to.be.equal(
			"Edgar Hipp0652455478New Website"
		);
		expect(doc.getFullText("word/footer1.xml")).to.be.equal(
			"EdgarHipp0652455478"
		);
	});
});

describe("Syntax.allowUnbalancedLoops option", () => {
	it("should work with unbalanced loop with allowUnbalancedLoops option", () => {
		const doc = createDocV4("table-unbalanced-loop.docx", {
			syntax: {
				allowUnbalancedLoops: true,
			},
		});
		doc.render({
			a: [1, 2, 3],
			b: [1, 2, 3],
			c: [1, 2, 3],
		});
		shouldBeSame({
			doc,
			expectedName: "expected-table-unbalanced-loop.docx",
		});
	});

	it("should work with unbalanced loop with allowUnbalancedLoops option (2)", () => {
		const doc = createDocV4("table-unbalanced-loop-2.docx", {
			syntax: {
				allowUnbalancedLoops: true,
			},
		});

		doc.render({
			a: [1, 2, 3],
			b: [1, 2, 3],
			c: [1, 2, 3],
		});
		shouldBeSame({
			doc,
			expectedName: "expected-table-unbalanced-loop-2.docx",
		});
	});
});

describe("Get Tags", () => {
	it("should be possible to get the tags", () => {
		const doc = createDocV4("tag-example.docx", {
			syntax: {
				allowUnbalancedLoops: true,
			},
		});

		expect(doc.getTags()).to.deep.equal({
			headers: [
				{
					target: "word/header1.xml",
					tags: {
						last_name: {},
						first_name: {},
						phone: {},
						description: {},
					},
				},
			],
			footers: [
				{
					target: "word/footer1.xml",
					tags: {
						last_name: {},
						first_name: {},
						phone: {},
					},
				},
			],
			document: {
				target: "word/document.xml",
				tags: {
					last_name: {},
					first_name: {},
				},
			},
		});
	});
});
