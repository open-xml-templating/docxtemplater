"use strict";

const {
	createDoc,
	expect,
	createXmlTemplaterDocxNoRender,
} = require("./utils");

const { times } = require("lodash");
const inspectModule = require("../inspect-module.js");

describe("Speed test", function () {
	it("should be fast for simple tags", function () {
		const content = "<w:t>tag {age}</w:t>";
		const docs = [];
		for (let i = 0; i < 100; i++) {
			docs.push(createXmlTemplaterDocxNoRender(content, { tags: { age: 12 } }));
		}
		const time = new Date();
		for (let i = 0; i < 100; i++) {
			docs[i].render();
		}
		const duration = new Date() - time;
		expect(duration).to.be.below(400);
	});
	it("should be fast for simple tags with huge content", function () {
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
			docs.push(createXmlTemplaterDocxNoRender(content, { tags: { age: 12 } }));
		}
		const time = new Date();
		for (i = 0; i < 20; i++) {
			docs[i].render();
		}
		const duration = new Date() - time;
		expect(duration).to.be.below(400);
	});
	it("should be fast for loop tags", function () {
		const content = "<w:t>{#users}{name}{/users}</w:t>";
		const users = [];
		for (let i = 1; i <= 1000; i++) {
			users.push({ name: "foo" });
		}
		const doc = createXmlTemplaterDocxNoRender(content, { tags: { users } });
		const time = new Date();
		doc.render();
		const duration = new Date() - time;
		expect(duration).to.be.below(100);
	});
	it("should be fast for nested loop tags", function () {
		const result = [];
		for (let i = 1; i <= 300; i++) {
			result.push(`
		<w:proofErr w:type="spellEnd"/>
		<w:r w:rsidRPr="0000000">
		<w:rPr>
		<w:rFonts w:asciiTheme="minorHAnsi" w:eastAsia="Times New Roman" w:hAnsiTheme="minorHAnsi" w:cs="Arial"/>
		<w:sz w:val="22"/>
		<w:szCs w:val="22"/>
		<w:lang w:eastAsia="es-ES"/>
		</w:rPr>
		<w:t xml:space="preserve">{#users} Names : {user}</w:t>
		<w:t xml:space="preserve">{/}</w:t>
		</w:r>
		`);
		}
		const prepost = result.join("");
		const content = `<w:p><w:r><w:t>{#foo}</w:t></w:r>${prepost}<w:r><w:t>{/}</w:t></w:r></w:p>`;
		const users = [{ name: "John" }, { name: "Mary" }];
		const doc = createXmlTemplaterDocxNoRender(content, { tags: { users } });
		const time = new Date();
		doc.render();
		const duration = new Date() - time;
		expect(duration).to.be.below(250);
	});
	/* eslint-disable-next-line no-process-env */
	if (!process.env.FAST) {
		it("should not exceed call stack size for big document with rawxml", function () {
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
			const doc = createXmlTemplaterDocxNoRender(content, { tags: { users } });
			let now = new Date();
			doc.compile();
			const compileDuration = new Date() - now;
			if (typeof window === "undefined") {
				// Skip this assertion in the browser
				expect(compileDuration).to.be.below(7000);
			}
			now = new Date();
			doc.render();
			const duration = new Date() - now;
			expect(duration).to.be.below(25000);
		});

		describe("Inspect module", function () {
			it("should not be slow after multiple generations", function () {
				let duration = 0;
				const iModule = inspectModule();
				for (let i = 0; i < 10; i++) {
					const doc = createDoc("tag-product-loop.docx");
					const startTime = new Date();
					doc.attachModule(iModule);
					const data = {
						nom: "Doe",
						prenom: "John",
						telephone: "0652455478",
						description: "New Website",
						offre: times(20000, (i) => {
							return {
								prix: 1000 + i,
								nom: "Acme" + i,
							};
						}),
					};
					doc.setData(data);
					doc.compile();
					doc.render();
					duration += new Date() - startTime;
				}
				expect(duration).to.be.below(750);
			});
		});
	}
});
