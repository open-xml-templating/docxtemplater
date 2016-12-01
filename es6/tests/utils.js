const FileTypeConfig = require("../file-type-config.js");
const XmlTemplater = require("../xml-templater");
const path = require("path");
const Docxtemplater = require("../docxtemplater.js");
const chai = require("chai");
const expect = chai.expect;
const JSZip = require("jszip");
const xmlPrettify = require("./xml-prettify");
const fs = require("fs");
let countFiles = 1;
let allStarted = false;
let examplesDirectory;

/* eslint-disable no-console */

function createXmlTemplaterDocx(content, options) {
	options = options || {};
	options.fileTypeConfig = FileTypeConfig.docx;
	options.modules = options.fileTypeConfig.baseModules.map(function (moduleFunction) {
		const module = moduleFunction();
		if (module.optionsTransformer) {
			module.optionsTransformer({}, {fileTypeConfig: options.fileTypeConfig});
		}
		return module;
	});

	return new XmlTemplater(content, options);
}

function shouldBeSame(options) {
	const zip = options.doc.getZip();
	const expectedName = options.expectedName;
	let expectedZip;
	const writeFile = path.resolve(examplesDirectory, "..", expectedName);

	if (fs.writeFileSync) {
		fs.writeFileSync(
			writeFile,
			zip.generate({type: "nodebuffer", compression: "DEFLATE"})
		);
	}

	try {
		expectedZip = (docX[expectedName]) ? docX[expectedName].zip : pptX[expectedName].zip;
	}
	catch (e) {
		console.log(JSON.stringify({msg: "Expected name does not match", expectedName}));
		throw e;
	}

	const result = [];
	try {
		Object.keys(zip.files).map(function (filePath) {
			const suffix = `for "${filePath}"`;
			expect(zip.files[filePath].name).to.be.equal(expectedZip.files[filePath].name, `Name differs ${suffix}`);
			expect(zip.files[filePath].options.dir).to.be.equal(expectedZip.files[filePath].options.dir, `IsDir differs ${suffix}`);
			const text1 = zip.files[filePath].asText().replace(/\n|\t/g, "");
			const text2 = expectedZip.files[filePath].asText().replace(/\n|\t/g, "");
			const pText1 = xmlPrettify(text1, options);
			const pText2 = xmlPrettify(text2, options);
			expect(pText1).to.be.equal(pText2, `Content differs ${suffix} lengths: "${text1.length}", "${text2.length}"`);
			expect(text1.length).to.be.equal(text2.length, `Content differs ${suffix}`);
		});
	}
	catch (e) {
		console.log(JSON.stringify({msg: "Expected name does not match", expectedName}));
		throw e;
	}
	return result;
}

const docX = {};
const pptX = {};
const imageData = {};

function load(name, content, fileType, obj) {
	const zip = new JSZip(content);
	obj[name] = new Docxtemplater();
	obj[name].setOptions({fileType});
	obj[name].loadZip(zip);
	obj[name].loadedName = name;
	obj[name].loadedContent = content;
	return obj[name];
}
function loadDocx(name, content) {
	return load(name, content, "docx", docX);
}
function loadPptx(name, content) {
	return load(name, content, "pptx", pptX);
}
function loadImage(name, content) {
	imageData[name] = content;
}

function loadFile(name, callback) {
	countFiles += 1;
	if (fs.readFileSync) {
		const path = require("path");
		const buffer = fs.readFileSync(path.join(examplesDirectory, name), "binary");
		callback(name, buffer);
		return endLoadFile(-1);
	}
	return JSZipUtils.getBinaryContent("../examples/" + name, function (err, data) {
		if (err) {
			throw err;
		}
		callback(name, data);
		return endLoadFile(-1);
	});
}
function endLoadFile(change) {
	change = change || 0;
	countFiles += change;
	if (countFiles === 0 && allStarted === true) {
		return startFunction();
	}
}

function start() {
	allStarted = true;
	endLoadFile(-1);
}

let startFunction;
function setStartFunction(sf) {
	allStarted = false;
	countFiles = 1;
	startFunction = sf;
}
function setExamplesDirectory(ed) {
	examplesDirectory = ed;
}

function removeSpaces(text) {
	return text.replace(/\n|\t/g, "");
}

function makeDocx(name, content) {
	const zip = new JSZip();
	zip.file("word/document.xml", content);
	const base64 = zip.generate({type: "string"});
	return load(name, base64, "docx", docX);
}

function createDoc(name) {
	return loadDocx(name, docX[name].loadedContent);
}

function createPpt(name) {
	return loadPptx(name, pptX[name].loadedContent);
}

module.exports = {
	createXmlTemplaterDocx,
	createDoc,
	createPpt,
	loadDocx,
	loadPptx,
	loadImage,
	shouldBeSame,
	docX,
	pptX,
	imageData,
	loadFile,
	start,
	chai,
	expect,
	setStartFunction,
	setExamplesDirectory,
	removeSpaces,
	makeDocx,
};
