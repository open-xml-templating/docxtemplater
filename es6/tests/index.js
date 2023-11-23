require("es6-promise").polyfill();
const {
	setExamplesDirectory,
	setSnapshotFile,
	setStartFunction,
	shouldBeSame,
	start,
	createDocV4,
	createDoc,
} = require("./utils.js");
const path = require("path");
if (path.resolve) {
	setExamplesDirectory(path.resolve(__dirname, "..", "..", "examples"));
	setSnapshotFile(path.resolve(__dirname, "__snapshots.js"));
}
setStartFunction(startTest, require("./__snapshots.js"));

function startTest() {
	beforeEach(function () {
		this.async = false;
		this.name = "";
		this.options = {};
		this.expectedName = "";
		this.data = {};
		this.renderV4 = function () {
			const doc = createDocV4(this.name, this.options);
			if (this.async) {
				return doc.renderAsync(this.data).then(() => {
					if (this.expectedName) {
						shouldBeSame({
							doc,
							expectedName: this.expectedName,
						});
					}
					return doc;
				});
			}
			doc.render(this.data);
			if (this.expectedName) {
				shouldBeSame({
					doc,
					expectedName: this.expectedName,
				});
			}
			return doc;
		};
		this.render = function () {
			const doc = createDoc(this.name, this.options);
			doc.render(this.data);
			return doc;
		};
	});
	describe("", function () {
		require("./e2e/text.js");
		require("./e2e/base.js");
		require("./e2e/xml-templater.js");
		require("./e2e/errors.js");
		require("./e2e/speed.js");
		require("./e2e/lexer-parser-render.js");
		require("./e2e/integration.js");
		require("./e2e/doc-props.js");
		require("./e2e/modules.js");
		require("./e2e/pptx.js");
		require("./e2e/table.js");
		require("./e2e/async.js");

		require("./unit/xml-matcher.js");
		require("./unit/doc-utils.js");
		require("./unit/expressions.js");
		require("./unit/merge-sort.js");
		require("./unit/scope-manager.js");
	});
}

start();
