const { createDoc, shouldBeSame, expect } = require("./utils");

describe("Docx docprops", function () {
	it("should change values with template data", function () {
		const tags = {
			first_name: "Hipp",
			last_name: "Edgar",
			phone: "0652455478",
			description: "New Website",
		};
		const doc = createDoc("tag-docprops.docx");
		doc.setData(tags);
		doc.render();
		expect(doc.getFullText()).to.be.equal("Edgar Hipp");
		expect(doc.getFullText("word/header1.xml")).to.be.equal(
			"Edgar Hipp0652455478New Website"
		);
		expect(doc.getFullText("word/footer1.xml")).to.be.equal(
			"EdgarHipp0652455478"
		);
		shouldBeSame({ doc, expectedName: "expected-tag-docprops.docx" });
	});
});
