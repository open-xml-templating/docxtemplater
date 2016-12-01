"use strict";

const testUtils = require("./utils");
const path = require("path");
const expect = testUtils.expect;
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
	"simple-example.pptx",
	"raw-xml-example.pptx",
	"one-raw-xml-tag.docx",
	"image.png",
];

function startTest() {
	require("./base");
	require("./errors");
	require("./speed");
	require("./lexer-parser-render");

	describe("pptx generation", function () {
		it("should work with simple pptx", function () {
			const doc = testUtils.createPpt("simple-example.pptx");
			const p = doc.setData({name: "Edgar"}).render();
			expect(p.getFullText()).to.be.equal("Hello Edgar");
		});
		it("should work with simple raw pptx", function () {
			const doc = testUtils.createPpt("raw-xml-example.pptx");
			const p = doc.setData({raw: "<p:sp><a:t>Hello World</a:t></p:sp>"}).render();
			expect(p.getFullText()).to.be.equal("Hello World");
		});
	});

	if (typeof window !== "undefined" && window) {
		return window.mocha.run();
	}
}

fileNames.forEach(function (fileName) {
	if (fileName.indexOf(".docx") !== -1) {
		return testUtils.loadFile(fileName, testUtils.loadDocx);
	}
	if (fileName.indexOf(".pptx") !== -1) {
		return testUtils.loadFile(fileName, testUtils.loadPptx);
	}
	if (fileName.indexOf(".png") !== -1) {
		return testUtils.loadFile(fileName, testUtils.loadImage);
	}
	throw new Error(`Filename ${fileName} neither docx nor pptx`);
});

testUtils.start();
