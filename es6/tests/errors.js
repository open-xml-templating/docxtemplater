"use strict";

var XmlTemplater = require("../xmlTemplater.js");
var expect = require("chai").expect;
var FileTypeConfig = require("../fileTypeConfig.js");
var expressions = require("angular-expressions");
function angularParser(tag) {
	var expr = expressions.compile(tag);
	return {
		get(scope) {
			return expr(scope);
		},
	};
}
var Errors = require("../errors.js");

function expectToThrow(obj, method, type, expectedError) {
	var e = null;
	try {
		obj[method]();
	}
	catch (error) {
		e = error;
	}
	expect(e, "No error has been thrown").not.to.be.equal(null);
	var toShowOnFail = e.stack;
	expect(e, toShowOnFail).to.be.an("object");
	expect(e, toShowOnFail).to.be.instanceOf(Error);
	expect(e, toShowOnFail).to.be.instanceOf(type);
	expect(e, toShowOnFail).to.have.property("properties");
	expect(e.properties, toShowOnFail).to.be.a("object");
	expect(e.properties, toShowOnFail).to.have.property("explanation");
	expect(e.properties.explanation, toShowOnFail).to.be.a("string");
	expect(e.properties, toShowOnFail).to.have.property("id");
	expect(e.properties.id, toShowOnFail).to.be.a("string");
	delete e.properties.explanation;
	delete e.stack;
	expect(JSON.parse(JSON.stringify(e))).to.be.deep.equal(expectedError);
}

describe("errors", function () {
	it("should be thrown when unclosedtag", function () {
		var content = "<w:t>{unclosedtag my text</w:t>";
		var scope = {};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		var expectedError = {
			name: "TemplateError",
			message: "Unclosed tag",
			properties: {
				context: "{unclosedtag my text",
				id: "unclosed_tag",
				xtag: "unclosedtag",
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTTemplateError, expectedError);
	});

	it("should be thrown when unclosedloop", function () {
		var content = "<w:t>{#loop} {foobar}</w:t>";
		var scope = {};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		var expectedError = {
			name: "TemplateError",
			message: "Unclosed loop",
			properties: {
				context: "{#loop} {foobar}",
				id: "unclosed_loop",
				xtag: "#loop",
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTTemplateError, expectedError);
	});

	it("should fail when rawtag not in paragraph", function () {
		var content = "<w:t>{@myrawtag}</w:t>";
		var scope = {myrawtag: "<w:p><w:t>foobar</w:t></w:p>"};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		var expectedError = {
			name: "TemplateError",
			message: "Can't find endTag",
			properties: {
				id: "raw_tag_outerxml_invalid",
				text: "<w:t>{@myrawtag}</w:t>",
				xmlTag: "w:p",
				previousEnd: 16,
				start: 5,
				xtag: "@myrawtag",
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTTemplateError, expectedError);

		content = "<w:t>{@myrawtag}</w:t></w:p>";
		scope = {myrawtag: "<w:p><w:t>foobar</w:t></w:p>"};
		xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		expectedError = {
			name: "TemplateError",
			message: "Can't find startTag",
			properties: {
				id: "raw_tag_outerxml_invalid",
				text: "<w:t>{@myrawtag}</w:t></w:p>",
				xmlTag: "w:p",
				previousEnd: 16,
				start: 5,
				xtag: "@myrawtag",
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTTemplateError, expectedError);
	});

	it("should fail when tag already opened", function () {
		var content = "<w:t>{user {name}</w:t>";
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx});
		var expectedError = {
			name: "TemplateError",
			message: "Unclosed tag",
			properties: {
				id: "unclosed_tag",
				context: "{user {",
				xtag: "user",
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTTemplateError, expectedError);
	});

	it("should fail when tag already closed", function () {
		var content = "<w:t>foobar}age</w:t>";
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx});
		var expectedError = {
			name: "TemplateError",
			message: "Unopened tag",
			properties: {
				id: "unopened_tag",
				context: "foobar}",
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTTemplateError, expectedError);
	});

	it("should fail when customparser fails to compile", function () {
		var content = "<w:t>{name++}</w:t>";
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: {name: 3}, parser: angularParser});
		var expectedError = {
			name: "ScopeParserError",
			message: "Scope parser compilation failed",
			properties: {
				id: "scopeparser_compilation_failed",
				tag: "name++",
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTScopeParserError, expectedError);
	});

	it("should fail when customparser fails to execute", function () {
		var content = "<w:t>{name|upper}</w:t>";
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: {name: 3}, parser: angularParser});
		var expectedError = {
			name: "ScopeParserError",
			message: "Scope parser execution failed",
			properties: {
				id: "scopeparser_execution_failed",
				tag: "name|upper",
				scope: {name: 3},
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTScopeParserError, expectedError);
	});

	it("should fail when rawtag is not only text in paragraph", function () {
		var content = "<w:p><w:t>{@myrawtag}</w:t><w:t>foobar</w:t></w:p>";
		var scope = {myrawtag: "<w:p><w:t>foobar</w:t></w:p>"};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		var expectedError = {
			name: "TemplateError",
			message: "Raw xml tag should be the only text in paragraph",
			properties: {
				id: "raw_xml_tag_should_be_only_text_in_paragraph",
				paragraphContent: "{@myrawtag}foobar",
				xtag: "@myrawtag",
				fullTag: "{@myrawtag}",
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTTemplateError, expectedError);
	});

	describe("internal errors", function () {
		it("should fail", function () {
			var expectedError = {
				name: "InternalError",
				message: "Content must be a string",
				properties:
					{id: "xmltemplater_content_must_be_string"},
			};
			var test = {fn() { return new XmlTemplater(1, {fileTypeConfig: FileTypeConfig.docx}); }};
			expectToThrow(test, "fn", Errors.XTInternalError, expectedError);
		});
	});
});
