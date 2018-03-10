"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DocUtils = require("./doc-utils");
DocUtils.traits = require("./traits");
DocUtils.moduleWrapper = require("./module-wrapper");
var defaults = DocUtils.defaults,
    str2xml = DocUtils.str2xml,
    xml2str = DocUtils.xml2str,
    moduleWrapper = DocUtils.moduleWrapper,
    concatArrays = DocUtils.concatArrays,
    unique = DocUtils.unique;

var _require = require("./errors"),
    XTInternalError = _require.XTInternalError,
    throwFileTypeNotIdentified = _require.throwFileTypeNotIdentified,
    throwFileTypeNotHandled = _require.throwFileTypeNotHandled;

var Docxtemplater = function () {
	function Docxtemplater() {
		_classCallCheck(this, Docxtemplater);

		if (arguments.length > 0) {
			throw new Error("The constructor with parameters has been removed in docxtemplater 3.0, please check the upgrade guide.");
		}
		this.compiled = {};
		this.modules = [];
		this.setOptions({});
	}

	_createClass(Docxtemplater, [{
		key: "setModules",
		value: function setModules(obj) {
			this.modules.forEach(function (module) {
				module.set(obj);
			});
		}
	}, {
		key: "sendEvent",
		value: function sendEvent(eventName) {
			this.modules.forEach(function (module) {
				module.on(eventName);
			});
		}
	}, {
		key: "attachModule",
		value: function attachModule(module) {
			var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
			var prefix = options.prefix;

			if (prefix) {
				module.prefix = prefix;
			}
			this.modules.push(moduleWrapper(module));
			return this;
		}
	}, {
		key: "setOptions",
		value: function setOptions(options) {
			var _this = this;

			this.options = options;
			Object.keys(defaults).forEach(function (key) {
				var defaultValue = defaults[key];
				_this.options[key] = _this.options[key] != null ? _this.options[key] : defaultValue;
				_this[key] = _this.options[key];
			});
			if (this.zip) {
				this.updateFileTypeConfig();
			}
			return this;
		}
	}, {
		key: "loadZip",
		value: function loadZip(zip) {
			if (zip.loadAsync) {
				throw new XTInternalError("Docxtemplater doesn't handle JSZip version >=3, see changelog");
			}
			this.zip = zip;
			this.updateFileTypeConfig();

			this.modules = concatArrays([this.fileTypeConfig.baseModules.map(function (moduleFunction) {
				return moduleFunction();
			}), this.modules]);
			return this;
		}
	}, {
		key: "compileFile",
		value: function compileFile(fileName) {
			var currentFile = this.createTemplateClass(fileName);
			currentFile.parse();
			this.compiled[fileName] = currentFile;
		}
	}, {
		key: "compile",
		value: function compile() {
			var _this2 = this;

			if (Object.keys(this.compiled).length) {
				return this;
			}
			this.options = this.modules.reduce(function (options, module) {
				return module.optionsTransformer(options, _this2);
			}, this.options);
			this.options.xmlFileNames = unique(this.options.xmlFileNames);
			this.xmlDocuments = this.options.xmlFileNames.reduce(function (xmlDocuments, fileName) {
				var content = _this2.zip.files[fileName].asText();
				xmlDocuments[fileName] = str2xml(content);
				return xmlDocuments;
			}, {});
			this.setModules({
				zip: this.zip,
				xmlDocuments: this.xmlDocuments,
				data: this.data
			});
			this.getTemplatedFiles();
			this.setModules({ compiled: this.compiled });
			// Loop inside all templatedFiles (ie xml files with content).
			// Sometimes they don't exist (footer.xml for example)
			this.templatedFiles.forEach(function (fileName) {
				if (_this2.zip.files[fileName] != null) {
					_this2.compileFile(fileName);
				}
			});
			return this;
		}
	}, {
		key: "updateFileTypeConfig",
		value: function updateFileTypeConfig() {
			var fileType = void 0;
			if (this.zip.files.mimetype) {
				fileType = "odt";
			}
			if (this.zip.files["word/document.xml"] || this.zip.files["word/document2.xml"]) {
				fileType = "docx";
			}
			if (this.zip.files["ppt/presentation.xml"]) {
				fileType = "pptx";
			}

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
	}, {
		key: "render",
		value: function render() {
			var _this3 = this;

			this.compile();
			this.mapper = this.modules.reduce(function (value, module) {
				return module.getRenderedMap(value);
			}, {});

			this.fileTypeConfig.tagsXmlLexedArray = unique(this.fileTypeConfig.tagsXmlLexedArray);
			this.fileTypeConfig.tagsXmlTextArray = unique(this.fileTypeConfig.tagsXmlTextArray);

			Object.keys(this.mapper).forEach(function (to) {
				var _mapper$to = _this3.mapper[to],
				    from = _mapper$to.from,
				    data = _mapper$to.data;

				var currentFile = _this3.compiled[from];
				currentFile.setTags(data);
				currentFile.render(to);
				_this3.zip.file(to, currentFile.content, { createFolders: true });
			});
			this.sendEvent("syncing-zip");
			this.syncZip();
			return this;
		}
	}, {
		key: "syncZip",
		value: function syncZip() {
			var _this4 = this;

			Object.keys(this.xmlDocuments).forEach(function (fileName) {
				_this4.zip.remove(fileName);
				var content = xml2str(_this4.xmlDocuments[fileName]);
				return _this4.zip.file(fileName, content, { createFolders: true });
			});
		}
	}, {
		key: "setData",
		value: function setData(data) {
			this.data = data;
			return this;
		}
	}, {
		key: "getZip",
		value: function getZip() {
			return this.zip;
		}
	}, {
		key: "createTemplateClass",
		value: function createTemplateClass(path) {
			var usedData = this.zip.files[path].asText();
			return this.createTemplateClassFromContent(usedData, path);
		}
	}, {
		key: "createTemplateClassFromContent",
		value: function createTemplateClassFromContent(content, filePath) {
			var _this5 = this;

			var xmltOptions = {
				filePath: filePath
			};
			Object.keys(defaults).forEach(function (key) {
				xmltOptions[key] = _this5[key];
			});
			xmltOptions.fileTypeConfig = this.fileTypeConfig;
			xmltOptions.modules = this.modules;
			return new Docxtemplater.XmlTemplater(content, xmltOptions);
		}
	}, {
		key: "getFullText",
		value: function getFullText(path) {
			return this.createTemplateClass(path || this.fileTypeConfig.textPath(this.zip)).getFullText();
		}
	}, {
		key: "getTemplatedFiles",
		value: function getTemplatedFiles() {
			this.templatedFiles = this.fileTypeConfig.getTemplatedFiles(this.zip);
			return this.templatedFiles;
		}
	}]);

	return Docxtemplater;
}();

Docxtemplater.DocUtils = DocUtils;
Docxtemplater.Errors = require("./errors");
Docxtemplater.XmlTemplater = require("./xml-templater");
Docxtemplater.FileTypeConfig = require("./file-type-config");
Docxtemplater.XmlMatcher = require("./xml-matcher");
module.exports = Docxtemplater;