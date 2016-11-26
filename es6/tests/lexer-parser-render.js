const Lexer = require("../lexer.js");
const testUtils = require("./utils");
const expect = testUtils.expect;
const fixtures = require("./fixtures");
const FileTypeConfig = require("../file-type-config");
const docxconfig = FileTypeConfig.docx;
const InspectModule = require("./inspect-module.js");
const tagsDocxConfig = {
	text: docxconfig.tagsXmlTextArray,
	other: docxconfig.tagsXmlLexedArray,
};

describe("Algorithm", function () {
	Object.keys(fixtures).forEach(function (key) {
		const fixture = fixtures[key];
		it(fixture.it, function () {
			const doc = testUtils.makeDocx(key, fixture.content);
			doc.setOptions({delimiters: fixture.delimiters});
			const inspectModule = new InspectModule();
			doc.attachModule(inspectModule);
			doc.setData(fixture.scope);
			doc.render();
			expect(inspectModule.inspect.lexed).to.be.deep.equal(fixture.lexed, "Lexed incorrect");
			expect(inspectModule.inspect.parsed).to.be.deep.equal(fixture.parsed, "Parsed incorrect");
			if (fixture.postparsed) {
				expect(inspectModule.inspect.postparsed).to.be.deep.equal(fixture.postparsed, "Postparsed incorrect");
			}
			if (inspectModule.inspect.content) {
				expect(inspectModule.inspect.content).to.be.deep.equal(fixture.result, "Content incorrect");
			}
		});
	});
	it("should xmlparse strange tags", function () {
		const result = Lexer.xmlparse(fixtures.strangetags.content, tagsDocxConfig);
		expect(result).to.be.deep.equal(fixtures.strangetags.xmllexed);
	});
});
