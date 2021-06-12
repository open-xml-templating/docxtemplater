const {
	expectToThrow,
	createDoc,
	shouldBeSame,
	isNode14,
	createDocV4,
} = require("./utils.js");
const Errors = require("../errors.js");
const { expect } = require("chai");
const { xml2str, traits } = require("../doc-utils.js");

describe("Verify apiversion", function () {
	it("should work with valid api version", function () {
		const module = {
			requiredAPIVersion: "3.23.0",
			render(part) {
				return part.value;
			},
		};
		const doc = createDoc("loop-valid.docx");
		doc.attachModule(module);
	});

	it("should fail with invalid api version", function () {
		const module = {
			requiredAPIVersion: "3.92.0",
			render(part) {
				return part.value;
			},
		};
		const doc = createDoc("loop-valid.docx");

		expectToThrow(() => doc.attachModule(module), Errors.XTAPIVersionError, {
			message:
				"The minor api version is not uptodate, you probably have to update docxtemplater with npm install --save docxtemplater",
			name: "APIVersionError",
			properties: {
				id: "api_version_error",
				currentModuleApiVersion: [3, 26, 0],
				neededVersion: [3, 92, 0],
			},
		});
	});
});

describe("Module attachment", function () {
	it("should not allow to attach the same module twice", function () {
		const module = {
			name: "TestModule",
			requiredAPIVersion: "3.0.0",
			render(part) {
				return part.value;
			},
		};
		const doc1 = createDoc("loop-valid.docx");
		doc1.attachModule(module);
		const doc2 = createDoc("tag-example.docx");

		let errMessage = null;
		try {
			doc2.attachModule(module);
		} catch (e) {
			errMessage = e.message;
		}
		expect(errMessage).to.equal(
			'Cannot attach a module that was already attached : "TestModule". Maybe you are instantiating the module at the root level, and using it for multiple instances of Docxtemplater'
		);
	});
});

describe("Module xml parse", function () {
	it("should not mutate options (regression for issue #526)", function () {
		const module = {
			requiredAPIVersion: "3.0.0",
			optionsTransformer(options, docxtemplater) {
				const relsFiles = docxtemplater.zip
					.file(/document.xml.rels/)
					.map((file) => file.name);
				options.xmlFileNames = options.xmlFileNames.concat(relsFiles);
				return options;
			},
		};
		const doc = createDoc("tag-example.docx");
		const opts = {};
		doc.setOptions(opts);
		doc.attachModule(module);
		doc.compile();
		expect(opts).to.deep.equal({});
	});

	it("should be possible to parse xml files", function () {
		let xmlDocuments;

		const module = {
			requiredAPIVersion: "3.0.0",
			optionsTransformer(options, docxtemplater) {
				const relsFiles = docxtemplater.zip
					.file(/document.xml.rels/)
					.map((file) => file.name);
				options.xmlFileNames = options.xmlFileNames.concat(relsFiles);
				return options;
			},
			set(options) {
				if (options.xmlDocuments) {
					xmlDocuments = options.xmlDocuments;
				}
			},
		};

		const doc = createDoc("tag-example.docx");
		doc.attachModule(module);
		doc.compile();

		const xmlKeys = Object.keys(xmlDocuments);
		expect(xmlKeys).to.deep.equal(["word/_rels/document.xml.rels"]);
		const rels =
			xmlDocuments["word/_rels/document.xml.rels"].getElementsByTagName(
				"Relationship"
			);
		expect(rels.length).to.equal(10);

		const str = xml2str(xmlDocuments["word/_rels/document.xml.rels"]);
		if (isNode14()) {
			expect(str).to
				.equal(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rId2" Type="http://schemas.microsoft.com/office/2007/relationships/stylesWithEffects" Target="stylesWithEffects.xml"/><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes" Target="endnotes.xml"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/><Relationship Id="rId10" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings" Target="webSettings.xml"/><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/></Relationships>`);
			rels[5].setAttribute("Foobar", "Baz");
			doc.render();
			shouldBeSame({ doc, expectedName: "expected-module-change-rels.docx" });
		}
	});
});

describe("Module unique tags xml", function () {
	it("should not cause an issue if tagsXmlLexedArray contains duplicates", function () {
		const module = {
			requiredAPIVersion: "3.0.0",
			optionsTransformer(options, docxtemplater) {
				docxtemplater.fileTypeConfig.tagsXmlLexedArray.push(
					"w:p",
					"w:r",
					"w:p"
				);
				return options;
			},
		};

		const doc = createDoc("tag-example.docx");
		doc.attachModule(module);
		doc.setData({
			first_name: "Hipp",
			last_name: "Edgar",
			phone: "0652455478",
			description: "New Website",
		});
		doc.compile();
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-tag-example.docx" });
	});
});

describe("Module traits", function () {
	it("should not cause an issue if using traits.expandTo containing loop", function () {
		const moduleName = "comment-module";
		function getInner({ part, leftParts, rightParts, postparse }) {
			part.subparsed = postparse([].concat(leftParts).concat(rightParts), {
				basePart: part,
			});
			return part;
		}
		const module = {
			name: "Test module",
			requiredAPIVersion: "3.0.0",
			parse(placeHolderContent) {
				if (placeHolderContent[0] === "£") {
					const type = "placeholder";
					return {
						type,
						value: placeHolderContent.substr(1),
						module: moduleName,
					};
				}
			},
			postparse(parsed, { postparse }) {
				parsed = traits.expandToOne(parsed, {
					moduleName,
					getInner,
					expandTo: ["w:p"],
					postparse,
				});
				return parsed;
			},
			render(part) {
				if (part.module === moduleName) {
					return {
						value: "",
					};
				}
			},
		};

		const doc = createDoc("comment-with-loop.docx");
		doc.attachModule(module);
		doc.setData({}).compile().render();
		shouldBeSame({ doc, expectedName: "expected-comment-example.docx" });
	});
});

describe("Module errors", function () {
	it("should work", function () {
		const moduleName = "ErrorModule";
		const module = {
			name: "Error module",
			requiredAPIVersion: "3.0.0",
			parse(placeHolderContent) {
				const type = "placeholder";
				return {
					type,
					value: placeHolderContent,
					module: moduleName,
				};
			},
			render(part) {
				if (part.module === moduleName) {
					return {
						errors: [new Error(`foobar ${part.value}`)],
					};
				}
			},
		};

		let error = null;
		const doc = createDoc("tag-example.docx");
		doc.attachModule(module);
		doc.setData({}).compile();
		try {
			doc.render();
		} catch (e) {
			error = e;
		}
		expect(error).to.be.an("object");
		expect(error.message).to.equal("Multi error");
		expect(error.properties.errors.length).to.equal(9);
		expect(error.properties.errors[0].message).to.equal("foobar last_name");
		expect(error.properties.errors[1].message).to.equal("foobar first_name");
		expect(error.properties.errors[2].message).to.equal("foobar phone");
	});
});

describe("Module should pass options to module.parse, module.postparse, module.render, module.postrender", function () {
	it("should pass filePath and contentType options", function () {
		const doc = createDoc("tag-example.docx");
		const filePaths = [];
		let renderFP = "",
			renderCT = "",
			postrenderFP = "",
			postrenderCT = "",
			postparseFP = "",
			postparseCT = "";
		const ct = [];

		const module = {
			name: "Test module",
			requiredAPIVersion: "3.0.0",
			parse(a, options) {
				filePaths.push(options.filePath);
				ct.push(options.contentType);
			},
			postparse(a, options) {
				postparseFP = options.filePath;
				postparseCT = options.contentType;
				return a;
			},
			render(a, options) {
				renderFP = options.filePath;
				renderCT = options.contentType;
			},
			postrender(a, options) {
				postrenderFP = options.filePath;
				postrenderCT = options.contentType;
				return a;
			},
		};
		doc.attachModule(module);
		doc.setData({}).compile();
		doc.render();
		expect(renderFP).to.equal("word/document.xml");
		expect(renderCT).to.equal(
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"
		);
		expect(postparseFP).to.equal("word/document.xml");
		expect(postparseCT).to.equal(
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"
		);
		expect(postrenderFP).to.equal("word/document.xml");
		expect(postrenderCT).to.equal(
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"
		);

		expect(filePaths).to.deep.equal([
			// Header appears 4 times because there are 4 tags in the header
			"word/header1.xml",
			"word/header1.xml",
			"word/header1.xml",
			"word/header1.xml",
			// Footer appears 3 times because there are 3 tags in the header
			"word/footer1.xml",
			"word/footer1.xml",
			"word/footer1.xml",
			// Document appears 2 times because there are 2 tags in the header
			"word/document.xml",
			"word/document.xml",
		]);

		expect(ct).to.deep.equal([
			"application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
		]);
	});
});

describe("Module detachment", function () {
	it("should detach the module when the module does not support the document filetype", function () {
		let isModuleCalled = false;
		let isDetachedCalled = false;
		const module = {
			optionsTransformer(options) {
				isModuleCalled = true;
				return options;
			},
			on(eventName) {
				if (eventName === "detached") {
					isDetachedCalled = true;
				}
			},
			supportedFileTypes: ["pptx"],
		};
		createDocV4("tag-example.docx", { modules: [module] });
		expect(isDetachedCalled).to.equal(true);
		expect(isModuleCalled).to.equal(false);
	});
});
