"use strict";

const {wordToUtf8, convertSpaces, defaults} = require("./doc-utils");
const createScope = require("./scope-manager");
const xmlMatcher = require("./xml-matcher");
const {throwMultiError, throwContentMustBeString} = require("./errors");
const Lexer = require("./lexer");
const Parser = require("./parser.js");
const {render} = require("./render.js");

function getFullText(content, tagsXmlArray) {
	const matcher = xmlMatcher(content, tagsXmlArray);
	const result = matcher.matches.map(function (match) {
		return match.array[2];
	});
	return wordToUtf8(convertSpaces(result.join("")));
}

module.exports = class XmlTemplater {
	constructor(content, options) {
		this.fromJson(options);
		this.setModules({inspect: {filePath: this.filePath}});
		this.load(content);
	}
	load(content) {
		if (typeof content !== "string") {
			throwContentMustBeString(typeof content);
		}
		this.content = content;
	}
	setTags(tags) {
		this.tags = (tags != null) ? tags : {};
		this.scopeManager = createScope({tags: this.tags, parser: this.parser});
		return this;
	}
	fromJson(options) {
		this.filePath = options.filePath;
		this.modules = options.modules;
		this.fileTypeConfig = options.fileTypeConfig;
		Object.keys(defaults).map(function (key) {
			this[key] = options[key] != null ? options[key] : defaults[key];
		}, this);
	}
	getFullText() {
		return getFullText(this.content, this.fileTypeConfig.tagsXmlTextArray);
	}
	setModules(obj) {
		this.modules.forEach((module) => {
			module.set(obj);
		});
	}
	parse() {
		let allErrors = [];
		this.xmllexed = Lexer.xmlparse(this.content, {text: this.fileTypeConfig.tagsXmlTextArray, other: this.fileTypeConfig.tagsXmlLexedArray});
		this.setModules({inspect: {xmllexed: this.xmllexed}});
		const {lexed, errors: lexerErrors} = Lexer.parse(this.xmllexed, this.delimiters);
		allErrors = allErrors.concat(lexerErrors);
		this.lexed = lexed;
		this.setModules({inspect: {lexed: this.lexed}});
		this.parsed = Parser.parse(this.lexed, this.modules);
		this.setModules({inspect: {parsed: this.parsed}});
		const {postparsed, errors: postparsedErrors} = Parser.postparse(this.parsed, this.modules);
		this.postparsed = postparsed;
		this.setModules({inspect: {postparsed: this.postparsed}});
		allErrors = allErrors.concat(postparsedErrors);
		this.errorChecker(allErrors);
		return this;
	}
	errorChecker(errors) {
		if (errors.length) {
			this.modules.forEach(function (module) {
				errors = module.errorsTransformer(errors);
			});
			errors.forEach((error) => {
				error.properties.file = this.filePath;
			});
			throwMultiError(errors);
		}
	}
	/*
	content is the whole content to be tagged
	scope is the current scope
	returns the new content of the tagged content
	*/
	render(to) {
		this.filePath = to;
		const options = {
			compiled: this.postparsed,
			tags: this.tags,
			modules: this.modules,
			parser: this.parser,
			nullGetter: this.nullGetter,
			filePath: this.filePath,
			render,
		};
		options.scopeManager = createScope(options);
		const {errors, parts} = render(options);
		this.errorChecker(errors);
		this.content = parts.join("");
		this.setModules({inspect: {content: this.content}});
		return this;
	}
};
