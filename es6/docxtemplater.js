"use strict";

const DocUtils = require("./doc-utils");
DocUtils.traits = require("./traits");
DocUtils.moduleWrapper = require("./module-wrapper");
const { throwMultiError } = require("./errors");

const collectContentTypes = require("./collect-content-types");
const ctXML = "[Content_Types].xml";
const commonModule = require("./modules/common");

const Lexer = require("./lexer");
const {
	defaults,
	str2xml,
	xml2str,
	moduleWrapper,
	utf8ToWord,
	concatArrays,
	unique,
} = DocUtils;
const {
	XTInternalError,
	throwFileTypeNotIdentified,
	throwFileTypeNotHandled,
	throwApiVersionError,
} = require("./errors");

const currentModuleApiVersion = [3, 24, 0];

const Docxtemplater = class Docxtemplater {
	constructor(zip, { modules = [], ...options } = {}) {
		if (!Array.isArray(modules)) {
			throw new Error(
				"The modules argument of docxtemplater's constructor must be an array"
			);
		}
		this.compiled = {};
		this.modules = [commonModule()];
		this.setOptions(options);
		modules.forEach((module) => {
			this.attachModule(module);
		});
		if (zip) {
			if (!zip.files || typeof zip.file !== "function") {
				throw new Error(
					"The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)"
				);
			}
			this.loadZip(zip);
			// remove the unsupported modules
			this.modules = this.modules.filter((module) => {
				if (module.supportedFileTypes) {
					if (!Array.isArray(module.supportedFileTypes)) {
						throw new Error(
							"The supportedFileTypes field of the module must be an array"
						);
					}
					const isSupportedModule =
						module.supportedFileTypes.indexOf(this.fileType) !== -1;
					if (!isSupportedModule) {
						module.on("detached");
					}
					return isSupportedModule;
				}
				return true;
			});
			this.compile();
			this.v4Constructor = true;
		}
	}
	getModuleApiVersion() {
		return currentModuleApiVersion.join(".");
	}
	verifyApiVersion(neededVersion) {
		neededVersion = neededVersion.split(".").map(function (i) {
			return parseInt(i, 10);
		});
		if (neededVersion.length !== 3) {
			throwApiVersionError("neededVersion is not a valid version", {
				neededVersion,
				explanation: "the neededVersion must be an array of length 3",
			});
		}
		if (neededVersion[0] !== currentModuleApiVersion[0]) {
			throwApiVersionError(
				"The major api version do not match, you probably have to update docxtemplater with npm install --save docxtemplater",
				{
					neededVersion,
					currentModuleApiVersion,
					explanation: `moduleAPIVersionMismatch : needed=${neededVersion.join(
						"."
					)}, current=${currentModuleApiVersion.join(".")}`,
				}
			);
		}
		if (neededVersion[1] > currentModuleApiVersion[1]) {
			throwApiVersionError(
				"The minor api version is not uptodate, you probably have to update docxtemplater with npm install --save docxtemplater",
				{
					neededVersion,
					currentModuleApiVersion,
					explanation: `moduleAPIVersionMismatch : needed=${neededVersion.join(
						"."
					)}, current=${currentModuleApiVersion.join(".")}`,
				}
			);
		}
		if (
			neededVersion[1] === currentModuleApiVersion[1] &&
			neededVersion[2] > currentModuleApiVersion[2]
		) {
			throwApiVersionError(
				"The patch api version is not uptodate, you probably have to update docxtemplater with npm install --save docxtemplater",
				{
					neededVersion,
					currentModuleApiVersion,
					explanation: `moduleAPIVersionMismatch : needed=${neededVersion.join(
						"."
					)}, current=${currentModuleApiVersion.join(".")}`,
				}
			);
		}
		return true;
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
		if (this.v4Constructor) {
			throw new Error(
				"attachModule() should not be called manually when using the v4 constructor"
			);
		}
		if (module.requiredAPIVersion) {
			this.verifyApiVersion(module.requiredAPIVersion);
		}
		if (module.attached === true) {
			throw new Error(
				`Cannot attach a module that was already attached : "${module.name}". Maybe you are instantiating the module at the root level, and using it for multiple instances of Docxtemplater`
			);
		}
		module.attached = true;
		const { prefix } = options;
		if (prefix) {
			module.prefix = prefix;
		}
		const wrappedModule = moduleWrapper(module);
		this.modules.push(wrappedModule);
		wrappedModule.on("attached");
		return this;
	}
	setOptions(options) {
		if (this.v4Constructor) {
			throw new Error(
				"setOptions() should not be called manually when using the v4 constructor"
			);
		}
		if (!options) {
			throw new Error(
				"setOptions should be called with an object as first parameter"
			);
		}
		if (options.delimiters) {
			options.delimiters.start = utf8ToWord(options.delimiters.start);
			options.delimiters.end = utf8ToWord(options.delimiters.end);
		}
		this.options = {};
		Object.keys(defaults).forEach((key) => {
			const defaultValue = defaults[key];
			this.options[key] = options[key] != null ? options[key] : defaultValue;
			this[key] = this.options[key];
		});
		if (this.zip) {
			this.updateFileTypeConfig();
		}
		return this;
	}
	loadZip(zip) {
		if (zip.loadAsync) {
			throw new XTInternalError(
				"Docxtemplater doesn't handle JSZip version >=3, please use pizzip"
			);
		}
		this.zip = zip;
		this.updateFileTypeConfig();

		this.modules = concatArrays([
			this.fileTypeConfig.baseModules.map(function (moduleFunction) {
				return moduleFunction();
			}),
			this.modules,
		]);
		return this;
	}
	compileFile(fileName) {
		this.compiled[fileName].parse();
	}
	precompileFile(fileName) {
		const currentFile = this.createTemplateClass(fileName);
		currentFile.preparse();
		this.compiled[fileName] = currentFile;
	}
	resolveData(data) {
		let errors = [];
		return Promise.resolve(data)
			.then((data) => {
				return Promise.all(
					Object.keys(this.compiled).map((from) => {
						const currentFile = this.compiled[from];
						return currentFile.resolveTags(data).catch(function (errs) {
							errors = errors.concat(errs);
						});
					})
				);
			})
			.then((resolved) => {
				if (errors.length !== 0) {
					throwMultiError(errors);
				}
				return concatArrays(resolved);
			});
	}
	compile() {
		if (Object.keys(this.compiled).length) {
			return this;
		}
		this.options = this.modules.reduce((options, module) => {
			return module.optionsTransformer(options, this);
		}, this.options);
		this.options.xmlFileNames = unique(this.options.xmlFileNames);
		this.xmlDocuments = this.options.xmlFileNames.reduce(
			(xmlDocuments, fileName) => {
				const content = this.zip.files[fileName].asText();
				xmlDocuments[fileName] = str2xml(content);
				return xmlDocuments;
			},
			{}
		);
		this.setModules({
			zip: this.zip,
			xmlDocuments: this.xmlDocuments,
		});
		this.getTemplatedFiles();
		this.setModules({ compiled: this.compiled });
		// Loop inside all templatedFiles (ie xml files with content).
		// Sometimes they don't exist (footer.xml for example)
		this.templatedFiles.forEach((fileName) => {
			if (this.zip.files[fileName] != null) {
				this.precompileFile(fileName);
			}
		});
		this.templatedFiles.forEach((fileName) => {
			if (this.zip.files[fileName] != null) {
				this.compileFile(fileName);
			}
		});
		return this;
	}
	updateFileTypeConfig() {
		let fileType;
		if (this.zip.files.mimetype) {
			fileType = "odt";
		}
		const contentTypes = this.zip.files[ctXML];
		this.targets = [];
		const contentTypeXml = contentTypes ? str2xml(contentTypes.asText()) : null;
		const overrides = contentTypeXml
			? contentTypeXml.getElementsByTagName("Override")
			: null;
		const defaults = contentTypeXml
			? contentTypeXml.getElementsByTagName("Default")
			: null;
		if (contentTypeXml) {
			this.filesContentTypes = collectContentTypes(
				overrides,
				defaults,
				this.zip
			);
			this.invertedContentTypes = DocUtils.invertMap(this.filesContentTypes);
			this.setModules({
				contentTypes: this.contentTypes,
				invertedContentTypes: this.invertedContentTypes,
			});
		}
		this.modules.forEach((module) => {
			fileType =
				module.getFileType({
					zip: this.zip,
					contentTypes,
					contentTypeXml,
					overrides,
					defaults,
					doc: this,
				}) || fileType;
		});
		if (fileType === "odt") {
			throwFileTypeNotHandled(fileType);
		}
		if (!fileType) {
			throwFileTypeNotIdentified();
		}

		this.fileType = fileType;

		this.fileTypeConfig =
			this.options.fileTypeConfig ||
			this.fileTypeConfig ||
			Docxtemplater.FileTypeConfig[this.fileType];
		return this;
	}
	render() {
		this.compile();
		this.setModules({
			data: this.data,
			Lexer,
		});
		this.mapper = this.modules.reduce(function (value, module) {
			return module.getRenderedMap(value);
		}, {});

		this.fileTypeConfig.tagsXmlLexedArray = unique(
			this.fileTypeConfig.tagsXmlLexedArray
		);
		this.fileTypeConfig.tagsXmlTextArray = unique(
			this.fileTypeConfig.tagsXmlTextArray
		);

		Object.keys(this.mapper).forEach((to) => {
			const { from, data } = this.mapper[to];
			const currentFile = this.compiled[from];
			currentFile.setTags(data);
			currentFile.render(to);
			this.zip.file(to, currentFile.content, { createFolders: true });
		});
		this.sendEvent("syncing-zip");
		this.syncZip();
		return this;
	}
	syncZip() {
		Object.keys(this.xmlDocuments).forEach((fileName) => {
			this.zip.remove(fileName);
			const content = xml2str(this.xmlDocuments[fileName]);
			return this.zip.file(fileName, content, { createFolders: true });
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
		const content = this.zip.files[path].asText();
		return this.createTemplateClassFromContent(content, path);
	}
	createTemplateClassFromContent(content, filePath) {
		const xmltOptions = {
			filePath,
			contentType: this.filesContentTypes[filePath],
		};
		Object.keys(defaults)
			.concat(["filesContentTypes", "fileTypeConfig", "modules"])
			.forEach((key) => {
				xmltOptions[key] = this[key];
			});
		return new Docxtemplater.XmlTemplater(content, xmltOptions);
	}
	getFullText(path) {
		return this.createTemplateClass(
			path || this.fileTypeConfig.textPath(this)
		).getFullText();
	}
	getTemplatedFiles() {
		this.templatedFiles = this.fileTypeConfig.getTemplatedFiles(this.zip);
		this.targets.forEach((target) => {
			this.templatedFiles.push(target);
		});
		return this.templatedFiles;
	}
};

Docxtemplater.DocUtils = DocUtils;
Docxtemplater.Errors = require("./errors");
Docxtemplater.XmlTemplater = require("./xml-templater");
Docxtemplater.FileTypeConfig = require("./file-type-config");
Docxtemplater.XmlMatcher = require("./xml-matcher");
module.exports = Docxtemplater;
