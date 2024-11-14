const { createDocV4, expect } = require("../utils.js");

describe("Table", function () {
	it("should work with selfclosing tag inside table with paragraphLoop", function () {
		return this.renderV4({
			name: "loop-valid.docx",
			options: { paragraphLoop: true },
			data: {
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
			},
			expectedName: "expected-loop-valid.docx",
		});
	});

	it("should work with tables", function () {
		return this.render({
			data: {
				clients: [
					{ first_name: "John", last_name: "Doe", phone: "+33647874513" },
					{ first_name: "Jane", last_name: "Doe", phone: "+33454540124" },
					{ first_name: "Phil", last_name: "Kiel", phone: "+44578451245" },
					{ first_name: "Dave", last_name: "Sto", phone: "+44548787984" },
				],
			},
			name: "tag-intelligent-loop-table.docx",
			expectedName: "expected-tag-intelligent-loop-table.docx",
			expectedText:
				"JohnDoe+33647874513JaneDoe+33454540124PhilKiel+44578451245DaveSto+44548787984",
		});
	});

	it("should work with simple table", function () {
		const doc = createDocV4("table-complex2-example.docx").render({
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
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal(
			"TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data"
		);
	});

	it("should work with more complex table", function () {
		const doc = createDocV4("table-complex-example.docx").render({
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
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal(
			"TABLE1COLUMN1COLUMN2COLUMN3COLUMN4TOTALt1total1-datat1total2-datat1total3-dataTABLE2COLUMN1COLUMN2COLUMN3COLUMN4t2-1row-data1t2-1row-data2t2-1row-data3t2-1row-data4t2-2row-data1t2-2row-data2t2-2row-data3t2-2row-data4TOTALt2total1-datat2total2-datat2total3-data"
		);
	});

	it("should work when looping around tables", function () {
		const doc = createDocV4("table-repeat.docx").render({
			table: [1, 2, 3, 4],
		});
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("1234123412341234");
	});

	it("should not corrupt table with empty rawxml", function () {
		return this.render({
			name: "table-raw-xml.docx",
			expectedName: "expected-raw-xml.docx",
		});
	});

	it("should call nullGetter with empty rawxml", function () {
		return this.renderV4({
			name: "table-raw-xml.docx",
			options: {
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
			},
			expectedName: "expected-raw-xml-null.docx",
		});
	});

	it("should not corrupt document with empty rawxml after a table, at the end of the document", function () {
		return this.render({
			name: "raw-xml-after-table.docx",
			expectedName: "expected-raw-xml-after-table.docx",
		});
	});

	it("should not corrupt document with selfclosing w:sdtContent tag", function () {
		return this.render({
			name: "self-closing-w-sdtcontent.docx",
			expectedName: "expected-self-closing-w-sdtcontent.docx",
		});
	});

	it("should not corrupt loop containing section", function () {
		return this.render({
			name: "loop-with-section.docx",
			data: {
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
			},
			expectedName: "expected-multi-section.docx",
		});
	});

	it("should repeat section break if the section break is inside a loop", function () {
		return this.render({
			name: "loop-with-page-section-break.docx",
			data: { loop: [1, 2, 3] },
			expectedName: "expected-page-section-break.docx",
		});
	});

	it("should not corrupt sdtcontent", function () {
		return this.render({
			name: "regression-sdtcontent-paragraph.docx",
			data: {
				loop: {
					name: "foo",
					Id: "bar",
				},
			},
			expectedName: "expected-sdtcontent-valid.docx",
		});
	});

	it("should not corrupt table with empty rawxml within loop", function () {
		return this.render({
			name: "loops-with-table-raw-xml.docx",
			options: { paragraphLoop: true },
			data: {
				loop: [
					{ loop2: [] },
					{ loop2: {}, raw: "<w:p><w:r><w:t>RAW</w:t></w:r></w:p>" },
				],
			},
			expectedName: "expected-loop-raw-xml.docx",
		});
	});

	it("should not corrupt document with selfclosing w:sdtContent tag", function () {
		return this.render({
			name: "self-closing-w-sdtcontent.docx",
			expectedName: "expected-self-closing-w-sdtcontent.docx",
		});
	});

	it("should not corrupt table because of missing <w:p> after table", function () {
		return this.renderV4({
			name: "table-in-table-corruption.docx",
			options: { paragraphLoop: true },
			expectedName: "expected-table-in-table-corruption.docx",
		});
	});

	it("should drop table if there are no <w:tr> childs", function () {
		return this.renderV4({
			name: "table-empty.docx",
			expectedName: "expected-table-empty.docx",
		});
	});
});
