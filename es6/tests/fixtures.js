const { clone, assign } = require("lodash");
const angularParser = require("./angular-parser");

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

const fixtures = {
	simple: {
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
		postparsed: [
			xmlSpacePreserveTag,
			content("Hi "),
			{ type: "placeholder", value: "user" },
			endText,
		],
	},
	dot: {
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
	strangetags: {
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
	otherdelimiters: {
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
	otherdelimiterssplitted: {
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
	otherdelimiterssplittedover2tags: {
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
	looptag: {
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
	paragraphlooptag: {
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
	nestedparagraphlooptag: {
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
		lexed: null,
		parsed: null,
		postparsed: null,
		options: {
			paragraphLoop: true,
		},
	},
	spacingloops: {
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
	spacingloops2: {
		it: "should work with spacing loops 2",
		content: "<w:t>{#condition}{text}{/condition}</w:t>",
		result: '<w:t xml:space="preserve"> hello </w:t>',
		lexed: null,
		parsed: null,
		postparsed: null,
		scope: {
			condition: [{ text: " hello " }],
		},
	},
	spacingloops3: {
		it: "should work with spacing loops 3",
		content: "<w:t>{#condition}</w:t><w:t>{/condition} foo</w:t>",
		result: '<w:t xml:space="preserve"> foo</w:t>',
		lexed: null,
		parsed: null,
		postparsed: null,
		scope: {
			condition: false,
		},
	},
	spacingloops4: {
		it: "should work with spacing loops 4",
		content: "<w:t>{#condition}foo{/condition}</w:t>",
		result: "<w:t/>",
		lexed: null,
		parsed: null,
		postparsed: null,
		scope: {
			condition: false,
		},
	},
	dashlooptag: {
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
	dashloopnested: {
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
	rawxml: {
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
	},
	selfclosing: {
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
	selfclosing_with_placeholderr: {
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
	delimiters_change: {
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
	delimiters_change_complex: {
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
	error_resolve: {
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
		lexed: null,
		parsed: null,
		postparsed: null,
	},
	error_resolve_2: {
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
		lexed: null,
		parsed: null,
		postparsed: null,
	},
	error_resolve_3: {
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
		lexed: null,
		parsed: null,
		postparsed: null,
	},
	error_resolve_truthy: {
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
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
	error_resolve_truthy_multi: {
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
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
	async_loop_issue: {
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
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
	inversed_loop: {
		it: "should work well with inversed loop",
		content: "<w:t>{#a}{^b}{label}{/}{/}</w:t>",
		result: '<w:t xml:space="preserve">hi</w:t>',
		scope: {
			a: [{ b: false, label: "hi" }],
		},
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
	inversed_loop_nested: {
		it: "should work well with inversed loop nested",
		content: "<w:t>{#a}{^b}{^c}{label}{/}{/}{/}</w:t>",
		result: '<w:t xml:space="preserve">hi</w:t>',
		scope: {
			a: [{ b: false, label: "hi" }],
		},
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
	inversed_loop_nested_resolved: {
		it: "should work well with inversed loop nested",
		content: "<w:t>{#a}{^b}{^c}{label}{/}{/}{/}</w:t>",
		result: '<w:t xml:space="preserve">hi</w:t>',
		scope: {
			label: "outer",
			a: [{ b: false, label: "hi" }],
		},
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
	condition_true_value: {
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
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
	condition_int_value: {
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
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
	condition_string_value: {
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
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
	condition_false_value: {
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
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
	condition_multi_level: {
		it: "should work well with multi level angular parser",
		content: "<w:t>{#users}{name} {date-age} {/}</w:t>",
		result: '<w:t xml:space="preserve">John 1975 Mary 1997 Walt 2078 </w:t>',
		scope: {
			date: 2019,
			users: [
				{ name: "John", age: 44 },
				{ name: "Mary", age: 22 },
				{ date: 2100, age: 22, name: "Walt" },
			],
		},
		options: {
			parser: angularParser,
		},
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
	condition_w_tr: {
		it:
			"should work well with -w:tr conditions inside table inside paragraphLoop condition",
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
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
	angular_expressions: {
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
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
	angular_this: {
		it: "should work with this with angular expressions",
		content: "<w:t>{#hello}{this}{/hello}</w:t>",
		result: '<w:t xml:space="preserve">world</w:t>',
		scope: { hello: ["world"] },
		options: {
			parser: angularParser,
		},
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
	angular_get_parent_prop_if_null_child: {
		it: "should get parent prop if child is null",
		content: "<w:t>{#c}{label}{/c}</w:t>",
		result: '<w:t xml:space="preserve">hello</w:t>',
		scope: { c: { label: null }, label: "hello" },
		options: {
			parser: angularParser,
		},
		lexed: null,
		parsed: null,
		postparsed: null,
		resolved: null,
	},
};

fixtures.rawxmlemptycontent = clone(fixtures.rawxml);
fixtures.rawxmlemptycontent.it = "should work with rawxml with undefined tags";
fixtures.rawxmlemptycontent.scope = {};
fixtures.rawxmlemptycontent.result = "BEFOREAFTER";

Object.keys(fixtures).forEach(function (key) {
	const fixture = fixtures[key];
	const delimiters = {
		delimiters: fixture.delimiters || {
			start: "{",
			end: "}",
		},
	};
	fixture.options = assign({}, fixture.options, delimiters);
});

module.exports = fixtures;
