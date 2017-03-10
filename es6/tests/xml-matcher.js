const xmlMatcher = require("../xml-matcher.js");
const testUtils = require("./utils");
const expect = testUtils.expect;

describe("xmlMatcher", function () {
	it("should work with simple tag", function () {
		const matcher = xmlMatcher("<w:t>Text</w:t>", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("<w:t>Text</w:t>");
		expect(matcher.matches[0].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[0].array[2]).to.be.equal("Text");
		expect(matcher.matches[0].offset).to.be.equal(0);
	});

	it("should work with multiple tags", function () {
		const matcher = xmlMatcher("<w:t>Text</w:t> TAG <w:t>Text2</w:t>", ["w:t"]);
		expect(matcher.matches[1].array[0]).to.be.equal("<w:t>Text2</w:t>");
		expect(matcher.matches[1].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[1].array[2]).to.be.equal("Text2");
		expect(matcher.matches[1].offset).to.be.equal(20);
	});

	it("should work with no tag, with w:t", function () {
		const matcher = xmlMatcher("Text1</w:t><w:t>Text2", ["w:t"]);
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
		const matcher = xmlMatcher("Text1", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("Text1");
		expect(matcher.matches[0].array[1]).to.be.equal("");
		expect(matcher.matches[0].array[2]).to.be.equal("Text1");
		expect(matcher.matches[0].offset).to.be.equal(0);
	});

	it("should not match with no </w:t> starter", function () {
		const matcher = xmlMatcher("TAG<w:t>Text1</w:t>", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("<w:t>Text1</w:t>");
		expect(matcher.matches[0].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[0].array[2]).to.be.equal("Text1");
		expect(matcher.matches[0].offset).to.be.equal(3);
	});

	it("should not match with no <w:t> ender", function () {
		const matcher = xmlMatcher("<w:t>Text1</w:t>TAG", ["w:t"]);
		expect(matcher.matches.length).to.be.equal(1);
	});
});

