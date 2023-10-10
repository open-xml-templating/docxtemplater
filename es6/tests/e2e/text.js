const { expect } = require("chai");
const expressionParser = require("../../expressions.js");
const TxtTemplater = require("../../text.js");

describe("Text templating", function () {
	it("should be possible to template text files", function () {
		const doc = new TxtTemplater("Hello {user}, how are you ?");
		expect(doc.render({ user: "John" })).to.be.equal(
			"Hello John, how are you ?"
		);
	});

	it("should be possible to template text files with expressionParser", function () {
		const doc = new TxtTemplater("Hello {user + age}, how are you ?", {
			parser: expressionParser,
		});
		expect(doc.render({ user: "John ", age: 12 })).to.be.equal(
			"Hello John 12, how are you ?"
		);
	});

	it("should be possible to use loops", function () {
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
});
