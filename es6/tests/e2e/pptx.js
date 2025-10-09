const {
	createDocV4,
	shouldBeSame,
	expect,
	resolveSoon,
} = require("../utils.js");
const rawXMLValue = require("../data/raw-xml-pptx.js");

describe("Pptx generation", () => {
	it("should work with title", () => {
		const doc = createDocV4("title-example.pptx");
		let con = doc.getZip().files["docProps/app.xml"].asText();
		expect(con).not.to.contain("Edgar");
		doc.render({ name: "Edgar" });
		con = doc.getZip().files["docProps/app.xml"].asText();
		expect(con).to.contain("Edgar");
	});

	it("should work with simple pptx", () => {
		const doc = createDocV4("simple-example.pptx");
		doc.render({ name: "Edgar" });
		expect(doc.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with table pptx", function () {
		return this.render({
			name: "table-example.pptx",
			data: {
				users: [
					{ msg: "hello", name: "mary" },
					{ msg: "hello", name: "john" },
				],
			},
			expectedName: "expected-table-example.pptx",
		});
	});

	it("should work with loop table", () => {
		const doc = createDocV4("loop-table.pptx");

		return doc
			.renderAsync({
				products: [
					{ name: "Acme", price: 10 },
					{ name: "Ecma", price: 20 },
				],
			})
			.then(() => {
				expect(
					doc.scopeManagers["ppt/slides/slide1.xml"].resolved
				).to.matchSnapshot();
				shouldBeSame({
					doc,
					expectedName: "expected-loop-table.pptx",
				});
			});
	});

	it("should be possible to totally remove a table if data is empty", () => {
		shouldBeSame({
			doc: createDocV4("loop-table-no-header.pptx").render(),
			expectedName: "expected-empty.pptx",
		});
	});

	it("should work with loop pptx", function () {
		return this.render({
			name: "loop-example.pptx",
			data: { users: [{ name: "Doe" }, { name: "John" }] },
			expectedName: "expected-loop-example.pptx",
			expectedText: " Doe  John ",
		});
	});

	it("should work with simple raw pptx", () => {
		let scope, meta, tag;
		let calls = 0;
		const doc = createDocV4("raw-xml-example.pptx", {
			parser: (t) => {
				tag = t;
				return {
					get: (s, m) => {
						scope = s;
						meta = m.meta;
						calls++;
						return scope[tag];
					},
				};
			},
		});
		doc.render({ raw: rawXMLValue });
		expect(calls).to.equal(1);
		expect(scope.raw).to.be.a("string");
		expect(meta).to.be.an("object");
		expect(meta.part).to.be.an("object");
		expect(meta.part.expanded).to.be.an("array");
		expect(doc.getFullText()).to.be.equal("Hello World");
		shouldBeSame({ doc, expectedName: "expected-raw-xml-example.pptx" });
	});

	it("should work with simple raw pptx async", () => {
		let scope, meta, tag;
		let calls = 0;
		const doc = createDocV4("raw-xml-example.pptx", {
			parser: (t) => {
				tag = t;
				return {
					get: (s, m) => {
						scope = s;
						meta = m.meta;
						calls++;
						return scope[tag];
					},
				};
			},
		});
		return doc.renderAsync({ raw: resolveSoon(rawXMLValue) }).then(() => {
			expect(calls).to.equal(1);
			expect(meta).to.be.an("object");
			expect(meta.part).to.be.an("object");
			expect(meta.part.expanded).to.be.an("array");
			expect(doc.getFullText()).to.be.equal("Hello World");
			shouldBeSame({
				doc,
				expectedName: "expected-raw-xml-example.pptx",
			});
		});
	});
});
