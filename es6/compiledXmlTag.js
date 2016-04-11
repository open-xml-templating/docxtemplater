"use strict";

var CompiledXmlTag = class CompiledXmlTag {
	constructor(compiled) { this.set(compiled || []); }
	set(compiled) {
		compiled = compiled || [];
		if (this.empty) { return this; }
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
		if (this.empty) { return this; }
		if (text !== "") {
			this.compiled.unshift(text);
		}
		return this;
	}
	appendText(text) {
		if (this.empty) { return this; }
		if (text !== "") {
			this.compiled.push(text);
		}
		return this;
	}
};

CompiledXmlTag.empty = function () {
	var obj = new CompiledXmlTag();
	obj.empty = true;
	return obj;
};

module.exports = CompiledXmlTag;
