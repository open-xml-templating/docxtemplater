const path = require("path");
const chai = require("chai");
const { expect } = chai;
const JSZip = require("jszip");
const fs = require("fs");
const { get, unset, omit, uniq } = require("lodash");

const Docxtemplater = require("../docxtemplater.js");
const xmlPrettify = require("./xml-prettify");
let countFiles = 1;
let allStarted = false;
let examplesDirectory;
const docX = {};
const imageData = {};
const emptyNamespace = /xmlns:[a-z0-9]+=""/;

function walk(dir) {
	let results = [];
	const list = fs.readdirSync(dir);
	list.forEach(function(file) {
		if (file.indexOf(".") === 0) {
			return;
		}
		file = dir + "/" + file;
		const stat = fs.statSync(file);
		if (stat && stat.isDirectory()) {
			results = results.concat(walk(file));
		} else {
			results.push(file);
		}
	});
	return results;
}

function createXmlTemplaterDocxNoRender(content, options = {}) {
	return makeDocx("temporary.docx", content).then(doc => {
		doc.setOptions(options);
		doc.setData(options.tags);
		return doc;
	});
}

function createXmlTemplaterDocx(content, options = {}) {
	return makeDocx("temporary.docx", content).then(doc => {
		doc.setOptions(options);
		doc.setData(options.tags);
		return doc.render().then(() => {
			return doc;
		});
	});
}

function writeFile(expectedName, zip) {
	return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }).then(generatedZip => {
		const writeFile = path.resolve(examplesDirectory, "..", expectedName);
		if (fs.writeFileSync) {
			fs.writeFileSync(
				writeFile,
				generatedZip
			);
		}
	});
}
function unlinkFile(expectedName) {
	const writeFile = path.resolve(examplesDirectory, "..", expectedName);
	if (fs.unlinkSync) {
		try {
			fs.unlinkSync(writeFile);
		} catch (e) {
			if (e.code !== "ENOENT") {
				throw e;
			}
		}
	}
}

/* eslint-disable no-console */
function shouldBeSame(options) {
	const zip = options.doc.getZip();
	const { expectedName } = options;
	let expectedZip;

	try {
		expectedZip = docX[expectedName].zip;
	} catch (e) {
		writeFile(expectedName, zip);
		console.log(
			JSON.stringify({ msg: "Expected file does not exists", expectedName })
		);
		throw e;
	}

	try {
		const result = uniq(Object.keys(zip.files).concat(Object.keys(expectedZip.files))).map(
			function(filePath) {
				const suffix = `for "${filePath}"`;
				expect(expectedZip.files[filePath]).to.be.an(
					"object",
					`The file ${filePath} doesn't exist on ${expectedName}`
				);
				expect(zip.files[filePath]).to.be.an(
					"object",
					`The file ${filePath} doesn't exist on generated file`
				);
				expect(zip.files[filePath].name).to.be.equal(
					expectedZip.files[filePath].name,
					`Name differs ${suffix}`
				);
				expect(zip.files[filePath].options.dir).to.be.equal(
					expectedZip.files[filePath].options.dir,
					`IsDir differs ${suffix}`
				);
				const texts = [];
				texts.push(zip.files[filePath].async("string"));
				texts.push(expectedZip.files[filePath].async("string"));
				return Promise.all(texts).then(texts => {
					const text1 = texts[0].replace(/\n|\t/g, "");
					const text2 = texts[1].replace(/\n|\t/g, "");
					if (filePath.indexOf(".png") !== -1) {
						expect(text1.length).to.be.equal(
							text2.length,
							`Content differs ${suffix}`
						);
						expect(text1).to.be.equal(text2, `Content differs ${suffix}`);
					} else {
						expect(text1).to.not.match(
							emptyNamespace,
							`The file ${filePath} has empty namespaces`
						);
						expect(text2).to.not.match(
							emptyNamespace,
							`The file ${filePath} has empty namespaces`
						);
						if (text1 === text2) {
							return;
						}
						const pText1 = xmlPrettify(text1, options);
						const pText2 = xmlPrettify(text2, options);
						expect(pText1).to.be.equal(
							pText2,
							`Content differs ${suffix} lengths: "${text1.length}", "${
								text2.length
							}"`
						);
					}
				});
			}
		);
		return Promise.all(result).then((results) => {
			unlinkFile(expectedName);
			return results;
		});
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

function cleanError(e, expectedError) {
	if (e.properties.file != null) {
		expect(e.properties.file).to.be.a("string");
		expect(e.properties.file).to.equal("word/document.xml");
	}
	if (expectedError.properties.offset != null) {
		expect(e.properties.offset).to.be.deep.equal(
			expectedError.properties.offset
		);
	}
	delete e.properties.file;
	delete e.properties.explanation;
	delete e.properties.offset;
	delete expectedError.properties.offset;
	e = omit(e, ["line", "sourceURL", "stack"]);
	if (e.properties.postparsed) {
		e.properties.postparsed.forEach(function(p) {
			delete p.lIndex;
			delete p.offset;
		});
	}
	if (e.properties.rootError) {
		expect(
			e.properties.rootError,
			JSON.stringify(e.properties)
		).to.be.instanceOf(Error);
		expect(
			expectedError.properties.rootError,
			JSON.stringify(expectedError.properties)
		).to.be.instanceOf(Object);
		if (expectedError) {
			expect(e.properties.rootError.message).to.equal(
				expectedError.properties.rootError.message
			);
		}
		delete e.properties.rootError;
		delete expectedError.properties.rootError;
	}
	checkLength(e, expectedError, "properties.paragraphParts");
	checkLength(e, expectedError, "properties.postparsed");
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

function errorVerifier(e, type, expectedError) {
	expect(e, "No error has been thrown").not.to.be.equal(null);
	const toShowOnFail = e.stack;
	expect(e, toShowOnFail).to.be.instanceOf(Error);
	expect(e, toShowOnFail).to.be.instanceOf(type);
	expect(e, toShowOnFail).to.be.an("object");
	expect(e, toShowOnFail).to.have.property("properties");
	expect(e.properties, toShowOnFail).to.be.an("object");
	expect(e.properties, toShowOnFail).to.have.property("explanation");
	expect(e.properties.explanation, toShowOnFail).to.be.a("string");
	expect(e.properties, toShowOnFail).to.have.property("id");
	expect(e.properties.id, toShowOnFail).to.be.a("string");
	expect(e.properties.explanation, toShowOnFail).to.be.a("string");
	e = cleanError(e, expectedError);
	if (e.properties.errors) {
		const msg =
			"expected : \n" +
			JSON.stringify(expectedError.properties.errors) +
			"\nactual : \n" +
			JSON.stringify(e.properties.errors);
		expect(expectedError.properties.errors).to.be.an("array", msg);
		expect(e.properties.errors.length).to.equal(
			expectedError.properties.errors.length,
			msg
		);
		e.properties.errors = e.properties.errors.map(function(e, i) {
			return cleanError(e, expectedError.properties.errors[i]);
		});
	}
	expect(
		JSON.parse(
			JSON.stringify(e, function(key, value) {
				if (value instanceof Promise) {
					return {};
				}
				return value;
			})
		)
	).to.be.deep.equal(expectedError);
}

function expectToThrowAsync(fn, type, expectedError) {
	return Promise.resolve(null)
		.then(function() {
			const r = fn();
			return r.then(function() {
				return null;
			});
		})
		.catch(function(error) {
			return error;
		})
		.then(function(e) {
			return errorVerifier(e, type, expectedError);
		});
}

function expectToThrow(fn, type, expectedError) {
	let err = null;
	try {
		fn();
	} catch (e) {
		err = e;
	}
	return errorVerifier(err, type, expectedError);
}

function load(name, content, fileType, obj) {
	const zip = new JSZip();
	return zip.loadAsync(content).then(zip => {
		obj[name] = new Docxtemplater();
		obj[name].loadZip(zip);
		obj[name].loadedName = name;
		obj[name].loadedContent = content;
		return obj[name];
	});
}
function loadDocument(name, content) {
	return load(name, content, "docx", docX);
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
	return JSZipUtils.getBinaryContent("../examples/" + name, function(
		err,
		data
	) {
		if (err) {
			return callback(err);
		}
		return callback(null, name, data);
	});
}

function unhandledRejectionHandler(reason) {
	throw reason;
}

let startFunction;
function setStartFunction(sf) {
	allStarted = false;
	countFiles = 1;
	startFunction = sf;

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
function startsWith(str, suffix) {
	return str.indexOf(suffix) === 0;
}

/* eslint-disable no-console */
function start() {
	/* eslint-disable dependencies/no-unresolved */
	const fileNames = require("./filenames.js");
	/* eslint-enable dependencies/no-unresolved */
	fileNames.forEach(function(fullFileName) {
		const fileName = fullFileName.replace(examplesDirectory + "/", "");
		let callback;
		if (startsWith(fileName, ".")) {
			return;
		}
		if (endsWith(fileName, ".docx") || endsWith(fileName, ".pptx")) {
			callback = loadDocument;
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
		const fileNames = walk(examplesDirectory).map(function(f) {
			return f.replace(examplesDirectory + "/", "");
		});
		fs.writeFileSync(
			path.resolve(__dirname, "filenames.js"),
			"module.exports=" + JSON.stringify(fileNames)
		);
	}
}

function removeSpaces(text) {
	return text.replace(/\n|\t/g, "");
}

function makeDocx(name, content) {
	const zip = new JSZip();
	zip.file("word/document.xml", content, { createFolders: true });
	return zip.generateAsync({type: "string"}).then(base64 => {
		return load(name, base64, "docx", docX);
	});
}

function createDoc(name) {
	return loadDocument(name, docX[name].loadedContent);
}

function getContent(doc) {
	return doc.getZip().files["word/document.xml"].async("string");
}

function resolveSoon(data) {
	return new Promise(function(resolve) {
		setTimeout(function() {
			resolve(data);
		}, 1);
	});
}

function rejectSoon(data) {
	return new Promise(function(resolve, reject) {
		setTimeout(function() {
			reject(data);
		}, 1);
	});
}

module.exports = {
	chai,
	cleanError,
	createDoc,
	createXmlTemplaterDocx,
	createXmlTemplaterDocxNoRender,
	expect,
	expectToThrow,
	expectToThrowAsync,
	getContent,
	imageData,
	loadDocument,
	loadFile,
	loadImage,
	makeDocx,
	removeSpaces,
	setExamplesDirectory,
	setStartFunction,
	shouldBeSame,
	resolveSoon,
	rejectSoon,
	start,
	wrapMultiError,
};
