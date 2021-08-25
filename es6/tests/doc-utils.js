const { uniq } = require("../doc-utils.js");
const { expect } = require("./utils.js");

describe("Uniq", function () {
	it("should work", function () {
		expect(uniq(["a", "b", "a"])).to.deep.equal(["a", "b"]);
	});
});
