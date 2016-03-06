"use strict";
// This class responsibility is to store an xmlTemplater's state
var DocUtils = require("./docUtils");
var Errors = require("./errors");

module.exports = class TemplaterState {
	constructor(moduleManager, delimiters) {
		this.moduleManager = moduleManager;
		this.delimiters = delimiters;
		this.moduleManager.templaterState = this;
	}
	moveCharacters(numXmlTag, newTextLength, oldTextLength) {
		return (() => {
			var result = [];
			var end = this.matches.length;
			for (var k = numXmlTag; k < end; k++) {
				result.push(this.charactersAdded[k] += newTextLength - oldTextLength);
			}
			return result;
		})();
	}
	calcStartTag(tag) { return this.calcPosition(tag.start); }
	calcXmlTagPosition(xmlTagNumber) {
		return this.matches[xmlTagNumber].offset + this.charactersAdded[xmlTagNumber];
	}
	calcEndTag(tag) { return this.calcPosition(tag.end) + 1; }
	calcPosition(bracket) {
		return this.matches[bracket.numXmlTag].offset + this.matches[bracket.numXmlTag].array[1].length + this.charactersAdded[bracket.numXmlTag] + bracket.numCharacter;
	}
	innerContent(type) { return this.matches[this[type].numXmlTag].array[2]; }
	initialize() {
		this.context = "";
		this.inForLoop = false; // tag with sharp: {#forLoop}______{/forLoop}
		this.loopIsInverted = false; // tag with caret: {^invertedForLoop}_____{/invertedForLoop}
		this.inTag = false; // all tags {___}
		this.inDashLoop = false; // tag with dash: {-w:tr dashLoop} {/dashLoop}
		this.rawXmlTag = false;
		this.textInsideTag = "";
		this.trail = "";
		this.trailSteps = [];
		this.offset = [];
	}
	finalize() {
		var err;
		var xtag;
		if (this.inForLoop === true || this.inDashLoop === true) {
			err = new Errors.XTTemplateError("Unclosed loop");
			xtag = this.loopOpen.raw;
			err.properties = {
				xtag: xtag,
				id: "unclosed_loop",
				context: this.context,
				explanation: `The loop beginning with '${xtag.substr(0, 10)}' is unclosed`,
			};
			throw err;
		}
		if (this.inTag === true) {
			err = new Errors.XTTemplateError("Unclosed tag");
			xtag = this.textInsideTag;
			err.properties = {
				xtag: xtag.split(" ")[0],
				id: "unclosed_tag",
				context: this.context,
				explanation: `The tag beginning with '${xtag.substr(0, 10)}' is unclosed`,
			};
			throw err;
		}
	}
	startTag() {
		if (this.inTag === true) {
			var err = new Errors.XTTemplateError("Unclosed tag");
			var xtag = this.textInsideTag;
			err.properties = {
				xtag: xtag.split(" ")[0],
				id: "unclosed_tag",
				context: this.context,
				explanation: `The tag beginning with '${xtag.substr(0, 10)}' is unclosed`,
			};
			throw err;
		}
		this.currentStep = this.trailSteps[0];
		this.inTag = true;
		this.rawXmlTag = false;
		this.textInsideTag = "";
		this.tagStart = this.currentStep;
		this.trail = "";
	}
	loopType() {
		if (this.inDashLoop) { return "dash"; }
		if (this.inForLoop) { return "for"; }
		if (this.rawXmlTag) { return "xml"; }
		var getFromModule = this.moduleManager.get("loopType");
		if (getFromModule != null) { return getFromModule; }
		return "simple";
	}
	isLoopClosingTag() {
		return this.textInsideTag[0] === "/" && ("/" + this.loopOpen.tag === this.textInsideTag);
	}
	finishLoop() {
		this.context = "";
		this.rawXmlTag = false;
		this.inForLoop = false;
		this.loopIsInverted = false;
		this.loopOpen = null;
		this.loopClose = null;
		this.inDashLoop = false;
		this.inTag = false;
		this.textInsideTag = "";
	}
	getLeftValue() {
		return this.innerContent("tagStart")
			.substr(0, this.tagStart.numCharacter + this.offset[this.tagStart.numXmlTag]);
	}
	getRightValue() {
		return this.innerContent("tagEnd")
			.substr(this.tagEnd.numCharacter + 1 + this.offset[this.tagEnd.numXmlTag]);
	}
	getMatchLocation(num) {
		var match = this.matches[num];
		if (match.first) {
			return "first";
		}
		if (match.last) {
			return "last";
		}
		return "normal";
	}
	handleSimpleEndTag() {
		var baseLoop = this.getCurrentLoop();
		if (this.textInsideTag[0] === "@") {
			this.rawXmlTag = true;
			this.tag = this.textInsideTag.substr(1);
			return;
		}
		if (this.textInsideTag[0] === "#" || this.textInsideTag[0] === "^") {
			// begin for loop
			this.inForLoop = true;
			baseLoop.tag = this.textInsideTag.substr(1);
			this.loopOpen = baseLoop;
			this.loopIsInverted = this.textInsideTag[0] === "^";
			return;
		}
		if (this.textInsideTag[0] === "-") {
			this.inDashLoop = true;
			var dashInnerRegex = /^-([^\s]+)\s(.+)$/;
			baseLoop.tag = (this.textInsideTag.replace(dashInnerRegex, "$2"));
			baseLoop.element = (this.textInsideTag.replace(dashInnerRegex, "$1"));
			this.loopOpen = baseLoop;
			return;
		}
	}
	getCurrentLoop() {
		return {start: this.tagStart, end: this.tagEnd, raw: this.textInsideTag};
	}
	endTag() {
		if (this.inTag === false) {
			var err = new Errors.XTTemplateError("Unopened tag");
			err.properties = {
				id: "unopened_tag",
				explanation: `Unopened tag near : '${this.context.substr(this.context.length - 10, 10)}'`,
				context: this.context,
			};
			throw err;
		}
		this.inTag = false;
		this.tagEnd = this.currentStep;
		this.textInsideTag = this.textInsideTag.substr(0, this.textInsideTag.length + 1 - this.delimiters.end.length);
		this.textInsideTag = DocUtils.wordToUtf8(this.textInsideTag);
		this.fullTextTag = this.delimiters.start + this.textInsideTag + this.delimiters.end;
		if (this.loopType() === "simple") {
			return this.handleSimpleEndTag();
		}
		if (this.textInsideTag[0] === "/") {
			this.loopClose = this.getCurrentLoop();
		}
	}
};
