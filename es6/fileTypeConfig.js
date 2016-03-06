"use strict";

var xmlUtil = require("./xmlUtil");
var SubContent = require("./subContent");

var PptXFileTypeConfig = {
	textPath: "ppt/slides/slide1.xml",
	tagsXmlArray: ["a:t", "m:t"],
	tagRawXml: "p: sp",
	getTemplatedFiles(zip) {
		var slideTemplates = zip.file(/ppt\/(slides|slideMasters)\/(slide|slideMaster)\d+\.xml/).map(function (file) { return file.name; });
		return slideTemplates.concat(["ppt/presentation.xml"]);
	},
	calcIntellegentlyDashElement(content, templaterState) {
		var outer = new SubContent(content).getOuterLoop(templaterState);
		var scopeContent = xmlUtil.getListXmlElements(content.substr(outer.start, outer.end - outer.start));
		for (var i = 0, t; i < scopeContent.length; i++) {
			t = scopeContent[i];
			if (t.tag === "<a:tc>") {
				return "a:tr";
			}
		}
		return false;
	},
};

var DocXFileTypeConfig = {
	getTemplatedFiles(zip) {
		var slideTemplates = zip.file(/word\/(header|footer)\d+\.xml/).map(function (file) { return file.name; });
		return slideTemplates.concat(["word/document.xml"]);
	},
	textPath: "word/document.xml",
	tagsXmlArray: ["w:t", "m:t"],
	tagRawXml: "w:p",
	calcIntellegentlyDashElement(content, templaterState) {
		var outer = new SubContent(content).getOuterLoop(templaterState);
		var scopeContent = xmlUtil.getListXmlElements(content.substr(outer.start, outer.end - outer.start));
		for (var i = 0, t; i < scopeContent.length; i++) {
			t = scopeContent[i];
			if (t.tag === "<w:tc>") {
				return "w:tr";
			}
		}
		return false;
	},
};

module.exports = {
	docx: DocXFileTypeConfig,
	pptx: PptXFileTypeConfig,
};
