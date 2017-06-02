"use strict";

const testUtils = require("./utils");
const path = require("path");
testUtils.setExamplesDirectory(path.resolve(__dirname, "..", "..", "examples"));
testUtils.setStartFunction(startTest);

const fileNames = [
	"angular-example.docx",
	"cyrillic.docx",
	"image-example.docx",
	"table-complex2-example.docx",
	"table-complex-example.docx",
	"tag-dash-loop.docx",
	"tag-dash-loop-list.docx",
	"tag-dash-loop-table.docx",
	"tag-example.docx",
	"tag-example-expected.docx",
	"tag-intelligent-loop-table.docx",
	"tag-intelligent-loop-table-expected.docx",
	"tag-loop-example.docx",
	"tag-produit-loop.docx",
	"one-raw-xml-tag.docx",
	"table-example.pptx",
	"table-example-expected.pptx",
	"simple-example.pptx",
	"loop-example.pptx",
	"expected-loop-example.pptx",
	"raw-xml-example.pptx",
	"expected-raw-xml-example.pptx",
	"image.png",
];

function startTest() {
	require("./base");
	require("./xml-templater");
	require("./xml-matcher");
	require("./errors");
	require("./speed");
	require("./lexer-parser-render");
	require("./integration");

	if (typeof window !== "undefined" && window) {
		return window.mocha.run();
	}
}

fileNames.forEach(function (fileName) {
	let callback;
	if (fileName.indexOf(".docx") !== -1 || fileName.indexOf(".pptx") !== -1) {
		callback = testUtils.loadDocument;
	}
	if (fileName.indexOf(".png") !== -1) {
		callback = testUtils.loadImage;
	}
	if (!callback) {
		throw new Error(`Filename ${fileName} neither docx nor pptx nor png`);
	}
	testUtils.loadFile(fileName, callback);
});

testUtils.start();
