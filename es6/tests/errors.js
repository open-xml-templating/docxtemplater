"use strict";

const testUtils = require("./utils");
const expect = testUtils.expect;
const _ = require("lodash");
const expressions = require("angular-expressions");
function angularParser(tag) {
	const expr = expressions.compile(tag);
	return {
		get(scope) {
			return expr(scope);
		},
	};
}
const Errors = require("../errors.js");

function expectToThrow(obj, method, type, expectedError) {
	let e = null;
	try {
		obj[method]();
	}
	catch (error) {
		e = error;
	}
	expect(e, "No error has been thrown").not.to.be.equal(null);
	const toShowOnFail = e.stack;
	expect(e, toShowOnFail).to.be.instanceOf(Error);
	expect(e, toShowOnFail).to.be.instanceOf(type);
	expect(e, toShowOnFail).to.be.an("object");
	expect(e, toShowOnFail).to.have.property("properties");
	expect(e.properties, toShowOnFail).to.be.an("object");
	expect(e.properties, toShowOnFail).to.have.property("explanation");
	expect(e.properties.explanation, toShowOnFail).to.be.a("string");
	expect(e.properties, toShowOnFail).to.have.property("id");
	expect(e.properties.id, toShowOnFail).to.be.a("string");
	expect(e.properties.explanation, toShowOnFail).to.be.a("string");
	delete e.properties.explanation;
	e = _.omit(e, ["line", "sourceURL", "stack"]);
	if (e.properties.rootError) {
		expect(e.properties.rootError.message).to.equal(expectedError.properties.rootError.message);
		delete e.properties.rootError;
		delete expectedError.properties.rootError;
	}
	if (e.properties.paragraphParts) {
		expect(e.properties.paragraphParts.length).to.equal(expectedError.properties.paragraphPartsLength);
		delete e.properties.paragraphParts;
		delete expectedError.properties.paragraphPartsLength;
	}
	if (e.stack) {
		expect(e.stack).to.contain("Error: " + expectedError.message);
		delete e.stack;
	}
	expect(JSON.parse(JSON.stringify(e))).to.be.deep.equal(expectedError);
}

describe("errors", function () {
	it("should be thrown when unclosedtag", function () {
		const content = "<w:t>{unclosedtag my text</w:t>";
		const tags = {};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags});
		const expectedError = {
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

	it("should not be possible to close {#users} with {/foo}", function () {
		const content = "<w:t>{#users}User {name}{/foo}</w:t>";
		const tags = {users: [{name: "John"}]};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags});
		const expectedError = {
			name: "TemplateError",
			message: "Closing tag does not match opening tag",
			properties: {
				id: "closing_tag_does_not_match_opening_tag",
				openingtag: "users",
				closingtag: "foo",
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTTemplateError, expectedError);
	});

	it("should be thrown when unopenedloop", function () {
		const content = "<w:t>{/loop} {foobar}</w:t>";
		const scope = {};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		const expectedError = {
			name: "TemplateError",
			message: "Unopened loop",
			properties: {
				id: "unopened_loop",
				xtag: "loop",
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTTemplateError, expectedError);
	});

	it("should be thrown when unclosedloop", function () {
		const content = "<w:t>{#loop} {foobar}</w:t>";
		const scope = {};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		const expectedError = {
			name: "TemplateError",
			message: "Unclosed loop",
			properties: {
				id: "unclosed_loop",
				xtag: "loop",
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTTemplateError, expectedError);
	});

	it("should fail when rawtag not in paragraph", function () {
		["<w:t>{@myrawtag}</w:t>", "<w:table><w:t>{@myrawtag}</w:t></w:table>"].forEach(function (content) {
			const scope = {myrawtag: "<w:p><w:t>foobar</w:t></w:p>"};
			const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
			const expectedError = {
				name: "TemplateError",
				message: "Raw tag not in paragraph",
				properties: {
					id: "raw_tag_outerxml_invalid",
					xtag: "myrawtag",
					rootError: {
						message: "No tag 'w:p' was found at the right",
					},
				},
			};
			expectToThrow(xmlTemplater, "render", Errors.XTTemplateError, expectedError);
		});
	});

	it("should fail when tag already opened", function () {
		const content = "<w:t>{user {name}</w:t>";
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content);
		const expectedError = {
			name: "TemplateError",
			message: "Unclosed tag",
			properties: {
				id: "unclosed_tag",
				context: "{user ",
				xtag: "user",
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTTemplateError, expectedError);
	});

	it("should fail when tag already closed", function () {
		const content = "<w:t>foobar}age</w:t>";
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content);
		const expectedError = {
			name: "TemplateError",
			message: "Unopened tag",
			properties: {
				id: "unopened_tag",
				context: "foobar",
				xtag: "foobar",
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTTemplateError, expectedError);
	});

	it("should fail when customparser fails to compile", function () {
		const content = "<w:t>{name++}</w:t>";
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: {name: 3}, parser: angularParser});
		const expectedError = {
			name: "ScopeParserError",
			message: "Scope parser compilation failed",
			properties: {
				id: "scopeparser_compilation_failed",
				tag: "name++",
				rootError: {
					message: "Syntax Error: Token 'undefined' not a primary expression at column NaN of the expression [name++] starting at [name++].",
				},
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTScopeParserError, expectedError);
	});

	it("should fail when customparser fails to execute", function () {
		const content = "<w:t>{name|upper}</w:t>";
		function errorParser() {
			return {
				get() {
					throw new Error("foo bar");
				},
			};
		}
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: {name: 3}, parser: errorParser});
		const expectedError = {
			name: "ScopeParserError",
			message: "Scope parser execution failed",
			properties: {
				id: "scopeparser_execution_failed",
				tag: "name|upper",
				scope: {name: 3},
				rootError: {
					message: "foo bar",
				},
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTScopeParserError, expectedError);
	});

	it("should fail when rawtag is not only text in paragraph", function () {
		const content = "<w:p><w:t>{@myrawtag}</w:t><w:t>foobar</w:t></w:p>";
		const scope = {myrawtag: "<w:p><w:t>foobar</w:t></w:p>"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		const expectedError = {
			name: "TemplateError",
			message: "Raw tag should be the only text in paragraph",
			properties: {
				id: "raw_xml_tag_should_be_only_text_in_paragraph",
				xtag: "myrawtag",
				paragraphPartsLength: 6,
			},
		};
		expectToThrow(xmlTemplater, "render", Errors.XTTemplateError, expectedError);
	});

	describe("internal errors", function () {
		it("should fail", function () {
			const expectedError = {
				name: "InternalError",
				message: "Content must be a string",
				properties:
					{id: "xmltemplater_content_must_be_string"},
			};
			const test = {fn() { return testUtils.createXmlTemplaterDocx(1); }};
			expectToThrow(test, "fn", Errors.XTInternalError, expectedError);
		});
	});
});
