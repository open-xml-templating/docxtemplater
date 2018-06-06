"use strict";

const { expect, createXmlTemplaterDocx } = require("./utils");

describe("Speed test", function() {
	it("should be fast for simple tags", function(done) {
		const content = "<w:t>tag {age}</w:t>";
		const docs = [];
		for (let i = 0; i < 100; i++) {
			docs.push(createXmlTemplaterDocx(content, { tags: { age: 12 } }));
		}
		Promise.all(docs).then(docs => {
			const time = new Date();
			const renderedDoc = [];
			for (let i = 0; i < 100; i++) {
				renderedDoc.push(docs[i].render());
			}
			Promise.all(renderedDoc).then(() => {
				const duration = new Date() - time;
				expect(duration).to.be.below(400);
				done();
			});
		});
	});
	it("should be fast for simple tags with huge content", function(done) {
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
		Promise.all(docs).then(docs => {
			const time = new Date();
			const renderedDoc = [];
			for (i = 0; i < 20; i++) {
				renderedDoc.push(docs[i].render());
			}
			Promise.all(renderedDoc).then(() => {
				const duration = new Date() - time;
				expect(duration).to.be.below(400);
				done();
			});
		});
	});
	it("should be fast for loop tags", function(done) {
		const content = "<w:t>{#users}{name}{/users}</w:t>";
		const users = [];
		for (let i = 1; i <= 1000; i++) {
			users.push({ name: "foo" });
		}
		createXmlTemplaterDocx(content, { tags: { users } }).then(doc => {
			const time = new Date();
			doc.render().then(() => {
				const duration = new Date() - time;
				expect(duration).to.be.below(100);
				done();
			});
		});
	});
	/* eslint-disable no-process-env */
	if (!process.env.FAST) {
		it("should not exceed call stack size for big document with rawxml", function(done) {
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
			createXmlTemplaterDocx(content, { tags: { users } }).then(doc => {
				const time = new Date();
				doc.render().then(() => {
					const duration = new Date() - time;
					expect(duration).to.be.below(25000);
					done();
				});
			});
		});
	}
});
