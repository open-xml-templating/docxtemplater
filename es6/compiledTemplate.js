"use strict";

var Errors = require("./errors");

var CompiledTemplate = class CompiledTemplate {
	constructor() {
		this.compiled = [];
	}
	prependText(text) {
		this.compiled.unshift(text);
		return this;
	}
	appendTag(compiledTag) {
		if (!compiledTag) {
			var err = new Errors.XTInternalError("Compiled tag empty");
			err.properties.id = "tag_appended_empty";
			throw err;
		}
		this.compiled = this.compiled.concat(compiledTag.compiled);
		return this;
	}
	appendRaw(tag) {
		this.compiled.push({type: "raw", tag});
		return this;
	}
	appendText(text) {
		if (text !== "") {
			this.compiled.push(text);
		}
		return this;
	}
	appendSubTemplate(subTemplate, tag, inverted) {
		if (!subTemplate) {
			var err = new Errors.XTInternalError("Subtemplate empty");
			err.properties.id = "subtemplate_appended_empty";
			throw err;
		}
		return this.compiled.push({type: "loop", tag, inverted, template: subTemplate});
	}
};

module.exports = CompiledTemplate;
