const {
	expect,
	makeDocxV4,
	makePptxV4,
	cleanRecursive,
	errorVerifier,
	captureLogs,
} = require("../utils.js");

const fixtures = require("./fixtures.js");
const inspectModule = require("../../inspect-module.js");
const AssertionModule = require("../assertion-module.js");
const utf8decode = require("../../uintarray-to-string.js");

function expectations(iModule, fixture) {
	cleanRecursive(iModule.inspect);
	if (fixture.error) {
		throw new Error("Fixture should have failed but did not fail");
	}
	if (fixture.result !== null) {
		let content = iModule.inspect.content;
		if (iModule.inspect.content instanceof Uint8Array) {
			content = utf8decode(content);
		}
		expect(content).to.be.deep.equal(fixture.result, "Content incorrect");
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
	fixture.options = fixture.options || {};
	const modules = [];
	const iModule = inspectModule();
	modules.push(iModule, new AssertionModule());
	if (fixture.options.modules) {
		fixture.options.modules().forEach(function (mod) {
			modules.push(mod);
		});
	}
	let doc;
	const capture = captureLogs();
	try {
		doc = fixture.pptx
			? makePptxV4("temp.docx", fixture.content, {
					...fixture.options,
					modules,
			  })
			: makeDocxV4("temp.docx", fixture.content, {
					...fixture.options,
					modules,
			  });
		doc.setData(fixture.scope);
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
			if (!fixture.error) {
				throw error;
			}
			errorVerifier(error, fixture.errorType, fixture.error);
			return;
		}
		capture2.stop();
		expectations(iModule, fixture);
	} else {
		return doc.renderAsync(fixture.scope).then(
			function () {
				capture2.stop();
				expectations(iModule, fixture);
				if (fixture.resolved) {
					expect(iModule.inspect.resolved).to.be.deep.equal(
						fixture.resolved,
						"Resolved incorrect"
					);
				}
			},
			function (error) {
				capture2.stop();
				if (!fixture.error) {
					throw error;
				}
				errorVerifier(error, fixture.errorType, fixture.error);
			}
		);
	}
}

describe("Algorithm", function () {
	fixtures.forEach(function (fixture) {
		(fixture.onlySync ? it.only : it)(fixture.it, function () {
			return runTest(fixture, false);
		});
		(fixture.only ? it.only : it)(`Async ${fixture.it}`, function () {
			// Return is important to make the test fail if there is an async error
			return runTest(fixture, true);
		});
	});
});
