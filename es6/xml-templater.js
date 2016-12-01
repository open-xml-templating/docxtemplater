"use strict";

const DocUtils = require("./doc-utils");
const ScopeManager = require("./scope-manager");
const xmlMatcher = require("./xml-matcher");
const Errors = require("./errors");
const Lexer = require("./lexer");
const Parser = require("./parser.js");
const render = require("./render.js");

function getFullText(content, tagsXmlArray) {
	const matcher = xmlMatcher(content, tagsXmlArray);
	const result = matcher.matches.map(function (match) {
		return match.array[2];
	});
	return DocUtils.wordToUtf8(DocUtils.convertSpaces(result.join("")));
}

module.exports = class XmlTemplater {
	constructor(content, options) {
		this.fromJson(options);
		this.setModules({inspect: {filePath: this.filePath}});
		this.load(content);
	}
	load(content) {
		if (typeof content !== "string") {
			const err = new Errors.XTInternalError("Content must be a string");
			err.properties.id = "xmltemplater_content_must_be_string";
			throw err;
		}
		this.content = content;
	}
	fromJson(options) {
		this.tags = (options.tags != null) ? options.tags : {};
		this.filePath = options.filePath;
		this.modules = options.modules;
		this.fileTypeConfig = options.fileTypeConfig;
		this.scopeManager = ScopeManager.createBaseScopeManager({tags: this.tags, parser: this.parser});
		Object.keys(DocUtils.defaults).map(function (key) {
			const defaultValue = DocUtils.defaults[key];
			this[key] = options[key] != null ? options[key] : defaultValue;
		}, this);
	}
	getFullText() {
		return getFullText(this.content, this.fileTypeConfig.tagsXmlTextArray);
	}
	setModules(obj) {
		this.modules.forEach((module) => {
			if (module.set) {
				module.set(obj);
			}
		});
	}
	/*
	content is the whole content to be tagged
	scope is the current scope
	returns the new content of the tagged content
	*/
	render() {
		this.xmllexed = Lexer.xmlparse(this.content, {text: this.fileTypeConfig.tagsXmlTextArray, other: this.fileTypeConfig.tagsXmlLexedArray});
		this.setModules({inspect: {xmllexed: this.xmllexed}});
		this.lexed = Lexer.parse(this.xmllexed, this.delimiters);
		this.setModules({inspect: {lexed: this.lexed}});
		this.parsed = Parser.parse(this.lexed, this.modules);
		this.setModules({inspect: {parsed: this.parsed}});
		this.postparsed = Parser.postparse(this.parsed, this.modules);
		this.setModules({inspect: {postparsed: this.postparsed}});
		this.content = render({
			compiled: this.postparsed,
			tags: this.tags,
			modules: this.modules,
			parser: this.parser,
			nullGetter: this.nullGetter,
			filePath: this.filePath,
		});
		this.setModules({inspect: {content: this.content}});
		return this;
	}
};
