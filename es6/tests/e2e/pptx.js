const {
	createDoc,
	createDocV4,
	shouldBeSame,
	expect,
	resolveSoon,
} = require("../utils.js");
const rawXMLValue = require("../data/raw-xml-pptx.js");

describe("Pptx generation", function () {
	it("should work with title", function () {
		const doc = createDoc("title-example.pptx");
		let con = doc.getZip().files["docProps/app.xml"].asText();
		expect(con).not.to.contain("Edgar");
		doc.setData({ name: "Edgar" }).render();
		con = doc.getZip().files["docProps/app.xml"].asText();
		expect(con).to.contain("Edgar");
	});
	it("should work with simple pptx", function () {
		const doc = createDoc("simple-example.pptx");
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

	it("should work with loop table", function () {
		const doc = createDocV4("loop-table.pptx");

		return doc
			.renderAsync({
				products: [
					{ name: "Acme", price: 10 },
					{ name: "Ecma", price: 20 },
				],
			})
			.then(function () {
				expect(
					doc.scopeManagers["ppt/slides/slide1.xml"].resolved
				).to.deep.equal([
					{
						tag: "products",
						lIndex: 58,
						value: [
							[
								{ tag: "name", lIndex: 61, value: "Acme" },
								{ tag: "price", lIndex: 79, value: 10 },
							],
							[
								{ tag: "name", lIndex: 61, value: "Ecma" },
								{ tag: "price", lIndex: 79, value: 20 },
							],
						],
					},
				]);
				shouldBeSame({
					doc,
					expectedName: "expected-loop-table.pptx",
				});
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

	it("should work with simple raw pptx", function () {
		const doc = createDoc("raw-xml-example.pptx");
		let scope, meta, tag;
		let calls = 0;
		doc.setOptions({
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
		doc.setData({ raw: rawXMLValue }).render();
		expect(calls).to.equal(1);
		expect(scope.raw).to.be.a("string");
		expect(meta).to.be.an("object");
		expect(meta.part).to.be.an("object");
		expect(meta.part.expanded).to.be.an("array");
		expect(doc.getFullText()).to.be.equal("Hello World");
		shouldBeSame({ doc, expectedName: "expected-raw-xml-example.pptx" });
	});

	it("should work with simple raw pptx async", function () {
		const doc = createDoc("raw-xml-example.pptx");
		let scope, meta, tag;
		let calls = 0;
		doc.setOptions({
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
		doc.compile();
		return doc.resolveData({ raw: resolveSoon(rawXMLValue) }).then(function () {
			doc.render();
			expect(calls).to.equal(1);
			expect(meta).to.be.an("object");
			expect(meta.part).to.be.an("object");
			expect(meta.part.expanded).to.be.an("array");
			expect(doc.getFullText()).to.be.equal("Hello World");
			shouldBeSame({ doc, expectedName: "expected-raw-xml-example.pptx" });
		});
	});
});
