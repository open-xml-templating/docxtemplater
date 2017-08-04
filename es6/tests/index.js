"use strict";

const testUtils = require("./utils");
const path = require("path");
testUtils.setExamplesDirectory(path.resolve(__dirname, "..", "..", "examples"));
testUtils.setStartFunction(startTest);

function startTest() {
	require("./base");
	require("./xml-templater");
	require("./xml-matcher");
	require("./errors");
	require("./speed");
	require("./lexer-parser-render");
	require("./integration");
	require("./doc-props");

	if (typeof window !== "undefined" && window) {
		return window.mocha.run();
	}
}

testUtils.start();
