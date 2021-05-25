"use strict";

const {
	createDoc,
	expect,
	createXmlTemplaterDocxNoRender,
	browserMatches,
} = require("./utils.js");

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
		let maxDuration = 100;
		if (
			browserMatches(/firefox (55|60|64|65)/) ||
			browserMatches(/MicrosoftEdge (16)/)
		) {
			maxDuration = 150;
		}
		expect(duration).to.be.below(maxDuration);
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
		let maxDuration = 300;
		if (
			browserMatches(/MicrosoftEdge (16|17|18)/) ||
			browserMatches(/internet explorer (10|11)/) ||
			browserMatches(/iphone 10.3/)
		) {
			maxDuration = 500;
		}
		expect(duration).to.be.below(maxDuration);
	});
	/* eslint-disable-next-line no-process-env */
	if (!process.env.FAST) {
		it("should not exceed call stack size for big document with a few rawxml tags", function () {
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
				expect(compileDuration).to.be.below(3000);
			}
			now = new Date();
			doc.render();
			const renderDuration = new Date() - now;
			expect(renderDuration).to.be.below(2000);
		});

		it("should not exceed call stack size for big document with many rawxml tags", function () {
			this.timeout(30000);
			const result = [];
			const normalContent = "<w:p><w:r><w:t>foo</w:t></w:r></w:p>";
			const rawContent = "<w:p><w:r><w:t>{@raw}</w:t></w:r></w:p>";

			for (let i = 1; i <= 50000; i++) {
				if (i % 2 === 1) {
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
				expect(compileDuration).to.be.below(3000);
			}
			now = new Date();
			doc.render();
			let maxRenderDuration = 2000;
			const renderDuration = new Date() - now;
			if (browserMatches(/MicrosoftEdge (16|17|18)/)) {
				maxRenderDuration = 3000;
			}
			if (browserMatches(/firefox (68)/)) {
				maxRenderDuration = 2500;
			}
			expect(renderDuration).to.be.below(maxRenderDuration);
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
				let maxInspectDuration = 750;
				if (browserMatches(/MicrosoftEdge (16|17|18)/)) {
					maxInspectDuration = 1000;
				}
				expect(duration).to.be.below(maxInspectDuration);
			});
		});

		it("should not be slow when having many loops with resolveData", function () {
			this.timeout(30000);
			const OldPromise = global.Promise;
			let resolveCount = 0;
			let allCount = 0;
			let parserCount = 0;
			let parserGetCount = 0;
			global.Promise = function (arg1, arg2) {
				return new OldPromise(arg1, arg2);
			};
			global.Promise.resolve = function (arg1) {
				resolveCount++;
				return OldPromise.resolve(arg1);
			};
			global.Promise.all = function (arg1) {
				allCount++;
				return OldPromise.all(arg1);
			};
			const doc = createDoc("multi-level.docx");
			doc.setOptions({
				paragraphLoop: true,
				parser: (tag) => {
					parserCount++;
					return {
						get: (scope) => {
							parserGetCount++;
							return scope[tag];
						},
					};
				},
			});
			let start = +new Date();
			doc.compile();
			const stepCompile = +new Date() - start;
			start = +new Date();
			const multiplier = 20;
			const total = Math.pow(multiplier, 3);
			const data = {
				l1: times(multiplier),
				l2: times(multiplier),
				l3: times(multiplier, () => ({ content: "Hello" })),
			};
			return doc.resolveData(data).then(function () {
				const stepResolve = +new Date() - start;
				start = +new Date();
				doc.render();
				const stepRender = +new Date() - start;
				expect(stepCompile).to.be.below(100);
				let maxResolveTime = 2000;
				if (browserMatches(/MicrosoftEdge (16|17|18)/)) {
					maxResolveTime = 20000;
				}
				if (browserMatches(/firefox 55/)) {
					maxResolveTime = 4000;
				}
				expect(stepResolve).to.be.below(maxResolveTime);
				let maxRenderTime = 1000;
				if (
					browserMatches(/iphone 10.3/) ||
					browserMatches(/MicrosoftEdge (16|17|18)/)
				) {
					maxRenderTime = 2000;
				}
				expect(stepRender).to.be.below(maxRenderTime);
				expect(parserCount).to.be.equal(4);
				// 20**3 + 20**2 *3 + 20 * 2 + 1  = 9241
				expect(parserGetCount).to.be.equal(9241);
				expect(resolveCount).to.be.within(total, total * 1.2);
				expect(allCount).to.be.within(total, total * 1.2);
				global.Promise = OldPromise;
			});
		});
	}
});
