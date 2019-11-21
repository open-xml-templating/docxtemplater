const { expectToThrow, createDoc } = require("./utils");
const Errors = require("../errors.js");
const { expect } = require("chai");

describe("Verify apiversion", function() {
	it("should work with valid api version", function() {
		const module = {
			requiredAPIVersion: "3.15.0",
			render(part) {
				return part.value;
			},
		};
		const doc = createDoc("loop-valid.docx");
		doc.attachModule(module);
	});

	it("should fail with valid api version", function() {
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
				currentModuleApiVersion: [3, 15, 0],
				neededVersion: [3, 92, 0],
			},
		});
	});
});

describe("Module attachment", function() {
	it("should not allow to attach the same module twice", function() {
		const module = {
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
			"Cannot attach a module that was already attached"
		);
	});
});
