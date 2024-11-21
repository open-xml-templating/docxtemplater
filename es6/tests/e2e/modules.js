const {
	expectToThrow,
	shouldBeSame,
	createDocV4,
	captureLogs,
	expect,
	getZip,
} = require("../utils.js");
const expressionParser = require("../../expressions.js");
const proofStateModule = require("../../proof-state-module.js");
const inspectModule = require("../../inspect-module.js");

const Docxtemplater = require("../../docxtemplater.js");
const Errors = require("../../errors.js");
const { traits, uniq } = require("../../doc-utils.js");
const fixDocPrCorruption = require("../../modules/fix-doc-pr-corruption.js");

describe("Verify apiversion", function () {
	it("should work with valid api version", function () {
		const module = {
			name: "Mymod",
			requiredAPIVersion: "3.23.0",
			render(part) {
				return part.value;
			},
		};
		createDocV4("tag-example.docx", { modules: [module] });
	});

	it("should fail with invalid api version", function () {
		const module = {
			name: "Mymod",
			requiredAPIVersion: "3.92.0",
			render(part) {
				return part.value;
			},
		};

		expectToThrow(
			() => createDocV4("loop-valid.docx", { modules: [module] }),
			Errors.XTAPIVersionError,
			{
				message:
					"The minor api version is not uptodate, you probably have to update docxtemplater with npm install --save docxtemplater",
				name: "APIVersionError",
				properties: {
					id: "api_version_error",
					currentModuleApiVersion: [3, 41, 0],
					neededVersion: [3, 92, 0],
				},
			}
		);
	});

	it("should fail when trying to attach null module", function () {
		expectToThrow(
			() => new Docxtemplater(getZip("loop-valid.docx"), { modules: [null] }),
			Error,
			{
				message: "Cannot attachModule with a falsy value",
				name: "InternalError",
				properties: {},
			}
		);
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
		createDocV4("loop-valid.docx", { modules: [module] });

		let errMessage = null;
		try {
			createDocV4("tag-example.docx", { modules: [module] });
		} catch (e) {
			errMessage = e.message;
		}
		expect(errMessage).to.equal(
			'Cannot attach a module that was already attached : "TestModule". The most likely cause is that you are instantiating the module at the root level, and using it for multiple instances of Docxtemplater'
		);
	});

	it("should allow to attach the same module twice if it has a clone method", function () {
		const module = {
			name: "TestModule",
			requiredAPIVersion: "3.0.0",
			render(part) {
				return part.value;
			},
			clone() {
				return this;
			},
		};
		createDocV4("loop-valid.docx", { modules: [module] });
		createDocV4("tag-example.docx", { modules: [module] });
		createDocV4("tag-example.docx", { modules: [module] });
	});

	it("should automatically detach inspect module", function () {
		const imodule = inspectModule();
		createDocV4("loop-valid.docx", { modules: [imodule] }).render();
		createDocV4("loop-valid.docx", { modules: [imodule] }).render();
	});
});

describe("Module xml parse", function () {
	it("should not mutate options (regression for issue #526)", function () {
		const module = {
			name: "FooModule",
			requiredAPIVersion: "3.0.0",
			optionsTransformer(options, docxtemplater) {
				const relsFiles = docxtemplater.zip
					.file(/document.xml.rels/)
					.map((file) => file.name);
				options.xmlFileNames = options.xmlFileNames.concat(relsFiles);
				return options;
			},
		};
		const opts = { modules: [module] };
		createDocV4("tag-example.docx", opts);
		delete opts.modules;
		expect(opts).to.deep.equal({});
	});

	it("should be possible to parse xml files", function () {
		let xmlDocuments;

		const module = {
			name: "ParseXMLModule",
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

		const doc = createDocV4("tag-example.docx", { modules: [module] });

		const xmlKeys = Object.keys(xmlDocuments);
		expect(xmlKeys).to.deep.equal([
			"[Content_Types].xml",
			"word/_rels/document.xml.rels",
		]);
		const rels =
			xmlDocuments["word/_rels/document.xml.rels"].getElementsByTagName(
				"Relationship"
			);
		expect(rels.length).to.equal(10);

		rels[5].setAttribute("Foobar", "Baz");
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-module-change-rels.docx" });
	});
});

describe("Module unique tags xml", function () {
	it("should not cause an issue if tagsXmlLexedArray contains duplicates", function () {
		const module = {
			name: "FooModule",
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

		const doc = createDocV4("tag-example.docx", { modules: [module] });
		doc.render({
			first_name: "Hipp",
			last_name: "Edgar",
			phone: "0652455478",
			description: "New Website",
		});
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

		const doc = createDocV4("comment-with-loop.docx", { modules: [module] });
		doc.render({});
		shouldBeSame({ doc, expectedName: "expected-comment-example.docx" });
	});
});

describe("Module errors", function () {
	it("should pass the errors to errorsTransformer", function () {
		const moduleName = "ErrorModule";
		let catched = null;
		const myErrors = [];
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
			errorsTransformer(errors) {
				myErrors.push(...errors);
				return errors.map(function (e) {
					e.xyz = "xxx";
					return e;
				});
			},
		};

		const doc = createDocV4("tag-example.docx", { modules: [module] });
		const capture = captureLogs();
		try {
			doc.render();
		} catch (e) {
			catched = e;
		}
		capture.stop();
		expect(catched.properties.errors[0].xyz).to.equal("xxx");
		expect(myErrors.length).to.equal(9);
		expect(myErrors[0].message).to.equal("foobar last_name");
	});

	it("should log the error that is returned from render", function () {
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
		const doc = createDocV4("tag-example.docx", { modules: [module] });
		const capture = captureLogs();
		try {
			doc.render();
		} catch (e) {
			error = e;
		}
		capture.stop();

		expect(error).to.be.an("object");
		expect(error.message).to.equal("Multi error");
		expect(error.properties.errors.length).to.equal(9);

		expect(error.properties.errors[4].properties.file).to.equal(
			"word/document.xml"
		);
		expect(error.properties.errors[4].message).to.equal("foobar last_name");
		expect(error.properties.errors[5].message).to.equal("foobar first_name");
		// expect(error.properties.errors[2].message).to.equal("foobar phone");

		const logs = capture.logs();
		expect(logs.length).to.equal(1, "Incorrect logs count");
		expect(logs[0]).to.contain("foobar last_name");
		expect(logs[0]).to.contain("foobar first_name");
		expect(logs[0]).to.contain("foobar phone");
		expect(logs[0]).to.satisfy(
			(log) =>
				// for chrome
				log.indexOf(".render") !== -1 ||
				// for firefox
				log.indexOf("render@") !== -1 ||
				// for bun (https://bun.sh/)
				log.indexOf("render (") !== -1
		);
		const parsedLog = JSON.parse(logs[0]);
		expect(parsedLog.error.length).to.equal(9);

		expect(error.properties.errors[0].properties.file).to.equal(
			"word/header1.xml"
		);
		expect(error.properties.errors[0].message).to.equal("foobar last_name");
		expect(error.properties.errors[1].message).to.equal("foobar first_name");
		expect(error.properties.errors[2].message).to.equal("foobar phone");

		expect(error.properties.errors[6].properties.file).to.equal(
			"word/footer1.xml"
		);
		expect(error.properties.errors[6].message).to.equal("foobar last_name");
	});

	it("should throw specific error if adding same module twice", function () {
		const mod1 = {
			name: "TestModule",
			set() {
				return null;
			},
		};
		const mod2 = {
			name: "TestModule",
			set() {
				return null;
			},
		};

		// This test will test the case where the fixDocPrCorruption is used on two different instances of the docxtemplater library
		expectToThrow(
			() => createDocV4("loop-image-footer.docx", { modules: [mod1, mod2] }),
			Error,
			{
				message: 'Detected duplicate module "TestModule"',
				name: "InternalError",
				properties: {},
			}
		);
	});
});

describe("Module should pass options to module.parse, module.postparse, module.render, module.postrender", function () {
	it("should pass filePath and contentType options", function () {
		const filePaths = [];
		const relsType = [];
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
				relsType.push(options.relsType);
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
		const doc = createDocV4("tag-example.docx", { modules: [module] });
		doc.render({});
		expect(renderFP).to.equal("word/footnotes.xml");
		expect(renderCT).to.equal(
			"application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"
		);
		expect(postparseFP).to.equal("word/footnotes.xml");
		expect(postparseCT).to.equal(
			"application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"
		);
		expect(postrenderFP).to.equal("word/footnotes.xml");
		expect(postrenderCT).to.equal(
			"application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"
		);

		// The order of the filePaths here is important, this has been fixed in version 3.37.8 : First headers are templated, than the document, than the footers.
		expect(filePaths).to.deep.equal([
			// Header appears 4 times because there are 4 tags in the header
			"word/header1.xml",
			"word/header1.xml",
			"word/header1.xml",
			"word/header1.xml",
			// Document appears 2 times because there are 2 tags in the header
			"word/document.xml",
			"word/document.xml",
			// Footer appears 3 times because there are 3 tags in the header
			"word/footer1.xml",
			"word/footer1.xml",
			"word/footer1.xml",
		]);

		expect(ct).to.deep.equal([
			"application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml",
		]);

		expect([relsType[3], relsType[4], relsType[5]]).to.deep.equal([
			undefined,
			"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
			"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
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

describe("Module Matcher API", function () {
	it("should call onMatch function", function () {
		function module1() {
			let myVal = "";
			return {
				name: "module1",
				matchers() {
					return [
						[
							"l",
							"module-m1",
							{
								onMatch: (part) => {
									myVal = part.prefix + part.lIndex + "!!";
								},
							},
						],
					];
				},
				render(part) {
					if (part.module === "module-m1") {
						return { value: myVal };
					}
				},
			};
		}
		expect(
			this.renderV4({
				name: "tag-example.docx",
				options: {
					modules: [module1()],
				},
				data: { first_name: "John" },
				expectedText: "l28!! John",
			})
		);
	});

	it("should automatically choose module with longest value", function () {
		function module1() {
			return {
				name: "module1",
				matchers() {
					return [["l", "module-m1"]];
				},
				render(part) {
					if (part.module === "module-m1") {
						return { value: part.value };
					}
				},
			};
		}
		function module2() {
			return {
				name: "module2",
				matchers() {
					return [[/last_(.*)/, "module-m2"]];
				},
				render(part) {
					if (part.module === "module-m2") {
						return { value: part.value };
					}
				},
			};
		}
		function module3() {
			return {
				name: "module3",
				matchers() {
					return [["last", "module-m3"]];
				},
				render(part) {
					if (part.module === "module-m3") {
						return { value: part.value };
					}
				},
			};
		}
		expect(
			createDocV4("tag-example.docx", {
				modules: [module1(), module2(), module3()],
			})
				.render({
					first_name: "John",
				})
				.getFullText()
		).to.equal("name John");

		expect(
			createDocV4("tag-example.docx", {
				modules: [module3(), module2(), module1()],
			})
				.render({
					first_name: "John",
				})
				.getFullText()
		).to.equal("name John");
	});
});

describe("Fix doc pr corruption module", function () {
	it("should work on multiple instances in parallel", function () {
		const doc = createDocV4("loop-image-footer.docx", {
			modules: [fixDocPrCorruption],
		});
		// This test will test the case where the fixDocPrCorruption is used on two different instances of the docxtemplater library
		createDocV4("tag-example.docx", {
			modules: [fixDocPrCorruption],
		});
		return doc.renderAsync({ loop: [1, 2, 3, 4] }).then(function () {
			shouldBeSame({
				doc,
				expectedName: "expected-loop-images-footer.docx",
			});
		});
	});
});

describe("Proofstate module", function () {
	it("should work with angular parser with proofstate module", function () {
		shouldBeSame({
			doc: createDocV4("angular-example.docx", {
				parser: expressionParser,
				modules: [proofStateModule],
			}).render({
				person: {
					first_name: "Hipp",
					last_name: "Edgar",
					birth_year: 1955,
					age: 59,
				},
			}),
			expectedName: "expected-proofstate-removed.docx",
		});
	});
});
describe("Module call order", function () {
	const expectedCallOrder = [
		"on",
		"set",
		"getFileType",
		"optionsTransformer",
		"preparse",
		"getTraits",
		"postparse",
		"errorsTransformer",
		"matchers",
		"getRenderedMap",
		"render",
		"postrender",
	];
	it("should work with v4", function () {
		const calls = [];
		const mod = {
			name: "TestModule",
			set() {
				calls.push("set");
				return null;
			},
			matchers() {
				calls.push("matchers");
				return [];
			},
			render() {
				calls.push("render");
				return null;
			},
			optionsTransformer(options) {
				calls.push("optionsTransformer");
				return options;
			},
			preparse() {
				calls.push("preparse");
				return null;
			},
			parse() {
				calls.push("parse");
				return null;
			},
			postparse() {
				calls.push("postparse");
				return null;
			},
			getTraits() {
				calls.push("getTraits");
			},
			getFileType() {
				calls.push("getFileType");
			},
			nullGetter() {
				calls.push("nullGetter");
			},
			postrender() {
				calls.push("postrender");
				return [];
			},
			errorsTransformer() {
				calls.push("errorsTransformer");
			},
			getRenderedMap(obj) {
				calls.push("getRenderedMap");
				return obj;
			},
			on() {
				calls.push("on");
			},
			resolve() {
				calls.push("on");
			},
		};
		const doc = createDocV4("loop-image-footer.docx", {
			modules: [mod],
		});
		// This test will test the case where the fixDocPrCorruption is used on two different instances of the docxtemplater library
		doc.render({ loop: [1, 2, 3, 4] });
		expect(uniq(calls)).to.deep.equal(expectedCallOrder);
	});

	it("should work with v3", function () {
		const calls = [];
		const mod = {
			name: "TestModule",
			set() {
				calls.push("set");
				return null;
			},
			matchers() {
				calls.push("matchers");
				return [];
			},
			render() {
				calls.push("render");
				return null;
			},
			optionsTransformer(options) {
				calls.push("optionsTransformer");
				return options;
			},
			preparse() {
				calls.push("preparse");
				return null;
			},
			parse() {
				calls.push("parse");
				return null;
			},
			postparse() {
				calls.push("postparse");
				return null;
			},
			getTraits() {
				calls.push("getTraits");
			},
			getFileType() {
				calls.push("getFileType");
			},
			nullGetter() {
				calls.push("nullGetter");
			},
			postrender() {
				calls.push("postrender");
				return [];
			},
			errorsTransformer() {
				calls.push("errorsTransformer");
			},
			getRenderedMap(obj) {
				calls.push("getRenderedMap");
				return obj;
			},
			on() {
				calls.push("on");
			},
			resolve() {
				calls.push("on");
			},
		};

		// This test will test the case where the fixDocPrCorruption is used on two different instances of the docxtemplater library
		this.render({
			name: "loop-image-footer.docx",
			options: {
				modules: [mod],
			},
			data: { loop: [1, 2, 3, 4] },
		});
		expect(uniq(calls)).to.deep.equal(expectedCallOrder);
	});
});

describe("Module priority", function () {
	it("should reorder modules", function () {
		const m1 = {
			priority: 4,
			name: "M1",
			parse: (parsed) => parsed,
		};
		const m2 = {
			priority: -1,
			name: "M2",
			parse: (parsed) => parsed,
		};
		const m3 = {
			priority: 5,
			name: "M3",
			parse: (parsed) => parsed,
		};
		const m4 = {
			priority: 5,
			name: "M4",
			parse: (parsed) => parsed,
		};
		const m5 = {
			priority: 5,
			name: "M5",
			parse: (parsed) => parsed,
		};
		const doc = createDocV4("loop-image-footer.docx", {
			modules: [m1, m2, m3, m4, m5],
		});

		const orderedNames = doc.modules.map(function ({ name }) {
			return name;
		});
		expect(orderedNames).to.deep.equal([
			"M3",
			"M4",
			"M5",
			"M1",
			"LoopModule",
			"SpacePreserveModule",
			"ExpandPairTrait",
			"RawXmlModule",
			"Render",
			"Common",
			"AssertionModule",
			"M2",
		]);
	});
});
