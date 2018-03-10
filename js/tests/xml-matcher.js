"use strict";

var xmlMatcher = require("../xml-matcher.js");

var _require = require("./utils"),
    expect = _require.expect;

describe("XmlMatcher", function () {
	it("should work with simple tag", function () {
		var matcher = xmlMatcher("<w:t>Text</w:t>", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("<w:t>Text</w:t>");
		expect(matcher.matches[0].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[0].array[2]).to.be.equal("Text");
		expect(matcher.matches[0].offset).to.be.equal(0);
	});

	it("should work with multiple tags", function () {
		var matcher = xmlMatcher("<w:t>Text</w:t> TAG <w:t>Text2</w:t>", ["w:t"]);
		expect(matcher.matches[1].array[0]).to.be.equal("<w:t>Text2</w:t>");
		expect(matcher.matches[1].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[1].array[2]).to.be.equal("Text2");
		expect(matcher.matches[1].offset).to.be.equal(20);
	});

	it("should work with selfclosing tag", function () {
		var matcher = xmlMatcher(' <w:spacing w:before="0" w:after="200"/> ', ["w:spacing"]);
		expect(matcher.matches.length).to.be.equal(1);
		expect(matcher.matches[0].array[0]).to.be.equal('<w:spacing w:before="0" w:after="200"/>');
	});

	it("should work with no tag, with w:t", function () {
		var matcher = xmlMatcher("Text1</w:t><w:t>Text2", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("Text1");
		expect(matcher.matches[0].array[1]).to.be.equal("");
		expect(matcher.matches[0].array[2]).to.be.equal("Text1");
		expect(matcher.matches[0].offset).to.be.equal(0);

		expect(matcher.matches[1].array[0]).to.be.equal("<w:t>Text2");
		expect(matcher.matches[1].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[1].array[2]).to.be.equal("Text2");
		expect(matcher.matches[1].offset).to.be.equal(11);
	});

	it("should work with no tag, no w:t", function () {
		var matcher = xmlMatcher("Text1", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("Text1");
		expect(matcher.matches[0].array[1]).to.be.equal("");
		expect(matcher.matches[0].array[2]).to.be.equal("Text1");
		expect(matcher.matches[0].offset).to.be.equal(0);
	});

	it("should not match with no </w:t> starter", function () {
		var matcher = xmlMatcher("TAG<w:t>Text1</w:t>", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("<w:t>Text1</w:t>");
		expect(matcher.matches[0].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[0].array[2]).to.be.equal("Text1");
		expect(matcher.matches[0].offset).to.be.equal(3);
	});

	it("should not match with no <w:t> ender", function () {
		var matcher = xmlMatcher("<w:t>Text1</w:t>TAG", ["w:t"]);
		expect(matcher.matches.length).to.be.equal(1);
	});
});