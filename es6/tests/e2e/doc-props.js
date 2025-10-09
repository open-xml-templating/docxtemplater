const { createDocV4, shouldBeSame, expect } = require("../utils.js");

describe("Docx document properties", () => {
	it("should change values in doc-props", () => {
		const doc = createDocV4("tag-docprops.docx", {
			paragraphLoop: true,
		});
		expect(doc.getFullText("docProps/app.xml")).to.be.equal(
			"TitleName: {first_name}"
		);
		doc.render({
			first_name: "Hipp",
			last_name: "Edgar",
			phone: "0652455478",
			description: "New Website",
		});
		expect(doc.getFullText()).to.be.equal("Edgar Hipp");
		expect(doc.getFullText("word/header1.xml")).to.be.equal(
			"Edgar Hipp0652455478New Website"
		);
		expect(doc.getFullText("word/footer1.xml")).to.be.equal(
			"EdgarHipp0652455478"
		);
		expect(doc.getFullText("docProps/app.xml")).to.be.equal(
			"TitleName: Hipp"
		);
		shouldBeSame({ doc, expectedName: "expected-tag-docprops.docx" });
	});

	it("should change custom values inside '<vt:lpwstr>' in file docProps/custom.xml", function () {
		return this.render({
			name: "tag-docprops-in-doc.docx",
			data: {
				first_name: "Hipp",
				email: "john@acme.com",
				last_name: "Edgar",
				phone: "0652455478",
				description: "New Website",
			},
			expectedName: "expected-tag-docprops-in-doc.docx",
		});
	});

	it("should be possible to ignore files in docProps/core.xml", () => {
		const avoidRenderingCoreXMLModule = {
			name: "avoidRenderingCoreXMLModule",
			getFileType({ doc }) {
				doc.targets = doc.targets.filter((file) => {
					if (
						file === "docProps/core.xml" ||
						file === "docProps/app.xml"
					) {
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
