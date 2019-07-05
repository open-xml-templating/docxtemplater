const { expectToThrow, createDoc } = require("./utils");
const Errors = require("../errors.js");

describe("Verify apiversion", function() {
	it("should work with valid api version", function() {
		const module = {
			requiredAPIVersion: "3.12.0",
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
				currentModuleApiVersion: [3, 12, 0],
				neededVersion: [3, 92, 0],
			},
		});
	});
});
