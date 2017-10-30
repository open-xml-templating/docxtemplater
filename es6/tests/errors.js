"use strict";

const expressions = require("angular-expressions");

const {loadFile, loadDocument} = require("./utils");
const Errors = require("../errors.js");
const {createXmlTemplaterDocx, wrapMultiError, expectToThrow} = require("./utils");

function angularParser(tag) {
	const expr = expressions.compile(tag.replace(/’/g, "'"));
	return {
		get(scope) {
			return expr(scope);
		},
	};
}

describe("compilation errors", function () {
	it("should fail when tag unclosed at end of document", function () {
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
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when tag unclosed", function () {
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
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when tag unopened", function () {
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
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when closing {#users} with {/foo}", function () {
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
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when closing an unopened loop", function () {
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
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when a loop is never closed", function () {
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
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when rawtag is not in paragraph", function () {
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
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when rawtag is in table without paragraph", function () {
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
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when rawtag is not only text in paragraph", function () {
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
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when customparser fails to compile", function () {
		const content = "<w:t>{name++}</w:t>";
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
		const create = createXmlTemplaterDocx.bind(null, content, {parser: angularParser});
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});
});

describe("runtime errors", function () {
	it("should fail when customparser fails to execute", function () {
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
		const create = createXmlTemplaterDocx.bind(null, content, {parser: errorParser});
		expectToThrow(create, Errors.XTScopeParserError, expectedError);
	});
});

describe("internal errors", function () {
	it("should fail if using odt format", function (done) {
		const expectedError = {
			name: "InternalError",
			message: "The filetype \"odt\" is not handled by docxtemplater",
			properties: {
				id: "filetype_not_handled",
			},
		};
		loadFile("test.odt", (e, name, buffer) => {
			function create() {
				loadDocument(name, buffer);
			}
			expectToThrow(create, Errors.XTInternalError, expectedError);
			done();
		});
	});
});

describe("multi errors", function () {
	it("should work with multiple errors simple", function () {
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
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with multiple errors complex", function () {
		const content = `<w:t>foo}
		Hello {user, my age is {bar}
		Hi bang}, my name is {user2}
		Hey {user}, my age is {bar}
		Hola {bang}, my name is {user2}
		{user, my age is {bar
		</w:t>`.replace(/\t/g, "").split("\n").join("!");
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
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with loops", function () {
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
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with loops unopened", function () {
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
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should fail when rawtag is not in paragraph", function () {
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
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});
	it("should fail when customparser fails to compile", function () {
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
								message: "Syntax Error: Token 'undefined' not a primary expression at column NaN of the expression [name++] starting at [name++].",
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
								message: "Syntax Error: Token 'bang' is an unexpected token at column 7 of the expression [foo|||bang] starting at [bang].",
							},
						},
					},
				],
				id: "multi_error",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {parser: angularParser});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should fail when customparser fails to compile", function () {
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
								message: "Syntax Error: Token 'undefined' not a primary expression at column NaN of the expression [name++] starting at [name++].",
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
								message: "Syntax Error: Token 'bang' is an unexpected token at column 7 of the expression [foo|||bang] starting at [bang].",
							},
						},
					},
				],
				id: "multi_error",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {parser: angularParser});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with lexer and customparser", function () {
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
								message: "Syntax Error: Token 'undefined' not a primary expression at column NaN of the expression [name++] starting at [name++].",
							},
						},
					},
				],
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {parser: angularParser});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with lexer and loop", function () {
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
		const create = createXmlTemplaterDocx.bind(null, content, {parser: angularParser});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with multiple errors", function () {
		const content = "<w:t>foo</w:t><w:t>} The users are {#users}{/bar} {@bang} </w:t>";
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
							postparsedLength: 11,
							expandTo: "w:p",
							index: 8,
						},
					},
				],
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {parser: angularParser});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with multiple unclosed", function () {
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
		const create = createXmlTemplaterDocx.bind(null, content, {parser: angularParser});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with multiple unopened", function () {
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
		const create = createXmlTemplaterDocx.bind(null, content, {parser: angularParser});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should show an error when loop tag are badly used (xml open count !== xml close count)", function () {
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
						message: 'The position of the loop tags "users" would produce invalid XML',
						properties: {
							tag: "users",
							id: "loop_position_invalid",
						},
					},
				],
				id: "multi_error",
			},
		};
		const create = createXmlTemplaterDocx.bind(null, content, {parser: angularParser});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});
});
