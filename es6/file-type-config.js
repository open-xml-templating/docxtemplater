"use strict";

const loopModule = require("./modules/loop");
const spacePreserveModule = require("./modules/space-preserve");
const RawXmlModule = require("./modules/rawxml");
const expandPairTrait = require("./modules/expand-pair-trait");

const PptXFileTypeConfig = {
	getTemplatedFiles(zip) {
		const slideTemplates = zip.file(/ppt\/(slides|slideMasters)\/(slide|slideMaster)\d+\.xml/).map(function (file) { return file.name; });
		return slideTemplates.concat(["ppt/presentation.xml"]);
	},
	textPath: "ppt/slides/slide1.xml",
	tagsXmlTextArray: ["a:t", "m:t"],
	tagsXmlLexedArray: ["p:sp", "a:tc", "a:tr", "a:table", "a:p", "a:r"],
	tagRawXml: "p:sp",
	tagTextXml: "a:t",
	baseModules: [() => expandPairTrait, () => new RawXmlModule(), () => loopModule],
};

const DocXFileTypeConfig = {
	getTemplatedFiles(zip) {
		const slideTemplates = zip.file(/word\/(header|footer)\d+\.xml/).map(function (file) { return file.name; });
		return slideTemplates.concat(["word/document.xml"]);
	},
	textPath: "word/document.xml",
	tagsXmlTextArray: ["w:t", "m:t"],
	tagsXmlLexedArray: ["w:tc", "w:tr", "w:table", "w:p", "w:r"],
	tagRawXml: "w:p",
	tagTextXml: "w:t",
	baseModules: [() => spacePreserveModule, () => expandPairTrait, () => new RawXmlModule(), () => loopModule],
};

module.exports = {
	docx: DocXFileTypeConfig,
	pptx: PptXFileTypeConfig,
};
