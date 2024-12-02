const { expect, expectToThrow, wrapMultiError } = require("../utils.js");

const Errors = require("../../errors.js");
const expressionParser = require("../../expressions.js");
const TxtTemplater = require("../../text.js");

describe("Text templating", () => {
	it("should be possible to template text files", () => {
		const doc = new TxtTemplater("Hello {user}, how are you ?");
		expect(doc.render({ user: "John" })).to.be.equal(
			"Hello John, how are you ?"
		);
	});

	it("should be possible to template text files with expressionParser", () => {
		const doc = new TxtTemplater("Hello {user + age}, how are you ?", {
			parser: expressionParser,
		});
		expect(doc.render({ user: "John ", age: 12 })).to.be.equal(
			"Hello John 12, how are you ?"
		);
	});

	it("should be possible to template xml files with expressionParser", () => {
		const doc = new TxtTemplater("<t>&gt;  {user}</t>", {
			parser: expressionParser,
		});
		expect(doc.render({ user: "<zaza> ", age: 12 })).to.be.equal(
			"<t>&gt;  <zaza> </t>"
		);
	});

	it("should be possible to use loops", () => {
		const doc = new TxtTemplater(
			"Hello {#users}{name},{/users} how are you ?",
			{
				parser: expressionParser,
			}
		);
		expect(
			doc.render({ users: [{ name: "John" }, { name: "Baz" }] })
		).to.be.equal("Hello John,Baz, how are you ?");
	});

	it("should throw specific error if loop not closed", () => {
		const expectedError = wrapMultiError({
			name: "TemplateError",
			message: "Unclosed loop",
			properties: {
				id: "unclosed_loop",
				xtag: "users",
				offset: 6,
			},
		});

		expectToThrow(
			() => new TxtTemplater("Hello {#users}"),
			Errors.XTTemplateError,
			expectedError
		);
	});

	it("should work with xml-namespace", () => {
		const doc = new TxtTemplater(
			'<?xml version="1.0" encoding="UTF-8”?> Hello {name}'
		);
		expect(doc.render({ name: "John" })).to.be.equal(
			'<?xml version="1.0" encoding="UTF-8”?> Hello John'
		);
	});

	it("should not regress with paragraphLoop: true or linebreaks: true", () => {
		const doc = new TxtTemplater("Text {#users}{name}{/}", {
			paragraphLoop: true,
			linebreaks: true,
		});
		expect(doc.render({ users: [{ name: "John\nFoo" }] })).to.be.equal(
			"Text John\nFoo"
		);
	});

	it("should be possible to render special characters in the output", () => {
		const doc = new TxtTemplater("Text {name}", {
			paragraphLoop: true,
			linebreaks: true,
		});
		expect(doc.render({ name: "&& <n>Baz</n> &nbsp;" })).to.be.equal(
			"Text && <n>Baz</n> &nbsp;"
		);
	});

	it("should be possible to use < and > as delimiters", () => {
		const doc = new TxtTemplater("Hello <name>", {
			delimiters: {
				start: "<",
				end: ">",
			},
		});
		expect(doc.render({ name: "John" })).to.be.equal("Hello John");
	});
});
