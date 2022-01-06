const { cloneDeep } = require("lodash");

const {
	createDoc,
	createDocV4,
	shouldBeSame,
	expect,
	resolveSoon,
	cleanRecursive,
} = require("../utils.js");
const fixDocPrCorruption = require("../../modules/fix-doc-pr-corruption.js");

describe("Resolver", function () {
	it("should render the document correctly in async mode", function () {
		const doc = createDoc("office365.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc.compile();
		return doc
			.resolveData({
				test: resolveSoon("Value"),
				test2: "Value2",
			})
			.then(function () {
				doc.render();
				expect(doc.getFullText()).to.be.equal("Value Value2");
				shouldBeSame({ doc, expectedName: "expected-office365.docx" });
			});
	});

	it("should work at parent level", function () {
		const doc = createDoc("office365.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc.compile();
		return doc
			.resolveData(
				resolveSoon({
					test: resolveSoon("Value"),
					test2: "Value2",
				})
			)
			.then(function () {
				doc.render();
				expect(doc.getFullText()).to.be.equal("Value Value2");
				shouldBeSame({ doc, expectedName: "expected-office365.docx" });
			});
	});

	it("should resolve loops", function () {
		const doc = createDoc("multi-loop.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc.compile();
		return doc
			.resolveData({
				companies: resolveSoon([
					{
						name: "Acme",
						users: resolveSoon([
							{
								name: "John",
							},
							{
								name: "James",
							},
						]),
					},
					{
						name: resolveSoon("Emca"),
						users: resolveSoon([
							{
								name: "Mary",
							},
							{
								name: "Liz",
							},
						]),
					},
				]),
				test2: "Value2",
			})
			.then(function () {
				doc.render();
				shouldBeSame({ doc, expectedName: "expected-multi-loop.docx" });
			});
	});

	it("should resolve with simple table", function () {
		const doc = createDocV4("table-complex2-example.docx");
		return doc
			.resolveData({
				table1: [
					{
						t1data1: "t1-1row-data1",
						t1data2: "t1-1row-data2",
						t1data3: "t1-1row-data3",
						t1data4: "t1-1row-data4",
					},
					{
						t1data1: "t1-2row-data1",
						t1data2: "t1-2row-data2",
						t1data3: "t1-2row-data3",
						t1data4: "t1-2row-data4",
					},
					{
						t1data1: "t1-3row-data1",
						t1data2: "t1-3row-data2",
						t1data3: "t1-3row-data3",
						t1data4: "t1-3row-data4",
					},
				],
				t1total1: "t1total1-data",
				t1total2: "t1total2-data",
				t1total3: "t1total3-data",
			})
			.then(function (resolved) {
				const myresolved = cloneDeep(resolved);
				cleanRecursive(myresolved);
				expect(myresolved).to.be.deep.equal([
					{
						tag: "t1total1",
						value: "t1total1-data",
					},
					{
						tag: "t1total2",
						value: "t1total2-data",
					},
					{
						tag: "t1total3",
						value: "t1total3-data",
					},
					{
						tag: "table1",
						value: [
							[
								{
									tag: "t1data1",
									value: "t1-1row-data1",
								},
								{
									tag: "t1data2",
									value: "t1-1row-data2",
								},
								{
									tag: "t1data3",
									value: "t1-1row-data3",
								},
								{
									tag: "t1data4",
									value: "t1-1row-data4",
								},
							],
							[
								{
									tag: "t1data1",
									value: "t1-2row-data1",
								},
								{
									tag: "t1data2",
									value: "t1-2row-data2",
								},
								{
									tag: "t1data3",
									value: "t1-2row-data3",
								},
								{
									tag: "t1data4",
									value: "t1-2row-data4",
								},
							],
							[
								{
									tag: "t1data1",
									value: "t1-3row-data1",
								},
								{
									tag: "t1data2",
									value: "t1-3row-data2",
								},
								{
									tag: "t1data3",
									value: "t1-3row-data3",
								},
								{
									tag: "t1data4",
									value: "t1-3row-data4",
								},
							],
						],
					},
				]);
				doc.render();
				const fullText = doc.getFullText();
				expect(fullText).to.be.equal(
					"TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data"
				);
			});
	});

	const dataNestedLoops = { a: [{ d: "Hello world" }] };

	it("should not regress with nested loops sync", function () {
		const doc = createDoc("regression-complex-loops.docx");
		doc.compile();
		doc.render(dataNestedLoops);
		shouldBeSame({
			doc,
			expectedName: "expected-regression-complex-loops.docx",
		});
	});

	it("should not regress when having [Content_Types.xml] contain Default instead of Override", function () {
		const doc = createDoc("with-default-contenttype.docx");
		doc.render();
		shouldBeSame({
			doc,
			expectedName: "expected-with-default-contenttype.docx",
		});
	});

	it("should not regress with nested loops async", function () {
		const doc = createDocV4("regression-complex-loops.docx");
		return doc.renderAsync(dataNestedLoops).then(function () {
			shouldBeSame({
				doc,
				expectedName: "expected-regression-complex-loops.docx",
			});
		});
	});

	const regressData = {
		amount_wheels_car_1: "4",
		amount_wheels_motorcycle_1: "2",
		amount_wheels_car_2: "6",
		amount_wheels_motorcycle_2: "3",
		id: [
			{
				car: "1",
				motorcycle: "",
			},
		],
	};

	it("should not regress with multiple loops sync", function () {
		const doc = createDocV4("regression-loops-resolve.docx");
		doc.render(regressData);
		shouldBeSame({
			doc,
			expectedName: "expected-regression-loops-resolve.docx",
		});
	});

	it("should not regress with multiple loops async", function () {
		const doc = createDocV4("regression-loops-resolve.docx");
		return doc.renderAsync(regressData).then(function () {
			shouldBeSame({
				doc,
				expectedName: "expected-regression-loops-resolve.docx",
			});
		});
	});

	it("should not regress with long file (hit maxCompact value of 65536)", function () {
		const doc = createDocV4("regression-loops-resolve.docx", {
			paragraphLoop: true,
		});
		return doc
			.renderAsync({
				amount_wheels_car_1: "4",
				amount_wheels_motorcycle_1: "2",
				amount_wheels_car_2: "6",
				amount_wheels_motorcycle_2: "3",
				id: [
					{
						car: "1",
						motorcycle: "2",
					},
					{
						car: "2",
						motorcycle: "3",
					},
					{
						car: "4",
						motorcycle: "5",
					},
					{
						car: "4",
						motorcycle: "5",
					},
				],
			})
			.then(function () {
				shouldBeSame({
					doc,
					expectedName: "expected-regression-loops-resolve-long.docx",
				});
			});
	});

	it("should deduplicate a16:rowId tag", function () {
		const doc = createDocV4("a16-row-id.pptx");
		return doc
			.renderAsync({
				loop: [1, 2, 3, 4],
			})
			.then(function () {
				shouldBeSame({
					doc,
					expectedName: "expected-a16-row-id.pptx",
				});
			});
	});

	it("should work with fix doc pr corruption", function () {
		const doc = createDocV4("loop-image.docx", {
			modules: [fixDocPrCorruption],
		});
		return doc
			.renderAsync({
				loop: [1, 2, 3, 4],
			})
			.then(function () {
				shouldBeSame({
					doc,
					expectedName: "expected-loop-images.docx",
				});
			});
	});
});
