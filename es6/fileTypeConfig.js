"use strict";

var xmlUtil = require("./xmlUtil");
var SubContent = require("./subContent");

function deepFreeze(obj) {
	Object.freeze(obj);
	Object.getOwnPropertyNames(obj).forEach(function (prop) {
		if (obj.hasOwnProperty(prop) && obj[prop] !== null
			&& (typeof obj[prop] === "object" || typeof obj[prop] === "function")
			&& !Object.isFrozen(obj[prop])) {
			deepFreeze(obj[prop]);
		}
	});
}

var PptXFileTypeConfig = {
	textPath: "ppt/slides/slide1.xml",
	tagsXmlArray: ["a:t", "m:t"],
	tagRawXml: "p:sp",
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

deepFreeze(PptXFileTypeConfig);

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

deepFreeze(DocXFileTypeConfig);

module.exports = {
	docx: DocXFileTypeConfig,
	pptx: PptXFileTypeConfig,
};
