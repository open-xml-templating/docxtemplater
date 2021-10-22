const {
	expect,
	makeDocx,
	makePptx,
	cleanRecursive,
	errorVerifier,
	captureLogs,
} = require("./utils.js");

const fixtures = require("./fixtures.js");
const inspectModule = require("../inspect-module.js");
const AssertionModule = require("./assertion-module.js");

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

function runTest(fixture, async = false) {
	const doc = fixture.pptx
		? makePptx("temp.docx", fixture.content)
		: makeDocx("temp.docx", fixture.content);
	doc.setOptions(fixture.options);
	const iModule = inspectModule();
	doc.attachModule(iModule).attachModule(new AssertionModule());
	doc.setData(fixture.scope);

	const capture = captureLogs();
	try {
		doc.compile();
		capture.stop();
	} catch (error) {
		capture.stop();
		if (!fixture.error) {
			throw error;
		}
		errorVerifier(error, fixture.errorType, fixture.error);
		return;
	}
	const capture2 = captureLogs();
	if (async === false) {
		try {
			doc.render();
			capture2.stop();
		} catch (error) {
			capture2.stop();
			errorVerifier(error, fixture.errorType, fixture.error);
		}
		capture2.stop();
		expectations(iModule, fixture);
	} else {
		return doc.resolveData(fixture.scope).then(function () {
			try {
				doc.render();
				capture2.stop();
			} catch (error) {
				capture2.stop();
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
	}
}

describe("Algorithm", function () {
	fixtures.forEach(function (fixture) {
		(fixture.onlySync ? it.only : it)(fixture.it, function () {
			runTest(fixture, false);
		});
		(fixture.only ? it.only : it)(`Async ${fixture.it}`, function () {
			runTest(fixture, true);
		});
	});
});
