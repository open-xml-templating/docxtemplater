const Lexer = require("../lexer.js");
const {
	expect,
	makeDocx,
	cleanRecursive,
	errorVerifier,
} = require("./utils.js");
const fixtures = require("./fixtures.js");
const docxconfig = require("../file-type-config.js").docx();
const inspectModule = require("../inspect-module.js");
const AssertionModule = require("./assertion-module.js");
const tagsDocxConfig = {
	text: docxconfig.tagsXmlTextArray,
	other: docxconfig.tagsXmlLexedArray,
};

function expectations(iModule, fixture) {
	cleanRecursive(iModule.inspect);
	if (fixture.error) {
		throw new Error("Fixture should have failed but did not fail");
	}
	if (fixture.result !== null) {
		expect(iModule.inspect.content).to.be.deep.equal(
			fixture.result,
			"Content incorrect"
		);
	}
	if (fixture.lexed !== null) {
		expect(iModule.inspect.lexed).to.be.deep.equal(
			fixture.lexed,
			"Lexed incorrect"
		);
	}
	if (fixture.parsed !== null) {
		expect(iModule.inspect.parsed).to.be.deep.equal(
			fixture.parsed,
			"Parsed incorrect"
		);
	}
	if (fixture.postparsed !== null) {
		expect(iModule.inspect.postparsed).to.be.deep.equal(
			fixture.postparsed,
			"Postparsed incorrect"
		);
	}
	if (fixture.xmllexed != null) {
		expect(iModule.inspect.xmllexed).to.be.deep.equal(
			fixture.xmllexed,
			"Xmllexed incorrect"
		);
	}
}

describe("Algorithm", function () {
	Object.keys(fixtures).forEach(function (key) {
		const fixture = fixtures[key];
		(fixture.onlySync ? it.only : it)(fixture.it, function () {
			const doc = makeDocx(key, fixture.content);
			doc.setOptions(fixture.options);
			const iModule = inspectModule();
			doc.attachModule(iModule).attachModule(new AssertionModule());
			doc.setData(fixture.scope);
			try {
				doc.compile();
			} catch (error) {
				errorVerifier(error, fixture.errorType, fixture.error);
				return;
			}
			try {
				doc.render();
			} catch (error) {
				errorVerifier(error, fixture.errorType, fixture.error);
			}
			expectations(iModule, fixture);
		});
	});

	Object.keys(fixtures).forEach(function (key) {
		const fixture = fixtures[key];
		(fixture.only ? it.only : it)(`Async ${fixture.it}`, function () {
			const doc = makeDocx(key, fixture.content);
			doc.setOptions(fixture.options);
			const iModule = inspectModule();
			doc.attachModule(iModule);
			try {
				doc.compile();
			} catch (error) {
				errorVerifier(error, fixture.errorType, fixture.error);
				return;
			}
			return doc.resolveData(fixture.scope).then(function () {
				try {
					doc.render();
				} catch (error) {
					errorVerifier(error, fixture.errorType, fixture.error);
				}
				expectations(iModule, fixture);
				if (fixture.resolved) {
					expect(iModule.inspect.resolved).to.be.deep.equal(
						fixture.resolved,
						"Resolved incorrect"
					);
				}
			});
		});
	});

	it("should xmlparse strange tags", function () {
		const xmllexed = Lexer.xmlparse(
			fixtures.strangetags.content,
			tagsDocxConfig
		);
		cleanRecursive(xmllexed);
		expect(xmllexed).to.be.deep.equal(fixtures.strangetags.xmllexed);
	});

	it("should xmlparse selfclosing tag", function () {
		const xmllexed = Lexer.xmlparse("<w:rPr><w:noProof/></w:rPr>", {
			text: [],
			other: ["w:rPr", "w:noProof"],
		});
		expect(xmllexed).to.be.deep.equal([
			{
				type: "tag",
				position: "start",
				text: false,
				value: "<w:rPr>",
				tag: "w:rPr",
			},
			{
				type: "tag",
				position: "selfclosing",
				text: false,
				value: "<w:noProof/>",
				tag: "w:noProof",
			},
			{
				type: "tag",
				position: "end",
				text: false,
				value: "</w:rPr>",
				tag: "w:rPr",
			},
		]);
	});
});
