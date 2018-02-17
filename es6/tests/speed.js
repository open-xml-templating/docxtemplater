"use strict";

const { expect, createXmlTemplaterDocx } = require("./utils");

describe("Speed test", function() {
	it("should be fast for simple tags", function() {
		const content = "<w:t>tag {age}</w:t>";
		const docs = [];
		for (let i = 0; i < 100; i++) {
			docs.push(createXmlTemplaterDocx(content, { tags: { age: 12 } }));
		}
		const time = new Date();
		for (let i = 0; i < 100; i++) {
			docs[i].render();
		}
		const duration = new Date() - time;
		expect(duration).to.be.below(400);
	});
	it("should be fast for simple tags with huge content", function() {
		let content = "<w:t>tag {age}</w:t>";
		let i;
		const result = [];
		for (i = 1; i <= 10000; i++) {
			result.push("bla");
		}
		const prepost = result.join("");
		content = prepost + content + prepost;
		const docs = [];
		for (i = 0; i < 20; i++) {
			docs.push(createXmlTemplaterDocx(content, { tags: { age: 12 } }));
		}
		const time = new Date();
		for (i = 0; i < 20; i++) {
			docs[i].render();
		}
		const duration = new Date() - time;
		expect(duration).to.be.below(400);
	});
	it("should be fast for loop tags", function() {
		const content = "<w:t>{#users}{name}{/users}</w:t>";
		const users = [];
		for (let i = 1; i <= 1000; i++) {
			users.push({ name: "foo" });
		}
		const doc = createXmlTemplaterDocx(content, { tags: { users } });
		const time = new Date();
		doc.render();
		const duration = new Date() - time;
		expect(duration).to.be.below(100);
	});
	/* eslint-disable no-process-env */
	if (!process.env.FAST) {
		it("should not exceed call stack size for big document with rawxml", function() {
			this.timeout(30000);
			const result = [];
			const normalContent = "<w:p><w:r><w:t>foo</w:t></w:r></w:p>";
			const rawContent = "<w:p><w:r><w:t>{@raw}</w:t></w:r></w:p>";

			for (let i = 1; i <= 30000; i++) {
				if (i % 100 === 1) {
					result.push(rawContent);
				}
				result.push(normalContent);
			}
			const content = result.join("");
			const users = [];
			const doc = createXmlTemplaterDocx(content, { tags: { users } });
			const time = new Date();
			doc.render();
			const duration = new Date() - time;
			expect(duration).to.be.below(25000);
		});
	}
});
