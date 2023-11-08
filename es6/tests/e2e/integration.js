const {
	expectToThrow,
	createDoc,
	createDocV4,
	shouldBeSame,
	expect,
	makeDocxV4,
	captureLogs,
} = require("../utils.js");

const printy = require("../printy.js");

const angularParser = require("../../expressions.js");
const Errors = require("../../errors.js");

describe("Simple templating", function () {
	describe("text templating", function () {
		it("should change values with template data", function () {
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

	it("should replace custom properties text", function () {
		const doc = createDoc("properties.docx");
		let app = doc.getZip().files["docProps/app.xml"].asText();
		let core = doc.getZip().files["docProps/core.xml"].asText();
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
		doc.attachModule(module);
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
		/* The order here is important !
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

describe("Docxtemplater internal properties", function () {
	it("should calculate filesContentTypes and invertedContentTypes", function () {
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

	it("should calculate filesContentTypes and invertedContentTypes", function () {
		const doc = createDocV4("cond-image.docx");

		const jpegImages = doc.invertedContentTypes["image/jpeg"];
		expect(jpegImages).to.deep.equal(["word/media/image1.jpeg"]);
		expect(
			doc.invertedContentTypes[
				"application/vnd.openxmlformats-package.relationships+xml"
			]
		).to.deep.equal(["_rels/.rels", "word/_rels/document.xml.rels"]);
	});

	it("should load relationships with xmlDocuments", function () {
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

describe("Special characters", function () {
	it("should not escape tab character", function () {
		shouldBeSame({
			doc: createDocV4("tab-character.pptx").render(),
			expectedName: "expected-tab-character.pptx",
		});
	});

	it("should not double escape loop containing hebrew", function () {
		const tags = {
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
		};
		const doc = createDocV4("loop-hebrew.docx").render(tags);
		shouldBeSame({ doc, expectedName: "expected-loop-hebrew.docx" });
	});
});

describe("Regression", function () {
	it("should not corrupt when having sdt content", function () {
		const tags = {};
		const doc = createDocV4("sdt-content.docx");
		doc.render(tags);
		shouldBeSame({ doc, expectedName: "expected-sdt-content.docx" });
	});

	it("should not corrupt document with tag inside title with linebreaks #docprops-linebreak", function () {
		// Fixed in version 3.40.3
		const tags = {
			title: "Foo\nBar\nBaz",
			creator: "Foo\nBar\nBaz",
			lmb: "Foo\nBar\nBaz",
		};
		const doc = createDocV4("tag-in-title.pptx", {
			paragraphLoop: true,
			linebreaks: true,
		});
		doc.render(tags);
		shouldBeSame({ doc, expectedName: "expected-tag-in-title.pptx" });
	});
});

describe("Spacing/Linebreaks", function () {
	it("should show spaces with linebreak option", function () {
		const doc = createDoc("tag-multiline.docx")
			.setOptions({ linebreaks: true })
			.render({
				description: `hello there
    deep indentation
       goes here
    end`,
			});
		shouldBeSame({ doc, expectedName: "expected-multiline-indent.docx" });
	});

	it("should be possible to have linebreaks if setting the option", function () {
		const doc = createDoc("tag-multiline.docx")
			.setOptions({ linebreaks: true })
			.render({
				description: "The description,\nmultiline",
			});
		shouldBeSame({ doc, expectedName: "expected-multiline.docx" });
	});

	it("should not remove section if having normal loop just before", function () {
		const doc = createDoc("loop-with-section-break-after.docx").render();
		shouldBeSame({
			doc,
			expectedName: "expected-loop-with-section-break-after.docx",
		});
	});

	it("should not remove section if having paragraph loop just before", function () {
		const doc = createDoc("paragraph-loop-with-section-break-after.docx")
			.setOptions({ paragraphLoop: true })
			.render();
		shouldBeSame({
			doc,
			expectedName: "expected-paragraph-loop-with-section-break-after.docx",
		});
	});

	it("should work with linebreaks and copy the run style onto new lines in docx", function () {
		const doc = createDocV4("multi-tags.docx", { linebreaks: true });
		return doc
			.renderAsync({
				test: "The tag1,\nmultiline\nfoobaz",
				test2: "The tag2,\nmultiline\nfoobar",
			})
			.then(function () {
				shouldBeSame({ doc, expectedName: "expected-two-multiline.docx" });
			});
	});

	it("should work with linebreaks and copy the run style onto new lines in pptx", function () {
		const doc = createDoc("tag-multiline.pptx")
			.setOptions({ linebreaks: true })
			.render({
				description: "The description,\nmultiline",
			});
		shouldBeSame({ doc, expectedName: "expected-multiline.pptx" });
	});

	it("should not fail when using linebreaks and tagvalue not a string", function () {
		const doc = createDoc("tag-multiline.pptx")
			.setOptions({ linebreaks: true })
			.render({
				description: true,
			});
		shouldBeSame({ doc, expectedName: "expected-regression-multiline.pptx" });
	});

	it("should drop empty lines found inside the tags", function () {
		const doc = createDocV4("tag-spanning-multiple-lines.docx", {
			parser: () => ({
				get: () => "",
			}),
		}).render();
		shouldBeSame({ doc, expectedName: "expected-no-multiline.docx" });
	});

	it("should drop empty lines found inside the tags", function () {
		const doc = createDocV4("tag-spanning-multiple-lines.pptx", {
			parser: () => ({
				get: () => "",
			}),
		}).render();
		shouldBeSame({ doc, expectedName: "expected-no-multiline.pptx" });
	});

	it("should keep run props (font-size) for pptx file", function () {
		const doc = createDocV4("run-props-linebreak.pptx", {
			linebreaks: true,
		}).render({
			data: "blabla\nbloblo\nblublu",
		});
		shouldBeSame({ doc, expectedName: "expected-run-props-linebreak.pptx" });
	});
});

describe("Comments", function () {
	it("should be possible to template values in comments", function () {
		const doc = createDocV4("with-comments.docx").render({
			name: "John",
		});
		shouldBeSame({ doc, expectedName: "expected-comments.docx" });
	});
});

describe("Assignment", function () {
	it("should be possible to assign a value from the template", function () {
		const doc = createDoc("assignment.docx")
			.setOptions({
				paragraphLoop: true,
				parser: angularParser,
			})
			.render({
				first_name: "Jane",
				last_name: "Doe",
			});
		shouldBeSame({ doc, expectedName: "expected-assignment.docx" });
	});
});

describe("Unusual document extensions", function () {
	it("should work with docm", function () {
		const doc = createDoc("input.docm").render({ user: "John" });
		shouldBeSame({ doc, expectedName: "expected-docm.docm" });
	});

	it("should work with pptm", function () {
		const doc = createDoc("input.pptm").render({ user: "John" });
		shouldBeSame({ doc, expectedName: "expected-pptm.pptm" });
	});

	it("should work with dotx", function () {
		const doc = createDoc("input.dotx").render({ user: "John" });
		shouldBeSame({ doc, expectedName: "expected-dotx.dotx" });
	});

	it("should work with dotm", function () {
		const doc = createDoc("input.dotm").render({ user: "John" });
		shouldBeSame({ doc, expectedName: "expected-dotm.dotm" });
	});
});

describe("Dash Loop", function () {
	it("should work on simple table -> w:tr", function () {
		const doc = createDoc("tag-dash-loop.docx").render({
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
	it("should work on simple table -> w:table", function () {
		const doc = createDoc("tag-dash-loop-table.docx").render({
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
	it("should work on simple list -> w:p", function () {
		const doc = createDoc("tag-dash-loop-list.docx").render({
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
		const doc = createDoc("regression-dash-loop-in-table-cell.pptx").render();
		shouldBeSame({ doc, expectedName: "expected-table-3-cells.pptx" });
	});

	it("should not corrupt document if using empty {-a:p} inside table cell", function () {
		const doc = createDoc("regression-dash-loop-in-table-cell.pptx").render({
			cond: [1, 2, 3],
		});
		shouldBeSame({ doc, expectedName: "expected-table-3-true-cells.pptx" });
	});
});

describe("Section breaks inside loops", function () {
	it("should work at beginning of paragraph loop with 3 elements", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		const doc = createDocV4("page-break-inside-condition.docx", {
			paragraphLoop: true,
		}).render({ cond: [1, 2, 3] });
		shouldBeSame({ doc, expectedName: "expected-with-page-break-3-els.docx" });
	});
	it("should work at beginning of paragraph loop with false", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		const doc = createDocV4("page-break-inside-condition.docx", {
			paragraphLoop: true,
		}).render({ cond: false });
		shouldBeSame({ doc, expectedName: "expected-with-page-break-falsy.docx" });
	});

	it("should work at beginning of std loop with false", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		const doc = createDoc("page-break-inside-condition.docx").render({
			cond: false,
		});
		shouldBeSame({
			doc,
			expectedName: "expected-page-break-falsy-std-loop.docx",
		});
	});

	it("should work at beginning of std loop with 3 elements", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		const doc = createDoc("page-break-inside-condition.docx").render({
			cond: [1, 2, 3],
		});
		shouldBeSame({
			doc,
			expectedName: "expected-page-break-3-els-std-loop.docx",
		});
	});

	it("should work at beginning of std loop with truthy", function () {
		// Warning : In libreoffice, this is not rendered correctly, use WPS or Word
		const doc = createDoc("page-break-inside-condition.docx").render({
			cond: true,
		});
		shouldBeSame({
			doc,
			expectedName: "expected-page-break-truthy-std-loop.docx",
		});
	});

	it("should work with table inside paragraph loop", function () {
		const doc = createDocV4("pagebreak-table-loop.docx", {
			paragraphLoop: true,
		}).render({ loop: [1, 2, 3] });
		shouldBeSame({
			doc,
			expectedName: "expected-pagebreak-table-loop.docx",
		});
	});

	it("should work at end of std loop", function () {
		const doc = createDoc("paragraph-loop-with-pagebreak.docx").render({
			users: [{ name: "Bar" }, { name: "John" }, { name: "Baz" }],
		});
		shouldBeSame({
			doc,
			expectedName: "expected-noparagraph-loop-with-pagebreak.docx",
		});
	});

	it("should work at end of paragraph loop", function () {
		const doc = createDocV4("paragraph-loop-with-pagebreak.docx", {
			paragraphLoop: true,
		}).render({
			users: [{ name: "Bar" }, { name: "John" }, { name: "Baz" }],
		});
		shouldBeSame({
			doc,
			expectedName: "expected-paragraph-loop-with-pagebreak.docx",
		});
	});

	it("should work with pagebreak afterwards with falsy value", function () {
		const doc = createDocV4("paragraph-loop-with-pagebreak.docx", {
			paragraphLoop: true,
		}).render({
			users: false,
		});
		shouldBeSame({
			doc,
			expectedName: "expected-paragraph-loop-empty-with-pagebreak.docx",
		});
	});

	it("should make first section break of the file continuous", function () {
		const doc = createDocV4("loop-with-continuous-section-break.docx", {
			paragraphLoop: true,
			parser: angularParser,
		}).render({
			loop: [1, 2, 3],
		});
		shouldBeSame({
			doc,
			expectedName: "expected-loop-with-continuous-section-break.docx",
		});
	});

	it("should work with delimiters << >> when saved in word as &gt;&gt;test>>", function () {
		const doc = createDocV4("gt-delimiters.docx", {
			parser: angularParser,
			delimiters: { start: "<<", end: ">>" },
		}).render({
			my_tag: "Hello John",
		});
		shouldBeSame({
			doc,
			expectedName: "expected-rendered-hello.docx",
		});
	});

	it("should work with quotes in tag with angular parser", function () {
		const doc = createDocV4("quotes-in-tag.docx", {
			parser: angularParser,
			paragraphLoop: true,
		}).render({
			user: "John",
			hobbies: ["hiking", "reading"],
		});
		shouldBeSame({
			doc,
			expectedName: "expected-quotes-in-tag.docx",
		});
	});

	it("should make first section break of the file continuous", function () {
		const doc = createDocV4("loop-with-continuous-section-break.docx", {
			parser: angularParser,
		}).render({
			loop: [1, 2, 3],
		});
		shouldBeSame({
			doc,
			expectedName: "expected-loop-with-continuous-section-break-2.docx",
		});
	});

	it('should work with w:type val="nextPage" section break', function () {
		const doc = createDocV4("nextpage-section-break.docx", {
			paragraphLoop: true,
		}).render({ items: [1, 2, 3, 4] });
		shouldBeSame({ doc, expectedName: "expected-nextpage-section-break.docx" });
	});
});

describe("ParagraphLoop", function () {
	it("should work with docx", function () {
		const doc = createDoc("users.docx")
			.setOptions({
				paragraphLoop: true,
			})
			.render({ users: ["John", "Jane", "Louis"] });
		shouldBeSame({ doc, expectedName: "expected-users.docx" });
	});

	it("should not drop image with text", function () {
		const doc = createDoc("cond-image.docx")
			.setOptions({
				paragraphLoop: true,
			})
			.render({ cond: true });
		shouldBeSame({ doc, expectedName: "expected-cond-image.docx" });
	});

	it("should not drop image without text", function () {
		const doc = createDoc("cond-image-no-innertext.docx")
			.setOptions({
				paragraphLoop: true,
			})
			.render({ cond: true });
		shouldBeSame({
			doc,
			expectedName: "expected-cond-image-no-innertext.docx",
		});
	});

	it("should not drop image without text at beginning", function () {
		const doc = createDoc("cond-image-no-innertext-before.docx")
			.setOptions({
				paragraphLoop: true,
			})
			.render({ cond: true });
		shouldBeSame({
			doc,
			expectedName: "expected-cond-image-no-innertext-before.docx",
		});
	});

	it("should work without removing extra text", function () {
		const doc = createDoc("paragraph-loops.docx")
			.setOptions({
				paragraphLoop: true,
			})
			.render({
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
			});
		shouldBeSame({ doc, expectedName: "expected-paragraph-loop.docx" });
	});

	it("should work with pptx", function () {
		const doc = createDoc("paragraph-loop.pptx")
			.setOptions({
				paragraphLoop: true,
			})
			.render({
				users: [
					{ age: 10, name: "Bar" },
					{ age: 18, name: "Bar" },
					{ age: 22, name: "Bar" },
				],
			});
		shouldBeSame({ doc, expectedName: "expected-paragraph-loop.pptx" });
	});

	it("should fail if trying to attach a module that has none of the properties", function () {
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
		shouldBeSame({
			doc: createDocV4("tag-with-comment.docx").render(),
			expectedName: "expected-tag-with-comment.docx",
		});
	});

	it("should not fail when having paragraph in paragraph", function () {
		const printedPostparsed = [];
		let filePath = "";
		const doc = createDoc("regression-par-in-par.docx")
			.attachModule({
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
			})
			.setOptions({
				paragraphLoop: true,
				parser: () => ({
					get: () => "foo",
				}),
			})
			.render();
		shouldBeSame({ doc, expectedName: "expected-rendered-par-in-par.docx" });
		expect(printedPostparsed["word/document.xml"]).to.matchSnapshot();
	});

	it("should work with spacing at the end", function () {
		const doc = createDoc("spacing-end.docx")
			.setOptions({
				paragraphLoop: true,
			})
			.render({ name: "John" });
		shouldBeSame({ doc, expectedName: "expected-spacing-end.docx" });
	});

	it("should throw specific error if calling .render() on document with invalid tags", function () {
		const doc = createDoc("errors-footer-and-header.docx").setOptions({
			paragraphLoop: true,
			parser: angularParser,
		});
		let catched = false;
		const capture = captureLogs();

		try {
			doc.compile();
		} catch (e) {
			catched = true;
			const expectedError = {
				name: "InternalError",
				message:
					"You should not call .render on a document that had compilation errors",
				properties: {
					id: "render_on_invalid_template",
				},
			};
			capture.stop();
			expectToThrow(() => doc.render(), Errors.XTInternalError, expectedError);
			/* handle error */
		}
		expect(catched).to.equal(true);
	});

	it("should fail with errors from header and footer", function () {
		const doc = createDoc("errors-footer-and-header.docx");
		doc.setOptions({
			paragraphLoop: true,
			parser: angularParser,
		});
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
		expectToThrow(() => doc.render(), Errors.XTTemplateError, expectedError);
	});

	it("should fail properly when having lexed + postparsed errors", function () {
		const doc = createDoc("multi-errors.docx").setOptions({
			paragraphLoop: true,
			parser: angularParser,
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
		expectToThrow(() => doc.compile(), Errors.XTTemplateError, expectedError);
	});

	it("should fail when placing paragraph loop inside normal loop", function () {
		const doc = createDoc("paragraph-loop-error.docx");
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
		expectToThrow(() => doc.compile(), Errors.XTTemplateError, expectedError);
	});
});

describe("Prefixes", function () {
	it("should be possible to change the prefix of the loop module", function () {
		const content = "<w:t>{##tables}{user}{/tables}</w:t>";
		const scope = {
			tables: [{ user: "John" }, { user: "Jane" }],
		};
		const doc = makeDocxV4(content, {
			modules: [
				{
					optionsTransformer(options, doc) {
						doc.modules.forEach(function (module) {
							if (module.name === "LoopModule") {
								module.prefix.start = "##";
							}
						});
						return options;
					},
				},
			],
		});
		doc.render(scope);
		expect(doc.getFullText()).to.be.equal("JohnJane");
	});

	it("should be possible to change the prefix of the loop module to a regexp", function () {
		const content =
			"<w:t>{##tables}{user}{/tables}{#tables}{user}{/tables}</w:t>";
		const scope = {
			tables: [{ user: "A" }, { user: "B" }],
		};
		const doc = makeDocxV4(content, {
			modules: [
				{
					optionsTransformer(options, doc) {
						doc.modules.forEach(function (module) {
							if (module.name === "LoopModule") {
								module.prefix.start = /^##?(.*)$/;
							}
						});
						return options;
					},
				},
			],
		});
		doc.render(scope);
		expect(doc.getFullText()).to.be.equal("ABAB");
	});

	it("should be possible to change the prefix of the raw xml module to a regexp", function () {
		const content = "<w:p><w:t>{!!raw}</w:t></w:p>";
		const scope = {
			raw: "<w:p><w:t>HoHo</w:t></w:p>",
		};
		const doc = makeDocxV4(content, {
			modules: [
				{
					optionsTransformer(options, doc) {
						doc.modules.forEach(function (module) {
							if (module.name === "RawXmlModule") {
								module.prefix = /^!!?(.*)$/;
							}
						});
						return options;
					},
				},
			],
		});
		doc.render(scope);

		expect(doc.getFullText()).to.be.equal("HoHo");
	});
});

describe("Load Office 365 file", function () {
	it("should handle files with word/document2.xml", function () {
		const doc = createDocV4("office365.docx", {
			paragraphLoop: true,
		}).render({
			test: "Value",
			test2: "Value2",
		});
		expect(doc.getFullText()).to.be.equal("Value Value2");
		shouldBeSame({ doc, expectedName: "expected-office365.docx" });
	});

	it("should template header.xml (without digit like header1.xml)", function () {
		const doc = createDoc("header-without-digit.docx").render({
			name: "John",
		});
		shouldBeSame({ doc, expectedName: "expected-header-without-digit.docx" });
	});
});

describe("Loops", function () {
	it("should work with template", function () {
		const doc = createDocV4("empty-loop-regression.docx").render({
			ice: [1, 2, 3],
		});
		shouldBeSame({ doc, expectedName: "expected-loop-regression.docx" });
	});
});
