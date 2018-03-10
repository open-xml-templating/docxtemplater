"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("./doc-utils"),
    wordToUtf8 = _require.wordToUtf8,
    convertSpaces = _require.convertSpaces,
    defaults = _require.defaults;

var createScope = require("./scope-manager");
var xmlMatcher = require("./xml-matcher");

var _require2 = require("./errors"),
    throwMultiError = _require2.throwMultiError,
    throwContentMustBeString = _require2.throwContentMustBeString;

var Lexer = require("./lexer");
var Parser = require("./parser.js");

var _require3 = require("./render.js"),
    _render = _require3.render;

function _getFullText(content, tagsXmlArray) {
	var matcher = xmlMatcher(content, tagsXmlArray);
	var result = matcher.matches.map(function (match) {
		return match.array[2];
	});
	return wordToUtf8(convertSpaces(result.join("")));
}

module.exports = function () {
	function XmlTemplater(content, options) {
		_classCallCheck(this, XmlTemplater);

		this.fromJson(options);
		this.setModules({ inspect: { filePath: this.filePath } });
		this.load(content);
	}

	_createClass(XmlTemplater, [{
		key: "load",
		value: function load(content) {
			if (typeof content !== "string") {
				throwContentMustBeString(typeof content === "undefined" ? "undefined" : _typeof(content));
			}
			this.content = content;
		}
	}, {
		key: "setTags",
		value: function setTags(tags) {
			this.tags = tags != null ? tags : {};
			this.scopeManager = createScope({ tags: this.tags, parser: this.parser });
			return this;
		}
	}, {
		key: "fromJson",
		value: function fromJson(options) {
			this.filePath = options.filePath;
			this.modules = options.modules;
			this.fileTypeConfig = options.fileTypeConfig;
			Object.keys(defaults).map(function (key) {
				this[key] = options[key] != null ? options[key] : defaults[key];
			}, this);
		}
	}, {
		key: "getFullText",
		value: function getFullText() {
			return _getFullText(this.content, this.fileTypeConfig.tagsXmlTextArray);
		}
	}, {
		key: "setModules",
		value: function setModules(obj) {
			this.modules.forEach(function (module) {
				module.set(obj);
			});
		}
	}, {
		key: "parse",
		value: function parse() {
			var allErrors = [];
			this.xmllexed = Lexer.xmlparse(this.content, {
				text: this.fileTypeConfig.tagsXmlTextArray,
				other: this.fileTypeConfig.tagsXmlLexedArray
			});
			this.setModules({ inspect: { xmllexed: this.xmllexed } });

			var _Lexer$parse = Lexer.parse(this.xmllexed, this.delimiters),
			    lexed = _Lexer$parse.lexed,
			    lexerErrors = _Lexer$parse.errors;

			allErrors = allErrors.concat(lexerErrors);
			this.lexed = lexed;
			this.setModules({ inspect: { lexed: this.lexed } });
			this.parsed = Parser.parse(this.lexed, this.modules);
			this.setModules({ inspect: { parsed: this.parsed } });

			var _Parser$postparse = Parser.postparse(this.parsed, this.modules),
			    postparsed = _Parser$postparse.postparsed,
			    postparsedErrors = _Parser$postparse.errors;

			this.postparsed = postparsed;
			this.setModules({ inspect: { postparsed: this.postparsed } });
			allErrors = allErrors.concat(postparsedErrors);
			this.errorChecker(allErrors);
			return this;
		}
	}, {
		key: "errorChecker",
		value: function errorChecker(errors) {
			var _this = this;

			if (errors.length) {
				this.modules.forEach(function (module) {
					errors = module.errorsTransformer(errors);
				});
				errors.forEach(function (error) {
					error.properties.file = _this.filePath;
				});
				throwMultiError(errors);
			}
		}
		/*
  content is the whole content to be tagged
  scope is the current scope
  returns the new content of the tagged content
  */

	}, {
		key: "render",
		value: function render(to) {
			this.filePath = to;
			var options = {
				compiled: this.postparsed,
				tags: this.tags,
				modules: this.modules,
				parser: this.parser,
				nullGetter: this.nullGetter,
				filePath: this.filePath,
				render: _render
			};
			options.scopeManager = createScope(options);

			var _render2 = _render(options),
			    errors = _render2.errors,
			    parts = _render2.parts;

			this.errorChecker(errors);
			this.content = parts.join("");
			this.setModules({ inspect: { content: this.content } });
			return this;
		}
	}]);

	return XmlTemplater;
}();