"use strict";

const DocUtils = require("./doc-utils");

const Docxtemplater = class Docxtemplater {
	constructor() {
		if (arguments.length > 0) {
			throw new Error("The constructor with parameters have been removed in docxtemplater 3.0, please check the upgrade guide.");
		}
		this.compiled = {};
		this.modules = [];
		this.setOptions({});
	}
	attachModule(module) {
		this.modules.push(module);
		return this;
	}
	setOptions(options) {
		this.options = options;
		Object.keys(DocUtils.defaults).forEach((key) => {
			const defaultValue = DocUtils.defaults[key];
			this[key] = (this.options[key] != null) ? this.options[key] : defaultValue;
		});
		if (this.fileType === "docx" || this.fileType === "pptx") {
			this.fileTypeConfig = Docxtemplater.FileTypeConfig[this.fileType];
		}
		this.fileTypeConfig = this.options.fileTypeConfig || this.fileTypeConfig;
		this.options.xmlFileNames = [];
		return this;
	}
	loadZip(zip) {
		if (zip.loadAsync) {
			throw new Error("Docxtemplater doesn't handle JSZip version >=3, see changelog");
		}
		this.zip = zip;
		return this;
	}
	renderFile(fileName) {
		const currentFile = this.createTemplateClass(fileName);
		this.zip.file(fileName, currentFile.render().content);
		this.compiled[fileName] = currentFile.postparsed;
	}
	compile() {
		this.templatedFiles = this.fileTypeConfig.getTemplatedFiles(this.zip);
	}
	render() {
		this.modules = this.fileTypeConfig.baseModules.map(function (moduleFunction) {
			return moduleFunction();
		}).concat(this.modules);
		this.options = this.modules.reduce((options, module) => {
			return module.optionsTransformer ? module.optionsTransformer(options, this) : options;
		}, this.options);
		this.xmlDocuments = this.options.xmlFileNames.reduce((xmlDocuments, fileName) => {
			const content = this.zip.files[fileName].asText();
			xmlDocuments[fileName] = DocUtils.str2xml(content);
			return xmlDocuments;
		}, {});
		this.modules.forEach((module) => {
			if (module.set) {
				module.set({zip: this.zip, xmlDocuments: this.xmlDocuments});
			}
		});
		this.compile();
		// Loop inside all templatedFiles (ie xml files with content).
		// Sometimes they don't exist (footer.xml for example)
		this.templatedFiles.forEach((fileName) => {
			if (this.zip.files[fileName] != null) {
				this.renderFile(fileName);
			}
		});
		Object.keys(this.xmlDocuments).forEach((fileName) => {
			this.zip.remove(fileName);
			const content = DocUtils.encodeUtf8(DocUtils.xml2str(this.xmlDocuments[fileName]));
			return this.zip.file(fileName, content, {});
		});
		return this;
	}
	setData(tags) {
		this.tags = tags;
		return this;
	}
	getZip() {
		return this.zip;
	}
	createTemplateClass(path) {
		const usedData = this.zip.files[path].asText();
		return this.createTemplateClassFromContent(usedData, path);
	}
	createTemplateClassFromContent(content, filePath) {
		const xmltOptions = {
			tags: this.tags,
			filePath,
		};
		Object.keys(DocUtils.defaults).forEach((key) => {
			xmltOptions[key] = this[key];
		});
		xmltOptions.fileTypeConfig = this.fileTypeConfig;
		xmltOptions.modules = this.modules;
		return new Docxtemplater.XmlTemplater(content, xmltOptions);
	}
	getFullText(path) {
		return this.createTemplateClass(path || this.fileTypeConfig.textPath).getFullText();
	}
	getTemplatedFiles() {
		this.compile();
		return this.templatedFiles;
	}
};

Docxtemplater.DocUtils = require("./doc-utils");
Docxtemplater.Errors = require("./errors");
Docxtemplater.XmlTemplater = require("./xml-templater");
Docxtemplater.FileTypeConfig = require("./file-type-config");
Docxtemplater.XmlMatcher = require("./xml-matcher");
module.exports = Docxtemplater;
