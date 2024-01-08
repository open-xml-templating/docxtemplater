const DocUtils = require("./doc-utils.js");
DocUtils.traits = require("./traits.js");
DocUtils.moduleWrapper = require("./module-wrapper.js");
const createScope = require("./scope-manager.js");
const {
	throwMultiError,
	throwResolveBeforeCompile,
	throwRenderInvalidTemplate,
	throwRenderTwice,
} = require("./errors.js");

const logErrors = require("./error-logger.js");
const collectContentTypes = require("./collect-content-types.js");
const ctXML = "[Content_Types].xml";
const relsFile = "_rels/.rels";
const commonModule = require("./modules/common.js");

const Lexer = require("./lexer.js");
const {
	defaults,
	str2xml,
	xml2str,
	moduleWrapper,
	concatArrays,
	uniq,
	getDuplicates,
	stableSort,
} = DocUtils;
const {
	XTInternalError,
	throwFileTypeNotIdentified,
	throwFileTypeNotHandled,
	throwApiVersionError,
} = require("./errors.js");

const currentModuleApiVersion = [3, 38, 0];

function dropUnsupportedFileTypesModules(dx) {
	dx.modules = dx.modules.filter((module) => {
		if (module.supportedFileTypes) {
			if (!Array.isArray(module.supportedFileTypes)) {
				throw new Error(
					"The supportedFileTypes field of the module must be an array"
				);
			}
			const isSupportedModule =
				module.supportedFileTypes.indexOf(dx.fileType) !== -1;
			if (!isSupportedModule) {
				module.on("detached");
			}
			return isSupportedModule;
		}
		return true;
	});
}

const Docxtemplater = class Docxtemplater {
	constructor(zip, { modules = [], ...options } = {}) {
		if (!Array.isArray(modules)) {
			throw new Error(
				"The modules argument of docxtemplater's constructor must be an array"
			);
		}
		this.targets = [];
		this.rendered = false;
		this.scopeManagers = {};
		this.compiled = {};
		this.modules = [commonModule()];
		this.setOptions(options);
		modules.forEach((module) => {
			this.attachModule(module);
		});
		if (arguments.length > 0) {
			if (!zip || !zip.files || typeof zip.file !== "function") {
				throw new Error(
					"The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)"
				);
			}
			this.loadZip(zip);
			this.compile();
			this.v4Constructor = true;
		}
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
	attachModule(module) {
		if (this.v4Constructor) {
			throw new XTInternalError(
				"attachModule() should not be called manually when using the v4 constructor"
			);
		}
		const moduleType = typeof module;
		if (moduleType === "function") {
			throw new XTInternalError(
				"Cannot attach a class/function as a module. Most probably you forgot to instantiate the module by using `new` on the module."
			);
		}
		if (!module || moduleType !== "object") {
			throw new XTInternalError("Cannot attachModule with a falsy value");
		}
		if (module.requiredAPIVersion) {
			this.verifyApiVersion(module.requiredAPIVersion);
		}
		if (module.attached === true) {
			if (typeof module.clone === "function") {
				module = module.clone();
			} else {
				throw new Error(
					`Cannot attach a module that was already attached : "${module.name}". The most likely cause is that you are instantiating the module at the root level, and using it for multiple instances of Docxtemplater`
				);
			}
		}
		module.attached = true;
		const wrappedModule = moduleWrapper(module);
		this.modules.push(wrappedModule);
		wrappedModule.on("attached");
		if (this.fileType) {
			dropUnsupportedFileTypesModules(this);
		}
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
		this.options = {};
		Object.keys(defaults).forEach((key) => {
			const defaultValue = defaults[key];
			this.options[key] =
				options[key] != null ? options[key] : this[key] || defaultValue;
			this[key] = this.options[key];
		});
		this.delimiters.start = DocUtils.utf8ToWord(this.delimiters.start);
		this.delimiters.end = DocUtils.utf8ToWord(this.delimiters.end);
		return this;
	}
	loadZip(zip) {
		if (this.v4Constructor) {
			throw new Error(
				"loadZip() should not be called manually when using the v4 constructor"
			);
		}
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

		dropUnsupportedFileTypesModules(this);
		return this;
	}
	precompileFile(fileName) {
		const currentFile = this.createTemplateClass(fileName);
		currentFile.preparse();
		this.compiled[fileName] = currentFile;
	}
	compileFile(fileName) {
		this.compiled[fileName].parse();
	}
	getScopeManager(to, currentFile, tags) {
		if (!this.scopeManagers[to]) {
			this.scopeManagers[to] = createScope({
				tags,
				parser: this.parser,
				cachedParsers: currentFile.cachedParsers,
			});
		}
		return this.scopeManagers[to];
	}
	resolveData(data) {
		const errors = [];
		if (!Object.keys(this.compiled).length) {
			throwResolveBeforeCompile();
		}
		return Promise.resolve(data).then((data) => {
			this.setData(data);
			this.setModules({
				data: this.data,
				Lexer,
			});
			this.mapper = this.modules.reduce(function (value, module) {
				return module.getRenderedMap(value);
			}, {});
			return Promise.all(
				Object.keys(this.mapper).map((to) => {
					const { from, data } = this.mapper[to];
					return Promise.resolve(data).then((data) => {
						const currentFile = this.compiled[from];
						currentFile.filePath = to;
						currentFile.scopeManager = this.getScopeManager(
							to,
							currentFile,
							data
						);
						return currentFile.resolveTags(data).then(
							function (result) {
								currentFile.scopeManager.finishedResolving = true;
								return result;
							},
							function (errs) {
								Array.prototype.push.apply(errors, errs);
							}
						);
					});
				})
			).then((resolved) => {
				if (errors.length !== 0) {
					if (this.options.errorLogging) {
						logErrors(errors, this.options.errorLogging);
					}
					throwMultiError(errors);
				}
				return concatArrays(resolved);
			});
		});
	}
	reorderModules() {
		this.modules = stableSort(
			this.modules,
			(m1, m2) => (m2.priority || 0) - (m1.priority || 0)
		);
	}
	throwIfDuplicateModules() {
		const duplicates = getDuplicates(this.modules.map(({ name }) => name));
		if (duplicates.length > 0) {
			throw new XTInternalError(`Detected duplicate module "${duplicates[0]}"`);
		}
	}
	compile() {
		this.updateFileTypeConfig();
		this.throwIfDuplicateModules();
		this.reorderModules();
		if (Object.keys(this.compiled).length) {
			return this;
		}
		this.options = this.modules.reduce((options, module) => {
			return module.optionsTransformer(options, this);
		}, this.options);
		this.options.xmlFileNames = uniq(this.options.xmlFileNames);
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
		this.setModules({ compiled: this.compiled });
		verifyErrors(this);
		return this;
	}
	getRelsTypes() {
		const rootRels = this.zip.files[relsFile];
		const rootRelsXml = rootRels ? str2xml(rootRels.asText()) : null;
		const rootRelationships = rootRelsXml
			? rootRelsXml.getElementsByTagName("Relationship")
			: [];
		const relsTypes = {};
		for (let i = 0, len = rootRelationships.length; i < len; i++) {
			const r = rootRelationships[i];
			relsTypes[r.getAttribute("Target")] = r.getAttribute("Type");
		}
		return relsTypes;
	}
	getContentTypes() {
		const contentTypes = this.zip.files[ctXML];
		const contentTypeXml = contentTypes ? str2xml(contentTypes.asText()) : null;
		const overrides = contentTypeXml
			? contentTypeXml.getElementsByTagName("Override")
			: null;
		const defaults = contentTypeXml
			? contentTypeXml.getElementsByTagName("Default")
			: null;

		return { overrides, defaults, contentTypes, contentTypeXml };
	}
	updateFileTypeConfig() {
		let fileType;
		if (this.zip.files.mimetype) {
			fileType = "odt";
		}
		this.relsTypes = this.getRelsTypes();
		const { overrides, defaults, contentTypes, contentTypeXml } =
			this.getContentTypes();
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
		dropUnsupportedFileTypesModules(this);

		this.fileTypeConfig =
			this.options.fileTypeConfig ||
			this.fileTypeConfig ||
			Docxtemplater.FileTypeConfig[this.fileType]();
		return this;
	}
	renderAsync(data) {
		return this.resolveData(data).then(() => {
			return this.render();
		});
	}
	render(data) {
		if (this.rendered) {
			throwRenderTwice();
		}
		this.rendered = true;
		this.compile();
		if (this.errors.length > 0) {
			throwRenderInvalidTemplate();
		}
		if (data) {
			this.setData(data);
		}
		this.setModules({
			data: this.data,
			Lexer,
		});
		this.mapper =
			this.mapper ||
			this.modules.reduce(function (value, module) {
				return module.getRenderedMap(value);
			}, {});

		Object.keys(this.mapper).forEach((to) => {
			const { from, data } = this.mapper[to];
			const currentFile = this.compiled[from];
			currentFile.scopeManager = this.getScopeManager(to, currentFile, data);
			currentFile.render(to);
			this.zip.file(to, currentFile.content, { createFolders: true });
		});

		verifyErrors(this);
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
			relsType: this.relsTypes[filePath],
		};
		Object.keys(defaults)
			.concat(["filesContentTypes", "fileTypeConfig", "fileType", "modules"])
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
		this.templatedFiles = uniq(this.templatedFiles);
		return this.templatedFiles;
	}
};

function verifyErrors(doc) {
	const compiled = doc.compiled;
	doc.errors = concatArrays(
		Object.keys(compiled).map((name) => {
			return compiled[name].allErrors;
		})
	);

	if (doc.errors.length !== 0) {
		if (doc.options.errorLogging) {
			logErrors(doc.errors, doc.options.errorLogging);
		}
		throwMultiError(doc.errors);
	}
}

Docxtemplater.DocUtils = DocUtils;
Docxtemplater.Errors = require("./errors.js");
Docxtemplater.XmlTemplater = require("./xml-templater.js");
Docxtemplater.FileTypeConfig = require("./file-type-config.js");
Docxtemplater.XmlMatcher = require("./xml-matcher.js");
module.exports = Docxtemplater;
module.exports.default = Docxtemplater;
