"use strict";

/* eslint-disable no-var */
var Docxtemplater = require("../js/docxtemplater.js");
window.Docxtemplater = Docxtemplater;
var expressions = require("angular-expressions");
var JSZip = require("jszip");
window.expressions = expressions;

function textAreaAdjust(o) {
	o.style.height = "1px";
	o.style.height = (25 + o.scrollHeight) + "px";
}

function loadFile(url, callback) {
	JSZipUtils.getBinaryContent(url, function (err, data) {
		callback(err, data);
	});
}

window.onload = function () {
	var i;
	var textAreaList = document.getElementsByTagName("textarea");

	for (i = textAreaList.length - 1; i >= 0; i--) {
		textAreaAdjust(textAreaList[i]);
		var executeButton = document.createElement("button");
		executeButton.className = "execute";
		executeButton.innerHTML = "Execute";
		textAreaList[i].parentNode.insertBefore(executeButton, textAreaList[i].nextSibling);

		var viewRawButton = document.createElement("button");
		viewRawButton.className = "raw";
		viewRawButton.innerHTML = "View Initial Document";
		textAreaList[i].parentNode.insertBefore(viewRawButton, textAreaList[i].nextSibling);
	}

	var executeButtonList = document.getElementsByClassName("execute");

	function executeFn() {
		var childs = (this.parentNode.childNodes);

		for (var j = 0; j < childs.length; j++) {
			if (childs[j].tagName === "TEXTAREA") {
				/* eslint-disable no-eval */
				eval(childs[j].value);
			}
		}
	}

	for (i = 0; i < executeButtonList.length; i++) {
		executeButtonList[i].onclick = executeFn;
	}

	var viewRawButtonList = document.getElementsByClassName("raw");

	function saveAsRaw(err, content) {
		if (err) {
			throw err;
		}
		var zip = new JSZip(content);
		var output = new Docxtemplater().loadZip(zip).getZip().generate({type: "blob"});
		saveAs(output, "raw.docx");
	}

	function viewRawFn() {
		var childs = (this.parentNode.childNodes);

		for (var j = 0; j < childs.length; j++) {
			if (childs[j].tagName === "TEXTAREA") {
				var raw = (childs[j].getAttribute("raw"));
				loadFile(raw, saveAsRaw);
			}
		}
	}

	for (i = 0; i < viewRawButtonList.length; i++) {
		viewRawButtonList[i].onclick = viewRawFn;
	}
};
