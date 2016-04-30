"use strict";
// This class responsibility is to deal with parts of the document
var Errors = require("./errors");

module.exports = class SubContent {
	constructor(fullText) {
		this.fullText = fullText || "";
		this.text = "";
		this.start = 0;
		this.end = 0;
	}
	getInnerLoop(templaterState) {
		this.start = templaterState.calcEndTag(templaterState.loopOpen);
		this.end = templaterState.calcStartTag(templaterState.loopClose);
		return this.refreshText();
	}
	getOuterLoop(templaterState) {
		this.start = templaterState.calcStartTag(templaterState.loopOpen);
		this.end = templaterState.calcEndTag(templaterState.loopClose);
		return this.refreshText();
	}
	getInnerTag(templaterState) {
		this.start = templaterState.calcPosition(templaterState.tagStart);
		this.end = templaterState.calcPosition(templaterState.tagEnd) + 1;
		return this.refreshText();
	}
	refreshText() {
		this.text = this.fullText.substr(this.start, this.end - this.start);
		return this;
	}
	getErrorProps(xmlTag) {
		return {
			xmlTag,
			text: this.fullText,
			start: this.start,
			previousEnd: this.end,
		};
	}
	getOuterXml(xmlTag) {
		var endCandidate = this.fullText.indexOf("</" + xmlTag + ">", this.end);
		var err;
		var startCandiate = Math.max(this.fullText.lastIndexOf("<" + xmlTag + ">", this.start), this.fullText.lastIndexOf("<" + xmlTag + " ", this.start));
		if (endCandidate === -1) {
			err = new Errors.XTTemplateError("Can't find endTag");
			err.properties = this.getErrorProps(xmlTag);
			throw err;
		}
		if (startCandiate === -1) {
			err = new Errors.XTTemplateError("Can't find startTag");
			err.properties = this.getErrorProps(xmlTag);
			throw err;
		}
		this.end = endCandidate + ("</" + xmlTag + ">").length;
		this.start = startCandiate;
		return this.refreshText();
	}
	replace(newText) {
		this.fullText = this.fullText.substr(0, this.start) + newText + this.fullText.substr(this.end);
		this.end = this.start + newText.length;
		return this.refreshText();
	}
};
