const errorLogger = require("../../error-logger.js");
const {
	getExamplesDirectory,
	loadImage,
	loadFile,
} = require("./file-system.js");
const { endLoadFile, addCountFiles, setAllStarted } = require("./snapshot.js");
const { cacheDocument } = require("./cache.js");

// text
function getText(file) {
	return file.asText().replace(/\n|\t/g, "");
}

// text
function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

// text
function endsWithOne(str, suffixes) {
	return suffixes.some(function (suffix) {
		return endsWith(str, suffix);
	});
}

// text
function startsWith(str, prefix) {
	return str.indexOf(prefix) === 0;
}

// main
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
	let fileNames = null;
	if (typeof global !== "undefined" && global.fileNames) {
		fileNames = global.fileNames;
	} else {
		fileNames = require("./filenames.js");
	}
	const examplesDirectory = getExamplesDirectory();
	fileNames.forEach(function (fullFileName) {
		const fileName = fullFileName.replace(examplesDirectory + "/", "");
		let callback = null;
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
		addCountFiles(1);
		loadFile(fileName, (e, name, buffer) => {
			if (e) {
				console.log(e);
				throw e;
			}
			endLoadFile(-1);
			callback(name, buffer);
		});
	});
	setAllStarted(true);
	endLoadFile(-1);
}
/* eslint-disable no-console */

// utils
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
		if (Array.isArray(p.value)) {
			p.value.forEach(cleanRecursive);
		}
		if (p.expanded) {
			p.expanded.forEach(cleanRecursive);
		}
	});
}

// utils
function getContent(doc) {
	return doc.getZip().files["word/document.xml"].asText();
}

// utils
function resolveSoon(data, time = 1) {
	return new Promise(function (resolve) {
		setTimeout(function () {
			resolve(data);
		}, time);
	});
}

// utils
function rejectSoon(data, time = 1) {
	return new Promise(function (resolve, reject) {
		setTimeout(function () {
			reject(data);
		}, time);
	});
}

// utils
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

// utils/browser
function browserMatches(regex) {
	const currentBrowser = getParameterByName("browser");
	if (currentBrowser === null) {
		return false;
	}
	return regex.test(currentBrowser);
}

// utils
function getLength(obj) {
	if (obj instanceof ArrayBuffer) {
		return obj.byteLength;
	}
	return obj.length;
}

module.exports = {
	getText,
	cleanRecursive,
	start,
	getContent,
	resolveSoon,
	rejectSoon,
	browserMatches,
	getLength,
};
