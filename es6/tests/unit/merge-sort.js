const { expect } = require("../utils.js");
const mergesort = require("../../merge-sort.js");

describe("Mergesort", () => {
	it("should work with simple", () => {
		const sorted = mergesort([
			[{ offset: 1 }, { offset: 4 }],
			[{ offset: 2 }, { offset: 3 }],
		]);
		const offsets = sorted.map(({ offset }) => offset);
		expect(offsets).to.deep.equal([1, 2, 3, 4]);
	});

	it("should work even when having first array be the smallest values", () => {
		// In previous versions, this simple example would fail with the
		// message : `Cannot read property 'offset' of undefined`
		const sorted = mergesort([
			[{ offset: 1 }, { offset: 2 }],
			[{ offset: 4 }, { offset: 5 }],
			[{ offset: 3 }, { offset: 6 }],
		]);
		const offsets = sorted.map(({ offset }) => offset);
		expect(offsets).to.deep.equal([1, 2, 3, 4, 5, 6]);
	});

	it("should work for complex case with empty values", () => {
		const sorted = mergesort([
			[{ offset: 2 }, { offset: 6 }],
			[{ offset: 1 }, { offset: 4 }],
			[],
			[{ offset: 7 }, { offset: 8 }],
			[],
			[],
			[{ offset: 3 }, { offset: 5 }],
			[],
		]);
		const offsets = sorted.map(({ offset }) => offset);
		expect(offsets).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8]);
	});
});
