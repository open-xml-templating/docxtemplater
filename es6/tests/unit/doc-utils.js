const {
	uniq,
	setSingleAttribute,
	getSingleAttribute,
	chunkBy,
} = require("../../doc-utils.js");
const { expect } = require("../utils.js");

describe("Uniq", function () {
	it("should work", function () {
		expect(uniq(["a", "b", "a"])).to.deep.equal(["a", "b"]);
	});
});

describe("setSingleAttribute", function () {
	it("should work with self closing", function () {
		expect(setSingleAttribute("<a/>", "b", "true")).to.equal('<a b="true"/>');
	});

	it("should work with starting tag", function () {
		expect(setSingleAttribute("<a>", "b", "true")).to.equal('<a b="true">');
	});
});

describe("getSingleAttribute", function () {
	it("should work and get value", function () {
		expect(getSingleAttribute('<a b="c">', "b")).to.equal("c");
	});

	it("should work and return null", function () {
		expect(getSingleAttribute("<a>", "b")).to.equal(null);
	});
});

describe("ChunkBy", function () {
	it("should work", function () {
		// This tests chunkBy, and in particular the fact that the chunking
		// works even if the first function call does'nt return "start" (it
		// returns undefined here)
		const chunks = chunkBy(
			[
				{ type: "content", value: "Hello" },
				{ type: "tag", tag: "w:t", position: "start" },
				{ type: "content", value: "Ho" },
				{ type: "tag", tag: "w:t", position: "end" },
				{ type: "content", value: "Bye" },
			],
			function (part) {
				if (part.type === "tag" && part.tag === "w:t") {
					return part.position;
				}
			}
		);
		expect(chunks).to.deep.equal([
			[{ type: "content", value: "Hello" }],
			[
				{ type: "tag", tag: "w:t", position: "start" },
				{ type: "content", value: "Ho" },
				{ type: "tag", tag: "w:t", position: "end" },
			],
			[{ type: "content", value: "Bye" }],
		]);
	});
});
