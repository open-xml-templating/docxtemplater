"use strict";

var _require = require("./utils"),
    createDoc = _require.createDoc,
    shouldBeSame = _require.shouldBeSame,
    expect = _require.expect;

describe("Docx docprops", function () {
	it("should change values with template data", function () {
		var tags = {
			first_name: "Hipp",
			last_name: "Edgar",
			phone: "0652455478",
			description: "New Website"
		};
		var doc = createDoc("tag-docprops.docx");
		doc.setData(tags);
		doc.render();
		expect(doc.getFullText()).to.be.equal("Edgar Hipp");
		expect(doc.getFullText("word/header1.xml")).to.be.equal("Edgar Hipp0652455478New Website");
		expect(doc.getFullText("word/footer1.xml")).to.be.equal("EdgarHipp0652455478");
		shouldBeSame({ doc: doc, expectedName: "tag-docprops-expected.docx" });
	});
});