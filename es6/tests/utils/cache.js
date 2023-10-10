const PizZip = require("pizzip");
const { load } = require("./file-system.js");

const documentCache = {};

function loadDocumentFromCache(name, content) {
	return load(name, content, documentCache);
}

function getLoadedContent(name) {
	return documentCache[name].loadedContent;
}

function cacheDocument(name, content) {
	const zip = new PizZip(content);
	documentCache[name] = { loadedName: name, loadedContent: content, zip };
	return documentCache[name];
}

function getZipFromCache(name) {
	return new PizZip(documentCache[name].loadedContent);
}

module.exports = {
	documentCache,
	loadDocumentFromCache,
	getLoadedContent,
	cacheDocument,
	getZipFromCache,
};
