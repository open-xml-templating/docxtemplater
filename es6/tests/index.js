require("es6-promise").polyfill();
const { setExamplesDirectory, setStartFunction, start } = require("./utils.js");
const path = require("path");
if (path.resolve) {
	setExamplesDirectory(path.resolve(__dirname, "..", "..", "examples"));
}
setStartFunction(startTest);

function startTest() {
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
	require("./unit/merge-sort.js");
	require("./unit/scope-manager.js");
}

start();
