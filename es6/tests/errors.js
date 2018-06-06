"use strict";

const expressions = require("angular-expressions");

const { loadFile, loadDocument, rejectSoon } = require("./utils");
const Errors = require("../errors.js");
const {
	createXmlTemplaterDocx,
	wrapMultiError,
	expectToThrowAsync,
} = require("./utils");

function angularParser(tag) {
	const expr = expressions.compile(tag.replace(/’/g, "'"));
	return {
		get(scope) {
			return expr(scope);
		},
	};
}

describe("Compilation errors", function() {
	it("should fail when parsing invalid xml (1)", function(done) {
		const content = "<w:t";
		const expectedError = {
			name: "TemplateError",
			message: "An XML file has invalid xml",
			properties: {
				content,
				offset: 0,
				id: "file_has_invalid_xml",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});

	it("should fail when parsing invalid xml (2)", function(done) {
		const content =
			"<w:t>Foobar </w:t><w:t>Foobar </w:t><w:t>Foobar </w:t> <w:t John Jane Mary Doe</w:t>";
		const expectedError = {
			name: "TemplateError",
			message: "An XML file has invalid xml",
			properties: {
				content,
				offset: 55,
				id: "file_has_invalid_xml",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});

	it("should fail when tag unclosed at end of document", function(done) {
		const content = "<w:t>{unclosedtag my text</w:t>";
		const expectedError = {
			name: "TemplateError",
			message: "Unclosed tag",
			properties: {
				context: "{unclosedtag my text",
				id: "unclosed_tag",
				xtag: "unclosedtag",
				offset: 0,
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(
			create,
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		).then(() => {
			done();
		});
	});

	it("should fail when tag unclosed", function(done) {
		const content = "<w:t>{user {name}</w:t>";
		const expectedError = {
			name: "TemplateError",
			message: "Unclosed tag",
			properties: {
				id: "unclosed_tag",
				context: "{user ",
				xtag: "user",
				offset: 0,
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(
			create,
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		).then(() => {
			done();
		});
	});

	it("should fail when tag unopened", function(done) {
		const content = "<w:t>foobar}age</w:t>";
		const expectedError = {
			name: "TemplateError",
			message: "Unopened tag",
			properties: {
				id: "unopened_tag",
				context: "foobar",
				offset: 6,
				xtag: "foobar",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(
			create,
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		).then(() => {
			done();
		});
	});

	it("should fail when closing {#users} with {/foo}", function(done) {
		const content = "<w:t>{#users}User {name}{/foo}</w:t>";
		const expectedError = {
			name: "TemplateError",
			message: "Closing tag does not match opening tag",
			properties: {
				id: "closing_tag_does_not_match_opening_tag",
				openingtag: "users",
				closingtag: "foo",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(
			create,
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		).then(() => {
			done();
		});
	});

	it("should fail when closing an unopened loop", function(done) {
		const content = "<w:t>{/loop} {foobar}</w:t>";
		const expectedError = {
			name: "TemplateError",
			message: "Unopened loop",
			properties: {
				id: "unopened_loop",
				xtag: "loop",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(
			create,
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		).then(() => {
			done();
		});
	});

	it("should fail when a loop is never closed", function(done) {
		const content = "<w:t>{#loop} {foobar}</w:t>";
		const expectedError = {
			name: "TemplateError",
			message: "Unclosed loop",
			properties: {
				id: "unclosed_loop",
				xtag: "loop",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(
			create,
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		).then(() => {
			done();
		});
	});

	it("should fail when rawtag is not in paragraph", function(done) {
		const content = "<w:t>{@myrawtag}</w:t>";
		const expectedError = {
			name: "TemplateError",
			message: "Raw tag not in paragraph",
			properties: {
				expandTo: "w:p",
				id: "raw_tag_outerxml_invalid",
				offset: 0,
				index: 1,
				postparsed: [
					{
						position: "start",
						text: true,
						type: "tag",
						value: "<w:t>",
						tag: "w:t",
					},
					{
						module: "rawxml",
						type: "placeholder",
						value: "myrawtag",
					},
					{
						position: "end",
						text: true,
						type: "tag",
						value: "</w:t>",
						tag: "w:t",
					},
				],
				xtag: "myrawtag",
				rootError: {
					message: 'No tag "w:p" was found at the right',
				},
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(
			create,
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		).then(() => {
			done();
		});
	});

	it("should fail when rawtag is in table without paragraph", function(done) {
		const content = "<w:table><w:t>{@myrawtag}</w:t></w:p></w:table>";
		const expectedError = {
			name: "TemplateError",
			message: "Raw tag not in paragraph",
			properties: {
				id: "raw_tag_outerxml_invalid",
				xtag: "myrawtag",
				postparsed: [
					{
						type: "tag",
						position: "start",
						text: false,
						value: "<w:table>",
						tag: "w:table",
					},
					{
						type: "tag",
						position: "start",
						text: true,
						value: "<w:t>",
						tag: "w:t",
					},
					{
						type: "placeholder",
						value: "myrawtag",
						module: "rawxml",
					},
					{
						type: "tag",
						position: "end",
						text: true,
						value: "</w:t>",
						tag: "w:t",
					},
					{
						type: "tag",
						position: "end",
						text: false,
						value: "</w:p>",
						tag: "w:p",
					},
					{
						type: "tag",
						position: "end",
						text: false,
						value: "</w:table>",
						tag: "w:table",
					},
				],
				rootError: {
					message: 'No tag "w:p" was found at the left',
				},
				expandTo: "w:p",
				index: 2,
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(
			create,
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		).then(() => {
			done();
		});
	});

	it("should fail when rawtag is not only text in paragraph", function(done) {
		const content = "<w:p><w:t> {@myrawtag}</w:t><w:t>foobar</w:t></w:p>";
		const expectedError = {
			name: "TemplateError",
			message: "Raw tag should be the only text in paragraph",
			properties: {
				id: "raw_xml_tag_should_be_only_text_in_paragraph",
				xtag: "myrawtag",
				offset: 1,
				paragraphPartsLength: 7,
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(
			create,
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		).then(() => {
			done();
		});
	});

	it("should fail when customparser fails to compile", function(done) {
		const content = "<w:t>{name++}</w:t>";
		const expectedError = {
			name: "ScopeParserError",
			message: "Scope parser compilation failed",
			properties: {
				id: "scopeparser_compilation_failed",
				tag: "name++",
				rootError: {
					message:
						"Syntax Error: Token 'undefined' not a primary expression at column NaN of the expression [name++] starting at [name++].",
				},
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser,
		});
		expectToThrowAsync(
			create,
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		).then(() => {
			done();
		});
	});
});

describe("Runtime errors", function() {
	it("should fail when customparser fails to execute", function(done) {
		const content = "<w:t>{name|upper}</w:t>";
		function errorParser() {
			return {
				get() {
					throw new Error("foo bar");
				},
			};
		}
		const expectedError = {
			name: "ScopeParserError",
			message: "Scope parser execution failed",
			properties: {
				id: "scopeparser_execution_failed",
				tag: "name|upper",
				scope: {},
				rootError: {
					message: "foo bar",
				},
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {
			parser: errorParser,
		});
		expectToThrowAsync(create, Errors.XTScopeParserError, expectedError).then(() => {
			done();
		});
	});
});

describe("Internal errors", function() {
	it("should fail if using odt format", function(done) {
		const expectedError = {
			name: "InternalError",
			message: 'The filetype "odt" is not handled by docxtemplater',
			properties: {
				id: "filetype_not_handled",
			},
		};
		loadFile("test.odt", (e, name, buffer) => {
			function create() {
				return loadDocument(name, buffer);
			}
			expectToThrowAsync(create, Errors.XTInternalError, expectedError).then(() => {
				done();
			});
		});
	});
});

describe("Multi errors", function() {
	it("should work with multiple errors simple", function(done) {
		const content = "<w:t>foo} Hello {user, my age is {bar}</w:t>";
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				id: "multi_error",
				errors: [
					{
						message: "Unopened tag",
						name: "TemplateError",
						properties: {
							offset: 3,
							context: "foo",
							id: "unopened_tag",
							xtag: "foo",
						},
					},
					{
						message: "Unclosed tag",
						name: "TemplateError",
						properties: {
							offset: 11,
							context: "{user, my age is ",
							id: "unclosed_tag",
							xtag: "user,",
						},
					},
				],
			},
		};

		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});

	it("should work with multiple errors complex", function(done) {
		const content = `<w:t>foo}
		Hello {user, my age is {bar}
		Hi bang}, my name is {user2}
		Hey {user}, my age is {bar}
		Hola {bang}, my name is {user2}
		{user, my age is {bar
		</w:t>`
			.replace(/\t/g, "")
			.split("\n")
			.join("!");
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				id: "multi_error",
				errors: [
					{
						name: "TemplateError",
						message: "Unopened tag",
						properties: {
							xtag: "foo",
							id: "unopened_tag",
							context: "foo",
						},
					},
					{
						name: "TemplateError",
						message: "Unclosed tag",
						properties: {
							xtag: "user,",
							id: "unclosed_tag",
							context: "{user, my age is ",
						},
					},
					{
						name: "TemplateError",
						message: "Unopened tag",
						properties: {
							xtag: "bang",
							id: "unopened_tag",
							context: "}!Hi bang",
						},
					},
					{
						name: "TemplateError",
						message: "Unclosed tag",
						properties: {
							xtag: "user,",
							id: "unclosed_tag",
							context: "{user, my age is ",
						},
					},
					{
						name: "TemplateError",
						message: "Unclosed tag",
						properties: {
							xtag: "bar!",
							id: "unclosed_tag",
							context: "{bar!",
						},
					},
				],
			},
		};

		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});

	it("should work with loops", function(done) {
		const content = `
		<w:t>{#users}User name{/foo}
		{#bang}User name{/baz}
		</w:t>
		`;
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [
					{
						name: "TemplateError",
						message: "Closing tag does not match opening tag",
						properties: {
							id: "closing_tag_does_not_match_opening_tag",
							openingtag: "users",
							closingtag: "foo",
						},
					},
					{
						name: "TemplateError",
						message: "Closing tag does not match opening tag",
						properties: {
							id: "closing_tag_does_not_match_opening_tag",
							openingtag: "bang",
							closingtag: "baz",
						},
					},
				],
				id: "multi_error",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});

	it("should work with loops unopened", function(done) {
		const content = `
		<w:t>{/loop} {#users}User name{/foo}
		{#bang}User name{/baz}
		{/fff}
		{#yum}
		</w:t>
		`;
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [
					{
						name: "TemplateError",
						message: "Unopened loop",
						properties: {
							id: "unopened_loop",
							xtag: "loop",
						},
					},
					{
						name: "TemplateError",
						message: "Closing tag does not match opening tag",
						properties: {
							id: "closing_tag_does_not_match_opening_tag",
							openingtag: "users",
							closingtag: "foo",
						},
					},
					{
						name: "TemplateError",
						message: "Closing tag does not match opening tag",
						properties: {
							id: "closing_tag_does_not_match_opening_tag",
							openingtag: "bang",
							closingtag: "baz",
						},
					},
					{
						name: "TemplateError",
						message: "Unopened loop",
						properties: {
							id: "unopened_loop",
							xtag: "fff",
						},
					},
					{
						name: "TemplateError",
						message: "Unclosed loop",
						properties: {
							id: "unclosed_loop",
							xtag: "yum",
						},
					},
				],
				id: "multi_error",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});

	it("should fail when rawtag is not in paragraph", function(done) {
		const content = "<w:t>{@first}</w:t><w:p><w:t>foo{@second}</w:t></w:p>";
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [
					{
						name: "TemplateError",
						message: "Raw tag not in paragraph",
						properties: {
							id: "raw_tag_outerxml_invalid",
							xtag: "first",
							rootError: {
								message: 'No tag "w:p" was found at the left',
							},
							postparsedLength: 9,
							expandTo: "w:p",
							offset: 0,
							index: 1,
						},
					},
					{
						name: "TemplateError",
						message: "Raw tag should be the only text in paragraph",
						properties: {
							id: "raw_xml_tag_should_be_only_text_in_paragraph",
							paragraphPartsLength: 4,
							xtag: "second",
							offset: 11,
						},
					},
				],
				id: "multi_error",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content);
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});
	it("should fail when customparser fails to compile", function(done) {
		const content = "<w:t>{name++} {foo|||bang}</w:t>";
		const expectedError = {
			message: "Multi error",
			name: "TemplateError",
			properties: {
				errors: [
					{
						name: "ScopeParserError",
						message: "Scope parser compilation failed",
						properties: {
							id: "scopeparser_compilation_failed",
							tag: "name++",
							rootError: {
								message:
									"Syntax Error: Token 'undefined' not a primary expression at column NaN of the expression [name++] starting at [name++].",
							},
						},
					},
					{
						name: "ScopeParserError",
						message: "Scope parser compilation failed",
						properties: {
							id: "scopeparser_compilation_failed",
							tag: "foo|||bang",
							rootError: {
								message:
									"Syntax Error: Token 'bang' is an unexpected token at column 7 of the expression [foo|||bang] starting at [bang].",
							},
						},
					},
				],
				id: "multi_error",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser,
		});
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});

	it("should fail when customparser fails to compile", function(done) {
		const content = "<w:t>{name++} {foo|||bang}</w:t>";
		const expectedError = {
			message: "Multi error",
			name: "TemplateError",
			properties: {
				errors: [
					{
						name: "ScopeParserError",
						message: "Scope parser compilation failed",
						properties: {
							id: "scopeparser_compilation_failed",
							tag: "name++",
							rootError: {
								message:
									"Syntax Error: Token 'undefined' not a primary expression at column NaN of the expression [name++] starting at [name++].",
							},
						},
					},
					{
						name: "ScopeParserError",
						message: "Scope parser compilation failed",
						properties: {
							id: "scopeparser_compilation_failed",
							tag: "foo|||bang",
							rootError: {
								message:
									"Syntax Error: Token 'bang' is an unexpected token at column 7 of the expression [foo|||bang] starting at [bang].",
							},
						},
					},
				],
				id: "multi_error",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser,
		});
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});

	it("should work with lexer and customparser", function(done) {
		const content = "<w:t>foo} Hello {name++}</w:t>";
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				id: "multi_error",
				errors: [
					{
						message: "Unopened tag",
						name: "TemplateError",
						properties: {
							context: "foo",
							id: "unopened_tag",
							xtag: "foo",
						},
					},
					{
						message: "Scope parser compilation failed",
						name: "ScopeParserError",
						properties: {
							id: "scopeparser_compilation_failed",
							tag: "name++",
							rootError: {
								message:
									"Syntax Error: Token 'undefined' not a primary expression at column NaN of the expression [name++] starting at [name++].",
							},
						},
					},
				],
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser,
		});
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});

	it("should work with lexer and loop", function(done) {
		const content = "<w:t>foo} The users are {#users}{/bar}</w:t>";
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				id: "multi_error",
				errors: [
					{
						message: "Unopened tag",
						name: "TemplateError",
						properties: {
							context: "foo",
							id: "unopened_tag",
							xtag: "foo",
						},
					},
					{
						name: "TemplateError",
						message: "Closing tag does not match opening tag",
						properties: {
							id: "closing_tag_does_not_match_opening_tag",
							openingtag: "users",
							closingtag: "bar",
						},
					},
				],
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser,
		});
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});

	it("should work with multiple errors", function(done) {
		const content =
			"<w:t>foo</w:t><w:t>} The users are {#users}{/bar} {@bang} </w:t>";
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				id: "multi_error",
				errors: [
					{
						message: "Unopened tag",
						name: "TemplateError",
						properties: {
							context: "foo",
							id: "unopened_tag",
							xtag: "foo",
						},
					},
					{
						name: "TemplateError",
						message: "Closing tag does not match opening tag",
						properties: {
							id: "closing_tag_does_not_match_opening_tag",
							openingtag: "users",
							closingtag: "bar",
							offset: [19, 27],
						},
					},
					{
						name: "TemplateError",
						message: "Raw tag not in paragraph",
						properties: {
							id: "raw_tag_outerxml_invalid",
							xtag: "bang",
							rootError: {
								message: 'No tag "w:p" was found at the right',
							},
							postparsedLength: 12,
							expandTo: "w:p",
							index: 9,
						},
					},
				],
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser,
		});
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});

	it("should work with multiple unclosed", function(done) {
		const content = `<w:t>foo</w:t>
		<w:t>{city, {state {zip </w:t>`;
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [
					{
						name: "TemplateError",
						message: "Unclosed tag",
						properties: {
							offset: 3,
							xtag: "city,",
							id: "unclosed_tag",
							context: "{city, ",
						},
					},
					{
						name: "TemplateError",
						message: "Unclosed tag",
						properties: {
							offset: 10,
							xtag: "state",
							id: "unclosed_tag",
							context: "{state ",
						},
					},
					{
						name: "TemplateError",
						message: "Unclosed tag",
						properties: {
							offset: 17,
							xtag: "zip",
							id: "unclosed_tag",
							context: "{zip ",
						},
					},
				],
				id: "multi_error",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser,
		});
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});

	it("should work with multiple unopened", function(done) {
		const content = `<w:t>foo</w:t>
		<w:t> city}, state} zip}</w:t>`;
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [
					{
						name: "TemplateError",
						message: "Unopened tag",
						properties: {
							xtag: "city",
							id: "unopened_tag",
							context: "foo city",
						},
					},
					{
						name: "TemplateError",
						message: "Unopened tag",
						properties: {
							xtag: "state",
							id: "unopened_tag",
							context: "}, state",
						},
					},
					{
						name: "TemplateError",
						message: "Unopened tag",
						properties: {
							xtag: "zip",
							id: "unopened_tag",
							context: "} zip",
						},
					},
				],
				id: "multi_error",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser,
		});
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});

	it("should show an error when loop tag are badly used (xml open count !== xml close count)", function(done) {
		const content = `<w:tbl>
      <w:tr>
        <w:tc>
          <w:p> <w:r> <w:t>{#users}</w:t> </w:r> <w:r> <w:t>test</w:t> </w:r> </w:p>
        </w:tc>
        <w:tc>
          <w:p> <w:r> <w:t>test2</w:t> </w:r> </w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    <w:p>
      <w:r> <w:t>{/users}</w:t> </w:r>
    </w:p>`;
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [
					{
						name: "TemplateError",
						message:
							'The position of the loop tags "users" would produce invalid XML',
						properties: {
							tag: "users",
							id: "loop_position_invalid",
						},
					},
				],
				id: "multi_error",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser,
		});
		expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
			done();
		});
	});
});

describe("Rendering error", function() {
	it("should show an error when using corrupt characters", function(done) {
		const content = "<w:t>{user}</w:t>";
		const expectedError = {
			name: "RenderingError",
			message: "There are some XML corrupt characters",
			properties: {
				id: "invalid_xml_characters",
				value: "\u001c",
				xtag: "user",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser,
			tags: { user: String.fromCharCode(28) },
		});
		expectToThrowAsync(create, Errors.RenderingError, expectedError).then(() => {
			done();
		});
	});
});

describe("Async errors", function() {
	it("should show error when having async promise", function(done) {
		const content = "<w:t>{user}</w:t>";
		const expectedError = {
			name: "ScopeParserError",
			message: "Scope parser execution failed",
			properties: {
				id: "scopeparser_execution_failed",
				tag: "user",
				scope: {
					user: {},
				},
				rootError: {
					message: "Foobar",
				},
			},
		};
		createXmlTemplaterDocx(content).then(doc => {
			function create() {
				return doc.resolveData({ user: rejectSoon(new Error("Foobar")) });
			}
			expectToThrowAsync(create, Errors.XTScopeParserError, expectedError).then(() => {
				done();
			});
		});
	});
});
