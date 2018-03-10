"use strict";

var path = require("path");
var chai = require("chai");
var expect = chai.expect;

var JSZip = require("jszip");
var fs = require("fs");

var _require = require("lodash"),
    get = _require.get,
    unset = _require.unset,
    omit = _require.omit,
    uniq = _require.uniq;

var Docxtemplater = require("../docxtemplater.js");
var xmlPrettify = require("./xml-prettify");
var countFiles = 1;
var allStarted = false;
var examplesDirectory = void 0;
var docX = {};
var imageData = {};
var emptyNamespace = /xmlns:[a-z0-9]+=""/;

function walk(dir) {
	var results = [];
	var list = fs.readdirSync(dir);
	list.forEach(function (file) {
		if (file.indexOf(".") === 0) {
			return;
		}
		file = dir + "/" + file;
		var stat = fs.statSync(file);
		if (stat && stat.isDirectory()) {
			results = results.concat(walk(file));
		} else {
			results.push(file);
		}
	});
	return results;
}

function createXmlTemplaterDocx(content) {
	var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	var doc = makeDocx("temporary.docx", content);
	doc.setOptions(options);
	doc.setData(options.tags);
	doc.render();
	return doc;
}

function writeFile(expectedName, zip) {
	var writeFile = path.resolve(examplesDirectory, "..", expectedName);
	if (fs.writeFileSync) {
		fs.writeFileSync(writeFile, zip.generate({ type: "nodebuffer", compression: "DEFLATE" }));
	}
}
function unlinkFile(expectedName) {
	var writeFile = path.resolve(examplesDirectory, "..", expectedName);
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
	var zip = options.doc.getZip();
	var expectedName = options.expectedName;

	var expectedZip = void 0;

	try {
		expectedZip = docX[expectedName].zip;
	} catch (e) {
		writeFile(expectedName, zip);
		console.log(JSON.stringify({ msg: "Expected file does not exists", expectedName: expectedName }));
		throw e;
	}

	try {
		uniq(Object.keys(zip.files).concat(Object.keys(expectedZip.files))).map(function (filePath) {
			var suffix = "for \"" + filePath + "\"";
			expect(expectedZip.files[filePath]).to.be.an("object", "The file " + filePath + " doesn't exist on " + expectedName);
			expect(zip.files[filePath]).to.be.an("object", "The file " + filePath + " doesn't exist on generated file");
			expect(zip.files[filePath].name).to.be.equal(expectedZip.files[filePath].name, "Name differs " + suffix);
			expect(zip.files[filePath].options.dir).to.be.equal(expectedZip.files[filePath].options.dir, "IsDir differs " + suffix);
			var text1 = zip.files[filePath].asText().replace(/\n|\t/g, "");
			var text2 = expectedZip.files[filePath].asText().replace(/\n|\t/g, "");
			if (filePath.indexOf(".png") !== -1) {
				expect(text1.length).to.be.equal(text2.length, "Content differs " + suffix);
				expect(text1).to.be.equal(text2, "Content differs " + suffix);
			} else {
				expect(text1).to.not.match(emptyNamespace, "The file " + filePath + " has empty namespaces");
				expect(text2).to.not.match(emptyNamespace, "The file " + filePath + " has empty namespaces");
				if (text1 === text2) {
					return;
				}
				var pText1 = xmlPrettify(text1, options);
				var pText2 = xmlPrettify(text2, options);
				expect(pText1).to.be.equal(pText2, "Content differs " + suffix + " lengths: \"" + text1.length + "\", \"" + text2.length + "\"");
			}
		});
	} catch (e) {
		writeFile(expectedName, zip);
		console.log(JSON.stringify({
			msg: "Expected file differs from actual file",
			expectedName: expectedName
		}));
		throw e;
	}
	unlinkFile(expectedName);
}
/* eslint-enable no-console */

function checkLength(e, expectedError, propertyPath) {
	var propertyPathLength = propertyPath + "Length";
	var property = get(e, propertyPath);
	var expectedPropertyLength = get(expectedError, propertyPathLength);
	if (property && expectedPropertyLength) {
		expect(expectedPropertyLength).to.be.a("number", JSON.stringify(expectedError.properties));
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
		expect(e.properties.offset).to.be.deep.equal(expectedError.properties.offset);
	}
	delete e.properties.file;
	delete e.properties.explanation;
	delete e.properties.offset;
	delete expectedError.properties.offset;
	e = omit(e, ["line", "sourceURL", "stack"]);
	if (e.properties.postparsed) {
		e.properties.postparsed.forEach(function (p) {
			delete p.lIndex;
			delete p.offset;
		});
	}
	if (e.properties.rootError) {
		expect(e.properties.rootError, JSON.stringify(e.properties)).to.be.instanceOf(Error);
		expect(expectedError.properties.rootError, JSON.stringify(expectedError.properties)).to.be.instanceOf(Object);
		if (expectedError) {
			expect(e.properties.rootError.message).to.equal(expectedError.properties.rootError.message);
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
	var type = Object.prototype.toString.call(error);
	var errors = void 0;
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
			errors: errors
		}
	};
}

function expectToThrow(fn, type, expectedError) {
	var e = null;
	try {
		fn();
	} catch (error) {
		e = error;
	}
	expect(e, "No error has been thrown").not.to.be.equal(null);
	var toShowOnFail = e.stack;
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
		var msg = "expected : \n" + JSON.stringify(expectedError.properties.errors) + "\nactual : \n" + JSON.stringify(e.properties.errors);
		expect(expectedError.properties.errors).to.be.an("array", msg);
		expect(e.properties.errors.length).to.equal(expectedError.properties.errors.length, msg);
		e.properties.errors = e.properties.errors.map(function (e, i) {
			return cleanError(e, expectedError.properties.errors[i]);
		});
	}
	expect(JSON.parse(JSON.stringify(e))).to.be.deep.equal(expectedError);
}

function load(name, content, fileType, obj) {
	var zip = new JSZip(content);
	obj[name] = new Docxtemplater();
	obj[name].loadZip(zip);
	obj[name].loadedName = name;
	obj[name].loadedContent = content;
	return obj[name];
}
function loadDocument(name, content) {
	return load(name, content, "docx", docX);
}
function loadImage(name, content) {
	imageData[name] = content;
}

function loadFile(name, callback) {
	if (fs.readFileSync) {
		var _path = require("path");
		var buffer = fs.readFileSync(_path.join(examplesDirectory, name), "binary");
		return callback(null, name, buffer);
	}
	return JSZipUtils.getBinaryContent("../examples/" + name, function (err, data) {
		if (err) {
			return callback(err);
		}
		return callback(null, name, data);
	});
}

var startFunction = void 0;
function setStartFunction(sf) {
	allStarted = false;
	countFiles = 1;
	startFunction = sf;
}

function endLoadFile(change) {
	change = change || 0;
	countFiles += change;
	if (countFiles === 0 && allStarted === true) {
		var result = startFunction();
		if (typeof window !== "undefined") {
			return window.mocha.run(function () {
				var elemDiv = window.document.getElementById("status");
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
	var fileNames = require("./filenames.js");
	/* eslint-enable dependencies/no-unresolved */
	fileNames.forEach(function (fullFileName) {
		var fileName = fullFileName.replace(examplesDirectory + "/", "");
		var callback = void 0;
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
		loadFile(fileName, function (e, name, buffer) {
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
		var fileNames = walk(examplesDirectory).map(function (f) {
			return f.replace(examplesDirectory + "/", "");
		});
		fs.writeFileSync(path.resolve(__dirname, "filenames.js"), "module.exports=" + JSON.stringify(fileNames));
	}
}

function removeSpaces(text) {
	return text.replace(/\n|\t/g, "");
}

function makeDocx(name, content) {
	var zip = new JSZip();
	zip.file("word/document.xml", content, { createFolders: true });
	var base64 = zip.generate({ type: "string" });
	return load(name, base64, "docx", docX);
}

function createDoc(name) {
	return loadDocument(name, docX[name].loadedContent);
}

function getContent(doc) {
	return doc.getZip().files["word/document.xml"].asText();
}

module.exports = {
	chai: chai,
	cleanError: cleanError,
	createDoc: createDoc,
	createXmlTemplaterDocx: createXmlTemplaterDocx,
	expect: expect,
	expectToThrow: expectToThrow,
	getContent: getContent,
	imageData: imageData,
	loadDocument: loadDocument,
	loadFile: loadFile,
	loadImage: loadImage,
	makeDocx: makeDocx,
	removeSpaces: removeSpaces,
	setExamplesDirectory: setExamplesDirectory,
	setStartFunction: setStartFunction,
	shouldBeSame: shouldBeSame,
	start: start,
	wrapMultiError: wrapMultiError
};