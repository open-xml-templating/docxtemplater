"use strict";

var CompiledXmlTag = class CompiledXmlTag {
	constructor(compiled) { this.set(compiled || []); }
	set(compiled) {
		compiled = compiled || [];
		if (this.null) { return this; }
		this.compiled = [];
		for (var i = 0, text; i < compiled.length; i++) {
			text = compiled[i];
			if (text !== "") {
				this.compiled.push(text);
			}
		}
		return this;
	}
	prependText(text) {
		if (this.null) { return this; }
		if (text !== "") {
			this.compiled.unshift(text);
		}
		return this;
	}
	appendText(text) {
		if (this.null) { return this; }
		if (text !== "") {
			this.compiled.push(text);
		}
		return this;
	}
};

CompiledXmlTag.null = function () {
	var obj = new CompiledXmlTag();
	obj.null = true;
	return obj;
};

module.exports = CompiledXmlTag;
