const inspectModule = require("../../inspect-module.js");
const { expectToThrowSnapshot, createDocV4, expect } = require("../utils.js");

describe("Inspect module", () => {
	it("should get main tags", () => {
		const iModule = inspectModule();
		const doc = createDocV4("tag-loop-example.docx", {
			modules: [iModule],
		});
		expect(iModule.getStructuredTags()).to.matchSnapshot();
		expect(iModule.getTags()).to.be.deep.equal({
			offre: {
				nom: {},
				prix: {},
				titre: {},
			},
			nom: {},
			prenom: {},
		});
		const data = { offre: [{}], prenom: "John" };
		doc.render(data);
		const fi = iModule.fullInspected["word/document.xml"];
		const { summary, detail } = fi.nullValues;
		const { postparsed, parsed, xmllexed } = fi;
		expect(postparsed.length).to.equal(249);
		expect(parsed.length).to.equal(385);
		expect(xmllexed.length).to.equal(383);

		expect(iModule.inspect.tags).to.be.deep.equal(data);
		expect(detail).to.be.an("array");
		expect(detail[0].part.value).to.equal("nom");
		expect(detail[0].scopeManager.scopeList[0].prenom).to.equal("John");
		expect(summary).to.be.deep.equal([
			["offre", "nom"],
			["offre", "prix"],
			["offre", "titre"],
			["nom"],
		]);
	});

	it("should get all tags (pptx file)", () => {
		const iModule = inspectModule();
		createDocV4("multi-page.pptx", { modules: [iModule] });
		expect(iModule.getStructuredTags()).to.matchSnapshot();
		expect(iModule.getFileType()).to.be.deep.equal("pptx");
		expect(iModule.getAllTags()).to.be.deep.equal({
			tag: {},
			users: {
				name: {},
			},
		});
		expect(iModule.getTemplatedFiles().sort()).to.be.deep.equal(
			[
				"ppt/slides/slide1.xml",
				"ppt/slides/slide2.xml",
				"ppt/slideLayouts/slideLayout1.xml",
				"ppt/slideLayouts/slideLayout10.xml",
				"ppt/slideLayouts/slideLayout11.xml",
				"ppt/slideLayouts/slideLayout12.xml",
				"ppt/slideLayouts/slideLayout2.xml",
				"ppt/slideLayouts/slideLayout3.xml",
				"ppt/slideLayouts/slideLayout4.xml",
				"ppt/slideLayouts/slideLayout5.xml",
				"ppt/slideLayouts/slideLayout6.xml",
				"ppt/slideLayouts/slideLayout7.xml",
				"ppt/slideLayouts/slideLayout8.xml",
				"ppt/slideLayouts/slideLayout9.xml",
				"ppt/slideMasters/slideMaster1.xml",
				"ppt/presentation.xml",
				"docProps/app.xml",
				"docProps/core.xml",
			].sort()
		);
	});

	it("should get all tags and merge them", () => {
		const iModule = inspectModule();
		createDocV4("multi-page-to-merge.pptx", {
			modules: [iModule],
		});
		expect(iModule.getAllTags()).to.be.deep.equal({
			tag: {},
			users: {
				name: {},
				age: {},
				company: {},
			},
		});
	});

	it("should get all tags with additional data", () => {
		const iModule = inspectModule();
		createDocV4("tag-product-loop.docx", {
			modules: [iModule],
		});
		expect(iModule.getAllStructuredTags()).to.matchSnapshot();
	});

	it("should show throw error if calling getAllTags, getAllStructuredTags without attaching the module", () => {
		// Fixed since v3.67.5
		const iModule = inspectModule();
		expectToThrowSnapshot(() => iModule.getAllTags());
		expectToThrowSnapshot(() => iModule.getTags());
		expectToThrowSnapshot(() => iModule.getInspected());
		expectToThrowSnapshot(() => iModule.getAllStructuredTags());
		expectToThrowSnapshot(() => iModule.getTemplatedFiles());
		expectToThrowSnapshot(() => iModule.getStructuredTags());
	});
});
