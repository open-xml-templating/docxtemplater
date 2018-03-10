"use strict";

var _require = require("lodash"),
    clone = _require.clone,
    merge = _require.merge;

var xmlSpacePreserveTag = {
	type: "tag",
	position: "start",
	value: '<w:t xml:space="preserve">',
	text: true,
	tag: "w:t"
};
var startText = {
	type: "tag",
	position: "start",
	value: "<w:t>",
	text: true,
	tag: "w:t"
};
var endText = {
	type: "tag",
	value: "</w:t>",
	text: true,
	position: "end",
	tag: "w:t"
};
var startParagraph = {
	type: "tag",
	value: "<w:p>",
	text: false,
	position: "start",
	tag: "w:p"
};
var endParagraph = {
	type: "tag",
	value: "</w:p>",
	text: false,
	position: "end",
	tag: "w:p"
};

var tableRowStart = {
	type: "tag",
	position: "start",
	text: false,
	value: "<w:tr>",
	tag: "w:tr"
};
var tableRowEnd = {
	type: "tag",
	value: "</w:tr>",
	text: false,
	position: "end",
	tag: "w:tr"
};

var delimiters = {
	start: { type: "delimiter", position: "start" },
	end: { type: "delimiter", position: "end" }
};
function content(value) {
	return { type: "content", value: value, position: "insidetag" };
}
function externalContent(value) {
	return { type: "content", value: value, position: "outsidetag" };
}

var fixtures = {
	simple: {
		it: "should handle {user} with tag",
		content: "<w:t>Hi {user}</w:t>",
		scope: {
			user: "Foo"
		},
		result: '<w:t xml:space="preserve">Hi Foo</w:t>',
		lexed: [startText, content("Hi "), delimiters.start, content("user"), delimiters.end, endText],
		parsed: [startText, content("Hi "), { type: "placeholder", value: "user" }, endText],
		postparsed: [xmlSpacePreserveTag, content("Hi "), { type: "placeholder", value: "user" }, endText]
	},
	dot: {
		it: "should handle {.} with tag",
		content: "<w:t>Hi {.}</w:t>",
		scope: "Foo",
		result: '<w:t xml:space="preserve">Hi Foo</w:t>',
		lexed: [startText, content("Hi "), delimiters.start, content("."), delimiters.end, endText],
		parsed: [startText, content("Hi "), { type: "placeholder", value: "." }, endText],
		postparsed: [xmlSpacePreserveTag, content("Hi "), { type: "placeholder", value: "." }, endText]
	},
	strangetags: {
		it: "should xmlparse strange tags",
		content: "<w:t>{name} {</w:t>FOO<w:t>age</w:t>BAR<w:t>}</w:t>",
		scope: {
			name: "Foo",
			age: 12
		},
		result: '<w:t xml:space="preserve">Foo 12</w:t>FOO<w:t></w:t>BAR<w:t></w:t>',
		parsed: [startText, { type: "placeholder", value: "name" }, content(" "), { type: "placeholder", value: "age" }, endText, externalContent("FOO"), startText, endText, externalContent("BAR"), startText, endText],
		xmllexed: [startText, { type: "content", value: "{name} {" }, endText, { type: "content", value: "FOO" }, startText, { type: "content", value: "age" }, endText, { type: "content", value: "BAR" }, startText, { type: "content", value: "}" }, endText],
		lexed: [startText, delimiters.start, content("name"), delimiters.end, content(" "), delimiters.start, endText, externalContent("FOO"), startText, content("age"), endText, externalContent("BAR"), startText, delimiters.end, endText]
	},
	otherdelimiters: {
		it: "should work with custom delimiters",
		content: "<w:t>Hello [[[name]]</w:t>",
		scope: {
			name: "John Doe"
		},
		result: '<w:t xml:space="preserve">Hello John Doe</w:t>',
		delimiters: {
			start: "[[[",
			end: "]]"
		},
		lexed: [startText, content("Hello "), delimiters.start, content("name"), delimiters.end, endText],
		parsed: [startText, content("Hello "), { type: "placeholder", value: "name" }, endText]
	},
	otherdelimiterssplitted: {
		it: "should work with custom delimiters splitted",
		content: '<w:t>Hello {name}</w:t><w:t foo="bar">}, how is it ?</w:t>',
		scope: {
			name: "John Doe"
		},
		result: '<w:t xml:space="preserve">Hello John Doe</w:t><w:t foo="bar">, how is it ?</w:t>',
		delimiters: {
			start: "{",
			end: "}}"
		},
		lexed: [startText, content("Hello "), delimiters.start, content("name"), delimiters.end, endText, {
			type: "tag",
			value: '<w:t foo="bar">',
			text: true,
			position: "start",
			tag: "w:t"
		}, content(", how is it ?"), endText],
		parsed: [startText, content("Hello "), { type: "placeholder", value: "name" }, endText, {
			type: "tag",
			value: '<w:t foo="bar">',
			text: true,
			position: "start",
			tag: "w:t"
		}, content(", how is it ?"), endText]
	},
	otherdelimiterssplittedover2tags: {
		it: "should work with custom delimiters splitted over > 2 tags",
		content: "<w:t>Hello {name}</w:t><w:t>}</w:t>TAG<w:t>}</w:t><w:t>}}foobar</w:t>",
		scope: {
			name: "John Doe"
		},
		result: '<w:t xml:space="preserve">Hello John Doe</w:t><w:t></w:t>TAG<w:t></w:t><w:t>foobar</w:t>',
		delimiters: {
			start: "{",
			end: "}}}}}"
		},
		lexed: [startText, content("Hello "), delimiters.start, content("name"), delimiters.end, endText, startText, endText, externalContent("TAG"), startText, endText, startText, content("foobar"), endText],
		parsed: [startText, content("Hello "), { type: "placeholder", value: "name" }, endText, startText, endText, externalContent("TAG"), startText, endText, startText, content("foobar"), endText]
	},
	looptag: {
		it: "should work with loops",
		content: "<w:t>Hello {#users}{name}, {/users}</w:t>",
		scope: {
			users: [{ name: "John Doe" }, { name: "Jane Doe" }, { name: "Wane Doe" }]
		},
		result: '<w:t xml:space="preserve">Hello John Doe, Jane Doe, Wane Doe, </w:t>',
		lexed: [startText, content("Hello "), delimiters.start, content("#users"), delimiters.end, delimiters.start, content("name"), delimiters.end, content(", "), delimiters.start, content("/users"), delimiters.end, endText],
		parsed: [startText, content("Hello "), {
			type: "placeholder",
			value: "users",
			location: "start",
			module: "loop",
			inverted: false,
			expandTo: "auto"
		}, { type: "placeholder", value: "name" }, content(", "), { type: "placeholder", value: "users", location: "end", module: "loop" }, endText],
		postparsed: [xmlSpacePreserveTag, content("Hello "), {
			type: "placeholder",
			value: "users",
			module: "loop",
			inverted: false,
			subparsed: [{ type: "placeholder", value: "name" }, content(", ")]
		}, endText]
	},
	paragraphlooptag: {
		it: "should work with paragraph loops",
		content: "<w:p><w:t>Hello </w:t></w:p><w:p><w:t>{#users}</w:t></w:p><w:p><w:t>User {.}</w:t></w:p><w:p><w:t>{/users}</w:t></w:p>",
		scope: {
			users: ["John Doe", "Jane Doe", "Wane Doe"]
		},
		result: '<w:p><w:t>Hello </w:t></w:p><w:p><w:t xml:space="preserve">User John Doe</w:t></w:p><w:p><w:t xml:space="preserve">User Jane Doe</w:t></w:p><w:p><w:t xml:space="preserve">User Wane Doe</w:t></w:p>',
		lexed: [startParagraph, startText, content("Hello "), endText, endParagraph, startParagraph, startText, delimiters.start, content("#users"), delimiters.end, endText, endParagraph, startParagraph, startText, content("User "), delimiters.start, content("."), delimiters.end, endText, endParagraph, startParagraph, startText, delimiters.start, content("/users"), delimiters.end, endText, endParagraph],
		parsed: [startParagraph, startText, content("Hello "), endText, endParagraph, startParagraph, startText, {
			type: "placeholder",
			value: "users",
			location: "start",
			module: "loop",
			inverted: false,
			expandTo: "auto"
		}, endText, endParagraph, startParagraph, startText, content("User "), { type: "placeholder", value: "." }, endText, endParagraph, startParagraph, startText, { type: "placeholder", value: "users", location: "end", module: "loop" }, endText, endParagraph],
		postparsed: [startParagraph, startText, content("Hello "), endText, endParagraph, {
			type: "placeholder",
			value: "users",
			module: "loop",
			inverted: false,
			subparsed: [startParagraph, xmlSpacePreserveTag, content("User "), { type: "placeholder", value: "." }, endText, endParagraph]
		}],
		options: {
			paragraphLoop: true
		}
	},
	dashlooptag: {
		it: "should work with dashloops",
		content: "<w:p><w:t>Hello {-w:p users}{name}, {/users}</w:t></w:p>",
		scope: {
			users: [{ name: "John Doe" }, { name: "Jane Doe" }, { name: "Wane Doe" }]
		},
		result: '<w:p><w:t xml:space="preserve">Hello John Doe, </w:t></w:p><w:p><w:t xml:space="preserve">Hello Jane Doe, </w:t></w:p><w:p><w:t xml:space="preserve">Hello Wane Doe, </w:t></w:p>',
		lexed: [startParagraph, startText, content("Hello "), delimiters.start, content("-w:p users"), delimiters.end, delimiters.start, content("name"), delimiters.end, content(", "), delimiters.start, content("/users"), delimiters.end, endText, endParagraph],
		parsed: [startParagraph, startText, content("Hello "), {
			type: "placeholder",
			value: "users",
			location: "start",
			module: "loop",
			inverted: false,
			expandTo: "w:p"
		}, { type: "placeholder", value: "name" }, content(", "), { type: "placeholder", value: "users", location: "end", module: "loop" }, endText, endParagraph],
		postparsed: [{
			type: "placeholder",
			value: "users",
			module: "loop",
			inverted: false,
			subparsed: [startParagraph, xmlSpacePreserveTag, content("Hello "), { type: "placeholder", value: "name" }, content(", "), endText, endParagraph]
		}]
	},
	dashloopnested: {
		it: "should work with dashloops nested",
		content: "<w:tr><w:p><w:t>{-w:tr columns} Hello {-w:p users}{name}, {/users}</w:t><w:t>{/columns}</w:t></w:p></w:tr>",
		scope: {
			columns: [{
				users: [{ name: "John Doe" }, { name: "Jane Doe" }, { name: "Wane Doe" }]
			}]
		},
		result: '<w:tr><w:p><w:t xml:space="preserve"> Hello John Doe, </w:t><w:t></w:t></w:p><w:p><w:t xml:space="preserve"> Hello Jane Doe, </w:t><w:t></w:t></w:p><w:p><w:t xml:space="preserve"> Hello Wane Doe, </w:t><w:t></w:t></w:p></w:tr>',
		lexed: [tableRowStart, startParagraph, startText, delimiters.start, content("-w:tr columns"), delimiters.end, content(" Hello "), delimiters.start, content("-w:p users"), delimiters.end, delimiters.start, content("name"), delimiters.end, content(", "), delimiters.start, content("/users"), delimiters.end, endText, startText, delimiters.start, content("/columns"), delimiters.end, endText, endParagraph, tableRowEnd],
		parsed: [tableRowStart, startParagraph, startText, {
			type: "placeholder",
			value: "columns",
			location: "start",
			module: "loop",
			inverted: false,
			expandTo: "w:tr"
		}, content(" Hello "), {
			type: "placeholder",
			value: "users",
			location: "start",
			module: "loop",
			inverted: false,
			expandTo: "w:p"
		}, { type: "placeholder", value: "name" }, content(", "), { type: "placeholder", value: "users", location: "end", module: "loop" }, endText, startText, {
			type: "placeholder",
			value: "columns",
			location: "end",
			module: "loop"
		}, endText, endParagraph, tableRowEnd],
		postparsed: [{
			type: "placeholder",
			value: "columns",
			module: "loop",
			inverted: false,
			subparsed: [tableRowStart, {
				type: "placeholder",
				value: "users",
				module: "loop",
				inverted: false,
				subparsed: [startParagraph, xmlSpacePreserveTag, content(" Hello "), { type: "placeholder", value: "name" }, content(", "), endText, startText, endText, endParagraph]
			}, tableRowEnd]
		}]
	},
	rawxml: {
		it: "should work with rawxml",
		content: "BEFORE<w:p><w:t>{@rawxml}</w:t></w:p>AFTER",
		scope: {
			rawxml: '<w:p><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>My custom</w:t></w:r><w:r><w:rPr><w:color w:val="00FF00"/></w:rPr><w:t>XML</w:t></w:r></w:p>'
		},
		result: 'BEFORE<w:p><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>My custom</w:t></w:r><w:r><w:rPr><w:color w:val="00FF00"/></w:rPr><w:t>XML</w:t></w:r></w:p>AFTER',
		lexed: [externalContent("BEFORE"), startParagraph, startText, delimiters.start, content("@rawxml"), delimiters.end, endText, endParagraph, externalContent("AFTER")],
		parsed: [externalContent("BEFORE"), startParagraph, startText, { type: "placeholder", value: "rawxml", module: "rawxml" }, endText, endParagraph, externalContent("AFTER")],
		postparsed: [externalContent("BEFORE"), {
			type: "placeholder",
			value: "rawxml",
			module: "rawxml",
			expanded: [[startParagraph, startText], [endText, endParagraph]]
		}, externalContent("AFTER")]
	},
	selfclosing: {
		it: "should handle selfclose tag",
		content: "<w:t />",
		scope: {
			user: "Foo"
		},
		result: "<w:t />",
		lexed: [{
			type: "tag",
			value: "<w:t />",
			text: true,
			position: "selfclosing",
			tag: "w:t"
		}],
		parsed: [{
			type: "tag",
			position: "selfclosing",
			value: "<w:t />",
			text: true,
			tag: "w:t"
		}],
		postparsed: [{
			type: "tag",
			position: "selfclosing",
			value: "<w:t />",
			text: true,
			tag: "w:t"
		}]
	},
	selfclosing_with_placeholderr: {
		it: "should handle {user} with tag with selfclosing",
		content: "<w:t /><w:t>Hi {user}</w:t>",
		scope: {
			user: "Foo"
		},
		result: '<w:t /><w:t xml:space="preserve">Hi Foo</w:t>',
		lexed: [{
			type: "tag",
			value: "<w:t />",
			text: true,
			position: "selfclosing",
			tag: "w:t"
		}, startText, content("Hi "), delimiters.start, content("user"), delimiters.end, endText],
		parsed: [{
			type: "tag",
			position: "selfclosing",
			value: "<w:t />",
			text: true,
			tag: "w:t"
		}, startText, content("Hi "), { type: "placeholder", value: "user" }, endText],
		postparsed: [{
			type: "tag",
			position: "selfclosing",
			value: "<w:t />",
			text: true,
			tag: "w:t"
		}, xmlSpacePreserveTag, content("Hi "), { type: "placeholder", value: "user" }, endText]
	},
	delimiters_change: {
		it: "should be possible to change the delimiters",
		content: "<w:t>Hi {=[[ ]]=}[[user]][[={ }=]] and {user2}</w:t>",
		scope: {
			user: "John",
			user2: "Jane"
		},
		result: '<w:t xml:space="preserve">Hi John and Jane</w:t>',
		lexed: [startText, content("Hi "), delimiters.start, content("user"), delimiters.end, content(" and "), delimiters.start, content("user2"), delimiters.end, endText],
		parsed: [startText, content("Hi "), { type: "placeholder", value: "user" }, content(" and "), { type: "placeholder", value: "user2" }, endText],
		postparsed: [xmlSpacePreserveTag, content("Hi "), { type: "placeholder", value: "user" }, content(" and "), { type: "placeholder", value: "user2" }, endText]
	},
	delimiters_change_complex: {
		it: "should be possible to change the delimiters with complex example",
		content: "<w:t>Hi {={{[ ]}}=}{{[user]}}{{[={{ ]=]}} and {{user2]</w:t>",
		scope: {
			user: "John",
			user2: "Jane"
		},
		result: '<w:t xml:space="preserve">Hi John and Jane</w:t>',
		lexed: [startText, content("Hi "), delimiters.start, content("user"), delimiters.end, content(" and "), delimiters.start, content("user2"), delimiters.end, endText],
		parsed: [startText, content("Hi "), { type: "placeholder", value: "user" }, content(" and "), { type: "placeholder", value: "user2" }, endText],
		postparsed: [xmlSpacePreserveTag, content("Hi "), { type: "placeholder", value: "user" }, content(" and "), { type: "placeholder", value: "user2" }, endText]
	}
};

fixtures.rawxmlemptycontent = clone(fixtures.rawxml);
fixtures.rawxmlemptycontent.it = "should work with rawxml with undefined tags";
fixtures.rawxmlemptycontent.scope = {};
fixtures.rawxmlemptycontent.result = "BEFOREAFTER";

Object.keys(fixtures).forEach(function (key) {
	var fixture = fixtures[key];
	var delimiters = {
		delimiters: fixture.delimiters || {
			start: "{",
			end: "}"
		}
	};
	fixture.options = merge({}, fixture.options, delimiters);
});

module.exports = fixtures;