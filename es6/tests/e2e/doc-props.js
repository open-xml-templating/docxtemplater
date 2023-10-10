const { createDoc, createDocV4, shouldBeSame } = require("../utils/index.js");
const { expect } = require("chai");

describe("Docx document properties", function () {
	it("should change values in doc-props", function () {
		const tags = {
			first_name: "Hipp",
			last_name: "Edgar",
			phone: "0652455478",
			description: "New Website",
		};
		const doc = createDoc("tag-docprops.docx", {
			paragraphLoop: true,
		});
		doc.setData(tags);
		expect(doc.getFullText("docProps/app.xml")).to.be.equal(
			"TitleName: {first_name}"
		);
		doc.render();
		expect(doc.getFullText()).to.be.equal("Edgar Hipp");
		expect(doc.getFullText("word/header1.xml")).to.be.equal(
			"Edgar Hipp0652455478New Website"
		);
		expect(doc.getFullText("word/footer1.xml")).to.be.equal(
			"EdgarHipp0652455478"
		);
		expect(doc.getFullText("docProps/app.xml")).to.be.equal("TitleName: Hipp");
		shouldBeSame({ doc, expectedName: "expected-tag-docprops.docx" });
	});

	it("should change custom values inside '<vt:lpwstr>' in file docProps/custom.xml", function () {
		const doc = createDoc("tag-docprops-in-doc.docx");
		doc.render({
			first_name: "Hipp",
			email: "john@acme.com",
			last_name: "Edgar",
			phone: "0652455478",
			description: "New Website",
		});
		shouldBeSame({ doc, expectedName: "expected-tag-docprops-in-doc.docx" });
	});

	it("should be possible to ignore files in docProps/core.xml", function () {
		const avoidRenderingCoreXMLModule = {
			name: "avoidRenderingCoreXMLModule",
			getFileType({ doc }) {
				doc.targets = doc.targets.filter(function (file) {
					if (file === "docProps/core.xml" || file === "docProps/app.xml") {
						return false;
					}
					return true;
				});
			},
		};

		const doc = createDocV4("core-xml-missing-close-tag.docx", {
			modules: [avoidRenderingCoreXMLModule],
		});
		doc.render({
			first_name: "Hipp",
			last_name: "Edgar",
			phone: "0652455478",
			description: "New Website",
		});
		shouldBeSame({ doc, expectedName: "expected-core-xml.docx" });
	});
});
