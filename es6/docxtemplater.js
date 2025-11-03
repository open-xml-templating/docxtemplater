const DocUtils = require("./doc-utils.js");
const z = require("./minizod.js");

// Schema definitions for DXT.ConstructorOptions
const dxtSyntaxSchema = z.object({
	allowUnopenedTag: z.boolean().optional(),
	allowUnclosedTag: z.boolean().optional(),
	allowUnbalancedLoops: z.boolean().optional(),
	changeDelimiterPrefix: z.string().optional().nullable(),
});

const dxtOptionsSchema = z
	.object({
		delimiters: z
			.object({
				start: z.string().nullable(),
				end: z.string().nullable(),
			})
			.strict()
			.optional(),
		fileTypeConfig: z.object({}).optional(),
		paragraphLoop: z.boolean().optional(),
		parser: z.function().optional(),
		errorLogging: z.union([z.boolean(), z.string()]).optional(),
		linebreaks: z.boolean().optional(),
		nullGetter: z.function().optional(),
		syntax: dxtSyntaxSchema.optional(),
		stripInvalidXMLChars: z.boolean().optional(),
		warnFn: z.function().optional(),
	})
	.strict();

const { getRelsTypes } = require("./get-relation-types.js");
const {
	collectContentTypes,
	getContentTypes,
} = require("./get-content-types.js");

const moduleWrapper = require("./module-wrapper.js");
const traits = require("./traits.js");
const commonModule = require("./modules/common.js");
const createScope = require("./scope-manager.js");
const Lexer = require("./lexer.js");
const { getTags } = require("./get-tags.js");
const logErrors = require("./error-logger.js");
const {
	throwMultiError,
	throwResolveBeforeCompile,
	throwRenderInvalidTemplate,
	throwRenderTwice,
	XTInternalError,
	XTTemplateError,
	throwFileTypeNotIdentified,
	throwFileTypeNotHandled,
	throwApiVersionError,
} = require("./errors.js");

DocUtils.getRelsTypes = getRelsTypes;
DocUtils.traits = traits;
DocUtils.moduleWrapper = moduleWrapper;
DocUtils.collectContentTypes = collectContentTypes;
DocUtils.getContentTypes = getContentTypes;

const {
	getDefaults,
	str2xml,
	xml2str,
	concatArrays,
	uniq,
	getDuplicates,
	stableSort,
	pushArray,
	utf8ToWord,
	invertMap,
} = DocUtils;

const ctXML = "[Content_Types].xml";
const relsFile = "_rels/.rels";
const currentModuleApiVersion = [3, 47, 2];

function throwIfDuplicateModules(modules) {
	const duplicates = getDuplicates(modules.map(({ name }) => name));
	if (duplicates.length > 0) {
		throw new XTInternalError(
			`Detected duplicate module "${duplicates[0]}"`
		);
	}
}

function addXmlFileNamesFromXmlContentType(doc) {
	for (const module of doc.modules) {
		for (const contentType of module.xmlContentTypes || []) {
			const candidates = doc.invertedContentTypes[contentType] || [];
			for (const candidate of candidates) {
				if (doc.zip.files[candidate]) {
					doc.options.xmlFileNames.push(candidate);
				}
			}
		}
	}
}

function reorderModules(modules) {
	/**
	 * Modules will be sorted according to priority.
	 *
	 * Input example:
	 * [
	 *   { priority: 1, name: "FooMod" },
	 *   { priority: -1, name: "XMod" },
	 *   { priority: 4, name: "OtherMod" }
	 * ]
	 *
	 * Output example (sorted by priority in descending order):
	 * [
	 *   { priority: 4, name: "OtherMod" },
	 *   { priority: 1, name: "FooMod" },
	 *   { priority: -1, name: "XMod" }
	 * ]
	 * Tested in #test-reorder-modules
	 */
	return stableSort(
		modules,
		(m1, m2) => (m2.priority || 0) - (m1.priority || 0)
	);
}

function zipFileOrder(files) {
	const allFiles = [];
	for (const name in files) {
		allFiles.push(name);
	}
	/*
	 * The first files that need to be put in the zip file are :
	 * [Content_Types].xml and _rels/.rels
	 */
	const resultFiles = [ctXML, relsFile];

	/*
	 * The next files that should be in the zip file are :
	 *
	 * - word/* (ie word/document.xml, word/header1.xml, ...)
	 * - xl/* (ie xl/worksheets/sheet1.xml)
	 * - ppt/* (ie ppt/slides/slide1.xml)
	 */
	const prefixes = ["word/", "xl/", "ppt/"];
	for (const name of allFiles) {
		for (const prefix of prefixes) {
			if (name.indexOf(`${prefix}`) === 0) {
				resultFiles.push(name);
			}
		}
	}

	/*
	 * Push the rest of files, such as docProps/core.xml and docProps/app.xml
	 */
	for (const name of allFiles) {
		if (resultFiles.indexOf(name) === -1) {
			resultFiles.push(name);
		}
	}
	return resultFiles;
}

function deprecatedMessage(obj, message) {
	if (obj.hideDeprecations === true) {
		return;
	}
	// eslint-disable-next-line no-console
	console.warn(message);
}

function deprecatedMethod(obj, method) {
	if (obj.hideDeprecations === true) {
		return;
	}
	return deprecatedMessage(
		obj,
		`Deprecated method ".${method}", view upgrade guide : https://docxtemplater.com/docs/api/#upgrade-guide, stack : ${new Error().stack}`
	);
}

function dropUnsupportedFileTypesModules(doc) {
	doc.modules = doc.modules.filter((module) => {
		if (!module.supportedFileTypes) {
			return true;
		}

		if (!Array.isArray(module.supportedFileTypes)) {
			throw new Error(
				"The supportedFileTypes field of the module must be an array"
			);
		}

		const isSupportedModule = module.supportedFileTypes.includes(
			doc.fileType
		);

		if (!isSupportedModule) {
			module.on("detached");
		}

		return isSupportedModule;
	});
}

function verifyErrors(doc) {
	const { compiled } = doc;
	doc.errors = concatArrays(
		Object.keys(compiled).map((name) => compiled[name].allErrors)
	);

	if (doc.errors.length !== 0) {
		if (doc.options.errorLogging) {
			logErrors(doc.errors, doc.options.errorLogging);
		}
		throwMultiError(doc.errors);
	}
}

function isBuffer(v) {
	return (
		typeof Buffer !== "undefined" &&
		typeof Buffer.isBuffer === "function" &&
		Buffer.isBuffer(v)
	);
}

const Docxtemplater = class Docxtemplater {
	constructor(zip, { modules = [], ...options } = {}) {
		this.targets = [];
		this.rendered = false;
		this.scopeManagers = {};
		this.compiled = {};
		this.modules = [commonModule()];
		this.xmlDocuments = {};

		if (arguments.length === 0) {
			deprecatedMessage(
				this,
				`Deprecated docxtemplater constructor with no arguments, view upgrade guide : https://docxtemplater.com/docs/api/#upgrade-guide, stack : ${new Error().stack}`
			);

			this.hideDeprecations = true;
			this.setOptions(options);
		} else {
			this.hideDeprecations = true;
			this.setOptions(options);
			if (isBuffer(zip)) {
				throw new Error(
					"You passed a Buffer to the Docxtemplater constructor. The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)"
				);
			}

			if (!zip || !zip.files || typeof zip.file !== "function") {
				throw new Error(
					"The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)"
				);
			}
			if (!Array.isArray(modules)) {
				throw new Error(
					"The modules argument of docxtemplater's constructor must be an array"
				);
			}
			for (const module of modules) {
				this.attachModule(module);
			}
			this.loadZip(zip);
			this.compile();
			this.v4Constructor = true;
		}
		this.hideDeprecations = false;
	}
	verifyApiVersion(neededVersion) {
		neededVersion = neededVersion.split(".").map((i) => parseInt(i, 10));
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
		for (const module of this.modules) {
			module.set(obj);
		}
	}
	sendEvent(eventName) {
		for (const module of this.modules) {
			module.on(eventName);
		}
	}
	attachModule(module) {
		if (this.v4Constructor) {
			throw new XTInternalError(
				"attachModule() should not be called manually when using the v4 constructor"
			);
		}
		deprecatedMethod(this, "attachModule");
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
	findModule(name) {
		for (const module of this.modules) {
			if (module.name === name) {
				return module;
			}
		}
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
		const result = dxtOptionsSchema.validate(options);
		if (result.success === false) {
			throw new Error(result.error);
		}

		deprecatedMethod(this, "setOptions");
		this.options = {};
		const defaults = getDefaults();
		for (const key in defaults) {
			const defaultValue = defaults[key];
			this.options[key] =
				options[key] != null ? options[key] : this[key] || defaultValue;
			this[key] = this.options[key];
		}
		this.delimiters.start &&= utf8ToWord(this.delimiters.start);
		this.delimiters.end &&= utf8ToWord(this.delimiters.end);
		return this;
	}
	loadZip(zip) {
		if (this.v4Constructor) {
			throw new Error(
				"loadZip() should not be called manually when using the v4 constructor"
			);
		}
		deprecatedMethod(this, "loadZip");
		if (zip.loadAsync) {
			throw new XTInternalError(
				"Docxtemplater doesn't handle JSZip version >=3, please use pizzip"
			);
		}
		if (zip.xtRendered) {
			this.options.warnFn([
				new Error(
					"This zip file appears to be the outcome of a previous docxtemplater generation. This typically indicates that docxtemplater was integrated by reusing the same zip file. It is recommended to create a new Pizzip instance for each docxtemplater generation."
				),
			]);
		}
		this.zip = zip;
		this.updateFileTypeConfig();

		this.modules = concatArrays([
			this.fileTypeConfig.baseModules.map((moduleFunction) =>
				moduleFunction()
			),
			this.modules,
		]);
		for (const module of this.modules) {
			module.zip = this.zip;
			module.docxtemplater = this;
			module.fileTypeConfig = this.fileTypeConfig;
			module.fileType = this.fileType;
			module.xtOptions = this.options;
			module.modules = this.modules;
		}

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
		this.scopeManagers[to] ||= createScope({
			tags,
			parser: this.parser,
			cachedParsers: currentFile.cachedParsers,
		});
		return this.scopeManagers[to];
	}
	resolveData(data) {
		deprecatedMethod(this, "resolveData");
		const errors = [];
		if (!Object.keys(this.compiled).length) {
			throwResolveBeforeCompile();
		}
		return Promise.resolve(data).then((data) => {
			this.data = data;
			this.setModules({
				data: this.data,
				Lexer,
			});
			this.mapper = this.modules.reduce(
				(value, module) => module.getRenderedMap(value),
				{}
			);
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
							(result) => {
								currentFile.scopeManager.finishedResolving = true;
								return result;
							},
							(errs) => {
								pushArray(errors, errs);
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
	compile() {
		deprecatedMethod(this, "compile");
		this.updateFileTypeConfig();
		throwIfDuplicateModules(this.modules);
		this.modules = reorderModules(this.modules);
		if (Object.keys(this.compiled).length) {
			return this;
		}
		let { options } = this;
		for (const module of this.modules) {
			options = module.optionsTransformer(options, this);
		}
		this.options = options;
		this.options.xmlFileNames = uniq(this.options.xmlFileNames);
		for (const fileName of this.options.xmlFileNames) {
			const content = this.zip.files[fileName].asText();
			this.xmlDocuments[fileName] = str2xml(content);
		}
		this.setModules({
			zip: this.zip,
			xmlDocuments: this.xmlDocuments,
		});
		for (const module of this.modules) {
			module.xmlDocuments = this.xmlDocuments;
		}
		this.getTemplatedFiles();
		/*
		 * Loop inside all templatedFiles (ie xml files with content).
		 * Sometimes they don't exist (footer.xml for example)
		 */
		this.sendEvent("before-preparse");
		for (const fileName of this.templatedFiles) {
			if (this.zip.files[fileName] != null) {
				this.precompileFile(fileName);
			}
		}
		this.sendEvent("after-preparse");
		for (const fileName of this.templatedFiles) {
			if (this.zip.files[fileName] != null) {
				this.compiled[fileName].parse({ noPostParse: true });
			}
		}
		this.sendEvent("after-parse");
		for (const fileName of this.templatedFiles) {
			if (this.zip.files[fileName] != null) {
				this.compiled[fileName].postparse();
			}
		}
		this.sendEvent("after-postparse");
		this.setModules({ compiled: this.compiled });
		verifyErrors(this);
		return this;
	}
	updateFileTypeConfig() {
		this.relsTypes = getRelsTypes(this.zip);
		const { overrides, defaults, contentTypes, contentTypeXml } =
			getContentTypes(this.zip);
		if (contentTypeXml) {
			this.filesContentTypes = collectContentTypes(
				overrides,
				defaults,
				this.zip
			);
			this.invertedContentTypes = invertMap(this.filesContentTypes);
			this.setModules({
				contentTypes: this.contentTypes,
				invertedContentTypes: this.invertedContentTypes,
			});
		}

		let fileType;
		if (this.zip.files.mimetype) {
			fileType = "odt";
		}
		for (const module of this.modules) {
			fileType =
				module.getFileType({
					zip: this.zip,
					contentTypes,
					contentTypeXml,
					overrides,
					defaults,
					doc: this,
				}) || fileType;
		}
		this.fileType = fileType;
		if (fileType === "odt") {
			throwFileTypeNotHandled(fileType);
		}
		if (!fileType) {
			throwFileTypeNotIdentified(this.zip);
		}

		addXmlFileNamesFromXmlContentType(this);
		dropUnsupportedFileTypesModules(this);

		this.fileTypeConfig =
			this.options.fileTypeConfig || this.fileTypeConfig;
		if (!this.fileTypeConfig) {
			if (Docxtemplater.FileTypeConfig[this.fileType]) {
				this.fileTypeConfig =
					Docxtemplater.FileTypeConfig[this.fileType]();
			} else {
				/*
				 * Error case handled since v3.60.2
				 * Throw specific error when trying to template xlsx file without xlsxmodule
				 */
				let message = `Filetype "${this.fileType}" is not supported`;
				let id = "filetype_not_supported";
				if (this.fileType === "xlsx") {
					message = `Filetype "${this.fileType}" is supported only with the paid XlsxModule`;
					id = "xlsx_filetype_needs_xlsx_module";
				}
				const err = new XTTemplateError(message);
				err.properties = {
					id,
					explanation: message,
				};
				throw err;
			}
		}
		return this;
	}
	renderAsync(data) {
		this.hideDeprecations = true;
		const promise = this.resolveData(data);
		this.hideDeprecations = false;
		this.zip.xtRendered = true;
		return promise.then(() => this.render());
	}
	render(data) {
		this.zip.xtRendered = true;
		if (this.rendered) {
			throwRenderTwice();
		}
		this.rendered = true;
		if (Object.keys(this.compiled).length === 0) {
			this.compile();
		}
		if (this.errors.length > 0) {
			throwRenderInvalidTemplate();
		}
		if (arguments.length > 0) {
			this.data = data;
		}
		this.setModules({
			data: this.data,
			Lexer,
		});
		this.mapper ||= this.modules.reduce(
			(value, module) => module.getRenderedMap(value),
			{}
		);

		const output = [];
		for (const to in this.mapper) {
			const { from, data } = this.mapper[to];
			const currentFile = this.compiled[from];
			currentFile.scopeManager = this.getScopeManager(
				to,
				currentFile,
				data
			);
			currentFile.render(to);
			output.push([to, currentFile.content, currentFile]);
			delete currentFile.content;
		}
		for (const outputPart of output) {
			const [, content, currentFile] = outputPart;
			for (const module of this.modules) {
				if (module.preZip) {
					const result = module.preZip(content, currentFile);
					if (typeof result === "string") {
						outputPart[1] = result;
					}
				}
			}
		}
		for (const [to, content] of output) {
			this.zip.file(to, content, { createFolders: true });
		}

		verifyErrors(this);
		this.sendEvent("syncing-zip");
		this.syncZip();
		// The synced-zip event is used in the subtemplate module for example
		this.sendEvent("synced-zip");
		return this;
	}
	syncZip() {
		for (const fileName in this.xmlDocuments) {
			this.zip.remove(fileName);
			const content = xml2str(this.xmlDocuments[fileName]);
			this.zip.file(fileName, content, { createFolders: true });
		}
	}
	setData(data) {
		deprecatedMethod(this, "setData");
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
		const defaults = getDefaults();
		const defaultKeys = pushArray(Object.keys(defaults), [
			"filesContentTypes",
			"fileTypeConfig",
			"fileType",
			"modules",
		]);
		for (const key of defaultKeys) {
			xmltOptions[key] = this[key];
		}

		return new Docxtemplater.XmlTemplater(content, xmltOptions);
	}
	getFullText(path) {
		return this.createTemplateClass(
			path || this.fileTypeConfig.textPath(this)
		).getFullText();
	}
	getTemplatedFiles() {
		this.templatedFiles = this.fileTypeConfig.getTemplatedFiles(this.zip);
		pushArray(this.templatedFiles, this.targets);
		const templatedNs = this.fileTypeConfig.templatedNs || [];
		if (templatedNs.length > 0) {
			for (const key in this.filesContentTypes) {
				if (/^customXml\/item\d+\.xml$/.test(key)) {
					for (const ns of templatedNs) {
						const text = this.zip.file(key).asText();
						if (text.indexOf(`xmlns="${ns}"`) !== -1) {
							this.templatedFiles.push(key);
						}
					}
				}
			}
		}
		this.templatedFiles = uniq(this.templatedFiles);
		return this.templatedFiles;
	}
	getTags() {
		const result = { headers: [], footers: [] };
		for (const key in this.compiled) {
			const contentType = this.filesContentTypes[key];
			if (
				contentType ===
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"
			) {
				result.document = {
					target: key,
					tags: getTags(this.compiled[key].postparsed),
				};
			}
			if (
				contentType ===
				"application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"
			) {
				result.headers.push({
					target: key,
					tags: getTags(this.compiled[key].postparsed),
				});
			}
			if (
				contentType ===
				"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"
			) {
				result.footers.push({
					target: key,
					tags: getTags(this.compiled[key].postparsed),
				});
			}
		}
		return result;
	}

	/* Export functions, present since 3.62.0 */
	toBuffer(options) {
		return this.zip.generate({
			compression: "DEFLATE",
			fileOrder: zipFileOrder,
			...options,
			type: "nodebuffer",
		});
	}
	/* Export functions, present since 3.62.0 */
	toBlob(options) {
		return this.zip.generate({
			compression: "DEFLATE",
			fileOrder: zipFileOrder,
			...options,
			type: "blob",
		});
	}
	/* Export functions, present since 3.62.0 */
	toBase64(options) {
		return this.zip.generate({
			compression: "DEFLATE",
			fileOrder: zipFileOrder,
			...options,
			type: "base64",
		});
	}
	/* Export functions, present since 3.62.0 */
	toUint8Array(options) {
		return this.zip.generate({
			compression: "DEFLATE",
			fileOrder: zipFileOrder,
			...options,
			type: "uint8array",
		});
	}
	/* Export functions, present since 3.62.0 */
	toArrayBuffer(options) {
		return this.zip.generate({
			compression: "DEFLATE",
			fileOrder: zipFileOrder,
			...options,
			type: "arraybuffer",
		});
	}
};

Docxtemplater.DocUtils = DocUtils;
Docxtemplater.Errors = require("./errors.js");
Docxtemplater.XmlTemplater = require("./xml-templater.js");
Docxtemplater.FileTypeConfig = require("./file-type-config.js");
Docxtemplater.XmlMatcher = require("./xml-matcher.js");

module.exports = Docxtemplater;
module.exports.default = Docxtemplater;
