const angularParser = require("../../expressions.js");
const angularParserIE11 = require("../../expressions-ie11.js");
const { expect } = require("../utils.js");

describe("Angular parser", function () {
	it("should work", function () {
		const result = angularParser("x+x", {
			tag: {
				value: "x+x",
			},
			scopePath: [],
		}).get({ x: 1 }, { scopePathItem: [] });
		expect(result).to.equal(2);
	});

	it("should work with ie 11", function () {
		const result = angularParserIE11("x+x", {
			tag: {
				value: "x+x",
			},
			scopePath: [],
		}).get({ x: 1 }, { scopePathItem: [] });
		expect(result).to.equal(2);
	});

	it("should be able to getIdentifiers", function () {
		angularParser.filters.getimg = () => 0;
		expect(
			angularParser("x+x", {
				scopePath: [],
				tag: {
					value: "x+x",
				},
			}).getIdentifiers()
		).to.deep.equal(["x"]);
		expect(
			angularParser("x+users", {
				scopePath: [],
				tag: {
					value: "x+users",
				},
			}).getIdentifiers()
		).to.deep.equal(["x", "users"]);
		expect(
			angularParser("users<= 3 && users!= 0 | getimg:foo", {
				scopePath: [],
				tag: {
					value: "users<= 3 && users!= 0 | getimg:foo",
				},
			}).getIdentifiers()
		).to.deep.equal(["users", "foo"]);
	});

	it("should be able to getIdentifiers with ie 11", function () {
		angularParserIE11.filters.getimg = function name() {
			return 0;
		};
		expect(
			angularParserIE11("x+x", {
				tag: {
					value: "x+x",
				},
			}).getIdentifiers()
		).to.deep.equal(["x"]);
		expect(
			angularParserIE11("x+users", {
				tag: {
					value: "x+users",
				},
			}).getIdentifiers()
		).to.deep.equal(["x", "users"]);
		expect(
			angularParserIE11("users<= 3 && users!= 0 | getimg:foo", {
				tag: {
					value: "x+x",
				},
			}).getIdentifiers()
		).to.deep.equal(["users", "foo"]);
	});
});
