const { assign } = require("lodash");
const angularParser = require("./angular-parser.js");
const Errors = require("../errors.js");
const { wrapMultiError } = require("./utils.js");
const nbsp = String.fromCharCode(160);

const noInternals = {
	lexed: null,
	parsed: null,
	postparsed: null,
	resolved: null,
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
		content: "<w:t>Hi {user}</w:t>",
		scope: {
			user: "Foo",
		},
		result: '<w:t xml:space="preserve">Hi Foo</w:t>',
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
		postparsed: [
			xmlSpacePreserveTag,
			content("Hi "),
			{ type: "placeholder", value: "user" },
			endText,
		],
	},
	{
		it: "should handle {.} with tag",
		content: "<w:t>Hi {.}</w:t>",
		scope: "Foo",
		result: '<w:t xml:space="preserve">Hi Foo</w:t>',
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
		content: "<w:t>{#users}{userGreeting}{/}</w:t>",
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
		result:
			'<w:t xml:space="preserve">How is it going, John ? 1How is it going, Mary ? 1</w:t>',
		...noInternals,
	},
	{
		it: "should handle non breaking space in tag",
		result: '<w:t xml:space="preserve">Hey Ho</w:t>',
		content: `<w:t>{:foo${nbsp}${nbsp}bar${nbsp}bar} {:zing${nbsp}${nbsp}${nbsp}bang}</w:t>`,
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
		...noInternals,
	},
	{
		it: "should be possible to add nullGetter to module",
		result: '<w:t xml:space="preserve">foo</w:t>',
		content: "<w:t>{foo}</w:t>",
		options: {
			modules: () => [
				{
					name: "MyModule",
					nullGetter(tag) {
						return tag.value;
					},
				},
			],
		},
		...noInternals,
	},

	{
		it: "should handle {#userGet} with lambda function",
		content: "<w:t>{#userGet}- {name}{/}</w:t>",
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
		result: '<w:t xml:space="preserve">- John- Mary</w:t>',
		...noInternals,
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
		postparsed: null,
	},
	{
		it: "should work with custom delimiters",
		content: "<w:t>Hello [[[name]]</w:t>",
		scope: {
			name: "John Doe",
		},
		result: '<w:t xml:space="preserve">Hello John Doe</w:t>',
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
		it: "should show multierror with loops",
		content: "<w:t>{#a}{b}{/a}</w:t>",
		scope: {
			a: [1],
		},
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
		errorType: Errors.XTTemplateError,
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
		...noInternals,
	},
	{
		it: "should work with loops",
		content: "<w:t>Hello {#users}{name}, {/users}</w:t>",
		scope: {
			users: [{ name: "John Doe" }, { name: "Jane Doe" }, { name: "Wane Doe" }],
		},
		result:
			'<w:t xml:space="preserve">Hello John Doe, Jane Doe, Wane Doe, </w:t>',
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
		options: {
			paragraphLoop: true,
		},
	},
	{
		it: "should not fail with nested loops if using paragraphLoop",
		content:
			"<w:p><w:t>{#users} {#pets}</w:t></w:p><w:p><w:t>Pet {.}</w:t></w:p><w:p><w:t>{/pets}{/users}</w:t></w:p>",
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
		...noInternals,
		options: {
			paragraphLoop: true,
		},
	},
	{
		it: "should work with spacing loops",
		content: "<w:t>{#condition</w:t><w:t>} hello{/</w:t><w:t>condition}</w:t>",
		result: '<w:t/><w:t xml:space="preserve"> hello</w:t><w:t></w:t>',
		scope: {
			condition: true,
		},
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
		content: "<w:t>{#condition}{text}{/condition}</w:t>",
		result: '<w:t xml:space="preserve"> hello </w:t>',
		...noInternals,
		scope: {
			condition: [{ text: " hello " }],
		},
	},
	{
		it: "should work with empty condition",
		content: "<w:t>{#a}A{/a}{^b}{/b}</w:t>",
		result: '<w:t xml:space="preserve">A</w:t>',
		...noInternals,
		scope: {
			a: true,
		},
	},
	{
		it: "should work with spacing loops 3",
		content: "<w:t>{#condition}</w:t><w:t>{/condition} foo</w:t>",
		result: '<w:t xml:space="preserve"> foo</w:t>',
		...noInternals,
		scope: {
			condition: false,
		},
	},
	{
		it: "should work with spacing loops 4",
		content: "<w:t>{#condition}foo{/condition}</w:t>",
		result: "<w:t/>",
		...noInternals,
		scope: {
			condition: false,
		},
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
		it: "should work with dashloops nested",
		content:
			"<w:tr><w:p><w:t>{-w:tr columns} Hello {-w:p users}{name}, {/users}</w:t><w:t>{/columns}</w:t></w:p></w:tr>",
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
			'<w:tr><w:p><w:t xml:space="preserve"> Hello John Doe, </w:t><w:t/></w:p><w:p><w:t xml:space="preserve"> Hello Jane Doe, </w:t><w:t/></w:p><w:p><w:t xml:space="preserve"> Hello Wane Doe, </w:t><w:t/></w:p></w:tr>',
		lexed: [
			tableRowStart,
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
			tableRowEnd,
		],
		parsed: [
			tableRowStart,
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
		content: "<w:t>Hi {=[[ ]]=}[[user]][[={ }=]] and {user2}</w:t>",
		scope: {
			user: "John",
			user2: "Jane",
		},
		result: '<w:t xml:space="preserve">Hi John and Jane</w:t>',
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
		content: "<w:t>Hi {=a b c=}</w:t>",
		errorType: Errors.XTTemplateError,
		error: {
			name: "TemplateError",
			message: "New Delimiters cannot be parsed",
			properties: {
				id: "change_delimiters_invalid",
			},
		},
	},
	{
		it: "should be possible to change the delimiters",
		content: "<w:t>Hi {= =}</w:t>",
		errorType: Errors.XTTemplateError,
		error: {
			name: "TemplateError",
			message: "New Delimiters cannot be parsed",
			properties: {
				id: "change_delimiters_invalid",
			},
		},
	},
	{
		it: "should be possible to change the delimiters with complex example",
		content: "<w:t>Hi {={{[ ]}}=}{{[user]}}{{[={{ ]=]}} and {{user2]</w:t>",
		scope: {
			user: "John",
			user2: "Jane",
		},
		result: '<w:t xml:space="preserve">Hi John and Jane</w:t>',
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
		content: "<w:t>{test}{#test}{label}{/test}{test}</w:t>",
		result: '<w:t xml:space="preserve">trueT1true</w:t>',
		scope: {
			label: "T1",
			test: true,
		},
		resolved: [
			{
				tag: "test",
				value: true,
				lIndex: 3,
			},
			{
				tag: "test",
				value: true,
				lIndex: 15,
			},
			{
				tag: "test",
				value: [
					[
						{
							tag: "label",
							value: "T1",
							lIndex: 9,
						},
					],
				],
				lIndex: 6,
			},
		],
		...noInternals,
	},
	{
		it: "should resolve 2 the data correctly",
		content: "<w:t>{^a}{label}{/a}</w:t>",
		result: "<w:t/>",
		scope: {
			a: true,
		},
		resolved: [
			{
				tag: "a",
				value: [],
				lIndex: 3,
			},
		],
		...noInternals,
	},
	{
		it: "should resolve 3 the data correctly",
		content:
			"<w:t>{#frames}{#true}{label}{#false}{label}{/false}{/true}{#false}{label}{/false}{/frames}</w:t>",
		result: '<w:t xml:space="preserve">T1</w:t>',
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
				value: [
					[
						{
							tag: "false",
							value: [],
							lIndex: 24,
						},
						{
							tag: "true",
							value: [
								[
									{
										tag: "label",
										value: "T1",
										lIndex: 9,
									},
									{
										tag: "false",
										value: [],
										lIndex: 12,
									},
								],
							],
							lIndex: 6,
						},
					],
				],
				lIndex: 3,
			},
		],
		...noInternals,
	},
	{
		it: "should resolve truthy data correctly",
		content:
			"<w:t>{#loop}L{#cond2}{label}{/cond2}{#cond3}{label}{/cond3}{/loop}</w:t>",
		result: '<w:t xml:space="preserve">Linner</w:t>',
		scope: {
			label: "outer",
			loop: [
				{
					cond2: true,
					label: "inner",
				},
			],
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should resolve truthy multi data correctly",
		content:
			"<w:t>{#loop}L{#cond2}{label}{/cond2}{#cond3}{label}{/cond3}{/loop}</w:t>",
		result: '<w:t xml:space="preserve">LinnerLinnerLinnerLouterouter</w:t>',
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
		...noInternals,
		resolved: null,
	},
	{
		it: "should resolve async loop",
		content: "<w:t>{#loop}{#cond1}{label}{/}{#cond2}{label}{/}{/loop}</w:t>",
		result: '<w:t xml:space="preserve">innerouterouter</w:t>',
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
		...noInternals,
		resolved: null,
	},
	{
		it: "should work well with inversed loop simple",
		content: "<w:t>{^b}{label}{/}</w:t>",
		result: '<w:t xml:space="preserve">hi</w:t>',
		scope: {
			b: false,
			label: "hi",
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should work well with nested inversed loop",
		content: "<w:t>{#a}{^b}{label}{/}{/}</w:t>",
		result: '<w:t xml:space="preserve">hi</w:t>',
		scope: {
			a: [{ b: false, label: "hi" }],
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should work well with deeply nested inversed loop nested",
		content: "<w:t>{#a}{^b}{^c}{label}{/}{/}{/}</w:t>",
		result: '<w:t xml:space="preserve">hi</w:t>',
		scope: {
			a: [{ b: false, label: "hi" }],
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should work well with true value for condition",
		content:
			"<w:t>{#cond}{#product.price &gt; 10}high{/}{#product.price &lt;= 10}low{/}{/cond}</w:t>",
		result: '<w:t xml:space="preserve">low</w:t>',
		scope: {
			cond: true,
			product: {
				price: 2,
			},
		},
		options: {
			parser: angularParser,
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should work well with int value for condition",
		content:
			"<w:t>{#cond}{#product.price &gt; 10}high{/}{#product.price &lt;= 10}low{/}{/cond}</w:t>",
		result: '<w:t xml:space="preserve">low</w:t>',
		scope: {
			cond: 10,
			product: {
				price: 2,
			},
		},
		options: {
			parser: angularParser,
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should work well with str value for condition",
		content:
			"<w:t>{#cond}{#product.price &gt; 10}high{/}{#product.price &lt;= 10}low{/}{/cond}</w:t>",
		result: '<w:t xml:space="preserve">low</w:t>',
		scope: {
			cond: "cond",
			product: {
				price: 2,
			},
		},
		options: {
			parser: angularParser,
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should work well with false value for condition",
		content:
			"<w:t>{^cond}{#product.price &gt; 10}high{/}{#product.price &lt;= 10}low{/}{/cond}</w:t>",
		result: '<w:t xml:space="preserve">low</w:t>',
		scope: {
			cond: false,
			product: {
				price: 2,
			},
		},
		options: {
			parser: angularParser,
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should work well with multi level angular parser",
		// This tag was designed to match /-([^\s]+)\s(.+)$/ which is the prefix of the dash loop
		content: "<w:t>{#users}{name} {date-age+ offset} {/}</w:t>",
		result: '<w:t xml:space="preserve">John 1976 Mary 1998 Walt 2079 </w:t>',
		scope: {
			date: 2019,
			offset: 1,
			users: [
				{ name: "John", age: 44 },
				{ name: "Mary", age: 22 },
				{ date: 2100, age: 22, name: "Walt" },
			],
		},
		options: {
			parser: angularParser,
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should work well with -w:tr conditions inside table inside paragraphLoop condition",
		content:
			"<w:p><w:r><w:t>{#cond}</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>{-w:tc cond}{val}{/}</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:r><w:t>{/}</w:t></w:r></w:p>",
		result:
			'<w:tbl><w:tr><w:tc><w:p><w:r><w:t xml:space="preserve">yep</w:t></w:r></w:p></w:tc></w:tr></w:tbl>',
		scope: {
			cond: true,
			val: "yep",
		},
		options: {
			paragraphLoop: true,
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should work well with nested angular expressions",
		content: "<w:t>{v}{#c1}{v}{#c2}{v}{#c3}{v}{/}{/}{/}</w:t>",
		result: '<w:t xml:space="preserve">0123</w:t>',
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
		options: {
			parser: angularParser,
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should work with this with angular expressions",
		content: "<w:t>{#hello}{this}{/hello}</w:t>",
		result: '<w:t xml:space="preserve">world</w:t>',
		scope: { hello: ["world"] },
		options: {
			parser: angularParser,
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should get parent prop if child is null",
		content: "<w:t>{#c}{label}{/c}</w:t>",
		result: '<w:t xml:space="preserve">hello</w:t>',
		scope: { c: { label: null }, label: "hello" },
		options: {
			parser: angularParser,
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should work when using double nested arrays",
		content: "<w:t>{#a}</w:t><w:t>{this}</w:t><w:t>{/}</w:t>",
		result: '<w:t/><w:t xml:space="preserve">first-part,other-part</w:t><w:t/>',
		scope: { a: [["first-part", "other-part"]] },
		options: {
			parser: angularParser,
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should work when using angular assignment that is already in the scope",
		content: "<w:t>{b=a}{b}</w:t>",
		result: '<w:t xml:space="preserve">10</w:t>',
		scope: { a: 10, b: 5 },
		options: {
			parser: angularParser,
		},
		...noInternals,
		resolved: null,
	},
	{
		it: "should work with linebreaks",
		content: "<w:t>{b}</w:t>",
		result:
			'<w:t xml:space="preserve">Hello</w:t></w:r><w:r><w:br/></w:r><w:r><w:t/></w:r><w:r><w:br/></w:r><w:r><w:t xml:space="preserve">Foo</w:t></w:r><w:r><w:br/></w:r><w:r><w:t/></w:r><w:r><w:br/></w:r><w:r><w:t xml:space="preserve">Bar</w:t></w:r><w:r><w:br/></w:r><w:r><w:t/></w:r><w:r><w:br/></w:r><w:r><w:t/>',
		scope: { b: "Hello\n\nFoo\n\nBar\n\n" },
		options: {
			linebreaks: true,
			parser: angularParser,
		},
		...noInternals,
	},
	{
		it: "should work for table with nested loops",
		content: `<w:tbl>
		<w:tr><w:tc><w:p><w:r><w:t>{#c1}A</w:t></w:r></w:p></w:tc></w:tr>
		<w:tr><w:tc><w:p><w:r><w:t>{/}{#c2}B</w:t></w:r><w:r><w:t>{/}</w:t></w:r></w:p></w:tc></w:tr>
</w:tbl>`,
		errorType: Errors.XTTemplateError,
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
	},
	{
		it: "should not escape explanation for unclosed tag with &&",
		content: "<w:t>Unclosed tag : {Hi&amp;&amp;Ho</w:t>",
		errorType: Errors.XTTemplateError,
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
	},
	{
		it: "should not escape explanation for unopened tag with &&",
		content: "<w:t>&&foo}</w:t>",
		errorType: Errors.XTTemplateError,
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
	},
	{
		it: "should not escape explanation for unclosed loop with &&",
		content: "<w:t>Unclosed tag : {#Hi&amp;&amp;Ho}{/%%>&lt;&&bar}</w:t>",
		errorType: Errors.XTTemplateError,
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
	},
	{
		it: "should not escape explanation for duplicate opening with &&",
		content: "<w:t>Unclosed tag : {Hi&amp;&amp;{foo</w:t>",
		errorType: Errors.XTTemplateError,
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
		...noInternals,
		result: null,
		content: '<w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr>',
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
		pptx: true,
		scope: { loop1: [1, 2, 3], loop2: [1, 2, 3] },
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
				[startParagraph, startText],
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
	scope: { rawxml: 11},
	errorType: Errors.XTTemplateError,
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
