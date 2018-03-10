"use strict";

var Lexer = require("../lexer.js");

var _require = require("./utils"),
    expect = _require.expect,
    makeDocx = _require.makeDocx;

var fixtures = require("./fixtures");
var FileTypeConfig = require("../file-type-config");
var docxconfig = FileTypeConfig.docx;
var inspectModule = require("../inspect-module.js");
var tagsDocxConfig = {
	text: docxconfig.tagsXmlTextArray,
	other: docxconfig.tagsXmlLexedArray
};

function cleanRecursive(arr) {
	arr.forEach(function (p) {
		delete p.lIndex;
		delete p.offset;
		if (p.subparsed) {
			cleanRecursive(p.subparsed);
		}
		if (p.expanded) {
			p.expanded.forEach(cleanRecursive);
		}
	});
}

describe("Algorithm", function () {
	Object.keys(fixtures).forEach(function (key) {
		var fixture = fixtures[key];
		(fixture.only ? it.only : it)(fixture.it, function () {
			var doc = makeDocx(key, fixture.content);
			doc.setOptions(fixture.options);
			var iModule = inspectModule();
			doc.attachModule(iModule);
			doc.setData(fixture.scope);
			doc.render();
			cleanRecursive(iModule.inspect.lexed);
			cleanRecursive(iModule.inspect.parsed);
			cleanRecursive(iModule.inspect.postparsed);
			expect(iModule.inspect.lexed).to.be.deep.equal(fixture.lexed, "Lexed incorrect");
			expect(iModule.inspect.parsed).to.be.deep.equal(fixture.parsed, "Parsed incorrect");
			if (fixture.postparsed) {
				expect(iModule.inspect.postparsed).to.be.deep.equal(fixture.postparsed, "Postparsed incorrect");
			}
			if (iModule.inspect.content) {
				expect(iModule.inspect.content).to.be.deep.equal(fixture.result, "Content incorrect");
			}
		});
	});
	it("should xmlparse strange tags", function () {
		var xmllexed = Lexer.xmlparse(fixtures.strangetags.content, tagsDocxConfig);
		cleanRecursive(xmllexed);
		expect(xmllexed).to.be.deep.equal(fixtures.strangetags.xmllexed);
	});
});