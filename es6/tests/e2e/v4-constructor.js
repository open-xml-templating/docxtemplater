const Docxtemplater = require("../../docxtemplater.js");
const { createDocV4, expect, getZip, captureLogs } = require("../utils.js");
const inspectModule = require("../../inspect-module.js");

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

	it("should warn if trying to reuse same zip for two docxtemplater templates", () => {
		const zip = getZip("tag-example.docx");
		const doc = new Docxtemplater(zip);
		const capture = captureLogs();
		doc.render();
		/* eslint-disable-next-line no-unused-vars */
		const otherDoc = new Docxtemplater(zip);
		capture.stop();
		const logs = capture.logs();
		expect(logs).to.deep.equal([
			"Warning : This zip file appears to be the outcome of a previous docxtemplater generation. This typically indicates that docxtemplater was integrated by reusing the same zip file. It is recommended to create a new Pizzip instance for each docxtemplater generation.",
		]);
	});

	it("should be possible to customize warnFn", () => {
		const zip = getZip("tag-example.docx");
		const doc = new Docxtemplater(zip);
		doc.render();
		let myErrors = [];
		/* eslint-disable-next-line no-unused-vars */
		const otherDoc = new Docxtemplater(zip, {
			warnFn: (errors) => {
				myErrors = errors;
			},
		});
		expect(myErrors.length).to.deep.equal(1);
		expect(myErrors[0]).to.be.instanceof(Error);
	});

	it("should throw an error when an invalid zip is passed", () => {
		expect(() => new Docxtemplater("content")).to.throw(
			"The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)"
		);

		expect(() => new Docxtemplater({ files: [] })).to.throw(
			"The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)"
		);

		const zip = getZip("tag-example.docx");
		zip.files = null;
		expect(() => new Docxtemplater(zip)).to.throw(
			"The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)"
		);

		if (typeof Buffer !== "undefined") {
			expect(() => new Docxtemplater(Buffer.from("content"))).to.throw(
				"You passed a Buffer to the Docxtemplater constructor. The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)"
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
		expect(doc.getFullText()).to.be.equal("Hello John");
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
		expect(doc.getFullText()).to.be.equal("Hello John from Acme");
	});

	it("should throw error when using a non-instanciated class as a module", () => {
		class MyTestModule {
			render(part) {
				return {
					value: part.value,
				};
			}
		}

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
		const doc = createDocV4("tag-example.docx");
		expect(() => doc.setOptions({ linebreaks: true })).to.throw(
			"setOptions() should not be called manually when using the v4 constructor"
		);
	});

	it("should throw if using v4 constructor and attachModule", () => {
		const doc = createDocV4("tag-example.docx");
		expect(() => doc.attachModule({ render() {} })).to.throw(
			"attachModule() should not be called manually when using the v4 constructor"
		);
	});

	it("should throw if using v4 constructor and loadZip", () => {
		const doc = createDocV4("tag-example.docx");
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
