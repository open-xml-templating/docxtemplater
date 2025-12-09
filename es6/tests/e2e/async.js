const { resolveSoon } = require("../utils.js");
const fixDocPrCorruption = require("../../modules/fix-doc-pr-corruption.js");

describe("Resolver", () => {
	it("should render the document correctly in async mode", function () {
		return this.render({
			async: true,
			name: "office365.docx",
			expectedName: "expected-office365.docx",
			expectedText: "Value Value2",
			data: {
				test: resolveSoon("Value"),
				test2: "Value2",
			},
			options: {
				paragraphLoop: true,
			},
		});
	});

	it("should work at parent level", function () {
		return this.render({
			async: true,
			name: "office365.docx",
			expectedName: "expected-office365.docx",
			expectedText: "Value Value2",
			data: resolveSoon({
				test: resolveSoon("Value"),
				test2: "Value2",
			}),
			options: {
				paragraphLoop: true,
			},
		});
	});

	it("should resolve loops", function () {
		return this.render({
			async: true,
			name: "multi-loop.docx",
			expectedName: "expected-multi-loop.docx",
			data: {
				companies: resolveSoon([
					{
						name: "Acme",
						users: resolveSoon(
							[
								{
									name: resolveSoon("John", 25),
								},
								resolveSoon({
									name: "James",
								}),
							],
							5
						),
					},
					resolveSoon(
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
						20
					),
				]),
				test2: "Value2",
			},
			options: {
				paragraphLoop: true,
			},
		});
	});

	const dataNestedLoops = { a: [{ d: "Hello world" }] };

	it("should not regress with nested loops sync", function () {
		return this.render({
			name: "regression-complex-loops.docx",
			expectedName: "expected-regression-complex-loops.docx",
			data: dataNestedLoops,
		});
	});

	it("should not regress with nested loops async", function () {
		return this.renderV4({
			async: true,
			name: "regression-complex-loops.docx",
			expectedName: "expected-regression-complex-loops.docx",
			data: dataNestedLoops,
		});
	});

	it("should not regress when having [Content_Types.xml] contain Default instead of Override", function () {
		return this.render({
			name: "with-default-contenttype.docx",
			expectedName: "expected-with-default-contenttype.docx",
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
		return this.renderV4({
			name: "regression-loops-resolve.docx",
			expectedName: "expected-regression-loops-resolve.docx",
			data: regressData,
		});
	});

	it("should not regress with multiple loops async", function () {
		return this.renderV4({
			async: true,
			name: "regression-loops-resolve.docx",
			expectedName: "expected-regression-loops-resolve.docx",
			data: regressData,
		});
	});

	it("should not regress with long file (hit maxCompact value of 65536)", function () {
		return this.renderV4({
			async: true,
			name: "regression-loops-resolve.docx",
			expectedName: "expected-regression-loops-resolve-long.docx",
			data: {
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
			},
			options: {
				paragraphLoop: true,
			},
		});
	});

	it("should deduplicate a16:rowId tag", function () {
		return this.renderV4({
			async: true,
			name: "a16-row-id.pptx",
			expectedName: "expected-a16-row-id.pptx",
			data: { loop: [1, 2, 3, 4] },
		});
	});

	it("should work with fix doc pr corruption", function () {
		return this.renderV4({
			async: true,
			name: "loop-image.docx",
			expectedName: "expected-loop-images.docx",
			data: { loop: [1, 2, 3, 4] },
			options: {
				modules: [fixDocPrCorruption],
			},
		});
	});
});
