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
	"one-raw-xml-tag.docx",
	"table-example.pptx",
	"table-example-expected.pptx",
	"simple-example.pptx",
	"loop-example.pptx",
	"expected-loop-example.pptx",
	"raw-xml-example.pptx",
	"image.png",
];

function startTest() {
	require("./base");
	require("./xml-templater");
	require("./xml-matcher");
	require("./errors");
	require("./speed");
	require("./lexer-parser-render");

	describe("pptx generation", function () {
		it("should work with simple pptx", function () {
			const doc = testUtils.createDoc("simple-example.pptx");
			const p = doc.setData({name: "Edgar"}).render();
			expect(p.getFullText()).to.be.equal("Hello Edgar");
		});
		it("should work with table pptx", function () {
			const doc = testUtils.createDoc("table-example.pptx");
			doc.setData({users: [{msg: "hello", name: "mary"}, {msg: "hello", name: "john"}]}).render();
			testUtils.shouldBeSame({doc, expectedName: "table-example-expected.pptx"});
		});
		it("should work with loop pptx", function () {
			const doc = testUtils.createDoc("loop-example.pptx");
			const p = doc.setData({users: [{name: "Doe"}, {name: "John"}]}).render();
			testUtils.shouldBeSame({doc, expectedName: "expected-loop-example.pptx"});
			expect(p.getFullText()).to.be.equal(" Doe  John ");
		});
		it("should work with simple raw pptx", function () {
			const doc = testUtils.createDoc("raw-xml-example.pptx");
			const p = doc.setData({raw: "<p:sp><a:t>Hello World</a:t></p:sp>"}).render();
			expect(p.getFullText()).to.be.equal("Hello World");
		});
	});

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
