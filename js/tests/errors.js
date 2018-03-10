"use strict";

var expressions = require("angular-expressions");

var _require = require("./utils"),
    loadFile = _require.loadFile,
    loadDocument = _require.loadDocument;

var Errors = require("../errors.js");

var _require2 = require("./utils"),
    createXmlTemplaterDocx = _require2.createXmlTemplaterDocx,
    wrapMultiError = _require2.wrapMultiError,
    expectToThrow = _require2.expectToThrow;

function angularParser(tag) {
	var expr = expressions.compile(tag.replace(/’/g, "'"));
	return {
		get: function get(scope) {
			return expr(scope);
		}
	};
}

describe("Compilation errors", function () {
	it("should fail when tag unclosed at end of document", function () {
		var content = "<w:t>{unclosedtag my text</w:t>";
		var expectedError = {
			name: "TemplateError",
			message: "Unclosed tag",
			properties: {
				context: "{unclosedtag my text",
				id: "unclosed_tag",
				xtag: "unclosedtag",
				offset: 0
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content);
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when tag unclosed", function () {
		var content = "<w:t>{user {name}</w:t>";
		var expectedError = {
			name: "TemplateError",
			message: "Unclosed tag",
			properties: {
				id: "unclosed_tag",
				context: "{user ",
				xtag: "user",
				offset: 0
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content);
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when tag unopened", function () {
		var content = "<w:t>foobar}age</w:t>";
		var expectedError = {
			name: "TemplateError",
			message: "Unopened tag",
			properties: {
				id: "unopened_tag",
				context: "foobar",
				offset: 6,
				xtag: "foobar"
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content);
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when closing {#users} with {/foo}", function () {
		var content = "<w:t>{#users}User {name}{/foo}</w:t>";
		var expectedError = {
			name: "TemplateError",
			message: "Closing tag does not match opening tag",
			properties: {
				id: "closing_tag_does_not_match_opening_tag",
				openingtag: "users",
				closingtag: "foo"
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content);
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when closing an unopened loop", function () {
		var content = "<w:t>{/loop} {foobar}</w:t>";
		var expectedError = {
			name: "TemplateError",
			message: "Unopened loop",
			properties: {
				id: "unopened_loop",
				xtag: "loop"
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content);
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when a loop is never closed", function () {
		var content = "<w:t>{#loop} {foobar}</w:t>";
		var expectedError = {
			name: "TemplateError",
			message: "Unclosed loop",
			properties: {
				id: "unclosed_loop",
				xtag: "loop"
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content);
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when rawtag is not in paragraph", function () {
		var content = "<w:t>{@myrawtag}</w:t>";
		var expectedError = {
			name: "TemplateError",
			message: "Raw tag not in paragraph",
			properties: {
				expandTo: "w:p",
				id: "raw_tag_outerxml_invalid",
				offset: 0,
				index: 1,
				postparsed: [{
					position: "start",
					text: true,
					type: "tag",
					value: "<w:t>",
					tag: "w:t"
				}, {
					module: "rawxml",
					type: "placeholder",
					value: "myrawtag"
				}, {
					position: "end",
					text: true,
					type: "tag",
					value: "</w:t>",
					tag: "w:t"
				}],
				xtag: "myrawtag",
				rootError: {
					message: 'No tag "w:p" was found at the right'
				}
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content);
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when rawtag is in table without paragraph", function () {
		var content = "<w:table><w:t>{@myrawtag}</w:t></w:p></w:table>";
		var expectedError = {
			name: "TemplateError",
			message: "Raw tag not in paragraph",
			properties: {
				id: "raw_tag_outerxml_invalid",
				xtag: "myrawtag",
				postparsed: [{
					type: "tag",
					position: "start",
					text: false,
					value: "<w:table>",
					tag: "w:table"
				}, {
					type: "tag",
					position: "start",
					text: true,
					value: "<w:t>",
					tag: "w:t"
				}, {
					type: "placeholder",
					value: "myrawtag",
					module: "rawxml"
				}, {
					type: "tag",
					position: "end",
					text: true,
					value: "</w:t>",
					tag: "w:t"
				}, {
					type: "tag",
					position: "end",
					text: false,
					value: "</w:p>",
					tag: "w:p"
				}, {
					type: "tag",
					position: "end",
					text: false,
					value: "</w:table>",
					tag: "w:table"
				}],
				rootError: {
					message: 'No tag "w:p" was found at the left'
				},
				expandTo: "w:p",
				index: 2
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content);
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when rawtag is not only text in paragraph", function () {
		var content = "<w:p><w:t> {@myrawtag}</w:t><w:t>foobar</w:t></w:p>";
		var expectedError = {
			name: "TemplateError",
			message: "Raw tag should be the only text in paragraph",
			properties: {
				id: "raw_xml_tag_should_be_only_text_in_paragraph",
				xtag: "myrawtag",
				offset: 1,
				paragraphPartsLength: 7
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content);
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});

	it("should fail when customparser fails to compile", function () {
		var content = "<w:t>{name++}</w:t>";
		var expectedError = {
			name: "ScopeParserError",
			message: "Scope parser compilation failed",
			properties: {
				id: "scopeparser_compilation_failed",
				tag: "name++",
				rootError: {
					message: "Syntax Error: Token 'undefined' not a primary expression at column NaN of the expression [name++] starting at [name++]."
				}
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser
		});
		expectToThrow(create, Errors.XTTemplateError, wrapMultiError(expectedError));
	});
});

describe("Runtime errors", function () {
	it("should fail when customparser fails to execute", function () {
		var content = "<w:t>{name|upper}</w:t>";
		function errorParser() {
			return {
				get: function get() {
					throw new Error("foo bar");
				}
			};
		}
		var expectedError = {
			name: "ScopeParserError",
			message: "Scope parser execution failed",
			properties: {
				id: "scopeparser_execution_failed",
				tag: "name|upper",
				scope: {},
				rootError: {
					message: "foo bar"
				}
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content, {
			parser: errorParser
		});
		expectToThrow(create, Errors.XTScopeParserError, expectedError);
	});
});

describe("Internal errors", function () {
	it("should fail if using odt format", function (done) {
		var expectedError = {
			name: "InternalError",
			message: 'The filetype "odt" is not handled by docxtemplater',
			properties: {
				id: "filetype_not_handled"
			}
		};
		loadFile("test.odt", function (e, name, buffer) {
			function create() {
				loadDocument(name, buffer);
			}
			expectToThrow(create, Errors.XTInternalError, expectedError);
			done();
		});
	});
});

describe("Multi errors", function () {
	it("should work with multiple errors simple", function () {
		var content = "<w:t>foo} Hello {user, my age is {bar}</w:t>";
		var expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				id: "multi_error",
				errors: [{
					message: "Unopened tag",
					name: "TemplateError",
					properties: {
						offset: 3,
						context: "foo",
						id: "unopened_tag",
						xtag: "foo"
					}
				}, {
					message: "Unclosed tag",
					name: "TemplateError",
					properties: {
						offset: 11,
						context: "{user, my age is ",
						id: "unclosed_tag",
						xtag: "user,"
					}
				}]
			}
		};

		var create = createXmlTemplaterDocx.bind(null, content);
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with multiple errors complex", function () {
		var content = "<w:t>foo}\n\t\tHello {user, my age is {bar}\n\t\tHi bang}, my name is {user2}\n\t\tHey {user}, my age is {bar}\n\t\tHola {bang}, my name is {user2}\n\t\t{user, my age is {bar\n\t\t</w:t>".replace(/\t/g, "").split("\n").join("!");
		var expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				id: "multi_error",
				errors: [{
					name: "TemplateError",
					message: "Unopened tag",
					properties: {
						xtag: "foo",
						id: "unopened_tag",
						context: "foo"
					}
				}, {
					name: "TemplateError",
					message: "Unclosed tag",
					properties: {
						xtag: "user,",
						id: "unclosed_tag",
						context: "{user, my age is "
					}
				}, {
					name: "TemplateError",
					message: "Unopened tag",
					properties: {
						xtag: "bang",
						id: "unopened_tag",
						context: "}!Hi bang"
					}
				}, {
					name: "TemplateError",
					message: "Unclosed tag",
					properties: {
						xtag: "user,",
						id: "unclosed_tag",
						context: "{user, my age is "
					}
				}, {
					name: "TemplateError",
					message: "Unclosed tag",
					properties: {
						xtag: "bar!",
						id: "unclosed_tag",
						context: "{bar!"
					}
				}]
			}
		};

		var create = createXmlTemplaterDocx.bind(null, content);
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with loops", function () {
		var content = "\n\t\t<w:t>{#users}User name{/foo}\n\t\t{#bang}User name{/baz}\n\t\t</w:t>\n\t\t";
		var expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [{
					name: "TemplateError",
					message: "Closing tag does not match opening tag",
					properties: {
						id: "closing_tag_does_not_match_opening_tag",
						openingtag: "users",
						closingtag: "foo"
					}
				}, {
					name: "TemplateError",
					message: "Closing tag does not match opening tag",
					properties: {
						id: "closing_tag_does_not_match_opening_tag",
						openingtag: "bang",
						closingtag: "baz"
					}
				}],
				id: "multi_error"
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content);
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with loops unopened", function () {
		var content = "\n\t\t<w:t>{/loop} {#users}User name{/foo}\n\t\t{#bang}User name{/baz}\n\t\t{/fff}\n\t\t{#yum}\n\t\t</w:t>\n\t\t";
		var expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [{
					name: "TemplateError",
					message: "Unopened loop",
					properties: {
						id: "unopened_loop",
						xtag: "loop"
					}
				}, {
					name: "TemplateError",
					message: "Closing tag does not match opening tag",
					properties: {
						id: "closing_tag_does_not_match_opening_tag",
						openingtag: "users",
						closingtag: "foo"
					}
				}, {
					name: "TemplateError",
					message: "Closing tag does not match opening tag",
					properties: {
						id: "closing_tag_does_not_match_opening_tag",
						openingtag: "bang",
						closingtag: "baz"
					}
				}, {
					name: "TemplateError",
					message: "Unopened loop",
					properties: {
						id: "unopened_loop",
						xtag: "fff"
					}
				}, {
					name: "TemplateError",
					message: "Unclosed loop",
					properties: {
						id: "unclosed_loop",
						xtag: "yum"
					}
				}],
				id: "multi_error"
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content);
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should fail when rawtag is not in paragraph", function () {
		var content = "<w:t>{@first}</w:t><w:p><w:t>foo{@second}</w:t></w:p>";
		var expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [{
					name: "TemplateError",
					message: "Raw tag not in paragraph",
					properties: {
						id: "raw_tag_outerxml_invalid",
						xtag: "first",
						rootError: {
							message: 'No tag "w:p" was found at the left'
						},
						postparsedLength: 9,
						expandTo: "w:p",
						offset: 0,
						index: 1
					}
				}, {
					name: "TemplateError",
					message: "Raw tag should be the only text in paragraph",
					properties: {
						id: "raw_xml_tag_should_be_only_text_in_paragraph",
						paragraphPartsLength: 4,
						xtag: "second",
						offset: 11
					}
				}],
				id: "multi_error"
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content);
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});
	it("should fail when customparser fails to compile", function () {
		var content = "<w:t>{name++} {foo|||bang}</w:t>";
		var expectedError = {
			message: "Multi error",
			name: "TemplateError",
			properties: {
				errors: [{
					name: "ScopeParserError",
					message: "Scope parser compilation failed",
					properties: {
						id: "scopeparser_compilation_failed",
						tag: "name++",
						rootError: {
							message: "Syntax Error: Token 'undefined' not a primary expression at column NaN of the expression [name++] starting at [name++]."
						}
					}
				}, {
					name: "ScopeParserError",
					message: "Scope parser compilation failed",
					properties: {
						id: "scopeparser_compilation_failed",
						tag: "foo|||bang",
						rootError: {
							message: "Syntax Error: Token 'bang' is an unexpected token at column 7 of the expression [foo|||bang] starting at [bang]."
						}
					}
				}],
				id: "multi_error"
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser
		});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should fail when customparser fails to compile", function () {
		var content = "<w:t>{name++} {foo|||bang}</w:t>";
		var expectedError = {
			message: "Multi error",
			name: "TemplateError",
			properties: {
				errors: [{
					name: "ScopeParserError",
					message: "Scope parser compilation failed",
					properties: {
						id: "scopeparser_compilation_failed",
						tag: "name++",
						rootError: {
							message: "Syntax Error: Token 'undefined' not a primary expression at column NaN of the expression [name++] starting at [name++]."
						}
					}
				}, {
					name: "ScopeParserError",
					message: "Scope parser compilation failed",
					properties: {
						id: "scopeparser_compilation_failed",
						tag: "foo|||bang",
						rootError: {
							message: "Syntax Error: Token 'bang' is an unexpected token at column 7 of the expression [foo|||bang] starting at [bang]."
						}
					}
				}],
				id: "multi_error"
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser
		});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with lexer and customparser", function () {
		var content = "<w:t>foo} Hello {name++}</w:t>";
		var expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				id: "multi_error",
				errors: [{
					message: "Unopened tag",
					name: "TemplateError",
					properties: {
						context: "foo",
						id: "unopened_tag",
						xtag: "foo"
					}
				}, {
					message: "Scope parser compilation failed",
					name: "ScopeParserError",
					properties: {
						id: "scopeparser_compilation_failed",
						tag: "name++",
						rootError: {
							message: "Syntax Error: Token 'undefined' not a primary expression at column NaN of the expression [name++] starting at [name++]."
						}
					}
				}]
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser
		});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with lexer and loop", function () {
		var content = "<w:t>foo} The users are {#users}{/bar}</w:t>";
		var expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				id: "multi_error",
				errors: [{
					message: "Unopened tag",
					name: "TemplateError",
					properties: {
						context: "foo",
						id: "unopened_tag",
						xtag: "foo"
					}
				}, {
					name: "TemplateError",
					message: "Closing tag does not match opening tag",
					properties: {
						id: "closing_tag_does_not_match_opening_tag",
						openingtag: "users",
						closingtag: "bar"
					}
				}]
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser
		});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with multiple errors", function () {
		var content = "<w:t>foo</w:t><w:t>} The users are {#users}{/bar} {@bang} </w:t>";
		var expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				id: "multi_error",
				errors: [{
					message: "Unopened tag",
					name: "TemplateError",
					properties: {
						context: "foo",
						id: "unopened_tag",
						xtag: "foo"
					}
				}, {
					name: "TemplateError",
					message: "Closing tag does not match opening tag",
					properties: {
						id: "closing_tag_does_not_match_opening_tag",
						openingtag: "users",
						closingtag: "bar",
						offset: [19, 27]
					}
				}, {
					name: "TemplateError",
					message: "Raw tag not in paragraph",
					properties: {
						id: "raw_tag_outerxml_invalid",
						xtag: "bang",
						rootError: {
							message: 'No tag "w:p" was found at the right'
						},
						postparsedLength: 12,
						expandTo: "w:p",
						index: 9
					}
				}]
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser
		});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with multiple unclosed", function () {
		var content = "<w:t>foo</w:t>\n\t\t<w:t>{city, {state {zip </w:t>";
		var expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [{
					name: "TemplateError",
					message: "Unclosed tag",
					properties: {
						offset: 3,
						xtag: "city,",
						id: "unclosed_tag",
						context: "{city, "
					}
				}, {
					name: "TemplateError",
					message: "Unclosed tag",
					properties: {
						offset: 10,
						xtag: "state",
						id: "unclosed_tag",
						context: "{state "
					}
				}, {
					name: "TemplateError",
					message: "Unclosed tag",
					properties: {
						offset: 17,
						xtag: "zip",
						id: "unclosed_tag",
						context: "{zip "
					}
				}],
				id: "multi_error"
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser
		});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should work with multiple unopened", function () {
		var content = "<w:t>foo</w:t>\n\t\t<w:t> city}, state} zip}</w:t>";
		var expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [{
					name: "TemplateError",
					message: "Unopened tag",
					properties: {
						xtag: "city",
						id: "unopened_tag",
						context: "foo city"
					}
				}, {
					name: "TemplateError",
					message: "Unopened tag",
					properties: {
						xtag: "state",
						id: "unopened_tag",
						context: "}, state"
					}
				}, {
					name: "TemplateError",
					message: "Unopened tag",
					properties: {
						xtag: "zip",
						id: "unopened_tag",
						context: "} zip"
					}
				}],
				id: "multi_error"
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser
		});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});

	it("should show an error when loop tag are badly used (xml open count !== xml close count)", function () {
		var content = "<w:tbl>\n      <w:tr>\n        <w:tc>\n          <w:p> <w:r> <w:t>{#users}</w:t> </w:r> <w:r> <w:t>test</w:t> </w:r> </w:p>\n        </w:tc>\n        <w:tc>\n          <w:p> <w:r> <w:t>test2</w:t> </w:r> </w:p>\n        </w:tc>\n      </w:tr>\n    </w:tbl>\n    <w:p>\n      <w:r> <w:t>{/users}</w:t> </w:r>\n    </w:p>";
		var expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [{
					name: "TemplateError",
					message: 'The position of the loop tags "users" would produce invalid XML',
					properties: {
						tag: "users",
						id: "loop_position_invalid"
					}
				}],
				id: "multi_error"
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser
		});
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});
});

describe("Rendering error", function () {
	it("should show an error when using corrupt characters", function () {
		var content = "<w:t>{user}</w:t>";
		var expectedError = {
			name: "RenderingError",
			message: "There are some XML corrupt characters",
			properties: {
				id: "invalid_xml_characters",
				value: "\x1C",
				xtag: "user"
			}
		};
		var create = createXmlTemplaterDocx.bind(null, content, {
			parser: angularParser,
			tags: { user: String.fromCharCode(28) }
		});
		expectToThrow(create, Errors.RenderingError, expectedError);
	});
});