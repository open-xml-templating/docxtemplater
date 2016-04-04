"use strict";

var DocUtils = require("./docUtils");

var Docxtemplater = class Docxtemplater {
	constructor(content, options) {
		this.compiled = {};
		this.moduleManager = new Docxtemplater.ModuleManager();
		this.moduleManager.setInstance("gen", this);
		this.setOptions({});
		if ((typeof content !== "undefined" && content != null)) { this.load(content, options); }
	}
	attachModule(module) {
		this.moduleManager.attachModule(module);
		return this;
	}
	setOptions(options) {
		var self = this;
		this.options = options || {};
		Object.keys(DocUtils.defaults).forEach(function (key) {
			var defaultValue = DocUtils.defaults[key];
			self[key] = (self.options[key] != null) ? self.options[key] : defaultValue;
		});
		if (this.fileType === "docx" || this.fileType === "pptx") {
			this.fileTypeConfig = Docxtemplater.FileTypeConfig[this.fileType];
		}
		return this;
	}
	load(content, options) {
		this.moduleManager.sendEvent("loading");
		if ((content.file != null)) {
			this.zip = content;
		}
		else {
			this.zip = new Docxtemplater.JSZip(content, options);
		}
		this.moduleManager.sendEvent("loaded");
		this.templatedFiles = this.fileTypeConfig.getTemplatedFiles(this.zip);
		return this;
	}
	renderFile(fileName) {
		this.moduleManager.sendEvent("rendering-file", fileName);
		var currentFile = this.createTemplateClass(fileName);
		this.zip.file(fileName, currentFile.render().content);
		this.compiled[fileName] = currentFile.compiled;
		return this.moduleManager.sendEvent("rendered-file", fileName);
	}
	render() {
		this.moduleManager.sendEvent("rendering");
		// Loop inside all templatedFiles (basically xml files with content). Sometimes they dont't exist (footer.xml for example)
		var iterable = this.templatedFiles;
		for (var i = 0, fileName; i < iterable.length; i++) {
			fileName = iterable[i];
			if ((this.zip.files[fileName] != null)) {
				this.renderFile(fileName);
			}
		}
		this.moduleManager.sendEvent("rendered");
		return this;
	}
	getTags() {
		var usedTags = [];
		var iterable = this.templatedFiles;
		for (var i = 0, fileName; i < iterable.length; i++) {
			fileName = iterable[i];
			if ((this.zip.files[fileName] != null)) {
				var currentFile = this.createTemplateClass(fileName);
				var usedTemplateV = currentFile.render().usedTags;
				if (DocUtils.sizeOfObject(usedTemplateV)) {
					usedTags.push({fileName, vars: usedTemplateV});
				}
			}
		}
		return usedTags;
	}
	setData(tags) {
		this.tags = tags;
		return this;
	}
	// output all files, if docx has been loaded via javascript, it will be available
	getZip() {
		return this.zip;
	}
	createTemplateClass(path) {
		var self = this;
		var usedData = this.zip.files[path].asText();
		var obj = {
			tags: this.tags,
			moduleManager: this.moduleManager,
		};
		Object.keys(DocUtils.defaults).forEach(function (key) {
			obj[key] = self[key];
		});
		obj.fileTypeConfig = this.fileTypeConfig;
		return new Docxtemplater.XmlTemplater(usedData, obj);
	}
	getFullText(path) {
		return this.createTemplateClass(path || this.fileTypeConfig.textPath).getFullText();
	}
};

Docxtemplater.DocUtils = require("./docUtils");
Docxtemplater.JSZip = require("jszip");
Docxtemplater.Errors = require("./errors");
Docxtemplater.ModuleManager = require("./moduleManager");
Docxtemplater.XmlTemplater = require("./xmlTemplater");
Docxtemplater.FileTypeConfig = require("./fileTypeConfig");
Docxtemplater.XmlMatcher = require("./xmlMatcher");
Docxtemplater.XmlUtil = require("./xmlUtil");
Docxtemplater.SubContent = require("./subContent");
module.exports = Docxtemplater;
