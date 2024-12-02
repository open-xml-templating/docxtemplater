const createScope = require("../../scope-manager.js");
const expressionParser = require("../../expressions.js");
const { expect } = require("../utils.js");
const { resolveSoon } = require("../utils.js");

describe("ScopeManager", () => {
	it("should work with simple tag", () => {
		const sm = createScope({
			tags: { x: "y" },
			parser: expressionParser,
		});
		const val = sm.getValue("x", {
			part: {
				value: "x",
			},
		});
		expect(val).to.equal("y");
	});

	it("should work with resolve asynchronously", async () => {
		const sm = createScope({
			tags: {
				list: resolveSoon([
					{
						x: resolveSoon("a"),
					},
					{
						x: "b",
					},
					{
						x: "c",
					},
				]),
			},
			parser: expressionParser,
		});
		const part = { type: "placeholder", value: "list", lIndex: 33 };
		const part2 = { type: "placeholder", value: "x", lIndex: 44 };
		const list = await sm.getValueAsync(part.value, { part });
		const val = list[0];
		const subSm = sm.createSubScopeManager(val, part.value, 0, part, 3);
		const subVal = await subSm.getValueAsync(part2.value, { part: part2 });
		expect(subVal).to.equal("a");
	});
});
