const { assign } = require("lodash");
const expressionParser = require("../../expressions.js");
const expressionParserIE11 = require("../../expressions-ie11.js");
const Errors = require("../../errors.js");
const { wrapMultiError } = require("../utils.js");
const nbsp = String.fromCharCode(160);
const { expect } = require("../utils.js");

expressionParser.filters.upper = function (str) {
	if (!str) {
		return str;
	}
	return str.toUpperCase();
};

expressionParser.filters.sum = function (num1, num2) {
	return num1 + num2;
};

const noInternals = {
	lexed: null,
	parsed: null,
	postparsed: null,
};
const xmlSpacePreserveTag = {
	type: "tag",
	position: "start",
	value: '<w:t xml:space="preserve">',
	text: true,
	tag: "w:t",
};
const startText = {
	type: "tag",
	position: "start",
	value: "<w:t>",
	text: true,
	tag: "w:t",
};
const endText = {
	type: "tag",
	value: "</w:t>",
	text: true,
	position: "end",
	tag: "w:t",
};
const startParagraph = {
	type: "tag",
	value: "<w:p>",
	text: false,
	position: "start",
	tag: "w:p",
};
const endParagraph = {
	type: "tag",
	value: "</w:p>",
	text: false,
	position: "end",
	tag: "w:p",
};

const tableRowStart = {
	type: "tag",
	position: "start",
	text: false,
	value: "<w:tr>",
	tag: "w:tr",
};
const tableRowEnd = {
	type: "tag",
	value: "</w:tr>",
	text: false,
	position: "end",
	tag: "w:tr",
};

const tableColStart = {
	type: "tag",
	position: "start",
	text: false,
	value: "<w:tc>",
	tag: "w:tc",
};
const tableColEnd = {
	type: "tag",
	value: "</w:tc>",
	text: false,
	position: "end",
	tag: "w:tc",
};

const delimiters = {
	start: { type: "delimiter", position: "start" },
	end: { type: "delimiter", position: "end" },
};
function content(value) {
	return { type: "content", value, position: "insidetag" };
}
function externalContent(value) {
	return { type: "content", value, position: "outsidetag" };
}

const fixtures = [
	{
		it: "should handle {user} with tag",
		contentText: "Hi {user}",
		scope: {
			user: "Foo",
		},
		resultText: "Hi Foo",
		xmllexed: [
			{
				position: "start",
				tag: "w:t",
				text: true,
				type: "tag",
				value: "<w:t>",
			},
			{
				type: "content",
				value: "Hi {user}",
			},
			{
				position: "end",
				tag: "w:t",
				text: true,
				type: "tag",
				value: "</w:t>",
			},
		],
		lexed: [
			startText,
			content("Hi "),
			delimiters.start,
			content("user"),
			delimiters.end,
			endText,
		],
		parsed: [
			startText,
			content("Hi "),
			{ type: "placeholder", value: "user" },
			endText,
		],
		postparsed: [
			xmlSpacePreserveTag,
			content("Hi "),
			{ type: "placeholder", value: "user" },
			endText,
		],
	},
	{
		it: "should handle {.} with tag",
		contentText: "Hi {.}",
		scope: "Foo",
		resultText: "Hi Foo",
		lexed: [
			startText,
			content("Hi "),
			delimiters.start,
			content("."),
			delimiters.end,
			endText,
		],
		parsed: [
			startText,
			content("Hi "),
			{ type: "placeholder", value: "." },
			endText,
		],
		postparsed: [
			xmlSpacePreserveTag,
			content("Hi "),
			{ type: "placeholder", value: "." },
			endText,
		],
	},
	{
		it: "should handle {userGreeting} with lambda function",
		contentText: "{#users}{userGreeting}{/}",
		resultText: "How is it going, John ? 1How is it going, Mary ? 1",
		...noInternals,
		scope: {
			userGreeting: (scope, sm) => {
				return "How is it going, " + scope.name + " ? " + sm.scopeLindex.length;
			},
			users: [
				{
					name: "John",
				},
				{
					name: "Mary",
				},
			],
		},
	},
	{
		it: "should handle non breaking space in tag",
		...noInternals,
		contentText: `{:foo${nbsp}${nbsp}bar${nbsp}bar} {:zing${nbsp}${nbsp}${nbsp}bang}`,
		resultText: "Hey Ho",
		options: {
			modules: () => [
				{
					name: "FooModule",
					parse(placeHolderContent, options) {
						if (options.match(":foo  ", placeHolderContent)) {
							return {
								type: "placeholder",
								value: options.getValue(":foo  ", placeHolderContent),
							};
						}
						if (options.match(/^:zing +(.*)/, placeHolderContent)) {
							return {
								type: "placeholder",
								value: options.getValue(/^:zing +(.*)/, placeHolderContent),
							};
						}
					},
				},
			],
			parser(tag) {
				return {
					get() {
						if (tag === "bar bar") {
							return "Hey";
						}
						if (tag === "bang") {
							return "Ho";
						}
						return "Bad";
					},
				};
			},
		},
	},
	{
		it: "should be possible to implement a parser that loads nested data using {user.name}",
		resultText: "Hello John, your age is 33. Date : 17/01/2000",
		...noInternals,
		contentText: "Hello {user.name}, your age is {user.age}. Date : {date}",
		options: {
			parser(tag) {
				const splitted = tag.split(".");
				return {
					get(scope) {
						if (tag === ".") {
							return scope;
						}
						let s = scope;
						for (let i = 0, len = splitted.length; i < len; i++) {
							const key = splitted[i];
							s = s[key];
						}
						return s;
					},
				};
			},
		},
		scope: {
			user: {
				name: "John",
				age: 33,
			},
			date: "17/01/2000",
		},
	},
	{
		it: "should be possible to add nullGetter to module (and use the first nullGetter result)",
		...noInternals,
		contentText: "{foo}",
		resultText: "foo",
		options: {
			modules: () => [
				{
					name: "MyModule",
					nullGetter() {
						return "foo";
					},
				},
				{
					name: "MyModule2",
					nullGetter() {
						return "bar";
					},
				},
			],
		},
	},

	{
		it: "should handle {#userGet} with lambda function",
		contentText: "{#userGet}- {name}{/}",
		resultText: "- John- Mary",
		...noInternals,
		scope: {
			userGet: () => {
				return [
					{
						name: "John",
					},
					{
						name: "Mary",
					},
				];
			},
		},
	},

	{
		it: "should allow to call a function up one scope with expressions parser",
		contentText: "{#users}{hi(.)}{/}",
		resultText: "What&apos;s up, John ?What&apos;s up, Jackie ?",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: {
			hi(user) {
				return `What's up, ${user} ?`;
			},
			users: ["John", "Jackie"],
		},
	},

	{
		it: "should xmlparse strange tags",
		content: "<w:t>{name} {</w:t>FOO<w:t>age</w:t>BAR<w:t>}</w:t>",
		scope: {
			name: "Foo",
			age: 12,
		},
		result:
			'<w:t xml:space="preserve">Foo 12</w:t>FOO<w:t></w:t>BAR<w:t></w:t>',
		xmllexed: [
			startText,
			{ type: "content", value: "{name} {" },
			endText,
			{ type: "content", value: "FOO" },
			startText,
			{ type: "content", value: "age" },
			endText,
			{ type: "content", value: "BAR" },
			startText,
			{ type: "content", value: "}" },
			endText,
		],
		lexed: [
			startText,
			delimiters.start,
			content("name"),
			delimiters.end,
			content(" "),
			delimiters.start,
			endText,
			externalContent("FOO"),
			startText,
			content("age"),
			endText,
			externalContent("BAR"),
			startText,
			delimiters.end,
			endText,
		],
		parsed: [
			startText,
			{ type: "placeholder", value: "name" },
			content(" "),
			{ type: "placeholder", value: "age" },
			endText,
			externalContent("FOO"),
			startText,
			endText,
			externalContent("BAR"),
			startText,
			endText,
		],
		postparsed: null,
	},
	{
		it: "should work with custom delimiters",
		contentText: "Hello [[[name]]",
		scope: {
			name: "John Doe",
		},
		resultText: "Hello John Doe",
		delimiters: {
			start: "[[[",
			end: "]]",
		},
		lexed: [
			startText,
			content("Hello "),
			delimiters.start,
			content("name"),
			delimiters.end,
			endText,
		],
		parsed: [
			startText,
			content("Hello "),
			{ type: "placeholder", value: "name" },
			endText,
		],
		postparsed: null,
	},
	{
		it: "should work with custom delimiters splitted",
		content: '<w:t>Hello {name}</w:t><w:t foo="bar">}, how is it ?</w:t>',
		scope: {
			name: "John Doe",
		},
		result:
			'<w:t xml:space="preserve">Hello John Doe</w:t><w:t foo="bar">, how is it ?</w:t>',
		delimiters: {
			start: "{",
			end: "}}",
		},
		lexed: [
			startText,
			content("Hello "),
			delimiters.start,
			content("name"),
			delimiters.end,
			endText,
			{
				type: "tag",
				value: '<w:t foo="bar">',
				text: true,
				position: "start",
				tag: "w:t",
			},
			content(", how is it ?"),
			endText,
		],
		parsed: [
			startText,
			content("Hello "),
			{ type: "placeholder", value: "name" },
			endText,
			{
				type: "tag",
				value: '<w:t foo="bar">',
				text: true,
				position: "start",
				tag: "w:t",
			},
			content(", how is it ?"),
			endText,
		],
		postparsed: null,
	},
	{
		it: "should work with custom delimiters splitted over > 2 tags",
		content:
			"<w:t>Hello {name}</w:t><w:t>}</w:t>TAG<w:t>}</w:t><w:t>}}foobar</w:t>",
		scope: {
			name: "John Doe",
		},
		result:
			'<w:t xml:space="preserve">Hello John Doe</w:t><w:t></w:t>TAG<w:t></w:t><w:t>foobar</w:t>',
		delimiters: {
			start: "{",
			end: "}}}}}",
		},
		lexed: [
			startText,
			content("Hello "),
			delimiters.start,
			content("name"),
			delimiters.end,
			endText,
			startText,
			endText,
			externalContent("TAG"),
			startText,
			endText,
			startText,
			content("foobar"),
			endText,
		],
		parsed: [
			startText,
			content("Hello "),
			{ type: "placeholder", value: "name" },
			endText,
			startText,
			endText,
			externalContent("TAG"),
			startText,
			endText,
			startText,
			content("foobar"),
			endText,
		],
		postparsed: null,
	},
	{
		it: "should work when having equal sign after closing tag",
		content: "<w:r><w:t>{foo}====</w:t></w:r>",
		scope: {
			foo: "FOO",
		},
		...noInternals,
		result: '<w:r><w:t xml:space="preserve">FOO====</w:t></w:r>',
	},
	{
		it: "should fail when having two open text tags",
		content: "<w:t><w:t>xxx",
		...noInternals,
		error: {
			message: "Malformed xml",
			name: "InternalError",
			properties: {
				id: "malformed_xml",
				explanation: "The template contains malformed xml",
			},
		},
		errorType: Errors.XTInternalError,
	},
	{
		it: "should fail when having two close text tags",
		content: "<w:t></w:t></w:t>xxx",
		...noInternals,
		error: {
			message: "Malformed xml",
			name: "InternalError",
			properties: {
				id: "malformed_xml",
				explanation: "The template contains malformed xml",
			},
		},
		errorType: Errors.XTInternalError,
	},
	{
		it: "should show multierror with loops",
		contentText: "{#a}{b}{/a}",
		...noInternals,
		options: {
			parser() {
				return {
					get() {
						throw new Error("Foobar");
					},
				};
			},
		},
		error: wrapMultiError({
			name: "ScopeParserError",
			message: "Scope parser execution failed",
			properties: {
				explanation: "The scope parser for the tag a failed to execute",
				rootError: {
					message: "Foobar",
				},
				file: "word/document.xml",
				id: "scopeparser_execution_failed",
				xtag: "a",
				offset: 0,
			},
		}),
		errorType: Errors.XTTemplateError,
	},
	{
		it: "should show multierror with loops",
		contentText: "{#a}{b}{/a}",
		...noInternals,
		options: {
			parser(tag) {
				return {
					get(scope) {
						if (tag === "a") {
							return scope[tag];
						}

						throw new Error("Foobar");
					},
				};
			},
		},
		scope: {
			a: [1],
		},
		error: wrapMultiError({
			name: "ScopeParserError",
			message: "Scope parser execution failed",
			properties: {
				explanation: "The scope parser for the tag b failed to execute",
				rootError: {
					message: "Foobar",
				},
				file: "word/document.xml",
				id: "scopeparser_execution_failed",
				scope: 1,
				xtag: "b",
				offset: 4,
			},
		}),
		errorType: Errors.XTTemplateError,
	},

	{
		it: "should work with loops",
		contentText: "Hello {#users}{name}, {/users}",
		scope: {
			users: [{ name: "John Doe" }, { name: "Jane Doe" }, { name: "Wane Doe" }],
		},
		resultText: "Hello John Doe, Jane Doe, Wane Doe, ",
		lexed: [
			startText,
			content("Hello "),
			delimiters.start,
			content("#users"),
			delimiters.end,
			delimiters.start,
			content("name"),
			delimiters.end,
			content(", "),
			delimiters.start,
			content("/users"),
			delimiters.end,
			endText,
		],
		parsed: [
			startText,
			content("Hello "),
			{
				type: "placeholder",
				value: "users",
				location: "start",
				module: "loop",
				inverted: false,
				expandTo: "auto",
			},
			{ type: "placeholder", value: "name" },
			content(", "),
			{ type: "placeholder", value: "users", location: "end", module: "loop" },
			endText,
		],
		postparsed: [
			xmlSpacePreserveTag,
			content("Hello "),
			{
				type: "placeholder",
				value: "users",
				module: "loop",
				inverted: false,
				sectPrCount: 0,
				subparsed: [{ type: "placeholder", value: "name" }, content(", ")],
			},
			endText,
		],
	},
	{
		it: "should work with paragraph loops",
		content:
			"<w:p><w:t>Hello </w:t></w:p><w:p><w:t>{#users}</w:t></w:p><w:p><w:t>User {.}</w:t></w:p><w:p><w:t>{/users}</w:t></w:p>",
		options: {
			paragraphLoop: true,
		},
		scope: {
			users: ["John Doe", "Jane Doe", "Wane Doe"],
		},
		result:
			'<w:p><w:t>Hello </w:t></w:p><w:p><w:t xml:space="preserve">User John Doe</w:t></w:p><w:p><w:t xml:space="preserve">User Jane Doe</w:t></w:p><w:p><w:t xml:space="preserve">User Wane Doe</w:t></w:p>',
		lexed: [
			startParagraph,
			startText,
			content("Hello "),
			endText,
			endParagraph,
			startParagraph,
			startText,
			delimiters.start,
			content("#users"),
			delimiters.end,
			endText,
			endParagraph,
			startParagraph,
			startText,
			content("User "),
			delimiters.start,
			content("."),
			delimiters.end,
			endText,
			endParagraph,
			startParagraph,
			startText,
			delimiters.start,
			content("/users"),
			delimiters.end,
			endText,
			endParagraph,
		],
		parsed: [
			startParagraph,
			startText,
			content("Hello "),
			endText,
			endParagraph,
			startParagraph,
			startText,
			{
				type: "placeholder",
				value: "users",
				location: "start",
				module: "loop",
				inverted: false,
				expandTo: "auto",
			},
			endText,
			endParagraph,
			startParagraph,
			startText,
			content("User "),
			{ type: "placeholder", value: "." },
			endText,
			endParagraph,
			startParagraph,
			startText,
			{ type: "placeholder", value: "users", location: "end", module: "loop" },
			endText,
			endParagraph,
		],
		postparsed: [
			startParagraph,
			startText,
			content("Hello "),
			endText,
			endParagraph,
			{
				type: "placeholder",
				value: "users",
				module: "loop",
				paragraphLoop: true,
				sectPrCount: 0,
				hasPageBreak: false,
				hasPageBreakBeginning: false,
				inverted: false,
				subparsed: [
					startParagraph,
					xmlSpacePreserveTag,
					content("User "),
					{ type: "placeholder", value: "." },
					endText,
					endParagraph,
				],
			},
		],
	},
	{
		it: "should work with paragraph loops and selfclosing paragraphs",
		...noInternals,
		content:
			"<w:p><w:t>{#foo}</w:t></w:p><w:p/><w:xxx></w:xxx><w:p><w:t>{/}</w:t></w:p>",
		options: {
			paragraphLoop: true,
		},
		scope: {
			foo: true,
		},
		result: "<w:p/><w:xxx></w:xxx>",
	},
	{
		it: "should not fail with nested loops if using paragraphLoop",
		content:
			"<w:p><w:t>{#users} {#pets}</w:t></w:p><w:p><w:t>Pet {.}</w:t></w:p><w:p><w:t>{/pets}{/users}</w:t></w:p>",
		...noInternals,
		options: {
			paragraphLoop: true,
		},
		scope: {
			users: [
				{
					pets: ["Cat", "Dog"],
				},
				{
					pets: ["Cat", "Dog"],
				},
			],
		},
		result:
			'<w:p><w:t xml:space="preserve"> </w:t></w:p><w:p><w:t xml:space="preserve">Pet Cat</w:t></w:p><w:p><w:t/></w:p><w:p><w:t xml:space="preserve">Pet Dog</w:t></w:p><w:p><w:t xml:space="preserve"> </w:t></w:p><w:p><w:t xml:space="preserve">Pet Cat</w:t></w:p><w:p><w:t/></w:p><w:p><w:t xml:space="preserve">Pet Dog</w:t></w:p><w:p><w:t/></w:p>',
	},
	{
		it: "should work with spacing loops",
		content: "<w:t>{#condition</w:t><w:t>} hello{/</w:t><w:t>condition}</w:t>",
		scope: {
			condition: true,
		},
		result: '<w:t/><w:t xml:space="preserve"> hello</w:t><w:t></w:t>',
		lexed: [
			startText,
			delimiters.start,
			content("#condition"),
			endText,
			startText,
			delimiters.end,
			content(" hello"),
			delimiters.start,
			content("/"),
			endText,
			startText,
			content("condition"),
			delimiters.end,
			endText,
		],
		parsed: [
			startText,
			{
				type: "placeholder",
				value: "condition",
				location: "start",
				module: "loop",
				inverted: false,
				expandTo: "auto",
			},
			endText,
			startText,
			content(" hello"),
			{
				type: "placeholder",
				value: "condition",
				location: "end",
				module: "loop",
			},
			endText,
			startText,
			endText,
		],
		postparsed: null,
	},
	{
		it: "should work with spacing loops 2",
		...noInternals,
		contentText: "{#condition}{text}{/condition}",
		resultText: " hello ",
		scope: {
			condition: [{ text: " hello " }],
		},
	},
	{
		it: "should work with empty condition",
		...noInternals,
		contentText: "{#a}A{/a}{^b}{/b}",
		resultText: "A",
		scope: {
			a: true,
		},
	},
	{
		it: "should work with spacing loops 3",
		...noInternals,
		content: "<w:t>{#condition}</w:t><w:t>{/condition} foo</w:t>",
		scope: {
			condition: false,
		},
		result: '<w:t xml:space="preserve"> foo</w:t>',
	},
	{
		it: "should work with spacing loops 4",
		...noInternals,
		contentText: "{#condition}foo{/condition}",
		scope: {
			condition: false,
		},
		result: "<w:t/>",
	},
	{
		it: "should work with dashloops",
		content: "<w:p><w:t>Hello {-w:p users}{name}, {/users}</w:t></w:p>",
		scope: {
			users: [{ name: "John Doe" }, { name: "Jane Doe" }, { name: "Wane Doe" }],
		},
		result:
			'<w:p><w:t xml:space="preserve">Hello John Doe, </w:t></w:p><w:p><w:t xml:space="preserve">Hello Jane Doe, </w:t></w:p><w:p><w:t xml:space="preserve">Hello Wane Doe, </w:t></w:p>',
		lexed: [
			startParagraph,
			startText,
			content("Hello "),
			delimiters.start,
			content("-w:p users"),
			delimiters.end,
			delimiters.start,
			content("name"),
			delimiters.end,
			content(", "),
			delimiters.start,
			content("/users"),
			delimiters.end,
			endText,
			endParagraph,
		],
		parsed: [
			startParagraph,
			startText,
			content("Hello "),
			{
				type: "placeholder",
				value: "users",
				location: "start",
				module: "loop",
				inverted: false,
				expandTo: "w:p",
			},
			{ type: "placeholder", value: "name" },
			content(", "),
			{ type: "placeholder", value: "users", location: "end", module: "loop" },
			endText,
			endParagraph,
		],
		postparsed: [
			{
				type: "placeholder",
				value: "users",
				module: "loop",
				inverted: false,
				sectPrCount: 0,
				subparsed: [
					startParagraph,
					xmlSpacePreserveTag,
					content("Hello "),
					{ type: "placeholder", value: "name" },
					content(", "),
					endText,
					endParagraph,
				],
			},
		],
	},
	{
		it: "should drop table if it has no tc",
		...noInternals,
		content:
			"<w:tbl><w:tr><w:tc><w:p><w:t>{-w:tr columns} Hello {-w:p users}{name}, {/users}</w:t><w:t>{/columns}</w:t></w:p></w:tc></w:tr></w:tbl>Other",
		scope: {},
		result: "<w:p/>Other",
	},
	{
		it: "should work with dashloops nested",
		content:
			"<w:tr><w:tc><w:p><w:t>{-w:tr columns} Hello {-w:p users}{name}, {/users}</w:t><w:t>{/columns}</w:t></w:p></w:tc></w:tr>",
		scope: {
			columns: [
				{
					users: [
						{ name: "John Doe" },
						{ name: "Jane Doe" },
						{ name: "Wane Doe" },
					],
				},
			],
		},
		result:
			'<w:tr><w:tc><w:p><w:t xml:space="preserve"> Hello John Doe, </w:t><w:t/></w:p><w:p><w:t xml:space="preserve"> Hello Jane Doe, </w:t><w:t/></w:p><w:p><w:t xml:space="preserve"> Hello Wane Doe, </w:t><w:t/></w:p></w:tc></w:tr>',
		lexed: [
			tableRowStart,
			tableColStart,
			startParagraph,
			startText,
			delimiters.start,
			content("-w:tr columns"),
			delimiters.end,
			content(" Hello "),
			delimiters.start,
			content("-w:p users"),
			delimiters.end,
			delimiters.start,
			content("name"),
			delimiters.end,
			content(", "),
			delimiters.start,
			content("/users"),
			delimiters.end,
			endText,
			startText,
			delimiters.start,
			content("/columns"),
			delimiters.end,
			endText,
			endParagraph,
			tableColEnd,
			tableRowEnd,
		],
		parsed: [
			tableRowStart,
			tableColStart,
			startParagraph,
			startText,
			{
				type: "placeholder",
				value: "columns",
				location: "start",
				module: "loop",
				inverted: false,
				expandTo: "w:tr",
			},
			content(" Hello "),
			{
				type: "placeholder",
				value: "users",
				location: "start",
				module: "loop",
				inverted: false,
				expandTo: "w:p",
			},
			{ type: "placeholder", value: "name" },
			content(", "),
			{ type: "placeholder", value: "users", location: "end", module: "loop" },
			endText,
			startText,
			{
				type: "placeholder",
				value: "columns",
				location: "end",
				module: "loop",
			},
			endText,
			endParagraph,
			tableColEnd,
			tableRowEnd,
		],
		postparsed: null,
	},
	{
		it: "should handle selfclose tag",
		content: "<w:t />",
		scope: {
			user: "Foo",
		},
		result: "<w:t />",
		lexed: [
			{
				type: "tag",
				value: "<w:t />",
				text: true,
				position: "selfclosing",
				tag: "w:t",
			},
		],
		parsed: [
			{
				type: "tag",
				position: "selfclosing",
				value: "<w:t />",
				text: true,
				tag: "w:t",
			},
		],
		postparsed: [
			{
				type: "tag",
				position: "selfclosing",
				value: "<w:t />",
				text: true,
				tag: "w:t",
			},
		],
	},
	{
		it: "should handle {user} with tag with selfclosing",
		content: "<w:t /><w:t>Hi {user}</w:t>",
		scope: {
			user: "Foo",
		},
		result: '<w:t /><w:t xml:space="preserve">Hi Foo</w:t>',
		lexed: [
			{
				type: "tag",
				value: "<w:t />",
				text: true,
				position: "selfclosing",
				tag: "w:t",
			},
			startText,
			content("Hi "),
			delimiters.start,
			content("user"),
			delimiters.end,
			endText,
		],
		parsed: [
			{
				type: "tag",
				position: "selfclosing",
				value: "<w:t />",
				text: true,
				tag: "w:t",
			},
			startText,
			content("Hi "),
			{ type: "placeholder", value: "user" },
			endText,
		],
		postparsed: [
			{
				type: "tag",
				position: "selfclosing",
				value: "<w:t />",
				text: true,
				tag: "w:t",
			},
			xmlSpacePreserveTag,
			content("Hi "),
			{ type: "placeholder", value: "user" },
			endText,
		],
	},
	{
		it: "should be possible to change the delimiters",
		contentText: "Hi {=[[ ]]=}[[user]][[={ }=]] and {user2}",
		scope: {
			user: "John",
			user2: "Jane",
		},
		resultText: "Hi John and Jane",
		lexed: [
			startText,
			content("Hi "),
			delimiters.start,
			content("user"),
			delimiters.end,
			content(" and "),
			delimiters.start,
			content("user2"),
			delimiters.end,
			endText,
		],
		parsed: [
			startText,
			content("Hi "),
			{ type: "placeholder", value: "user" },
			content(" and "),
			{ type: "placeholder", value: "user2" },
			endText,
		],
		postparsed: [
			xmlSpacePreserveTag,
			content("Hi "),
			{ type: "placeholder", value: "user" },
			content(" and "),
			{ type: "placeholder", value: "user2" },
			endText,
		],
	},
	{
		it: "should be possible to change the delimiters",
		contentText: "Hi {=a b c=}",
		error: {
			name: "TemplateError",
			message: "New Delimiters cannot be parsed",
			properties: {
				id: "change_delimiters_invalid",
			},
		},
		errorType: Errors.XTTemplateError,
	},
	{
		it: "should throw error if delimiters invalid",
		contentText: "Hi {= =}",
		error: {
			name: "TemplateError",
			message: "New Delimiters cannot be parsed",
			properties: {
				id: "change_delimiters_invalid",
			},
		},
		errorType: Errors.XTTemplateError,
	},
	{
		it: "should throw error if delimiters invalid (2)",
		contentText: "Hi {=[ =}",
		error: {
			name: "TemplateError",
			message: "New Delimiters cannot be parsed",
			properties: {
				id: "change_delimiters_invalid",
			},
		},
		errorType: Errors.XTTemplateError,
	},
	{
		it: "should throw error if delimiters invalid (3)",
		contentText: "Hi {= ]=}",
		error: {
			name: "TemplateError",
			message: "New Delimiters cannot be parsed",
			properties: {
				id: "change_delimiters_invalid",
			},
		},
		errorType: Errors.XTTemplateError,
	},
	{
		it: "should be possible to change the delimiters with complex example",
		contentText: "Hi {={{[ ]}}=}{{[user]}}{{[={{ ]=]}} and {{user2]",
		scope: {
			user: "John",
			user2: "Jane",
		},
		resultText: "Hi John and Jane",
		lexed: [
			startText,
			content("Hi "),
			delimiters.start,
			content("user"),
			delimiters.end,
			content(" and "),
			delimiters.start,
			content("user2"),
			delimiters.end,
			endText,
		],
		parsed: [
			startText,
			content("Hi "),
			{ type: "placeholder", value: "user" },
			content(" and "),
			{ type: "placeholder", value: "user2" },
			endText,
		],
		postparsed: [
			xmlSpacePreserveTag,
			content("Hi "),
			{ type: "placeholder", value: "user" },
			content(" and "),
			{ type: "placeholder", value: "user2" },
			endText,
		],
	},
	{
		it: "should resolve the data correctly",
		...noInternals,
		contentText: "{test}{#test}{label}{/test}{test}",
		scope: {
			label: "T1",
			test: true,
		},
		resolved: [
			{
				tag: "test",
				lIndex: 3,
				value: true,
			},
			{
				tag: "test",
				lIndex: 15,
				value: true,
			},
			{
				tag: "test",
				lIndex: 6,
				value: [
					[
						{
							tag: "label",
							lIndex: 9,
							value: "T1",
						},
					],
				],
			},
		],
		resultText: "trueT1true",
	},
	{
		it: "should resolve 2 the data correctly",
		...noInternals,
		contentText: "{^a}{label}{/a}",
		scope: {
			a: true,
		},
		resolved: [
			{
				tag: "a",
				lIndex: 3,
				value: [],
			},
		],
		result: "<w:t/>",
	},
	{
		it: "should resolve 3 the data correctly",
		...noInternals,
		contentText:
			"{#frames}{#true}{label}{#false}{label}{/false}{/true}{#false}{label}{/false}{/frames}",
		resultText: "T1",
		scope: {
			frames: [
				{
					label: "T1",
					true: true,
				},
			],
		},
		resolved: [
			{
				tag: "frames",
				lIndex: 3,
				value: [
					[
						{
							tag: "false",
							lIndex: 24,
							value: [],
						},
						{
							tag: "true",
							lIndex: 6,
							value: [
								[
									{
										tag: "label",
										lIndex: 9,
										value: "T1",
									},
									{
										tag: "false",
										lIndex: 12,
										value: [],
									},
								],
							],
						},
					],
				],
			},
		],
	},
	{
		it: "should resolve truthy data correctly",
		contentText:
			"{#loop}L{#cond2}{label}{/cond2}{#cond3}{label}{/cond3}{/loop}",
		resultText: "Linner",
		...noInternals,
		scope: {
			label: "outer",
			loop: [
				{
					cond2: true,
					label: "inner",
				},
			],
		},
	},
	{
		it: "should resolve truthy multi data correctly",
		contentText:
			"{#loop}L{#cond2}{label}{/cond2}{#cond3}{label}{/cond3}{/loop}",
		...noInternals,
		scope: {
			label: "outer",
			loop: [
				{
					cond2: true,
					label: "inner",
				},
				{
					cond2: true,
					label: "inner",
				},
				{
					cond3: true,
					label: "inner",
				},
				{
					cond2: true,
					cond3: true,
				},
			],
		},
		resultText: "LinnerLinnerLinnerLouterouter",
	},
	{
		it: "should resolve async loop",
		contentText: "{#loop}{#cond1}{label}{/}{#cond2}{label}{/}{/loop}",
		...noInternals,
		scope: {
			label: "outer",
			loop: [
				{
					cond1: true,
					label: "inner",
				},
				{
					cond1: true,
					cond2: true,
				},
			],
		},
		resultText: "innerouterouter",
	},
	{
		it: "should work well with inversed loop simple",
		contentText: "{^b}{label}{/}",
		...noInternals,
		scope: {
			b: false,
			label: "hi",
		},
		resultText: "hi",
	},
	{
		it: "should work well with nested inversed loop",
		contentText: "{#a}{^b}{label}{/}{/}",
		...noInternals,
		scope: {
			a: [{ b: false, label: "hi" }],
		},
		resultText: "hi",
	},
	{
		it: "should work well with deeply nested inversed loop nested",
		contentText: "{#a}{^b}{^c}{label}{/}{/}{/}",
		...noInternals,
		scope: {
			a: [{ b: false, label: "hi" }],
		},
		resultText: "hi",
	},
	{
		it: "should work well with true value for condition",
		contentText:
			"{#cond}{#product.price &gt; 10}high{/}{#product.price &lt;= 10}low{/}{/cond}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: {
			cond: true,
			product: {
				price: 2,
			},
		},
		resultText: "low",
	},
	{
		it: "should handle {this+this+this} tag",
		scope: "Foo",
		...noInternals,
		contentText: "Hi {this+this+this}",
		options: {
			parser: expressionParser,
		},
		resultText: "Hi FooFooFoo",
	},
	{
		it: "should handle {((.+.+.)*.*0.5)|sum:.} tag",
		scope: 2,
		...noInternals,
		contentText: "Hi {((((.+.+.)*.*0.5)|sum:.)-.)/.}",
		// = (((2 + 2 + 2)*2 * 0.5 | sum:2)-2)/2
		// = (((6)*2 * 0.5 | sum:2)-2)/2
		// = ((6 | sum:2)-2)/2
		// = ((8)-2)/2
		// = (6)/2
		// = 3
		options: {
			parser: expressionParser,
		},
		resultText: "Hi 3",
	},
	{
		it: "should handle {.['user-name']} tag",
		scope: {
			"user-name": "John",
		},
		...noInternals,
		contentText: "Hi {.['user-name']}",
		options: {
			parser: expressionParser,
		},
		resultText: "Hi John",
	},
	{
		it: "should handle {#loop}{. | myFilter}{/loop} tag",
		scope: {
			loop: [3],
		},
		...noInternals,
		contentText: "Hi {#loop}{. | myFilter}{/loop}",
		options: {
			parser: expressionParser.configure({
				filters: {
					myFilter(input) {
						expect(typeof input).to.equal("number");
						expect(input).to.equal(3);
						return input + input;
					},
				},
			}),
		},
		resultText: "Hi 6",
	},
	{
		it: 'should handle {this["a b"]} tag',
		scope: {
			"a b": "John",
		},
		...noInternals,
		contentText: 'Hi {this["a b"]}',
		options: {
			parser: expressionParser,
		},
		resultText: "Hi John",
	},
	{
		it: 'should handle {this["length"]} tag',
		scope: "John",
		...noInternals,
		contentText: 'Hi { this["length"]}',
		options: {
			parser: expressionParser,
		},
		resultText: "Hi 4",
	},
	{
		it: 'should handle {this["split"]} tag',
		scope: "John",
		...noInternals,
		contentText: 'Hi {this["split"]}',
		options: {
			parser: expressionParser,
		},
		resultText: "Hi undefined",
	},
	{
		it: "should handle {this.split} tag",
		scope: "John",
		...noInternals,
		contentText: "Hi {this.split}",
		options: {
			parser: expressionParser,
		},
		resultText: "Hi undefined",
	},
	{
		it: "should handle {(this+this+this)*this} tag",
		scope: 1,
		...noInternals,
		contentText: "Hi {(this+this+this)*(this+this)}",
		options: {
			parser: expressionParser,
		},
		resultText: "Hi 6",
	},
	{
		it: "should handle {(this+this+this)*(this+this)}, this=0 tag",
		scope: 0,
		...noInternals,
		contentText: "Hi {(   this + this + this)*(this+this)}",
		options: {
			parser: expressionParser,
		},
		resultText: "Hi 0",
	},
	{
		it: "should handle {#products}{# .  }-{ . }-{/}{/}",
		scope: {
			products: [
				[1, 2, 3, 4],
				[4, 5, 6, 7],
			],
		},
		...noInternals,
		// The space inside {# . } is important.
		// It tests a regression that was fixed in version 3.37.12
		contentText: "Hi {#products}{# .  }-{ . }-{/}{/}",
		options: {
			parser: expressionParser,
		},
		resultText: "Hi -1--2--3--4--4--5--6--7-",
	},
	{
		it: "should work well with int value for condition",
		contentText:
			"{#cond}{#product.price &gt; 10}high{/}{#product.price &lt;= 10}low{/}{/cond}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: {
			cond: 10,
			product: {
				price: 2,
			},
		},
		resultText: "low",
	},
	{
		it: "should work well with empty string as result",
		contentText: "{foo}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: {
			foo: "",
		},
		result: "<w:t/>",
	},
	{
		it: "should work well with str value for condition",
		contentText:
			"{#cond}{#product.price &gt; 10}high{/}{#product.price &lt;= 10}low{/}{/cond}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: {
			cond: "cond",
			product: {
				price: 2,
			},
		},
		resultText: "low",
	},
	{
		it: "should work well with false value for condition",
		contentText:
			"{^cond}{#product.price &gt; 10}high{/}{#product.price &lt;= 10}low{/}{/cond}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: {
			cond: false,
			product: {
				price: 2,
			},
		},
		resultText: "low",
	},
	{
		it: "should work well with multi level expression parser",
		// This tag was designed to match /-([^\s]+)\s(.+)$/ which is the prefix of the dash loop
		contentText: "{#users}{name} {date-age+ offset} {/}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: {
			date: 2019,
			offset: 1,
			users: [
				{ name: "John", age: 44 },
				{ name: "Mary", age: 22 },
				{ date: 2100, age: 22, name: "Walt" },
			],
		},
		resultText: "John 1976 Mary 1998 Walt 2079 ",
	},
	{
		it: "should work well with $index expression parser",
		contentText: "{#list}{#$index==0}FIRST {/}{text} {/list}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: { list: [{ text: "Hello" }, { text: "Other item" }] },
		resultText: "FIRST Hello Other item ",
	},
	{
		it: "should work well with $index inside condition expression parser",
		contentText:
			"{#list}{#important}!!{$index+1}{text}{/}{^important}?{$index+1}{text}{/}{/}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: {
			list: [
				{ important: true, text: "Hello" },
				{ text: "Other item" },
				{ important: true, text: "Bye" },
			],
		},
		resultText: "!!1Hello?2Other item!!3Bye",
	},
	{
		it: "should work well with $index inside condition expression parser",
		contentText:
			"{#list}{#important}!!{$index+1}{text}{/}{^important}?{$index+1}{text}{/}{/}",
		...noInternals,
		options: {
			parser: expressionParserIE11,
		},
		scope: {
			list: [
				{ important: true, text: "Hello" },
				{ text: "Other item" },
				{ important: true, text: "Bye" },
			],
		},
		resultText: "!!1Hello?2Other item!!3Bye",
	},
	{
		it: "should work well with nested conditions inside table",
		...noInternals,
		content:
			"<w:tbl><w:tr><w:tc><w:p><w:r><w:t>{#cond}{#cond2}{name}</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>{/}{/}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>",
		options: {
			paragraphLoop: true,
		},
		scope: {
			cond: true,
			cond2: false,
		},
		result: "",
	},
	{
		it: "should work well with -w:tr conditions inside table inside paragraphLoop condition",
		...noInternals,
		content:
			"<w:p><w:r><w:t>{#cond}</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>{-w:tc cond}{val}{/}</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:r><w:t>{/}</w:t></w:r></w:p>",
		options: {
			paragraphLoop: true,
		},
		scope: {
			cond: true,
			val: "yep",
		},
		result:
			'<w:tbl><w:tr><w:tc><w:p><w:r><w:t xml:space="preserve">yep</w:t></w:r></w:p></w:tc></w:tr></w:tbl>',
	},
	{
		it: "should work well with nested expressions parser",
		contentText: "{v}{#c1}{v}{#c2}{v}{#c3}{v}{/}{/}{/}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: {
			v: "0",
			c1: {
				v: "1",
				c2: {
					v: "2",
					c3: {
						v: "3",
					},
				},
			},
		},
		resultText: "0123",
	},
	{
		it: "should work with this with expressions parser",
		contentText: "{#hello}{this}{/hello}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: { hello: ["world"] },
		resultText: "world",
	},
	{
		it: "should be possible to close loops with {/}",
		contentText: "{#products}Product {name}{/}",
		...noInternals,
		scope: { products: [{ name: "Bread" }] },
		resultText: "Product Bread",
	},
	{
		it: "should get parent prop if child is null",
		contentText: "{#c}{label}{/c}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: { c: { label: null }, label: "hello" },
		resultText: "hello",
	},
	{
		it: "should work when using double nested arrays",
		content: "<w:t>{#a}</w:t><w:t>{this}</w:t><w:t>{/}</w:t>",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: { a: [["first-part", "other-part"]] },
		result: '<w:t/><w:t xml:space="preserve">first-part,other-part</w:t><w:t/>',
	},
	{
		it: "should work when using accents or numbers in variable names, ...",
		contentText: "{êtreîöò12áeêëẽ}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		resultText: "undefined",
	},
	{
		it: "should fail when using € sign",
		contentText: "{hello€}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		error: wrapMultiError({
			name: "ScopeParserError",
			message: "Scope parser compilation failed",
			properties: {
				explanation: 'The scope parser for the tag "hello€" failed to compile',
				rootError: {
					message: `[$parse:lexerr] Lexer Error: Unexpected next character  at columns 5-5 [€] in expression [hello€].
http://errors.angularjs.org/"NG_VERSION_FULL"/$parse/lexerr?p0=Unexpected%20next%20character%20&p1=s%205-5%20%5B%E2%82%AC%5D&p2=hello%E2%82%AC`,
				},
				file: "word/document.xml",
				id: "scopeparser_compilation_failed",
				xtag: "hello€",
				offset: 0,
			},
		}),
		errorType: Errors.XTTemplateError,
		resultText: "undefined",
	},
	{
		it: "should disallow access to internal property",
		contentText: '{"".split.toString()}',
		...noInternals,
		options: {
			parser: expressionParser,
		},
		resultText: "undefined",
	},
	{
		it: "should allow filters like | upper",
		contentText: "{name | upper}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: { name: "john" },
		resultText: "JOHN",
	},
	{
		it: "should work when using assignment that is already in the scope",
		contentText: "{b=a}{b}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		scope: { a: 10, b: 5 },
		resultText: "10",
	},
	{
		it: "should work with linebreaks",
		contentText: "{b}",
		...noInternals,
		options: {
			linebreaks: true,
			parser: expressionParser,
		},
		scope: { b: "Hello\n\nFoo\n\nBar\n\n" },
		result:
			'<w:t xml:space="preserve">Hello</w:t></w:r><w:r><w:br/></w:r><w:r><w:t/></w:r><w:r><w:br/></w:r><w:r><w:t xml:space="preserve">Foo</w:t></w:r><w:r><w:br/></w:r><w:r><w:t/></w:r><w:r><w:br/></w:r><w:r><w:t xml:space="preserve">Bar</w:t></w:r><w:r><w:br/></w:r><w:r><w:t/></w:r><w:r><w:br/></w:r><w:r><w:t/>',
	},
	{
		it: "should not fail with no scope on expressionParser",
		contentText: "{b}",
		...noInternals,
		options: {
			parser: expressionParser,
		},
		resultText: "undefined",
	},
	{
		it: "should be possible to add filter for one instance of the expressionParser",
		contentText: "{b|foo}",
		...noInternals,
		options: {
			parser: expressionParser.configure({
				filters: {
					foo() {
						return "FOO";
					},
				},
			}),
		},
		resultText: "FOO",
	},
	(() => {
		const globalData = { val: 0 };
		return {
			it: "should be possible to configure expressionParser with set command",
			contentText: "{#loop}{$$val = (cond ? 0 : $$val + 1); $$val}{/loop}",
			...noInternals,
			options: {
				parser: expressionParser.configure({
					setIdentifier(tag, value) {
						const matchGlobal = /^\$\$/g;
						if (matchGlobal.test(tag)) {
							globalData[tag] = value;
							return true;
						}
					},
					evaluateIdentifier(tag) {
						const matchGlobal = /^\$\$/g;
						if (matchGlobal.test(tag)) {
							return globalData[tag];
						}
					},
				}),
			},
			scope: {
				loop: [
					{ cond: true, x: "foo" },
					{ cond: false, x: "foo" },
					{ cond: false, x: "foo" },
					{ cond: true, x: "foo" },
					{ cond: false, x: "foo" },
				],
			},
			resultText: "01201",
		};
	})(),
	{
		it: "should be possible to use parent scope together with expressionParser",
		contentText: "{#loop}{__b|twice}{b|twice}{/loop}",
		resultText: "2426",
		// __b means in this context "b" but from the rootscope
		scope: {
			loop: [
				{
					b: 2,
				},
				{
					b: 3,
				},
			],
			b: 1,
		},
		...noInternals,
		options: {
			parser: expressionParser.configure({
				evaluateIdentifier(tag, scope, scopeList, context) {
					const matchesParent = /^(_{2,})(.*)/g;
					expect(context.num).to.be.a("number");
					if (matchesParent.test(tag)) {
						const parentCount = tag.replace(matchesParent, "$1").length - 1;
						tag = tag.replace(matchesParent, "$2");
						if (parentCount >= 1) {
							for (let i = scopeList.length - 1 - parentCount; i >= 0; i--) {
								const s = scopeList[i];
								if (s[tag] != null) {
									const property = s[tag];
									return typeof property === "function"
										? property.bind(s)
										: property;
								}
							}
						}
					}
				},
				filters: {
					twice(input) {
						return 2 * input;
					},
				},
			}),
		},
	},
	{
		it: "should be possible to add filter for one instance of the ie11 parser",
		contentText: "{b|foo}",
		resultText: "FOO",
		...noInternals,
		options: {
			parser: expressionParserIE11.configure({
				csp: true,
				filters: {
					foo() {
						return "FOO";
					},
				},
			}),
		},
	},
	{
		it: "should not fail with no scope on ie11 parser",
		contentText: "{b}",
		resultText: "undefined",
		...noInternals,
		options: {
			parser: expressionParserIE11,
		},
	},
	{
		it: "should show error when having table with nested loops",
		content: `<w:tbl>
		<w:tr><w:tc><w:p><w:r><w:t>{#c1}A</w:t></w:r></w:p></w:tc></w:tr>
		<w:tr><w:tc><w:p><w:r><w:t>{/}{#c2}B</w:t></w:r><w:r><w:t>{/}</w:t></w:r></w:p></w:tc></w:tr>
</w:tbl>`,
		error: wrapMultiError({
			name: "TemplateError",
			message: "Unbalanced loop tag",
			properties: {
				explanation: "Unbalanced loop tags {#c1}{/}{#c2}{/}",
				file: "word/document.xml",
				id: "unbalanced_loop_tags",
				lastPair: {
					left: "c1",
					right: "",
				},
				offset: [0, 15],
				pair: {
					left: "c2",
					right: "",
				},
			},
		}),
		errorType: Errors.XTTemplateError,
	},
	{
		it: "should not escape explanation for unclosed tag with &&",
		contentText: "Unclosed tag : {Hi&amp;&amp;Ho",
		error: wrapMultiError({
			name: "TemplateError",
			message: "Unclosed tag",
			properties: {
				explanation: 'The tag beginning with "{Hi&&Ho" is unclosed',
				context: "{Hi&&Ho",
				xtag: "Hi&&Ho",
				file: "word/document.xml",
				id: "unclosed_tag",
				offset: 15,
			},
		}),
		errorType: Errors.XTTemplateError,
	},
	{
		it: "should not escape explanation for unopened tag with &&",
		contentText: "&&foo}",
		error: wrapMultiError({
			name: "TemplateError",
			message: "Unopened tag",
			properties: {
				explanation: 'The tag beginning with "&&foo" is unopened',
				context: "&&foo",
				xtag: "&&foo",
				file: "word/document.xml",
				id: "unopened_tag",
				offset: null,
			},
		}),
		errorType: Errors.XTTemplateError,
	},
	{
		it: "should not escape explanation for unclosed loop with &&",
		contentText: "Unclosed tag : {#Hi&amp;&amp;Ho}{/%%>&lt;&&bar}",
		error: wrapMultiError({
			name: "TemplateError",
			message: "Closing tag does not match opening tag",
			properties: {
				explanation: 'The tag "Hi&&Ho" is closed by the tag "%%><&&bar"',
				file: "word/document.xml",
				openingtag: "Hi&&Ho",
				closingtag: "%%><&&bar",
				id: "closing_tag_does_not_match_opening_tag",
				offset: [15, 32],
			},
		}),
		errorType: Errors.XTTemplateError,
	},
	{
		it: "should not escape explanation for duplicate opening with &&",
		contentText: "Unclosed tag : {Hi&amp;&amp;{foo",
		error: {
			message: "Multi error",
			name: "TemplateError",
			properties: {
				id: "multi_error",
				errors: [
					{
						name: "TemplateError",
						message: "Unclosed tag",
						properties: {
							context: "{Hi&&",
							xtag: "Hi&&",
							explanation: 'The tag beginning with "{Hi&&" is unclosed',
							file: "word/document.xml",
							id: "unclosed_tag",
							offset: null,
						},
					},
					{
						name: "TemplateError",
						message: "Unclosed tag",
						properties: {
							context: "{foo",
							xtag: "foo",
							explanation: 'The tag beginning with "{foo" is unclosed',
							file: "word/document.xml",
							id: "unclosed_tag",
							offset: null,
						},
					},
				],
			},
		},
		errorType: Errors.XTTemplateError,
	},
	{
		it: "should add space=preserve to last tag",
		...noInternals,
		content: `<w:p>
      <w:r>
        <w:t>Hello {firstName} {</w:t>
      </w:r>
      <w:r>
        <w:t>lastName</w:t>
      </w:r>
      <w:r>
        <w:t>} world</w:t>
      </w:r>
    </w:p>`,
		result: `<w:p>
      <w:r>
        <w:t xml:space="preserve">Hello undefined undefined</w:t>
      </w:r>
      <w:r>
        <w:t></w:t>
      </w:r>
      <w:r>
        <w:t xml:space="preserve"> world</w:t>
      </w:r>
    </w:p>`,
	},
	{
		it: "should not fail on triple open tag if allowUnclosedTag is true",
		...noInternals,
		content: `<w:p>
      <w:r>
        <w:t>Hello {{{</w:t>
      </w:r>
      <w:r>
        <w:t>lastName</w:t>
      </w:r>
      <w:r>
        <w:t>} world</w:t>
      </w:r>
    </w:p>`,
		options: {
			syntax: {
				allowUnclosedTag: true,
			},
		},
		scope: { firstName: "John", lastName: "Doe" },
		result: `<w:p>
      <w:r>
        <w:t xml:space="preserve">Hello {{Doe</w:t>
      </w:r>
      <w:r>
        <w:t></w:t>
      </w:r>
      <w:r>
        <w:t xml:space="preserve"> world</w:t>
      </w:r>
    </w:p>`,
	},
	{
		it: "should not fail on SPACED unclosed tag if allowUnclosedTag is true",
		...noInternals,
		content: `<w:p>
      <w:r>
        <w:t>Hello {firstName {</w:t>
      </w:r>
      <w:r>
        <w:t>lastName</w:t>
      </w:r>
      <w:r>
        <w:t>} world</w:t>
      </w:r>
    </w:p>`,
		options: {
			syntax: {
				allowUnclosedTag: true,
			},
		},
		scope: { firstName: "John", lastName: "Doe" },
		result: `<w:p>
      <w:r>
        <w:t xml:space="preserve">Hello {firstName Doe</w:t>
      </w:r>
      <w:r>
        <w:t></w:t>
      </w:r>
      <w:r>
        <w:t xml:space="preserve"> world</w:t>
      </w:r>
    </w:p>`,
	},
	{
		it: "should not fail on SPACED unopened tag if allowUnopenedTag is true",
		...noInternals,
		content: `<w:p>
      <w:r>
        <w:t>Hello firstName} {</w:t>
      </w:r>
      <w:r>
        <w:t>lastName</w:t>
      </w:r>
      <w:r>
        <w:t>} } world} } }</w:t>
      </w:r>
    </w:p>`,
		options: {
			syntax: {
				allowUnopenedTag: true,
			},
		},
		scope: { firstName: "John", lastName: "Doe" },
		result: `<w:p>
      <w:r>
        <w:t xml:space="preserve">Hello firstName} Doe</w:t>
      </w:r>
      <w:r>
        <w:t></w:t>
      </w:r>
      <w:r>
        <w:t xml:space="preserve"> } world} } }</w:t>
      </w:r>
    </w:p>`,
	},
	{
		it: "should not fail if allowUnclosedTag on 'Hello {' string",
		...noInternals,
		content: "<w:p><w:r><w:t>Hello {</w:t></w:r></w:p>",
		options: {
			syntax: {
				allowUnclosedTag: true,
				allowUnopenedTag: true,
			},
		},
		scope: { firstName: "John", lastName: "Doe" },
		result: "<w:p><w:r><w:t>Hello {</w:t></w:r></w:p>",
	},
	{
		it: "should not fail if allowUnclosedTag on 'Hello }' string",
		...noInternals,
		content: "<w:p><w:r><w:t>Hello }</w:t></w:r></w:p>",
		options: {
			syntax: {
				allowUnclosedTag: true,
				allowUnopenedTag: true,
			},
		},
		scope: { firstName: "John", lastName: "Doe" },
		result: "<w:p><w:r><w:t>Hello }</w:t></w:r></w:p>",
	},
	{
		it: "should not fail on double delimiters if allowUnclosedTag and allowUnopenedTag is true",
		...noInternals,
		content: `<w:p>
      <w:r>
        <w:t>Hello {{</w:t>
      </w:r>
      <w:r>
        <w:t>lastName</w:t>
      </w:r>
      <w:r>
        <w:t>}}</w:t>
      </w:r>
    </w:p>`,
		options: {
			syntax: {
				allowUnclosedTag: true,
				allowUnopenedTag: true,
			},
		},
		scope: { firstName: "John", lastName: "Doe" },
		result: `<w:p>
      <w:r>
        <w:t xml:space="preserve">Hello {Doe</w:t>
      </w:r>
      <w:r>
        <w:t></w:t>
      </w:r>
      <w:r>
        <w:t xml:space="preserve">}</w:t>
      </w:r>
    </w:p>`,
	},
	{
		it: "should not fail on unopened tag if allowUnopenedTag is true",
		...noInternals,
		content: `<w:p>
      <w:r>
        <w:t>Hello firstName} {</w:t>
      </w:r>
      <w:r>
        <w:t>lastName</w:t>
      </w:r>
      <w:r>
        <w:t>}} world}}}</w:t>
      </w:r>
    </w:p>}`,
		options: {
			syntax: {
				allowUnopenedTag: true,
			},
		},
		scope: { firstName: "John", lastName: "Doe" },
		result: `<w:p>
      <w:r>
        <w:t xml:space="preserve">Hello firstName} Doe</w:t>
      </w:r>
      <w:r>
        <w:t></w:t>
      </w:r>
      <w:r>
        <w:t xml:space="preserve">} world}}}</w:t>
      </w:r>
    </w:p>}`,
	},
	{
		it: "should be possible to set another change delimiter prefix (use $)",
		...noInternals,
		content: "<w:p><w:r><w:t>{$[[ ]]$}[[name]]</w:t></w:r></w:p>",
		options: {
			syntax: {
				changeDelimiterPrefix: "$",
			},
		},
		scope: { name: "John" },
		result: '<w:p><w:r><w:t xml:space="preserve">John</w:t></w:r></w:p>',
	},
	{
		it: "should be possible to set change delimiter prefix to null",
		...noInternals,
		content: "<w:p><w:r><w:t>{$[[ ]]$}[[name]]</w:t></w:r></w:p>",
		options: {
			syntax: {
				changeDelimiterPrefix: null,
			},
		},
		scope: { name: "John", "$[[ ]]$": "Match ! " },
		result:
			'<w:p><w:r><w:t xml:space="preserve">Match ! [[name]]</w:t></w:r></w:p>',
	},
	{
		it: "should add space=preserve to last tag when having middle tag",
		...noInternals,
		content: `<w:p>
		<w:r>
			<w:t>Hello {</w:t>
		</w:r>
		<w:r>
			<w:t>last_name</w:t>
		</w:r>
		<w:r>
			<w:t>} {</w:t>
		</w:r>
		<w:r>
			<w:t>first_name</w:t>
		</w:r>
		<w:r>
			<w:t>} what's up ?</w:t>
		</w:r>
    </w:p>`,
		result: `<w:p>
		<w:r>
			<w:t xml:space="preserve">Hello undefined</w:t>
		</w:r>
		<w:r>
			<w:t></w:t>
		</w:r>
		<w:r>
			<w:t xml:space="preserve"> undefined</w:t>
		</w:r>
		<w:r>
			<w:t></w:t>
		</w:r>
		<w:r>
			<w:t xml:space="preserve"> what's up ?</w:t>
		</w:r>
    </w:p>`,
	},
	{
		it: "should parse self closing tags",
		content: '<w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr>',
		...noInternals,
		result: null,
		xmllexed: [
			{
				position: "start",
				tag: "w:pPr",
				type: "tag",
				text: false,
				value: "<w:pPr>",
			},
			{
				position: "selfclosing",
				tag: "w:spacing",
				type: "tag",
				text: false,
				value: '<w:spacing w:line="360" w:lineRule="auto"/>',
			},
			{
				position: "end",
				tag: "w:pPr",
				type: "tag",
				text: false,
				value: "</w:pPr>",
			},
		],
	},
	{
		it: "should not fail with empty loop inside loop",
		content: `<w:p><w:r><w:t>A{#a}</w:t></w:r></w:p>
		<w:p><w:r><w:t>{#c}{/}{/}</w:t></w:r></w:p>`,
		...noInternals,
		result: '<w:p><w:r><w:t xml:space="preserve">A</w:t></w:r></w:p>',
	},
	{
		// The specificity of this input is that it contains : <a:ext uri="{9D8B030D-6E8A-4147-A177-3AD203B41FA5}">
		// So in the algorithm that updates the height of the table, those tags should be ignored
		it: "should work with table pptx nested and empty 'ext' element",
		...noInternals,
		content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:graphicFrame>
        <p:xfrm>
          <a:off x="3561792" y="1315064"/>
          <a:ext cx="5853297" cy="713565"/>
        </p:xfrm>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
            <a:tbl>
              <a:tblGrid>
                <a:gridCol w="3275655">
                  <a:extLst>
                    <a:ext uri="{9D8B030D-6E8A-4147-A177-3AD203B41FA5}">
                      <a16:colId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" val="3066261218"/>
                    </a:ext>
                  </a:extLst>
                </a:gridCol>
                <a:gridCol w="2577642">
                  <a:extLst>
                    <a:ext uri="{9D8B030D-6E8A-4147-A177-3AD203B41FA5}">
                      <a16:colId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" val="913921408"/>
                    </a:ext>
                  </a:extLst>
                </a:gridCol>
              </a:tblGrid>
              <a:tr h="347805">
                <a:tc>
                  <a:txBody>
                    <a:bodyPr/>
                    <a:lstStyle/>
                    <a:p>
                      <a:r>
                        <a:t>ABC</a:t>
                      </a:r>
                    </a:p>
                  </a:txBody>
                  <a:tcPr/>
                </a:tc>
                <a:tc>
                  <a:txBody>
                    <a:bodyPr/>
                    <a:lstStyle/>
                    <a:p>
                      <a:r>
                        <a:t>DEF</a:t>
                      </a:r>
                    </a:p>
                  </a:txBody>
                  <a:tcPr/>
                </a:tc>
                <a:extLst>
                  <a:ext uri="{0D108BD9-81ED-4DB2-BD59-A6C34878D82A}">
                    <a16:rowId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" val="2223618801"/>
                  </a:ext>
                </a:extLst>
              </a:tr>
              <a:tr h="347805">
                <a:tc>
                  <a:txBody>
                    <a:bodyPr/>
                    <a:lstStyle/>
                    <a:p>
                      <a:r>
                        <a:t>{#loop1}{#loop2}</a:t>
                      </a:r>
                      <a:r>
                        <a:t>{name}</a:t>
                      </a:r>
                      <a:r>
                        <a:t>{/}{#loop3}</a:t>
                      </a:r>
                      <a:r>
                        <a:t>TTT</a:t>
                      </a:r>
                      <a:r>
                        <a:t>{/}</a:t>
                      </a:r>
                    </a:p>
                  </a:txBody>
                  <a:tcPr/>
                </a:tc>
                <a:tc>
                  <a:txBody>
                    <a:bodyPr/>
                    <a:lstStyle/>
                    <a:p>
                      <a:r>
                        <a:t>{#loop3}</a:t>
                      </a:r>
                      <a:r>
                        <a:t>{name}</a:t>
                      </a:r>
                      <a:r>
                        <a:t>{/}{#loop4}</a:t>
                      </a:r>
                      <a:r>
                        <a:t>DEF</a:t>
                      </a:r>
                      <a:r>
                        <a:t>{/}{/loop1}</a:t>
                      </a:r>
                    </a:p>
                  </a:txBody>
                  <a:tcPr/>
                </a:tc>
                <a:extLst>
                  <a:ext uri="{0D108BD9-81ED-4DB2-BD59-A6C34878D82A}">
                    <a16:rowId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" val="1379104515"/>
                  </a:ext>
                </a:extLst>
              </a:tr>
            </a:tbl>
          </a:graphicData>
        </a:graphic>
      </p:graphicFrame>
    </p:spTree>
    <p:extLst>
      <p:ext uri="{BB962C8B-B14F-4D97-AF65-F5344CB8AC3E}">
        <p14:creationId xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" val="2554173214"/>
      </p:ext>
    </p:extLst>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:sld>`,
		scope: { loop1: [1, 2, 3], loop2: [1, 2, 3] },
		result: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:graphicFrame>
        <p:xfrm>
          <a:off x="3561792" y="1315064"/>
          <a:ext cx="5853297" cy="1409175"/>
        </p:xfrm>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
            <a:tbl>
              <a:tblGrid>
                <a:gridCol w="3275655">
                  <a:extLst>
                    <a:ext uri="{9D8B030D-6E8A-4147-A177-3AD203B41FA5}">
                      <a16:colId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" val="3066261218"/>
                    </a:ext>
                  </a:extLst>
                </a:gridCol>
                <a:gridCol w="2577642">
                  <a:extLst>
                    <a:ext uri="{9D8B030D-6E8A-4147-A177-3AD203B41FA5}">
                      <a16:colId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" val="913921408"/>
                    </a:ext>
                  </a:extLst>
                </a:gridCol>
              </a:tblGrid>
              <a:tr h="347805">
                <a:tc>
                  <a:txBody>
                    <a:bodyPr/>
                    <a:lstStyle/>
                    <a:p>
                      <a:r>
                        <a:t>ABC</a:t>
                      </a:r>
                    </a:p>
                  </a:txBody>
                  <a:tcPr/>
                </a:tc>
                <a:tc>
                  <a:txBody>
                    <a:bodyPr/>
                    <a:lstStyle/>
                    <a:p>
                      <a:r>
                        <a:t>DEF</a:t>
                      </a:r>
                    </a:p>
                  </a:txBody>
                  <a:tcPr/>
                </a:tc>
                <a:extLst>
                  <a:ext uri="{0D108BD9-81ED-4DB2-BD59-A6C34878D82A}">
                    <a16:rowId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" val="2223618801"/>
                  </a:ext>
                </a:extLst>
              </a:tr>
              <a:tr h="347805">
                <a:tc>
                  <a:txBody>
                    <a:bodyPr/>
                    <a:lstStyle/>
                    <a:p>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                      <a:r>
                        <a:t>undefined</a:t>
                      </a:r>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                      <a:r>
                        <a:t>undefined</a:t>
                      </a:r>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                      <a:r>
                        <a:t>undefined</a:t>
                      </a:r>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                    </a:p>
                  </a:txBody>
                  <a:tcPr/>
                </a:tc>
                <a:tc>
                  <a:txBody>
                    <a:bodyPr/>
                    <a:lstStyle/>
                    <a:p>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                    </a:p>
                  </a:txBody>
                  <a:tcPr/>
                </a:tc>
                <a:extLst>
                  <a:ext uri="{0D108BD9-81ED-4DB2-BD59-A6C34878D82A}">
                    <a16:rowId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" val="1379104515"/>
                  </a:ext>
                </a:extLst>
              </a:tr><a:tr h="347805">
                <a:tc>
                  <a:txBody>
                    <a:bodyPr/>
                    <a:lstStyle/>
                    <a:p>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                      <a:r>
                        <a:t>undefined</a:t>
                      </a:r>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                      <a:r>
                        <a:t>undefined</a:t>
                      </a:r>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                      <a:r>
                        <a:t>undefined</a:t>
                      </a:r>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                    </a:p>
                  </a:txBody>
                  <a:tcPr/>
                </a:tc>
                <a:tc>
                  <a:txBody>
                    <a:bodyPr/>
                    <a:lstStyle/>
                    <a:p>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                    </a:p>
                  </a:txBody>
                  <a:tcPr/>
                </a:tc>
                <a:extLst>
                  <a:ext uri="{0D108BD9-81ED-4DB2-BD59-A6C34878D82A}">
                    <a16:rowId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" val="1379104516"/>
                  </a:ext>
                </a:extLst>
              </a:tr><a:tr h="347805">
                <a:tc>
                  <a:txBody>
                    <a:bodyPr/>
                    <a:lstStyle/>
                    <a:p>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                      <a:r>
                        <a:t>undefined</a:t>
                      </a:r>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                      <a:r>
                        <a:t>undefined</a:t>
                      </a:r>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                      <a:r>
                        <a:t>undefined</a:t>
                      </a:r>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                    </a:p>
                  </a:txBody>
                  <a:tcPr/>
                </a:tc>
                <a:tc>
                  <a:txBody>
                    <a:bodyPr/>
                    <a:lstStyle/>
                    <a:p>
                      <a:r>
                        <a:t></a:t>
                      </a:r>
                    </a:p>
                  </a:txBody>
                  <a:tcPr/>
                </a:tc>
                <a:extLst>
                  <a:ext uri="{0D108BD9-81ED-4DB2-BD59-A6C34878D82A}">
                    <a16:rowId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" val="1379104517"/>
                  </a:ext>
                </a:extLst>
              </a:tr>
            </a:tbl>
          </a:graphicData>
        </a:graphic>
      </p:graphicFrame>
    </p:spTree>
    <p:extLst>
      <p:ext uri="{BB962C8B-B14F-4D97-AF65-F5344CB8AC3E}">
        <p14:creationId xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" val="2554173214"/>
      </p:ext>
    </p:extLst>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:sld>`,
		pptx: true,
	},
];

const rawXmlTest = {
	it: "should work with rawxml",
	content: "BEFORE<w:p><w:t>{@rawxml}</w:t></w:p>AFTER",
	scope: {
		rawxml:
			'<w:p><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>My custom</w:t></w:r><w:r><w:rPr><w:color w:val="00FF00"/></w:rPr><w:t>XML</w:t></w:r></w:p>',
	},
	result:
		'BEFORE<w:p><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>My custom</w:t></w:r><w:r><w:rPr><w:color w:val="00FF00"/></w:rPr><w:t>XML</w:t></w:r></w:p>AFTER',
	lexed: [
		externalContent("BEFORE"),
		startParagraph,
		startText,
		delimiters.start,
		content("@rawxml"),
		delimiters.end,
		endText,
		endParagraph,
		externalContent("AFTER"),
	],
	parsed: [
		externalContent("BEFORE"),
		startParagraph,
		startText,
		{ type: "placeholder", value: "rawxml", module: "rawxml" },
		endText,
		endParagraph,
		externalContent("AFTER"),
	],
	postparsed: [
		externalContent("BEFORE"),
		{
			type: "placeholder",
			value: "rawxml",
			module: "rawxml",
			expanded: [
				[startParagraph, xmlSpacePreserveTag],
				[endText, endParagraph],
			],
		},
		externalContent("AFTER"),
	],
};

fixtures.push(rawXmlTest);
fixtures.push({
	...rawXmlTest,
	it: "should work with rawxml with undefined tags",
	scope: {},
	result: "BEFOREAFTER",
});
fixtures.push({
	...rawXmlTest,
	it: "should throw error with rawxml with scope that is an integer",
	scope: { rawxml: 11 },
	error: wrapMultiError({
		name: "RenderingError",
		message: "Non string values are not allowed for rawXML tags",
		properties: {
			explanation: "The value of the raw tag : 'rawxml' is not a string",
			file: "word/document.xml",
			id: "invalid_raw_xml_value",
			value: 11,
			xtag: "rawxml",
			offset: 0,
		},
	}),
	errorType: Errors.XTTemplateError,
});

fixtures.forEach(function (fixture) {
	const delimiters = {
		delimiters: fixture.delimiters || {
			start: "{",
			end: "}",
		},
	};
	fixture.options = assign({}, fixture.options, delimiters);
});

module.exports = fixtures;
