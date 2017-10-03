"use strict";

const DocUtils = require("./doc-utils");
DocUtils.traits = require("./traits");
DocUtils.moduleWrapper = require("./module-wrapper");
const {defaults, str2xml, xml2str, moduleWrapper, concatArrays} = DocUtils;
const {XTInternalError, throwFileTypeNotIdentified, throwFileTypeNotHandled} = require("./errors");

const Docxtemplater = class Docxtemplater {
	constructor() {
		if (arguments.length > 0) {
			throw new Error("The constructor with parameters has been removed in docxtemplater 3.0, please check the upgrade guide.");
		}
		this.compiled = {};
		this.modules = [];
		this.setOptions({});
	}
	setModules(obj) {
		this.modules.forEach((module) => {
			module.set(obj);
		});
	}
	sendEvent(eventName) {
		this.modules.forEach((module) => {
			module.on(eventName);
		});
	}
	attachModule(module, options = {}) {
		const {prefix} = options;
		if (prefix) {
			module.prefix = prefix;
		}
		this.modules.push(moduleWrapper(module));
		return this;
	}
	setOptions(options) {
		this.options = options;
		Object.keys(defaults).forEach((key) => {
			const defaultValue = defaults[key];
			this[key] = (this.options[key] != null) ? this.options[key] : defaultValue;
		});
		if (this.zip) {
			this.updateFileTypeConfig();
		}
		return this;
	}
	loadZip(zip) {
		if (zip.loadAsync) {
			throw new XTInternalError("Docxtemplater doesn't handle JSZip version >=3, see changelog");
		}
		this.zip = zip;
		this.updateFileTypeConfig();
		return this;
	}
	compileFile(fileName) {
		const currentFile = this.createTemplateClass(fileName);
		currentFile.parse();
		this.compiled[fileName] = currentFile;
	}
	compile() {
		if (Object.keys(this.compiled).length) {
			return this;
		}

		this.options.xmlFileNames = [];
		this.modules = concatArrays([this.fileTypeConfig.baseModules.map(function (moduleFunction) {
			return moduleFunction();
		}), this.modules]);
		this.options = this.modules.reduce((options, module) => {
			return module.optionsTransformer(options, this);
		}, this.options);
		this.xmlDocuments = this.options.xmlFileNames.reduce((xmlDocuments, fileName) => {
			const content = this.zip.files[fileName].asText();
			xmlDocuments[fileName] = str2xml(content);
			return xmlDocuments;
		}, {});
		this.setModules({zip: this.zip, xmlDocuments: this.xmlDocuments, data: this.data});
		this.getTemplatedFiles();
		this.setModules({compiled: this.compiled});
		// Loop inside all templatedFiles (ie xml files with content).
		// Sometimes they don't exist (footer.xml for example)
		this.templatedFiles.forEach((fileName) => {
			if (this.zip.files[fileName] != null) {
				this.compileFile(fileName);
			}
		});
		return this;
	}
	updateFileTypeConfig() {
		const fileTypeIdentifiers = {
			docx: "word/document.xml",
			pptx: "ppt/presentation.xml",
			odt: "mimetype",
		};

		const fileType = Object.keys(fileTypeIdentifiers).reduce((fileType, key) => {
			if (fileType) {
				return fileType;
			}
			if (this.zip.files[fileTypeIdentifiers[key]]) {
				return key;
			}
			return fileType;
		}, null);

		if (fileType === "odt") {
			throwFileTypeNotHandled(fileType);
		}
		if (!fileType) {
			throwFileTypeNotIdentified();
		}
		this.fileType = fileType;
		this.fileTypeConfig = this.options.fileTypeConfig || Docxtemplater.FileTypeConfig[this.fileType];
		return this;
	}
	render() {
		this.compile();
		this.mapper = this.modules.reduce(function (value, module) {
			return module.getRenderedMap(value);
		}, {});

		Object.keys(this.mapper).forEach((to) => {
			const {from, data} = this.mapper[to];
			const currentFile = this.compiled[from];
			currentFile.setTags(data);
			currentFile.render(to);
			this.zip.file(to, currentFile.content, {createFolders: true});
		});
		this.sendEvent("syncing-zip");
		this.syncZip();
		return this;
	}
	syncZip() {
		Object.keys(this.xmlDocuments).forEach((fileName) => {
			this.zip.remove(fileName);
			const content = xml2str(this.xmlDocuments[fileName]);
			return this.zip.file(fileName, content, {createFolders: true});
		});
	}
	setData(data) {
		this.data = data;
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
			filePath,
		};
		Object.keys(defaults).forEach((key) => {
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
		this.templatedFiles = this.fileTypeConfig.getTemplatedFiles(this.zip);
		return this.templatedFiles;
	}
};

Docxtemplater.DocUtils = DocUtils;
Docxtemplater.Errors = require("./errors");
Docxtemplater.XmlTemplater = require("./xml-templater");
Docxtemplater.FileTypeConfig = require("./file-type-config");
Docxtemplater.XmlMatcher = require("./xml-matcher");
module.exports = Docxtemplater;
