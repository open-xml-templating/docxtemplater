const PizZip = require("pizzip");
const { uniq } = require("lodash");
const { expect } = require("chai");
const xmlPrettify = require("../xml-prettify.js");
const { writeFile, unlinkFile } = require("./file-system.js");
const { getText } = require("./utils.js");
const { unifiedDiff } = require("./logs.js");
const { documentCache } = require("./cache.js");

const emptyNamespace = /xmlns:[a-z0-9]+=""/;

function isZip(text) {
	const start = text.substr(0, 9);
	const zipSignature = "PK\u0003\u0004\n\u0000\u0000\u0000\u0000";
	return start === zipSignature;
}

function isBinaryFile(file1, file2) {
	return (
		file1.name.indexOf(".xml") === -1 &&
		file1.name.indexOf(".rels") === -1 &&
		(file1.options.binary || file2.options.binary)
	);
}

function zipCompare(zip, expectedZip, expectedName) {
	uniq(Object.keys(zip.files).concat(Object.keys(expectedZip.files))).map(
		function (filePath) {
			const suffix = `for "${filePath}"`;
			const file = zip.files[filePath];
			const expectedFile = expectedZip.files[filePath];
			expect(expectedFile).to.be.an(
				"object",
				`The file ${filePath} doesn't exist on examples/${expectedName}`
			);
			expect(file).to.be.an(
				"object",
				`The file ${filePath} doesn't exist on ${expectedName}`
			);
			expect(file.name).to.be.equal(
				expectedFile.name,
				`Name differs ${suffix}`
			);
			expect(file.options.dir).to.be.equal(
				expectedFile.options.dir,
				`IsDir differs ${suffix}`
			);

			if (file.options.dir) {
				return;
			}

			if (isBinaryFile(file, expectedFile)) {
				const actualHash = file._data.crc32;
				const expectedHash = expectedFile._data.crc32;

				const actualText = file.asBinary();
				if (isZip(actualText)) {
					const expectedText = expectedFile.asBinary();
					zipCompare(
						new PizZip(actualText),
						new PizZip(expectedText),
						expectedName
					);
				} else if (actualHash && expectedHash) {
					expect(actualHash).to.be.a("number");
					expect(actualHash).to.be.equal(
						expectedHash,
						"Content differs for " + suffix
					);
				} else {
					const expectedText = expectedFile.asBinary();
					expect(actualText).to.equal(
						expectedText,
						`Binary file ${filePath} differs`
					);
				}

				return;
			}
			const actualText = getText(file);
			const expectedText = getText(expectedFile);
			expect(actualText).to.not.match(
				emptyNamespace,
				`The file ${filePath} has empty namespaces`
			);
			expect(expectedText).to.not.match(
				emptyNamespace,
				`The file ${filePath} has empty namespaces`
			);
			if (actualText === expectedText) {
				return;
			}
			const prettyActualText = xmlPrettify(actualText);
			const prettyExpectedText = xmlPrettify(expectedText);

			if (prettyActualText !== prettyExpectedText) {
				const prettyDiff = unifiedDiff(prettyActualText, prettyExpectedText);
				expect(prettyActualText).to.be.equal(
					prettyExpectedText,
					"Content differs \n" + suffix + "\n" + prettyDiff
				);
			}
		}
	);
}

/* eslint-disable no-console */
function shouldBeSame({ doc, expectedName }) {
	const zip = doc.getZip();
	const cached = documentCache[expectedName];
	if (!cached) {
		writeFile(expectedName, zip);
		console.log(
			JSON.stringify({ msg: "Expected file does not exists", expectedName })
		);
		throw new Error(
			`File ${expectedName} does not exist in examples directory`
		);
	}
	const expectedZip = cached.zip;

	try {
		zipCompare(zip, expectedZip, expectedName);
	} catch (e) {
		writeFile(expectedName, zip);
		console.log(
			JSON.stringify({
				msg: "Expected file differs from actual file",
				expectedName,
			})
		);
		throw e;
	}
	unlinkFile(expectedName);
}
/* eslint-enable no-console */

module.exports = {
	shouldBeSame,
};
