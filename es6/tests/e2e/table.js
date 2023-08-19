const { createDoc, createDocV4, shouldBeSame, expect } = require("../utils.js");

describe("Table", function () {
	it("should work with selfclosing tag inside table with paragraphLoop", function () {
		const tags = {
			a: [
				{
					b: {
						c: "Foo",
						d: "Hello ",
					},
				},
				{
					b: {
						c: "Foo",
						d: "Hello ",
					},
				},
			],
		};
		shouldBeSame({
			doc: createDocV4("loop-valid.docx", { paragraphLoop: true }).render(tags),
			expectedName: "expected-loop-valid.docx",
		});
	});

	it("should work with tables", function () {
		const tags = {
			clients: [
				{ first_name: "John", last_name: "Doe", phone: "+33647874513" },
				{ first_name: "Jane", last_name: "Doe", phone: "+33454540124" },
				{ first_name: "Phil", last_name: "Kiel", phone: "+44578451245" },
				{ first_name: "Dave", last_name: "Sto", phone: "+44548787984" },
			],
		};
		const doc = createDoc("tag-intelligent-loop-table.docx");
		doc.setData(tags);
		doc.render();
		const expectedText =
			"JohnDoe+33647874513JaneDoe+33454540124PhilKiel+44578451245DaveSto+44548787984";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
		shouldBeSame({
			doc,
			expectedName: "expected-tag-intelligent-loop-table.docx",
		});
	});

	it("should work with simple table", function () {
		const doc = createDoc("table-complex2-example.docx");
		doc.setData({
			table1: [
				{
					t1data1: "t1-1row-data1",
					t1data2: "t1-1row-data2",
					t1data3: "t1-1row-data3",
					t1data4: "t1-1row-data4",
				},
				{
					t1data1: "t1-2row-data1",
					t1data2: "t1-2row-data2",
					t1data3: "t1-2row-data3",
					t1data4: "t1-2row-data4",
				},
				{
					t1data1: "t1-3row-data1",
					t1data2: "t1-3row-data2",
					t1data3: "t1-3row-data3",
					t1data4: "t1-3row-data4",
				},
			],
			t1total1: "t1total1-data",
			t1total2: "t1total2-data",
			t1total3: "t1total3-data",
		});
		doc.render();
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal(
			"TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data"
		);
	});

	it("should work with more complex table", function () {
		const doc = createDoc("table-complex-example.docx");
		doc.setData({
			table2: [
				{
					t2data1: "t2-1row-data1",
					t2data2: "t2-1row-data2",
					t2data3: "t2-1row-data3",
					t2data4: "t2-1row-data4",
				},
				{
					t2data1: "t2-2row-data1",
					t2data2: "t2-2row-data2",
					t2data3: "t2-2row-data3",
					t2data4: "t2-2row-data4",
				},
			],
			t1total1: "t1total1-data",
			t1total2: "t1total2-data",
			t1total3: "t1total3-data",
			t2total1: "t2total1-data",
			t2total2: "t2total2-data",
			t2total3: "t2total3-data",
		});
		doc.render();
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal(
			"TABLE1COLUMN1COLUMN2COLUMN3COLUMN4TOTALt1total1-datat1total2-datat1total3-dataTABLE2COLUMN1COLUMN2COLUMN3COLUMN4t2-1row-data1t2-1row-data2t2-1row-data3t2-1row-data4t2-2row-data1t2-2row-data2t2-2row-data3t2-2row-data4TOTALt2total1-datat2total2-datat2total3-data"
		);
	});

	it("should work when looping around tables", function () {
		const doc = createDoc("table-repeat.docx");
		doc.setData({
			table: [1, 2, 3, 4],
		});
		doc.render();
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("1234123412341234");
	});

	it("should not corrupt table with empty rawxml", function () {
		const doc = createDoc("table-raw-xml.docx");
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-raw-xml.docx" });
	});

	it("should call nullGetter with empty rawxml", function () {
		const doc = createDocV4("table-raw-xml.docx", {
			nullGetter: (part) => {
				if (part.module === "rawxml") {
					return `<w:p>
					<w:r>
						<w:rPr><w:color w:val="FF0000"/></w:rPr>
						<w:t>UNDEFINED</w:t>
					</w:r>
					</w:p>`;
				}
			},
		});
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-raw-xml-null.docx" });
	});

	it("should not corrupt document with empty rawxml after a table, at the end of the document", function () {
		const doc = createDoc("raw-xml-after-table.docx");
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-raw-xml-after-table.docx" });
	});

	it("should not corrupt document with selfclosing w:sdtContent tag", function () {
		const doc = createDoc("self-closing-w-sdtcontent.docx");
		doc.render();
		shouldBeSame({
			doc,
			expectedName: "expected-self-closing-w-sdtcontent.docx",
		});
	});

	it("should not corrupt loop containing section", function () {
		const doc = createDoc("loop-with-section.docx");
		doc.render({
			loop1: [
				{
					loop2: [1, 2],
				},
				{
					loop2: [],
				},
				{
					loop2: [3, 4, 5],
				},
			],
		});
		shouldBeSame({ doc, expectedName: "expected-multi-section.docx" });
	});

	it("should repeat section break if the section break is inside a loop", function () {
		const doc = createDoc("loop-with-page-section-break.docx");
		doc.setData({
			loop: [1, 2, 3],
		});
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-page-section-break.docx" });
	});

	it("should not corrupt sdtcontent", function () {
		const doc = createDoc("regression-sdtcontent-paragraph.docx");
		doc.setData({
			loop: {
				name: "foo",
				Id: "bar",
			},
		});
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-sdtcontent-valid.docx" });
	});

	it("should not corrupt table with empty rawxml within loop", function () {
		const doc = createDoc("loops-with-table-raw-xml.docx");
		doc.setData({
			loop: [
				{ loop2: [] },
				{ loop2: {}, raw: "<w:p><w:r><w:t>RAW</w:t></w:r></w:p>" },
			],
		});
		doc.setOptions({ paragraphLoop: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-loop-raw-xml.docx" });
	});

	it("should not corrupt table with empty loop", function () {
		const doc = createDoc("table-loop.docx");
		doc.setOptions({ paragraphLoop: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-empty-table.docx" });
	});

	it("should not corrupt table because of missing <w:p> after table", function () {
		shouldBeSame({
			doc: createDocV4("table-in-table-corruption.docx", {
				paragraphLoop: true,
			}).render(),
			expectedName: "expected-table-in-table-corruption.docx",
		});
	});

	it("should drop table if there are no <w:tr> childs", function () {
		shouldBeSame({
			doc: createDocV4("table-empty.docx").render(),
			expectedName: "expected-table-empty.docx",
		});
	});
});
