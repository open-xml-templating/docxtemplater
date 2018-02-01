"use strict";

const loopModule = require("./modules/loop");
const spacePreserveModule = require("./modules/space-preserve");
const rawXmlModule = require("./modules/rawxml");
const expandPairTrait = require("./modules/expand-pair-trait");
const render = require("./modules/render");

const PptXFileTypeConfig = {
	getTemplatedFiles(zip) {
		const slideTemplates = zip
			.file(/ppt\/(slides|slideMasters)\/(slide|slideMaster)\d+\.xml/)
			.map(function(file) {
				return file.name;
			});
		return slideTemplates.concat([
			"ppt/presentation.xml",
			"docProps/app.xml",
			"docProps/core.xml",
		]);
	},
	textPath() {
		return "ppt/slides/slide1.xml";
	},
	tagsXmlTextArray: [
		"a:t",
		"m:t",
		"vt:lpstr",
		"dc:title",
		"dc:creator",
		"cp:keywords",
	],
	tagsXmlLexedArray: ["p:sp", "a:tc", "a:tr", "a:table", "a:p", "a:r"],
	expandTags: [{ contains: "a:tc", expand: "a:tr" }],
	onParagraphLoop: [{ contains: "a:p", expand: "a:p", onlyTextInTag: true }],
	tagRawXml: "p:sp",
	tagTextXml: "a:t",
	baseModules: [loopModule, expandPairTrait, rawXmlModule, render],
};

const DocXFileTypeConfig = {
	getTemplatedFiles(zip) {
		const baseTags = [
			"docProps/core.xml",
			"docProps/app.xml",
			"word/document.xml",
			"word/document2.xml",
		];
		const slideTemplates = zip
			.file(/word\/(header|footer)\d+\.xml/)
			.map(function(file) {
				return file.name;
			});
		return slideTemplates.concat(baseTags);
	},
	textPath(zip) {
		if (zip.files["word/document.xml"]) {
			return "word/document.xml";
		}
		if (zip.files["word/document2.xml"]) {
			return "word/document2.xml";
		}
	},
	tagsXmlTextArray: [
		"w:t",
		"m:t",
		"vt:lpstr",
		"dc:title",
		"dc:creator",
		"cp:keywords",
	],
	tagsXmlLexedArray: [
		"w:tc",
		"w:tr",
		"w:table",
		"w:p",
		"w:r",
		"w:rPr",
		"w:pPr",
		"w:spacing",
	],
	expandTags: [{ contains: "w:tc", expand: "w:tr" }],
	onParagraphLoop: [{ contains: "w:p", expand: "w:p", onlyTextInTag: true }],
	tagRawXml: "w:p",
	tagTextXml: "w:t",
	baseModules: [
		loopModule,
		spacePreserveModule,
		expandPairTrait,
		rawXmlModule,
		render,
	],
};

module.exports = {
	docx: DocXFileTypeConfig,
	pptx: PptXFileTypeConfig,
};
