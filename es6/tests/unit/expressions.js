const angularParser = require("../../expressions.js");
const angularParserIE11 = require("../../expressions-ie11.js");
const { expect } = require("../utils.js");

describe("Angular parser", function () {
	it("should work", function () {
		expect(
			angularParser("x+x", {
				tag: {
					value: "x+x",
				},
				scopePath: [],
			}).get({ x: 1 }, { scopePathItem: [] })
		).to.equal(2);

		expect(
			angularParser("x(y)", {
				scopePath: [],
			}).get(
				{
					x(y) {
						return y * 2;
					},
					y: 3,
				},
				{ scopePathItem: [] }
			)
		).to.equal(6);
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

	it("should be able to get object identifiers", function () {
		expect(
			angularParser("(x.y.z + x.m) / a").getObjectIdentifiers()
		).to.deep.equal({ a: {}, x: { m: {}, y: { z: {} } } });

		expect(angularParser("x(a.b.c)").getObjectIdentifiers()).to.deep.equal({
			x: {},
			a: { b: { c: {} } },
		});
	});

	it("should be able to get object identifiers ie11", function () {
		expect(
			angularParserIE11("(x.y.z + x.m) / a").getObjectIdentifiers()
		).to.deep.equal({ a: {}, x: { m: {}, y: { z: {} } } });

		expect(angularParserIE11("x(a.b.c)").getObjectIdentifiers()).to.deep.equal({
			x: {},
			a: { b: { c: {} } },
		});
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
