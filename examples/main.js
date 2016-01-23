"use strict";

var DocxGen = require("../js/docxgen.js");
window.DocxGen = DocxGen;
var expressions = require("angular-expressions");
window.expressions = expressions;

var textAreaAdjust = function (o) {
	o.style.height = "1px";
	o.style.height = (25 + o.scrollHeight) + "px";
};

var loadFile = function (url, callback) {
	JSZipUtils.getBinaryContent(url, function (err, data) {
		callback(err, data);
	});
};

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

	for (i = 0; i < executeButtonList.length; i++) {
		executeButtonList[i].onclick = function () {
			var childs = (this.parentNode.childNodes);

			for (var j = 0; j < childs.length; j++) {
				if (childs[j].tagName === "TEXTAREA") {
					/* eslint-disable no-eval */
					eval(childs[j].value);
				}
			}
		};
	}

	var viewRawButtonList = document.getElementsByClassName("raw");

	for (i = 0; i < viewRawButtonList.length; i++) {
		viewRawButtonList[i].onclick = function () {
			var childs = (this.parentNode.childNodes);

			for (var j = 0; j < childs.length; j++) {
				if (childs[j].tagName === "TEXTAREA") {
					var raw = (childs[j].getAttribute("raw"));
					loadFile(raw, function (err, content) {
						if (err) {
							throw err;
						}
						var output = new DocxGen(content).getZip().generate({type: "blob"});
						saveAs(output, "raw.docx");
					});
				}
			}
		};
	}
};
