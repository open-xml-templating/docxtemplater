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

let doc;

function expectations(iModule, fixture) {
	cleanRecursive(iModule.inspect);
	if (fixture.error) {
		throw new Error("Fixture should have failed but did not fail");
	}
	if (fixture.resultText != null) {
		let { content } = iModule.inspect;
		if (iModule.inspect.content instanceof Uint8Array) {
			content = utf8decode(content);
		}
		content = content
			.replace(/^<w:t( xml:space="preserve")?>/, "")
			.replace(/<\/w:t>$/, "")
			.replace(/<w:t\/>$/, "");
		expect(content).to.be.deep.equal(
			fixture.resultText,
			"Content incorrect"
		);
	} else if (fixture.result !== null) {
		let { content } = iModule.inspect;
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
	if (fixture.assertAfter) {
		fixture.assertAfter();
	}
}

function getDoc() {
	return doc;
}

function runTest(fixture, async = false) {
	fixture.options ||= {};
	const modules = [];
	const iModule = inspectModule();
	modules.push(iModule, new AssertionModule());
	if (fixture.assertBefore) {
		fixture.assertBefore();
	}
	if (fixture.options.modules) {
		for (const mod of fixture.options.modules()) {
			modules.push(mod);
		}
	}
	const capture = captureLogs();
	if (fixture.contentText) {
		fixture.content = `<w:t>${fixture.contentText}</w:t>`;
	}
	if (fixture.contentParagraph) {
		fixture.content = `<w:p><w:r><w:t>${fixture.contentParagraph}</w:t></w:r></w:p>`;
	}
	try {
		doc = fixture.pptx
			? makePptxV4(fixture.content, {
					...fixture.options,
					modules,
				})
			: makeDocxV4(fixture.content, {
					...fixture.options,
					modules,
				});
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
			doc.render(fixture.scope);
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
			() => {
				capture2.stop();
				expectations(iModule, fixture);
				if (fixture.resolved) {
					expect(iModule.inspect.resolved).to.be.deep.equal(
						fixture.resolved,
						"Resolved incorrect"
					);
				}
			},
			(error) => {
				capture2.stop();
				if (!fixture.error) {
					throw error;
				}
				errorVerifier(error, fixture.errorType, fixture.error);
			}
		);
	}
}

describe("Algorithm", () => {
	for (let fixture of fixtures) {
		if (typeof fixture === "function") {
			fixture = fixture({ getDoc });
		}

		(fixture.onlySync ? it.only : it)(fixture.it, () =>
			runTest(fixture, false)
		);
		(fixture.only ? it.only : it)(`Async ${fixture.it}`, () =>
			// Return is important to make the test fail if there is an async error
			runTest(fixture, true)
		);
	}
});
