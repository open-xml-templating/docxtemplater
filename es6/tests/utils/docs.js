const PizZip = require("pizzip");
const Docxtemplater = require("../../docxtemplater.js");
const AssertionModule = require("../assertion-module.js");
const {
	loadDocumentFromCache,
	getLoadedContent,
	getZipFromCache,
} = require("./cache.js");

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
	return loadDocumentFromCache(name, zip.generate({ type: "string" }));
}

function makePptxV4(content, options = {}) {
	const zip = new PizZip();
	zip.file("ppt/slides/slide1.xml", content, { createFolders: true });
	zip.file("[Content_Types].xml", pptxContentTypeContent);
	zip.file("_rels/.rels", pptxRelsContent);
	return new Docxtemplater(zip, options);
}

function createDoc(name, options = {}) {
	const doc = loadDocumentFromCache(name, getLoadedContent(name));
	doc.attachModule(new AssertionModule());
	doc.setOptions(options);
	return doc;
}

function createDocV4(name, options) {
	const zip = getZipFromCache(name);
	options = options || {};
	if (!options.modules || options.modules instanceof Array) {
		options.modules = options.modules || [];
		options.modules.push(new AssertionModule());
	}
	return new Docxtemplater(zip, options);
}

module.exports = {
	createXmlTemplaterDocxNoRender,
	createXmlTemplaterDocx,
	makeDocx,
	makeDocxV4,
	makePptx,
	makePptxV4,
	createDoc,
	createDocV4,
};
