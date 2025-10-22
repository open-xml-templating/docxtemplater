const Errors = require("../../errors.js");
const {
	loadFile,
	rejectSoon,
	expect,
	loadDocumentV4,
	makeDocxV4,
	wrapMultiError,
	expectToThrow,
	expectToThrowSnapshot,
	expectToThrowAsync,
	captureLogs,
} = require("../utils.js");
const expressionParser = require("../../expressions.js");

describe("Compilation errors", () => {
	it("should fail when parsing invalid xml (1)", () => {
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
		expectToThrow(
			() => makeDocxV4(content),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should fail when parsing invalid xml (2)", () => {
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
		expectToThrow(
			() => makeDocxV4(content),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should fail when tag unclosed at end of document", () => {
		const expectedError = {
			name: "TemplateError",
			message: "Unclosed tag",
			properties: {
				context: "{unclosedtag my text",
				file: "word/document.xml",
				id: "unclosed_tag",
				xtag: "unclosedtag",
				offset: 0,
			},
		};
		expectToThrow(
			() =>
				makeDocxV4("<w:t>{unclosedtag my text</w:t>", {
					errorLogging: false,
				}),
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		);
	});

	it("should be possible to not log error message", () => {
		const expectedError = {
			name: "TemplateError",
			message: "Unclosed tag",
			properties: {
				context: "{unclosedtag my text",
				file: "word/document.xml",
				id: "unclosed_tag",
				xtag: "unclosedtag",
				offset: 0,
			},
		};
		const capture = captureLogs();
		expectToThrow(
			() =>
				makeDocxV4("<w:t>{unclosedtag my text</w:t>", {
					errorLogging: false,
				}),
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		);
		capture.stop();
		const logs = capture.logs();
		expect(logs.length).to.equal(0);
	});

	it("should fail when tag unclosed", () => {
		const expectedError = {
			name: "TemplateError",
			message: "Unclosed tag",
			properties: {
				file: "word/document.xml",
				id: "unclosed_tag",
				context: "{user ",
				xtag: "user",
				offset: 0,
			},
		};
		expectToThrow(
			() =>
				makeDocxV4("<w:t>{user {name}</w:t>", { errorLogging: false }),
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		);
	});

	it("should fail when tag unopened", () => {
		const expectedError = {
			name: "TemplateError",
			message: "Unopened tag",
			properties: {
				file: "word/document.xml",
				id: "unopened_tag",
				context: "foobar",
				offset: 6,
				xtag: "foobar",
			},
		};
		expectToThrow(
			() => makeDocxV4("<w:t>foobar}age</w:t>", { errorLogging: false }),
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		);
	});

	it("should fail when closing {#users} with {/foo}", () => {
		const expectedError = {
			name: "TemplateError",
			message: "Closing tag does not match opening tag",
			properties: {
				file: "word/document.xml",
				id: "closing_tag_does_not_match_opening_tag",
				openingtag: "users",
				closingtag: "foo",
			},
		};
		expectToThrow(
			() =>
				makeDocxV4("<w:t>{#users}User {name}{/foo}</w:t>", {
					errorLogging: false,
				}),
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		);
	});

	it("should fail when closing an unopened loop", () => {
		const expectedError = {
			name: "TemplateError",
			message: "Unopened loop",
			properties: {
				file: "word/document.xml",
				id: "unopened_loop",
				xtag: "loop",
				offset: 0,
			},
		};
		expectToThrow(
			() =>
				makeDocxV4("<w:t>{/loop} {foobar}</w:t>", {
					errorLogging: false,
				}),
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		);
	});

	it("should fail when a loop is never closed", () => {
		const expectedError = {
			name: "TemplateError",
			message: "Unclosed loop",
			properties: {
				file: "word/document.xml",
				id: "unclosed_loop",
				xtag: "loop",
				offset: 0,
			},
		};
		expectToThrow(
			() =>
				makeDocxV4("<w:t>{#loop} {foobar}</w:t>", {
					errorLogging: false,
				}),
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		);
	});

	it("should fail early when a loop closes the wrong loop", () => {
		expectToThrowSnapshot(() =>
			makeDocxV4(
				"<w:t>{#loop1}{#loop2}{/loop3}{/loop3}{/loop2}{/loop1}</w:t>",
				{ errorLogging: false }
			)
		);
	});

	it("should fail when rawtag is not in paragraph", () => {
		expectToThrowSnapshot(() =>
			makeDocxV4("<w:t>{@myrawtag}</w:t>", { errorLogging: false })
		);
	});

	it("should fail when rawtag is in table without paragraph", () => {
		expectToThrowSnapshot(() =>
			makeDocxV4("<w:tbl><w:t>{@myrawtag}</w:t></w:p></w:tbl>", {
				errorLogging: false,
			})
		);
	});

	it("should fail when rawtag is not only text in paragraph", () => {
		const expectedError = {
			name: "TemplateError",
			message: "Raw tag should be the only text in paragraph",
			properties: {
				file: "word/document.xml",
				id: "raw_xml_tag_should_be_only_text_in_paragraph",
				xtag: "myrawtag",
				offset: 1,
				paragraphPartsLength: 7,
			},
		};
		expectToThrow(
			() =>
				makeDocxV4(
					"<w:p><w:t> {@myrawtag}</w:t><w:t>foobar</w:t></w:p>",
					{
						errorLogging: false,
					}
				),
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		);
	});

	it("should count 3 errors when having rawxml and two other errors", () => {
		expectToThrowSnapshot(() =>
			makeDocxV4("<w:p><w:r><w:t>foo} {@bang} bar}</w:t></w:r></w:p>", {
				errorLogging: false,
			})
		);
	});

	it("should fail when customparser fails to compile", () => {
		const expectedError = {
			name: "ScopeParserError",
			message: "Scope parser compilation failed",
			properties: {
				file: "word/document.xml",
				id: "scopeparser_compilation_failed",
				xtag: "name++",
				rootError: {
					message: `[$parse:ueoe] Unexpected end of expression: name++
http://errors.angularjs.org/"NG_VERSION_FULL"/$parse/ueoe?p0=name%2B%2B`,
				},
			},
		};
		expectToThrow(
			() =>
				makeDocxV4("<w:t>{name++}</w:t>", {
					parser: expressionParser,
					errorLogging: false,
				}),
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		);
	});
});

describe("Runtime errors", () => {
	it("should fail when customparser fails to execute", () => {
		function errorParser() {
			return {
				get() {
					throw new Error("foo bar");
				},
			};
		}
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [
					{
						name: "ScopeParserError",
						message: "Scope parser execution failed",
						properties: {
							file: "word/document.xml",
							id: "scopeparser_execution_failed",
							xtag: "name|upper",
							offset: 1,
							rootError: { message: "foo bar" },
						},
					},
				],
				id: "multi_error",
			},
		};
		expectToThrow(
			() =>
				makeDocxV4("<w:t> {name|upper}</w:t>", {
					parser: errorParser,
					errorLogging: false,
				}).render(),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should be possible to log the error", () => {
		let errorStringified = "";
		function errorParser() {
			return {
				get() {
					throw new Error(
						"foo bar 6aaef652-8525-4442-b9b8-5ab942b2c476"
					);
				},
			};
		}
		function replaceErrors(key, value) {
			if (value instanceof Error) {
				const error = {};
				for (const key of Object.getOwnPropertyNames(value)) {
					error[key] = value[key];
				}
				return error;
			}
			return value;
		}
		const capture = captureLogs();
		try {
			makeDocxV4("<w:t> {name|upper}</w:t>", {
				parser: errorParser,
			}).render();
			capture.stop();
		} catch (e) {
			capture.stop();
			errorStringified = JSON.stringify(e, replaceErrors, 2);
		}
		expect(errorStringified).to.contain(
			"foo bar 6aaef652-8525-4442-b9b8-5ab942b2c476"
		);
	});

	it("should fail with multi-error when customparser fails to execute on multiple raw tags", () => {
		let count = 0;
		function errorParser() {
			return {
				get() {
					count++;
					throw new Error(`foo ${count}`);
				},
			};
		}
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [
					{
						name: "ScopeParserError",
						message: "Scope parser execution failed",
						properties: {
							id: "scopeparser_execution_failed",
							file: "word/document.xml",
							xtag: "raw|isfalse",
							rootError: { message: "foo 1" },
							offset: 0,
						},
					},
					{
						name: "ScopeParserError",
						message: "Scope parser execution failed",
						properties: {
							file: "word/document.xml",
							id: "scopeparser_execution_failed",
							xtag: "raw|istrue",
							rootError: { message: "foo 2" },
							offset: 14,
						},
					},
				],
				id: "multi_error",
			},
		};

		const doc = makeDocxV4(
			`
		<w:p><w:r><w:t>{@raw|isfalse}</w:t></w:r></w:p>
		<w:p><w:r><w:t>{@raw|istrue}</w:t></w:r></w:p>
		`,
			{
				parser: errorParser,
				errorLogging: false,
			}
		);
		expectToThrow(
			() => doc.render(),
			Errors.XTTemplateError,
			expectedError
		);
	});
});

describe("Internal errors", () => {
	it("should fail if using odt format", (done) => {
		const expectedError = {
			name: "InternalError",
			message: 'The filetype "odt" is not handled by docxtemplater',
			properties: {
				id: "filetype_not_handled",
				fileType: "odt",
			},
		};
		loadFile("test.odt", (e, name, buffer) => {
			expectToThrow(
				() => loadDocumentV4(name, buffer),
				Errors.XTInternalError,
				expectedError
			);
			done();
		});
	});

	it("should fail if using zip file and show list of files", (done) => {
		const expectedError = {
			name: "InternalError",
			message:
				"The filetype for this file could not be identified, is this file corrupted ? Zip file contains : world.txt,xxx.log",
			properties: {
				id: "filetype_not_identified",
			},
		};
		loadFile("simple-zip.zip", (e, name, buffer) => {
			expectToThrow(
				() => loadDocumentV4(name, buffer),
				Errors.XTInternalError,
				expectedError
			);
			done();
		});
	});

	it("should fail if using empty zip file and show it", (done) => {
		const expectedError = {
			name: "InternalError",
			message:
				"The filetype for this file could not be identified, is this file corrupted ? Empty zip file",
			properties: {
				id: "filetype_not_identified",
			},
		};
		loadFile("empty.zip", (e, name, buffer) => {
			expectToThrow(
				() => loadDocumentV4(name, buffer),
				Errors.XTInternalError,
				expectedError
			);
			done();
		});
	});
});

describe("Multi errors", () => {
	it("should work with multiple errors simple", () => {
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
							file: "word/document.xml",
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
							file: "word/document.xml",
						},
					},
				],
			},
		};

		expectToThrow(
			() =>
				makeDocxV4("<w:t>foo} Hello {user, my age is {bar}</w:t>", {
					errorLogging: false,
				}),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should work with multiple errors complex", () => {
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

		expectToThrowSnapshot(() =>
			makeDocxV4(content, { errorLogging: false })
		);
	});

	it("should work with wrongly nested loops", () => {
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [
					{
						name: "TemplateError",
						message: "Unopened loop",
						properties: {
							file: "word/document.xml",
							id: "unopened_loop",
							xtag: "companies",
						},
					},
					{
						name: "TemplateError",
						message: "Unclosed loop",
						properties: {
							file: "word/document.xml",
							id: "unclosed_loop",
							xtag: "companies",
						},
					},
				],
				id: "multi_error",
			},
		};
		expectToThrow(
			() =>
				makeDocxV4(
					`
		<w:t>
			{#users}.........{/companies}
			{#companies}.....{/users}
		</w:t>
		`,
					{ errorLogging: false }
				),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should work with loops", () => {
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [
					{
						name: "TemplateError",
						message: "Closing tag does not match opening tag",
						properties: {
							file: "word/document.xml",
							id: "closing_tag_does_not_match_opening_tag",
							openingtag: "users",
							closingtag: "foo",
						},
					},
					{
						name: "TemplateError",
						message: "Closing tag does not match opening tag",
						properties: {
							file: "word/document.xml",
							id: "closing_tag_does_not_match_opening_tag",
							openingtag: "bang",
							closingtag: "baz",
						},
					},
				],
				id: "multi_error",
			},
		};
		expectToThrow(
			() =>
				makeDocxV4(
					`
					<w:t>{#users}User name{/foo}
					{#bang}User name{/baz}
					</w:t>
					`,
					{ errorLogging: false }
				),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should work with loops unopened", () => {
		expectToThrowSnapshot(() =>
			makeDocxV4(
				`<w:t>{/loop} {#users}User name{/foo}
				{#bang}User name{/baz}
				{/fff}
				{#yum}
				</w:t>
				`,
				{ errorLogging: false }
			)
		);
	});

	it("should fail when having multiple rawtags without a surrounding paragraph", () => {
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [
					{
						name: "TemplateError",
						message: "Raw tag not in paragraph",
						properties: {
							file: "word/document.xml",
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
							file: "word/document.xml",
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
		expectToThrow(
			() =>
				makeDocxV4(
					"<w:t>{@first}</w:t><w:p><w:t>foo{@second}</w:t></w:p>",
					{
						errorLogging: false,
					}
				),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should fail when customparser fails to compile", () => {
		const expectedError = {
			message: "Multi error",
			name: "TemplateError",
			properties: {
				errors: [
					{
						name: "ScopeParserError",
						message: "Scope parser compilation failed",
						properties: {
							file: "word/document.xml",
							offset: 0,
							id: "scopeparser_compilation_failed",
							xtag: "name++",
							rootError: {
								message: `[$parse:ueoe] Unexpected end of expression: name++
http://errors.angularjs.org/"NG_VERSION_FULL"/$parse/ueoe?p0=name%2B%2B`,
							},
						},
					},
					{
						name: "ScopeParserError",
						message: "Scope parser compilation failed",
						properties: {
							file: "word/document.xml",
							offset: 9,
							id: "scopeparser_compilation_failed",
							xtag: "foo|||bang",
							rootError: {
								message: `[$parse:syntax] Syntax Error: Token '|' not a primary expression at column 6 of the expression [foo|||bang] starting at [|bang].
http://errors.angularjs.org/"NG_VERSION_FULL"/$parse/syntax?p0=%7C&p1=not%20a%20primary%20expression&p2=6&p3=foo%7C%7C%7Cbang&p4=%7Cbang`,
							},
						},
					},
				],
				id: "multi_error",
			},
		};
		expectToThrow(
			() =>
				makeDocxV4("<w:t>{name++} {foo|||bang}</w:t>", {
					parser: expressionParser,
					errorLogging: false,
				}),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should fail when customparser fails to compile 2", () => {
		const expectedError = {
			message: "Multi error",
			name: "TemplateError",
			properties: {
				errors: [
					{
						name: "ScopeParserError",
						message: "Scope parser compilation failed",
						properties: {
							file: "word/document.xml",
							id: "scopeparser_compilation_failed",
							xtag: "name++",
							rootError: {
								message: `[$parse:ueoe] Unexpected end of expression: name++
http://errors.angularjs.org/"NG_VERSION_FULL"/$parse/ueoe?p0=name%2B%2B`,
							},
						},
					},
					{
						name: "ScopeParserError",
						message: "Scope parser compilation failed",
						properties: {
							file: "word/document.xml",
							id: "scopeparser_compilation_failed",
							xtag: "foo|||bang",
							rootError: {
								message: `[$parse:syntax] Syntax Error: Token '|' not a primary expression at column 6 of the expression [foo|||bang] starting at [|bang].
http://errors.angularjs.org/"NG_VERSION_FULL"/$parse/syntax?p0=%7C&p1=not%20a%20primary%20expression&p2=6&p3=foo%7C%7C%7Cbang&p4=%7Cbang`,
							},
						},
					},
				],
				id: "multi_error",
			},
		};
		expectToThrow(
			() =>
				makeDocxV4("<w:t>{name++} {foo|||bang}</w:t>", {
					parser: expressionParser,
					errorLogging: false,
				}),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should work with lexer and customparser", () => {
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
							file: "word/document.xml",
						},
					},
					{
						message: "Scope parser compilation failed",
						name: "ScopeParserError",
						properties: {
							id: "scopeparser_compilation_failed",
							xtag: "name++",
							rootError: {
								message: `[$parse:ueoe] Unexpected end of expression: name++
http://errors.angularjs.org/"NG_VERSION_FULL"/$parse/ueoe?p0=name%2B%2B`,
							},
							file: "word/document.xml",
						},
					},
				],
			},
		};
		expectToThrow(
			() =>
				makeDocxV4("<w:t>foo} Hello {name++}</w:t>", {
					parser: expressionParser,
					errorLogging: false,
				}),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should work with lexer and loop", () => {
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
							file: "word/document.xml",
						},
					},
					{
						name: "TemplateError",
						message: "Closing tag does not match opening tag",
						properties: {
							id: "closing_tag_does_not_match_opening_tag",
							openingtag: "users",
							closingtag: "bar",
							file: "word/document.xml",
						},
					},
				],
			},
		};
		expectToThrow(
			() =>
				makeDocxV4("<w:t>foo} The users are {#users}{/bar}</w:t>", {
					parser: expressionParser,
					errorLogging: false,
				}),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should work with multiple errors", () => {
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
							file: "word/document.xml",
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
							file: "word/document.xml",
						},
					},
					{
						name: "TemplateError",
						message: "Raw tag not in paragraph",
						properties: {
							id: "raw_tag_outerxml_invalid",
							xtag: "bang",
							rootError: {
								message: 'No tag "w:p" was found at the left',
							},
							postparsedLength: 12,
							expandTo: "w:p",
							index: 9,
							file: "word/document.xml",
						},
					},
				],
			},
		};
		expectToThrow(
			() =>
				makeDocxV4(
					"<w:t>foo</w:t><w:t>} The users are {#users}{/bar} {@bang} </w:t>",
					{
						parser: expressionParser,
						errorLogging: false,
					}
				),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should work with multiple unclosed", () => {
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
							file: "word/document.xml",
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
							file: "word/document.xml",
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
							file: "word/document.xml",
						},
					},
				],
				id: "multi_error",
			},
		};
		expectToThrow(
			() =>
				makeDocxV4(
					`<w:t>foo</w:t>
							<w:t>{city, {state {zip </w:t>`,
					{
						parser: expressionParser,
						errorLogging: false,
					}
				),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should work with multiple unopened", () => {
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
							file: "word/document.xml",
						},
					},
					{
						name: "TemplateError",
						message: "Unopened tag",
						properties: {
							xtag: "state",
							id: "unopened_tag",
							context: "}, state",
							file: "word/document.xml",
						},
					},
					{
						name: "TemplateError",
						message: "Unopened tag",
						properties: {
							xtag: "zip",
							id: "unopened_tag",
							context: "} zip",
							file: "word/document.xml",
						},
					},
				],
				id: "multi_error",
			},
		};
		expectToThrow(
			() =>
				makeDocxV4(
					`<w:t>foo</w:t>
							<w:t> city}, state} zip}</w:t>`,
					{
						parser: expressionParser,
						errorLogging: false,
					}
				),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should show an error when loop tag are badly used (xml open count !== xml close count)", () => {
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
							xtag: "users",
							offset: [0, 17],
							id: "loop_position_invalid",
							file: "word/document.xml",
						},
					},
				],
				id: "multi_error",
			},
		};
		expectToThrow(
			() =>
				makeDocxV4(
					`<w:tbl>
						<w:tr>
							<w:tc>
								<w:p>
									<w:r>
										<w:t>{#users}</w:t>
									</w:r>
									<w:r>
										<w:t>test</w:t>
									</w:r>
								</w:p>
							</w:tc>
							<w:tc>
								<w:p>
									<w:r>
										<w:t>test2</w:t>
									</w:r>
								</w:p>
							</w:tc>
						</w:tr>
					</w:tbl>
					<w:p>
						<w:r>
							<w:t>{/users}</w:t>
						</w:r>
					</w:p>`,
					{
						parser: expressionParser,
						errorLogging: false,
					}
				),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should show clean error message when using {{ with single delimiter", () => {
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [
					{
						name: "TemplateError",
						message: "Duplicate open tag, expected one open tag",
						properties: {
							context: "{{name",
							file: "word/document.xml",
							id: "duplicate_open_tag",
							offset: 0,
							xtag: "{{name",
						},
					},
					{
						name: "TemplateError",
						message: "Duplicate close tag, expected one close tag",
						properties: {
							context: "name}}",
							file: "word/document.xml",
							id: "duplicate_close_tag",
							xtag: "name}}",
						},
					},
				],
				id: "multi_error",
			},
		};

		expectToThrow(
			() =>
				makeDocxV4("<w:p><w:r><w:t>{{name}}</w:t></w:r></w:p>", {
					errorLogging: false,
				}),
			Errors.XTTemplateError,
			expectedError
		);
	});
});

describe("Rendering error", () => {
	it("should show an error when calling render twice", () => {
		const expectedError = {
			name: "InternalError",
			message:
				"You should not call .render twice on the same docxtemplater instance",
			properties: {
				id: "render_twice",
			},
		};
		const doc = makeDocxV4("<w:t>{user}</w:t>").render();
		expectToThrow(
			() => {
				doc.render();
			},
			Errors.XTInternalError,
			expectedError
		);
	});

	it("should show an error when using corrupt characters", () => {
		const expectedError = {
			name: "RenderingError",
			message: "There are some XML corrupt characters",
			properties: {
				id: "invalid_xml_characters",
				value: "\u001c",
				xtag: "user",
				offset: 1,
				file: "word/document.xml",
			},
		};
		expectToThrow(
			() => {
				makeDocxV4("<w:t> {user}</w:t>", {
					parser: expressionParser,
					errorLogging: false,
				}).render({
					user: String.fromCharCode(28),
				});
			},
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		);
	});
});

describe("Async errors", () => {
	it("should show error when having async promise", () => {
		const expectedError = {
			name: "ScopeParserError",
			message: "Scope parser execution failed",
			properties: {
				file: "word/document.xml",
				id: "scopeparser_execution_failed",
				xtag: "user",
				scope: {
					user: {},
				},
				rootError: {
					message: "Foobar",
				},
			},
		};
		const doc = makeDocxV4("<w:t>{user}</w:t>", {
			errorLogging: false,
		});
		function create() {
			return doc.renderAsync({ user: rejectSoon(new Error("Foobar")) });
		}
		return expectToThrowAsync(
			create,
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		);
	});

	it("should show error when having async reject within loop", () => {
		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [
					{
						name: "ScopeParserError",
						message: "Scope parser execution failed",
						properties: {
							file: "word/document.xml",
							id: "scopeparser_execution_failed",
							scope: 1,
							xtag: "user",
							rootError: { message: "foo 1" },
						},
					},
					{
						name: "ScopeParserError",
						message: "Scope parser execution failed",
						properties: {
							file: "word/document.xml",
							id: "scopeparser_execution_failed",
							scope: 2,
							xtag: "user",
							rootError: { message: "foo 2" },
						},
					},
					{
						name: "ScopeParserError",
						message: "Scope parser execution failed",
						properties: {
							file: "word/document.xml",
							id: "scopeparser_execution_failed",
							scope: 3,
							xtag: "user",
							rootError: { message: "foo 3" },
						},
					},
				],
				id: "multi_error",
			},
		};
		let count = 0;
		function errorParser(tag) {
			return {
				get() {
					if (tag === "users") {
						return [1, 2, 3];
					}
					count++;
					throw new Error(`foo ${count}`);
				},
			};
		}
		const doc = makeDocxV4("<w:t>{#users}{user}{/}</w:t>", {
			parser: errorParser,
			errorLogging: false,
		});
		return expectToThrowAsync(
			() => doc.renderAsync({}),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should fail when customparser fails to execute on multiple tags", async () => {
		let count = 0;
		function errorParser() {
			return {
				get() {
					count++;
					throw new Error(`foo ${count}`);
				},
			};
		}
		/*
		 * The order of the errors is not the same as the order of the tags in
		 * the template, because each promise could resolve at a different
		 * time.
		 */
		const doc = makeDocxV4(
			"<w:t>{#name|istrue}Name{/} {name|upper} {othername|upper}</w:t>",
			{
				parser: errorParser,
				errorLogging: false,
			}
		);
		function create() {
			return doc.renderAsync().then(() => doc.render());
		}
		let myError;
		try {
			await create();
		} catch (e) {
			myError = e;
		}
		expect(myError.message).to.equal("Multi error");
		const sortedErrors = myError.properties.errors.sort((x, y) => {
			if (x.properties.offset > y.properties.offset) {
				return 1;
			}
			return -1;
		});
		const rootErrorMessages = [];
		for (const err of sortedErrors) {
			rootErrorMessages.push(err.properties.rootError.message);
		}
		expect(rootErrorMessages).to.deep.equal(["foo 1", "foo 2", "foo 3"]);
	});

	it("should fail when customparser fails to execute on multiple raw tags", () => {
		let count = 0;
		function errorParser() {
			return {
				get() {
					count++;
					throw new Error(`foo ${count}`);
				},
			};
		}

		const expectedError = {
			name: "TemplateError",
			message: "Multi error",
			properties: {
				errors: [
					{
						name: "ScopeParserError",
						message: "Scope parser execution failed",
						properties: {
							id: "scopeparser_execution_failed",
							file: "word/document.xml",
							scope: { abc: true },
							xtag: "raw|isfalse",
							rootError: { message: "foo 1" },
							offset: 0,
						},
					},
					{
						name: "ScopeParserError",
						message: "Scope parser execution failed",
						properties: {
							id: "scopeparser_execution_failed",
							file: "word/document.xml",
							scope: { abc: true },
							xtag: "raw|istrue",
							rootError: { message: "foo 2" },
							offset: 14,
						},
					},
				],
				id: "multi_error",
			},
		};
		const doc = makeDocxV4(
			`
				<w:p><w:r><w:t>{@raw|isfalse}</w:t></w:r></w:p>
				<w:p><w:r><w:t>{@raw|istrue}</w:t></w:r></w:p>
				`,
			{
				parser: errorParser,
				errorLogging: false,
			}
		);
		return expectToThrowAsync(
			() => doc.renderAsync({ abc: true }),
			Errors.XTTemplateError,
			expectedError
		);
	});
});

describe("Syntax option", () => {
	it("should be possible to allow unopened tag if syntax.allowUnopenedTag is true", function () {
		return this.renderV4({
			name: "bug-closing-placeholder-orphan.docx",
			data: {
				first_name: "John",
				last_name: "Doe",
			},
			options: {
				delimiters: {
					start: "$(",
					end: ")",
				},
				syntax: {
					allowUnopenedTag: true,
				},
			},
			expectedName: "expected-bug-closing-placeholder-orphan.docx",
		});
	});
});
