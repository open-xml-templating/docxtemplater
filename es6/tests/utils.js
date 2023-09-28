if (typeof process === "undefined") {
	global.process = {};
}
const path = require("path");
const chai = require("chai");
const { expect } = chai;
const Errors = require("../errors.js");
const PizZip = require("pizzip");
const fs = require("fs");
const { get, unset, omit, uniq, cloneDeep } = require("lodash");
const errorLogger = require("../error-logger.js");
const diff = require("diff");
const AssertionModule = require("./assertion-module.js");

const Docxtemplater = require("../docxtemplater.js");
const { first } = require("../utils.js");
const xmlPrettify = require("./xml-prettify.js");
let countFiles = 1;
let allStarted = false;
let examplesDirectory;
let snapshotFile;
const documentCache = {};
const imageData = {};
const emptyNamespace = /xmlns:[a-z0-9]+=""/;

function unifiedDiff(actual, expected) {
	const indent = "      ";
	function cleanUp(line) {
		const firstChar = first(line);
		if (firstChar === "+") {
			return indent + line;
		}
		if (firstChar === "-") {
			return indent + line;
		}
		if (line.match(/@@/)) {
			return "--";
		}
		if (line.match(/\\ No newline/)) {
			return null;
		}
		return indent + line;
	}
	function notBlank(line) {
		return typeof line !== "undefined" && line !== null;
	}
	const msg = diff.createPatch("string", actual, expected);
	const lines = msg.split("\n").splice(5);
	return (
		"\n      " +
		"+ expected" +
		" " +
		"- actual" +
		"\n\n" +
		lines.map(cleanUp).filter(notBlank).join("\n")
	);
}

function walk(dir) {
	const results = [];
	const list = fs.readdirSync(dir);
	list.forEach(function (file) {
		if (file.indexOf(".") === 0) {
			return;
		}
		file = dir + "/" + file;
		const stat = fs.statSync(file);
		if (stat && stat.isDirectory()) {
			Array.prototype.push.apply(results, walk(file));
		} else {
			results.push(file);
		}
	});
	return results;
}

function createXmlTemplaterDocxNoRender(content, options = {}) {
	const doc = makeDocx(content);
	doc.setOptions(options);
	doc.setData(options.tags);
	return doc;
}

function createXmlTemplaterDocx(content, options = {}) {
	const doc = makeDocx(content, options);
	doc.setOptions(options);
	doc.setData(options.tags);
	doc.render();
	return doc;
}

function writeFile(expectedName, zip) {
	if (path.resolve) {
		if (fs.writeFileSync) {
			const writeFile =
				// eslint-disable-next-line no-process-env
				process.env.UPDATE === "true"
					? path.resolve(examplesDirectory, expectedName)
					: path.resolve(examplesDirectory, "..", expectedName);
			fs.writeFileSync(
				writeFile,
				zip.generate({ type: "nodebuffer", compression: "DEFLATE" })
			);
		}
		if (typeof window !== "undefined" && window.saveAs) {
			const out = zip.generate({
				type: "blob",
				mimeType:
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				compression: "DEFLATE",
			});
			saveAs(out, expectedName); // comment to see the error
		}
	}
}
function unlinkFile(expectedName) {
	if (path.resolve) {
		const writeFile = path.resolve(examplesDirectory, "..", expectedName);
		try {
			fs.unlinkSync(writeFile);
		} catch (e) {
			if (e.code !== "ENOENT") {
				throw e;
			}
		}
	}
}
function getText(file) {
	return file.asText().replace(/\n|\t/g, "");
}

function isBinaryFile(file1, file2) {
	return (
		file1.name.indexOf(".xml") === -1 &&
		file1.name.indexOf(".rels") === -1 &&
		(file1.options.binary || file2.options.binary)
	);
}

function isZip(text) {
	const start = text.substr(0, 9);
	const zipSignature = "PK\u0003\u0004\n\u0000\u0000\u0000\u0000";
	return start === zipSignature;
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

	if (!documentCache[expectedName]) {
		writeFile(expectedName, zip);
		console.log(
			JSON.stringify({ msg: "Expected file does not exists", expectedName })
		);
		throw new Error(
			`File ${expectedName} does not exist in examples directory`
		);
	}
	const expectedZip = documentCache[expectedName].zip;

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

function checkLength(e, expectedError, propertyPath) {
	const propertyPathLength = propertyPath + "Length";
	const property = get(e, propertyPath);
	const expectedPropertyLength = get(expectedError, propertyPathLength);
	if (property && expectedPropertyLength) {
		expect(expectedPropertyLength).to.be.a(
			"number",
			JSON.stringify(expectedError.properties)
		);
		expect(expectedPropertyLength).to.equal(property.length);
		unset(e, propertyPath);
		unset(expectedError, propertyPathLength);
	}
}

function cleanRecursive(arr) {
	if (arr.lexed) {
		cleanRecursive(arr.lexed);
		cleanRecursive(arr.parsed);
		cleanRecursive(arr.postparsed);
		return;
	}
	arr.forEach(function (p) {
		delete p.lIndex;
		delete p.endLindex;
		delete p.offset;
		delete p.raw;
		if (p.lastParagrapSectPr === "") {
			delete p.lastParagrapSectPr;
		}
		if (p.subparsed) {
			cleanRecursive(p.subparsed);
		}
		if (p.value && p.value.forEach) {
			p.value.forEach(cleanRecursive);
		}
		if (p.expanded) {
			p.expanded.forEach(cleanRecursive);
		}
	});
}

// eslint-disable-next-line complexity
function cleanError(e, expectedError) {
	const message = e.message;
	e = omit(e, ["line", "sourceURL", "stack"]);
	e.message = message;
	if (expectedError.properties && e.properties) {
		if (!e.properties.explanation) {
			throw new Error("No explanation for this error");
		}
		if (expectedError.properties.explanation != null) {
			const e1 = e.properties.explanation;
			const e2 = expectedError.properties.explanation;
			expect(e1).to.be.deep.equal(
				e2,
				`Explanations differ '${e1}' != '${e2}': for ${JSON.stringify(
					expectedError
				)}`
			);
		}
		delete e.properties.explanation;
		delete expectedError.properties.explanation;
		if (e.properties.postparsed) {
			e.properties.postparsed.forEach(function (p) {
				delete p.lIndex;
				delete p.endLindex;
				delete p.offset;
			});
		}
		if (e.properties.rootError) {
			expect(
				e.properties.rootError,
				JSON.stringify(e.properties)
			).to.be.instanceOf(Error, "rootError doesn't have correct type");
			expect(
				expectedError.properties.rootError,
				JSON.stringify(expectedError.properties)
			).to.be.instanceOf(Object, "expectedError doesn't have a rootError");
			if (expectedError) {
				expect(e.properties.rootError.message).to.equal(
					expectedError.properties.rootError.message,
					"rootError.message"
				);
			}
			delete e.properties.rootError;
			delete expectedError.properties.rootError;
		}
		if (expectedError.properties.offset != null) {
			const o1 = e.properties.offset;
			const o2 = expectedError.properties.offset;
			// offset can be arrays, so deep compare
			expect(o1).to.be.deep.equal(
				o2,
				`Offset differ ${o1} != ${o2}: for ${JSON.stringify(expectedError)}`
			);
		}
		delete expectedError.properties.offset;
		delete e.properties.offset;
		checkLength(e, expectedError, "properties.paragraphParts");
		checkLength(e, expectedError, "properties.postparsed");
		checkLength(e, expectedError, "properties.parsed");
	}
	if (e.stack && expectedError) {
		expect(e.stack).to.contain("Error: " + expectedError.message);
	}
	delete e.stack;
	return e;
}

function wrapMultiError(error) {
	const type = Object.prototype.toString.call(error);
	let errors;
	if (type === "[object Array]") {
		errors = error;
	} else {
		errors = [error];
	}

	return {
		name: "TemplateError",
		message: "Multi error",
		properties: {
			id: "multi_error",
			errors,
		},
	};
}

function jsonifyError(e) {
	return JSON.parse(
		JSON.stringify(e, function (key, value) {
			if (value instanceof Promise) {
				return {};
			}
			return value;
		})
	);
}

function errorVerifier(e, type, expectedError) {
	e = cloneDeep(e);
	expectedError = cloneDeep(expectedError);
	expect(e, "No error has been thrown").not.to.be.equal(null);
	const toShowOnFail = e.stack;
	expect(e, toShowOnFail).to.be.instanceOf(
		Error,
		"error is not a Javascript error"
	);
	expect(e, toShowOnFail).to.be.instanceOf(
		type,
		"error doesn't have the correct type"
	);
	expect(e, toShowOnFail).to.be.an("object");
	expect(e, toShowOnFail).to.have.property("properties");
	expect(e.properties, toShowOnFail).to.be.an("object");
	if (type.name && type.name !== "XTInternalError") {
		expect(e.properties, toShowOnFail).to.have.property("explanation");
		expect(e.properties.explanation, toShowOnFail).to.be.a("string");
		expect(e.properties.explanation, toShowOnFail).to.be.a("string");
	}
	if (e.properties.id) {
		expect(e.properties.id, toShowOnFail).to.be.a("string");
	}
	e = cleanError(e, expectedError);
	if (e.properties.errors) {
		const msg =
			"expected : \n" +
			JSON.stringify(expectedError.properties.errors) +
			"\nactual : \n" +
			JSON.stringify(e.properties.errors);
		expect(expectedError.properties.errors).to.be.an("array", msg);

		const l1 = e.properties.errors.length;
		const l2 = expectedError.properties.errors.length;
		expect(l1).to.equal(
			l2,
			`Expected to have the same amount of e.properties.errors ${l1} !== ${l2} ` +
				msg
		);
		e.properties.errors = e.properties.errors.map(function (suberror, i) {
			const cleaned = cleanError(suberror, expectedError.properties.errors[i]);
			const jsonified = jsonifyError(cleaned);
			return jsonified;
		});
	}

	const realError = jsonifyError(e);
	expect(realError).to.be.deep.equal(expectedError);
}

function expectToThrow(fn, type, expectedError) {
	let err = null;
	const capture = captureLogs();
	try {
		fn();
	} catch (e) {
		err = e;
	}
	capture.stop();
	if (!type) {
		expect(err).to.satisfy(function (err) {
			return !!err;
		});
		return;
	}
	errorVerifier(err, type, expectedError);
	return capture;
}

function expectToThrowAsync(fn, type, expectedError) {
	const capture = captureLogs();
	return Promise.resolve(null)
		.then(function () {
			const r = fn();
			return r.then(function () {
				capture.stop();
				return null;
			});
		})
		.catch(function (error) {
			capture.stop();
			return error;
		})
		.then(function (err) {
			if (!type) {
				expect(err).to.satisfy(function (err) {
					return !!err;
				});
				return;
			}
			errorVerifier(err, type, expectedError);
			return capture;
		});
}

function expectToThrowSnapshot(fn, update) {
	let err = null;
	const capture = captureLogs();
	try {
		fn();
	} catch (e) {
		err = e;
	}
	capture.stop();
	expect(errToObject(err)).to.matchSnapshot(update);
	return capture;
}

function expectToThrowAsyncSnapshot(fn, update) {
	const capture = captureLogs();
	return Promise.resolve(null)
		.then(function () {
			const r = fn();
			return r.then(function () {
				capture.stop();
				return null;
			});
		})
		.catch(function (error) {
			capture.stop();
			return error;
		})
		.then(function (err) {
			expect(err).to.matchSnapshot(update);
			return capture;
		});
}

function errToObject(err) {
	const obj = {};
	if (err instanceof Errors.XTTemplateError) {
		obj._type = "XTTemplateError";
	} else if (err instanceof Errors.XTAPIVersionError) {
		obj._type = "XTAPIVersionError";
	} else if (err instanceof Errors.XTRenderingError) {
		obj._type = "XTRenderingError";
	} else if (err instanceof Errors.XTScopeParserError) {
		obj._type = "XTScopeParserError";
	} else if (err instanceof Errors.XTInternalError) {
		obj._type = "XTInternalError";
	} else if (err instanceof Errors.XTAPIVersionError) {
		obj._type = "XTAPIVersionError";
	}

	if (err.name) {
		obj.name = err.name;
	}
	if (err.message) {
		obj.message = err.message;
	}
	if (err.properties) {
		obj.properties = {};
		Object.keys(err.properties).forEach(function (key) {
			const value = err.properties[key];
			if (value instanceof Error) {
				obj.properties[key] = errToObject(value);
				return;
			}
			if (value instanceof Array) {
				obj.properties[key] = value.map(function (value) {
					if (value instanceof Error) {
						return errToObject(value);
					}
					return value;
				});
				return;
			}
			obj.properties[key] = value;
		});
	}
	return obj;
}

function load(name, content, cache) {
	const zip = new PizZip(content);
	const doc = new Docxtemplater();
	doc.attachModule(new AssertionModule());
	doc.loadZip(zip);
	doc.loadedName = name;
	doc.loadedContent = content;
	cache[name] = doc;
	return doc;
}
function loadDocument(name, content) {
	return load(name, content, documentCache);
}

function cacheDocument(name, content) {
	const zip = new PizZip(content);
	documentCache[name] = { loadedName: name, loadedContent: content, zip };
	return documentCache[name];
}
function loadImage(name, content) {
	imageData[name] = content;
}

function loadFile(name, callback) {
	if (fs.readFileSync) {
		const path = require("path");
		const buffer = fs.readFileSync(
			path.join(examplesDirectory, name),
			"binary"
		);
		return callback(null, name, buffer);
	}
	return PizZipUtils.getBinaryContent(
		"../examples/" + name,
		function (err, data) {
			if (err) {
				return callback(err);
			}
			return callback(null, name, data);
		}
	);
}

function unhandledRejectionHandler(reason) {
	throw reason;
}

let startFunction;
function setStartFunction(sf, snapshots = {}) {
	allStarted = false;
	countFiles = 1;
	startFunction = sf;

	const runnedSnapshots = {};
	let fullTestName = "";
	function matchSnapshot() {
		let ftn = fullTestName;
		let i = 0;
		while (runnedSnapshots[ftn]) {
			i++;
			ftn = fullTestName + "-" + i;
		}
		runnedSnapshots[ftn] = true;
		const obj = this.__flags.object;
		if (!snapshots[ftn]) {
			snapshots[ftn] = obj;
			return;
		}

		try {
			expect(obj).to.deep.equal(snapshots[ftn]);
		} catch (e) {
			if (
				typeof process !== "undefined" &&
				// eslint-disable-next-line no-process-env
				process.env &&
				// eslint-disable-next-line no-process-env
				process.env.WRITE_SNAPSHOTS === "true"
			) {
				snapshots[ftn] = obj;
				return;
			}
			throw e;
		}
	}
	beforeEach(function () {
		function getParentsTitle(a) {
			if (a.parent) {
				return `${a.parent.title} ${getParentsTitle(a.parent)}`;
			}
			return "";
		}
		fullTestName = getParentsTitle(this.currentTest) + this.currentTest.title;
	});
	after(function () {
		if (
			typeof process !== "undefined" &&
			// eslint-disable-next-line no-process-env
			process.env &&
			// eslint-disable-next-line no-process-env
			process.env.WRITE_SNAPSHOTS === "true"
		) {
			const sortedKeys = Object.keys(snapshots).sort();
			const output =
				sortedKeys
					.map(function (key) {
						const snap = snapshots[key];
						return "exports[`" + key + "`] = " + JSON.stringify(snap, null, 2);
					})
					.join("\n\n") + "\n\n";
			fs.writeFileSync(snapshotFile, output);
		}
	});
	chai.use(function () {
		chai.Assertion.addMethod("matchSnapshot", matchSnapshot);
	});

	if (typeof window !== "undefined" && window.addEventListener) {
		window.addEventListener("unhandledrejection", unhandledRejectionHandler);
	} else {
		process.on("unhandledRejection", unhandledRejectionHandler);
	}
}

function endLoadFile(change) {
	change = change || 0;
	countFiles += change;
	if (countFiles === 0 && allStarted === true) {
		const result = startFunction();
		if (typeof window !== "undefined") {
			return window.mocha.run(() => {
				const elemDiv = window.document.getElementById("status");
				elemDiv.textContent = "FINISHED";
				document.body.appendChild(elemDiv);
			});
		}
		return result;
	}
}

function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
function endsWithOne(str, suffixes) {
	return suffixes.some(function (suffix) {
		return endsWith(str, suffix);
	});
}
function startsWith(str, prefix) {
	return str.indexOf(prefix) === 0;
}

/* eslint-disable no-console */
function start() {
	afterEach(function () {
		if (
			this.currentTest.state === "failed" &&
			this.currentTest.err.properties
		) {
			errorLogger(this.currentTest.err, "jsonl");
		}
	});
	let fileNames;
	if (typeof global !== "undefined" && global.fileNames) {
		fileNames = global.fileNames;
	} else {
		fileNames = require("./filenames.js");
	}
	/* eslint-disable import/no-unresolved */
	/* eslint-enable import/no-unresolved */
	fileNames.forEach(function (fullFileName) {
		const fileName = fullFileName.replace(examplesDirectory + "/", "");
		let callback;
		if (startsWith(fileName, ".") || startsWith(fileName, "~")) {
			return;
		}
		if (
			endsWithOne(fileName, [
				".docm",
				".docx",
				".dotm",
				".dotx",
				".potm",
				".potx",
				".pptm",
				".pptx",
				".xlsm",
				".xlsx",
				".xltm",
				".xltx",
			])
		) {
			callback = cacheDocument;
		}
		if (!callback) {
			callback = loadImage;
		}
		countFiles++;
		loadFile(fileName, (e, name, buffer) => {
			if (e) {
				console.log(e);
				throw e;
			}
			endLoadFile(-1);
			callback(name, buffer);
		});
	});
	allStarted = true;
	endLoadFile(-1);
}
/* eslint-disable no-console */

function setExamplesDirectory(ed) {
	examplesDirectory = ed;
	if (fs && fs.writeFileSync) {
		const fileNames = walk(examplesDirectory).map(function (f) {
			return f.replace(examplesDirectory + "/", "");
		});
		fs.writeFileSync(
			path.resolve(__dirname, "filenames.js"),
			"module.exports=" + JSON.stringify(fileNames)
		);
		global.fileNames = fileNames;
	}
}

function setSnapshotFile(file) {
	snapshotFile = file;
}

function removeSpaces(text) {
	return text.replace(/\n|\t/g, "");
}

const docxContentTypeContent = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const docxRelsContent = `<?xml version="1.0" encoding="utf-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" Target="docProps/custom.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
`;

const pptxRelsContent = `<?xml version="1.0" encoding="utf-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>
`;

function makeDocx(content) {
	const zip = new PizZip();
	zip.file("word/document.xml", content, { createFolders: true });
	zip.file("[Content_Types].xml", docxContentTypeContent);
	zip.file("_rels/.rels", docxRelsContent);
	const doc = new Docxtemplater();
	doc.loadZip(zip);
	return doc;
}
function makeDocxV4(content, options = {}) {
	const zip = new PizZip();
	zip.file("word/document.xml", content, { createFolders: true });
	zip.file("[Content_Types].xml", docxContentTypeContent);
	zip.file("_rels/.rels", docxRelsContent);
	return new Docxtemplater(zip, options);
}

const pptxContentTypeContent = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`;

function makePptx(name, content) {
	const zip = new PizZip();
	zip.file("ppt/slides/slide1.xml", content, { createFolders: true });
	zip.file("[Content_Types].xml", pptxContentTypeContent);
	zip.file("_rels/.rels", pptxRelsContent);
	return load(name, zip.generate({ type: "string" }), documentCache);
}

function makePptxV4(content, options = {}) {
	const zip = new PizZip();
	zip.file("ppt/slides/slide1.xml", content, { createFolders: true });
	zip.file("[Content_Types].xml", pptxContentTypeContent);
	zip.file("_rels/.rels", pptxRelsContent);
	return new Docxtemplater(zip, options);
}

function createDoc(name, options = {}) {
	const doc = loadDocument(name, documentCache[name].loadedContent);
	doc.attachModule(new AssertionModule());
	doc.setOptions(options);
	return doc;
}

function createDocV4(name, options) {
	const zip = getZip(name);
	options = options || {};
	if (!options.modules || options.modules instanceof Array) {
		options.modules = options.modules || [];
		options.modules.push(new AssertionModule());
	}
	return new Docxtemplater(zip, options);
}

function getZip(name) {
	return new PizZip(documentCache[name].loadedContent);
}

function getLoadedContent(name) {
	return documentCache[name].loadedContent;
}

function getContent(doc) {
	return doc.getZip().files["word/document.xml"].asText();
}

function resolveSoon(data, time = 1) {
	return new Promise(function (resolve) {
		setTimeout(function () {
			resolve(data);
		}, time);
	});
}

function rejectSoon(data, time = 1) {
	return new Promise(function (resolve, reject) {
		setTimeout(function () {
			reject(data);
		}, time);
	});
}

function getParameterByName(name) {
	if (typeof window === "undefined") {
		return null;
	}
	const url = window.location.href;
	name = name.replace(/[[\]]/g, "\\$&");
	const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) {
		return null;
	}
	if (!results[2]) {
		return "";
	}
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function browserMatches(regex) {
	const currentBrowser = getParameterByName("browser");
	if (currentBrowser === null) {
		return false;
	}
	return regex.test(currentBrowser);
}

function getLength(obj) {
	if (obj instanceof ArrayBuffer) {
		return obj.byteLength;
	}
	return obj.length;
}

function captureLogs() {
	const oldLog = console.log;
	const collected = [];
	console.log = function (a) {
		// oldLog(a);
		collected.push(a);
	};
	return {
		logs() {
			return collected;
		},
		stop() {
			console.log = oldLog;
		},
	};
}

module.exports = {
	chai,
	cleanError,
	cleanRecursive,
	createDoc,
	getLoadedContent,
	createXmlTemplaterDocx,
	createXmlTemplaterDocxNoRender,
	expect,
	expectToThrow,
	expectToThrowSnapshot,
	expectToThrowAsync,
	expectToThrowAsyncSnapshot,
	getContent,
	imageData,
	loadDocument,
	loadFile,
	loadImage,
	makeDocx,
	makeDocxV4,
	makePptx,
	makePptxV4,
	removeSpaces,
	setExamplesDirectory,
	setSnapshotFile,
	setStartFunction,
	shouldBeSame,
	resolveSoon,
	rejectSoon,
	start,
	wrapMultiError,
	createDocV4,
	getZip,
	getParameterByName,
	browserMatches,
	errorVerifier,
	getLength,
	captureLogs,
};
