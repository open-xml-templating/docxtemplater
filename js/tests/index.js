"use strict";

var _require = require("./utils"),
    setExamplesDirectory = _require.setExamplesDirectory,
    setStartFunction = _require.setStartFunction,
    start = _require.start;

var path = require("path");
setExamplesDirectory(path.resolve(__dirname, "..", "..", "examples"));
setStartFunction(startTest);

function startTest() {
	require("./base");
	require("./xml-templater");
	require("./xml-matcher");
	require("./errors");
	require("./speed");
	require("./lexer-parser-render");
	require("./integration");
	require("./doc-props");
}

start();