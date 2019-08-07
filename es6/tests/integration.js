const {
	expectToThrow,
	createDoc,
	shouldBeSame,
	expect,
	resolveSoon,
	createXmlTemplaterDocxNoRender,
	cleanRecursive,
} = require("./utils");

const printy = require("./printy");
const { cloneDeep } = require("lodash");

const expectedPrintedPostParsed = `
(0)<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 w16se w16cid wp14"><w:body>
***START LOOP OF hi
(1)   <w:p>
(2)      <w:r>
(3)         <w:t xml:space="preserve">
(3)         </w:t>
(2)      </w:r>
(2)      <w:p w14:paraId="736A2D9F" w14:textId="77777777" w:rsidR="008E1095" w:rsidRDefault="008E1095"/>
(2)      <w:sdt><w:sdtPr><w:alias w:val="SF:Table"/><w:id w:val="2039776175"/><w:placeholder><w:docPart w:val="CFCF8C7E6B33489A9DD50D7417AD410D"/></w:placeholder><w15:color w:val="008000"/><w15:appearance w15:val="hidden"/></w:sdtPr><w:sdtContent>
(2)      <w:p w14:paraId="4800949B" w14:textId="77777777" w:rsidR="00D3440B" w:rsidRDefault="00D3440B" w:rsidP="00D3440B"/>
(2)      <w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="0660" w:firstRow="1" w:lastRow="1" w:firstColumn="0" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/></w:tblPr><w:tblGrid><w:gridCol w:w="2909"/><w:gridCol w:w="2928"/><w:gridCol w:w="2793"/></w:tblGrid>
(2)      <w:tr w:rsidR="00D3440B" w14:paraId="5887C255" w14:textId="77777777" w:rsidTr="00F617CB">
(3)         <w:trPr><w:tblHeader/></w:trPr>
(3)         <w:tc>
(4)            <w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>
(4)            <w:p w14:paraId="5951DD51" w14:textId="77777777" w:rsidR="00D3440B" w:rsidRDefault="00D3440B" w:rsidP="00F617CB">
(5)               <w:r>
(6)                  <w:t xml:space="preserve">
(7)                     name
(6)                  </w:t>
(5)               </w:r>
(4)            </w:p>
(3)         </w:tc>
(3)         <w:tc>
(4)            <w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>
(4)            <w:p w14:paraId="34A4528E" w14:textId="77777777" w:rsidR="00D3440B" w:rsidRDefault="00D3440B" w:rsidP="00F617CB">
(5)               <w:r>
(6)                  <w:t xml:space="preserve">
(7)                     phone
(6)                  </w:t>
(5)               </w:r>
(4)            </w:p>
(3)         </w:tc>
(3)         <w:tc>
(4)            <w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>
(4)            <w:p w14:paraId="1EFFDB2B" w14:textId="77777777" w:rsidR="00D3440B" w:rsidRDefault="00D3440B" w:rsidP="00F617CB">
(5)               <w:r>
(6)                  <w:t xml:space="preserve">
(7)                     website
(6)                  </w:t>
(5)               </w:r>
(4)            </w:p>
(3)         </w:tc>
(2)      </w:tr>
(2)      <w:tr w:rsidR="00D3440B" w14:paraId="53971E16" w14:textId="77777777" w:rsidTr="00F617CB">
(3)         <w:sdt><w:sdtPr><w:alias w:val="SF:R"/><w:id w:val="1927457022"/><w15:color w:val="008000"/><w15:appearance w15:val="hidden"/></w:sdtPr><w:sdtContent>
(3)         <w:tc>
(4)            <w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>
(4)            <w:p w14:paraId="6B371C2E" w14:textId="77777777" w:rsidR="00D3440B" w:rsidRDefault="00D3440B" w:rsidP="00F617CB">
(5)               <w:pPr>
(6)                  <w:spacing w:line="360" w:lineRule="auto"/>
(6)                  <w:jc w:val="both"/>
(5)               </w:pPr>
(5)               <w:r>
(6)                  <w:t xml:space="preserve">
========================{foo}
(6)                  </w:t>
(5)               </w:r>
(4)            </w:p>
(3)         </w:tc>
(3)         </w:sdtContent></w:sdt><w:sdt><w:sdtPr><w:alias w:val="SF:R"/><w:id w:val="1556285925"/><w15:color w:val="008000"/><w15:appearance w15:val="hidden"/></w:sdtPr><w:sdtContent>
(3)         <w:tc>
(4)            <w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>
(4)            <w:p w14:paraId="3C4100BB" w14:textId="77777777" w:rsidR="00D3440B" w:rsidRDefault="00D3440B" w:rsidP="00F617CB">
(5)               <w:pPr>
(6)                  <w:spacing w:line="360" w:lineRule="auto"/>
(6)                  <w:jc w:val="both"/>
(5)               </w:pPr>
(5)               <w:r>
(6)                  <w:t xml:space="preserve">
========================{bar}
(6)                  </w:t>
(5)               </w:r>
(4)            </w:p>
(3)         </w:tc>
(3)         </w:sdtContent></w:sdt><w:sdt><w:sdtPr><w:alias w:val="SF:R"/><w:id w:val="-788971804"/><w15:color w:val="008000"/><w15:appearance w15:val="hidden"/></w:sdtPr><w:sdtContent>
(3)         <w:tc>
(4)            <w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>
(4)            <w:p w14:paraId="24C5CEB1" w14:textId="77777777" w:rsidR="00D3440B" w:rsidRDefault="00D3440B" w:rsidP="00F617CB">
(5)               <w:pPr>
(6)                  <w:spacing w:line="360" w:lineRule="auto"/>
(6)                  <w:jc w:val="both"/>
(5)               </w:pPr>
(5)               <w:r>
(6)                  <w:t xml:space="preserve">
========================{bar}
(6)                  </w:t>
(5)               </w:r>
(4)            </w:p>
(3)         </w:tc>
(3)         </w:sdtContent></w:sdt>
(2)      </w:tr>
(2)      </w:tbl>
(2)      <w:p w14:paraId="676A1E43" w14:textId="77777777" w:rsidR="00D3440B" w:rsidRDefault="00D3440B" w:rsidP="00D3440B"/>
(2)      </w:sdtContent></w:sdt>
(2)      <w:p w14:paraId="22D858B2" w14:textId="69A6ACE6" w:rsidR="009843AE" w:rsidRDefault="00EB53B3"/>
(1)   </w:p>
(1)   <w:p>
(2)      <w:r>
(3)         <w:t xml:space="preserve">
(3)         </w:t>
(2)      </w:r>
(1)   </w:p>
***END LOOP OF hi
(0)</w:body></w:document>`;

const raw = `<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="37" name="CustomShape 2"/>
    <p:cNvSpPr/>
    <p:nvPr/>
  </p:nvSpPr>
  <p:spPr>
    <a:xfrm>
      <a:off x="504000" y="1769040"/>
      <a:ext cx="9071280" cy="4384080"/>
    </a:xfrm>
    <a:prstGeom prst="rect">
      <a:avLst/>
    </a:prstGeom>
    <a:noFill/>
    <a:ln>
      <a:noFill/>
    </a:ln>
  </p:spPr>
  <p:style>
    <a:lnRef idx="0"/>
    <a:fillRef idx="0"/>
    <a:effectRef idx="0"/>
    <a:fontRef idx="minor"/>
  </p:style>
  <p:txBody>
    <a:bodyPr lIns="0" rIns="0" tIns="0" bIns="0" anchor="ctr"/>
    <a:p>
      <a:pPr algn="ctr">
        <a:lnSpc>
          <a:spcPct val="100000"/>
        </a:lnSpc>
      </a:pPr>
      <a:r>
        <a:rPr b="0" lang="fr-FR" sz="3200" spc="-1" strike="noStrike">
          <a:solidFill>
            <a:srgbClr val="000000"/>
          </a:solidFill>
          <a:uFill>
            <a:solidFill>
              <a:srgbClr val="ffffff"/>
            </a:solidFill>
          </a:uFill>
          <a:latin typeface="Arial"/>
        </a:rPr>
        <a:t>Hello World</a:t>
      </a:r>
      <a:endParaRPr b="0" lang="fr-FR" sz="1800" spc="-1" strike="noStrike">
        <a:solidFill>
          <a:srgbClr val="000000"/>
        </a:solidFill>
        <a:uFill>
          <a:solidFill>
            <a:srgbClr val="ffffff"/>
          </a:solidFill>
        </a:uFill>
        <a:latin typeface="Arial"/>
      </a:endParaRPr>
    </a:p>
  </p:txBody>
</p:sp>`;

const angularParser = require("./angular-parser");
const Errors = require("../errors.js");

describe("Docm/Pptm generation", function() {
	it("should work with docm", function() {
		const tags = {
			user: "John",
		};
		const doc = createDoc("docm.docx");
		doc.setData(tags);
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-docm.docx" });
	});
	it("should work with pptm", function() {
		const tags = {
			user: "John",
		};
		const doc = createDoc("pptm.pptx");
		doc.setData(tags);
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-pptm.pptx" });
	});
});

describe("Pptx generation", function() {
	it("should work with title", function() {
		const doc = createDoc("title-example.pptx");
		let con = doc.getZip().files["docProps/app.xml"].asText();
		expect(con).not.to.contain("Edgar");
		doc.setData({ name: "Edgar" }).render();
		con = doc.getZip().files["docProps/app.xml"].asText();
		expect(con).to.contain("Edgar");
	});
	it("should work with simple pptx", function() {
		const doc = createDoc("simple-example.pptx");
		doc.setData({ name: "Edgar" }).render();
		expect(doc.getFullText()).to.be.equal("Hello Edgar");
	});
	it("should work with table pptx", function() {
		const doc = createDoc("table-example.pptx");
		doc
			.setData({
				users: [{ msg: "hello", name: "mary" }, { msg: "hello", name: "john" }],
			})
			.render();
		shouldBeSame({ doc, expectedName: "expected-table-example.pptx" });
	});
	it("should work with loop pptx", function() {
		const doc = createDoc("loop-example.pptx");
		doc.setData({ users: [{ name: "Doe" }, { name: "John" }] }).render();
		expect(doc.getFullText()).to.be.equal(" Doe  John ");
		shouldBeSame({ doc, expectedName: "expected-loop-example.pptx" });
	});

	it("should work with simple raw pptx", function() {
		const doc = createDoc("raw-xml-example.pptx");
		let scope, meta, tag;
		let calls = 0;
		doc.setOptions({
			parser: t => {
				tag = t;
				return {
					get: (s, m) => {
						scope = s;
						meta = m.meta;
						calls++;
						return scope[tag];
					},
				};
			},
		});
		doc.setData({ raw }).render();
		expect(calls).to.equal(1);
		expect(scope.raw).to.be.a("string");
		expect(meta).to.be.an("object");
		expect(meta.part).to.be.an("object");
		expect(meta.part.expanded).to.be.an("array");
		expect(doc.getFullText()).to.be.equal("Hello World");
		shouldBeSame({ doc, expectedName: "expected-raw-xml-example.pptx" });
	});

	it("should work with simple raw pptx async", function() {
		const doc = createDoc("raw-xml-example.pptx");
		let scope, meta, tag;
		let calls = 0;
		doc.setOptions({
			parser: t => {
				tag = t;
				return {
					get: (s, m) => {
						scope = s;
						meta = m.meta;
						calls++;
						return scope[tag];
					},
				};
			},
		});
		doc.compile();
		return doc.resolveData({ raw }).then(function() {
			doc.render();
			expect(calls).to.equal(1);
			expect(scope.raw).to.be.a("string");
			expect(meta).to.be.an("object");
			expect(meta.part).to.be.an("object");
			expect(meta.part.expanded).to.be.an("array");
			expect(doc.getFullText()).to.be.equal("Hello World");
			shouldBeSame({ doc, expectedName: "expected-raw-xml-example.pptx" });
		});
	});

	it("should be possible to have linebreaks if setting the option", function() {
		const doc = createDoc("tag-multiline.pptx");
		doc.setData({
			description: "The description,\nmultiline",
		});
		doc.setOptions({ linebreaks: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-multiline.pptx" });
	});

	it("should not fail when using linebreaks and tagvalue not a string", function() {
		const doc = createDoc("tag-multiline.pptx");
		doc.setData({
			description: true,
		});
		doc.setOptions({ linebreaks: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-regression-multiline.pptx" });
	});
});

describe("Table", function() {
	it("should work with selfclosing tag inside table with paragraphLoop", function() {
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
		const doc = createDoc("loop-valid.docx");
		doc.setData(tags);
		doc.setOptions({ paragraphLoop: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-loop-valid.docx" });
	});

	it("should work with tables", function() {
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

	it("should work with simple table", function() {
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

	it("should work with more complex table", function() {
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

	it("should work when looping around tables", function() {
		const doc = createDoc("table-repeat.docx");
		doc.setData({
			table: [1, 2, 3, 4],
		});
		doc.render();
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("1234123412341234");
	});

	it("should not corrupt table with empty rawxml", function() {
		const doc = createDoc("table-raw-xml.docx");
		doc.setData({});
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-raw-xml.docx" });
	});

	it("should not corrupt table with empty loop", function() {
		const doc = createDoc("table-loop.docx");
		doc.setData({});
		doc.setOptions({ paragraphLoop: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-empty-table.docx" });
	});
});

describe("Dash Loop", function() {
	it("should work on simple table -> w:tr", function() {
		const tags = {
			os: [
				{ type: "linux", price: "0", reference: "Ubuntu10" },
				{ type: "DOS", price: "500", reference: "Win7" },
				{ type: "apple", price: "1200", reference: "MACOSX" },
			],
		};
		const doc = createDoc("tag-dash-loop.docx");
		doc.setData(tags);
		doc.render();
		const expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});
	it("should work on simple table -> w:table", function() {
		const tags = {
			os: [
				{ type: "linux", price: "0", reference: "Ubuntu10" },
				{ type: "DOS", price: "500", reference: "Win7" },
				{ type: "apple", price: "1200", reference: "MACOSX" },
			],
		};
		const doc = createDoc("tag-dash-loop-table.docx");
		doc.setData(tags);
		doc.render();
		const expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});
	it("should work on simple list -> w:p", function() {
		const tags = {
			os: [
				{ type: "linux", price: "0", reference: "Ubuntu10" },
				{ type: "DOS", price: "500", reference: "Win7" },
				{ type: "apple", price: "1200", reference: "MACOSX" },
			],
		};
		const doc = createDoc("tag-dash-loop-list.docx");
		doc.setData(tags);
		doc.render();
		const expectedText = "linux 0 Ubuntu10 DOS 500 Win7 apple 1200 MACOSX ";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});
});

describe("Templating", function() {
	describe("text templating", function() {
		it("should change values with template data", function() {
			const tags = {
				first_name: "Hipp",
				last_name: "Edgar",
				phone: "0652455478",
				description: "New Website",
			};
			const doc = createDoc("tag-example.docx");
			doc.setData(tags);
			doc.render();
			expect(doc.getFullText()).to.be.equal("Edgar Hipp");
			expect(doc.getFullText("word/header1.xml")).to.be.equal(
				"Edgar Hipp0652455478New Website"
			);
			expect(doc.getFullText("word/footer1.xml")).to.be.equal(
				"EdgarHipp0652455478"
			);
			shouldBeSame({ doc, expectedName: "expected-tag-example.docx" });
		});
	});

	it("should replace custom properties text", function() {
		const doc = createDoc("properties.docx");
		let app = doc.getZip().files["docProps/app.xml"].asText();
		let core = doc.getZip().files["docProps/core.xml"].asText();
		expect(app).to.contain("{tag1}");
		expect(core).to.contain("{tag1}");
		expect(core).to.contain("{tag2}");
		expect(core).to.contain("{tag3}");
		expect(app).to.contain("{tag4}");
		expect(app).to.contain("{tag5}");
		expect(core).to.contain("{tag6}");
		expect(core).to.contain("{tag7}");
		expect(core).to.contain("{tag8}");
		expect(app).to.contain("{tag9}");
		doc
			.setData({
				tag1: "resolvedvalue1",
				tag2: "resolvedvalue2",
				tag3: "resolvedvalue3",
				tag4: "resolvedvalue4",
				tag5: "resolvedvalue5",
				tag6: "resolvedvalue6",
				tag7: "resolvedvalue7",
				tag8: "resolvedvalue8",
				tag9: "resolvedvalue9",
			})
			.render();
		app = doc.getZip().files["docProps/app.xml"].asText();
		core = doc.getZip().files["docProps/core.xml"].asText();
		expect(app).to.contain("resolvedvalue1");
		expect(core).to.contain("resolvedvalue1");
		expect(core).to.contain("resolvedvalue2");
		expect(core).to.contain("resolvedvalue3");
		expect(app).to.contain("resolvedvalue4");
		expect(app).to.contain("resolvedvalue5");
		expect(core).to.contain("resolvedvalue6");
		expect(core).to.contain("resolvedvalue7");
		expect(core).to.contain("resolvedvalue8");
		expect(app).to.contain("resolvedvalue9");
	});
	it("should show spaces with linebreak option", function() {
		const doc = createDoc("tag-multiline.docx");
		doc.setData({
			description: `hello there
    deep indentation
       goes here
    end`,
		});
		doc.setOptions({ linebreaks: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-multiline-indent.docx" });
	});
});

describe("Linebreaks", function() {
	it("should be possible to have linebreaks if setting the option", function() {
		const doc = createDoc("tag-multiline.docx");
		doc.setData({
			description: "The description,\nmultiline",
		});
		doc.setOptions({ linebreaks: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-multiline.docx" });
	});

	it("should work with linebreaks without changing the style", function() {
		const doc = createDoc("multi-tags.docx");
		doc.setData({
			test: "The tag1,\nmultiline\nfoobaz",
			test2: "The tag2,\nmultiline\nfoobar",
		});
		doc.setOptions({ linebreaks: true });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-two-multiline.docx" });
	});
});

describe("ParagraphLoop", function() {
	it("should work with docx", function() {
		const doc = createDoc("users.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc.setData({ users: ["John", "Jane", "Louis"] }).render();
		shouldBeSame({ doc, expectedName: "expected-users.docx" });
	});

	it("should work without removing extra text", function() {
		const doc = createDoc("paragraph-loops.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc
			.setData({
				condition: [1, 2],
				l1: [
					{
						l2: ["a", "b", "c"],
					},
					{
						l2: ["d", "e", "f"],
					},
				],
				placeholder: "placeholder-value",
			})
			.render();
		shouldBeSame({ doc, expectedName: "expected-paragraph-loop.docx" });
	});

	it("should work with pptx", function() {
		const doc = createDoc("paragraph-loop.pptx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc
			.setData({
				users: [
					{ age: 10, name: "Bar" },
					{ age: 18, name: "Bar" },
					{ age: 22, name: "Bar" },
				],
			})
			.render();
		shouldBeSame({ doc, expectedName: "expected-paragraph-loop.pptx" });
	});

	it("should not fail when having paragraph in paragraph", function() {
		const doc = createDoc("regression-par-in-par.docx");
		const printedPostparsed = [];
		doc.attachModule({
			set(obj) {
				if (obj.inspect && obj.inspect.postparsed) {
					printedPostparsed.push(printy(obj.inspect.postparsed));
				}
			},
		});

		doc.setOptions({
			paragraphLoop: true,
			parser: () => ({
				get: () => "foo",
			}),
		});
		doc.setData({});
		doc.render();
		expect(printedPostparsed[8]).to.be.equal(expectedPrintedPostParsed);
		shouldBeSame({ doc, expectedName: "expected-rendered-par-in-par.docx" });
	});

	it("should work with spacing at the end", function() {
		const doc = createDoc("spacing-end.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc.setData({ name: "John" }).render();
		shouldBeSame({ doc, expectedName: "expected-spacing-end.docx" });
	});

	it("should fail properly when having lexed + postparsed errors", function() {
		const doc = createDoc("multi-errors.docx");
		doc.setOptions({
			paragraphLoop: true,
			parser: angularParser,
		});
		doc.setData({
			users: [
				{ age: 10, name: "Bar" },
				{ age: 18, name: "Bar" },
				{ age: 22, name: "Bar" },
			],
		});
		const expectedError = {
			message: "Multi error",
			name: "TemplateError",
			properties: {
				id: "multi_error",
				errors: [
					{
						name: "TemplateError",
						message: "Unclosed tag",
						properties: {
							xtag: "firstName",
							id: "unclosed_tag",
							context: "{firstName ",
							offset: 0,
						},
					},
					{
						name: "TemplateError",
						message: "Unclosed tag",
						properties: {
							xtag: "error",
							id: "unclosed_tag",
							context: "{error  ",
							offset: 22,
						},
					},
					{
						name: "TemplateError",
						message: "Unopened tag",
						properties: {
							xtag: "}",
							id: "unopened_tag",
							context: "}",
							offset: 35,
						},
					},
					{
						name: "TemplateError",
						message: "Unclosed tag",
						properties: {
							xtag: "",
							id: "unclosed_tag",
							context: "{",
							offset: 42,
						},
					},
				],
			},
		};
		const create = doc.render.bind(doc);
		expectToThrow(create, Errors.XTTemplateError, expectedError);
	});
});

describe("Prefixes", function() {
	it("should be possible to change the prefix of the loop module", function() {
		const content = "<w:t>{##tables}{user}{/tables}</w:t>";
		const scope = {
			tables: [{ user: "John" }, { user: "Jane" }],
		};
		const doc = createXmlTemplaterDocxNoRender(content, { tags: scope });
		doc.modules.forEach(function(module) {
			if (module.name === "LoopModule") {
				module.prefix.start = "##";
			}
		});
		doc.render();
		expect(doc.getFullText()).to.be.equal("JohnJane");
	});

	it("should be possible to change the prefix of the loop module to a regexp", function() {
		const content =
			"<w:t>{##tables}{user}{/tables}{#tables}{user}{/tables}</w:t>";
		const scope = {
			tables: [{ user: "A" }, { user: "B" }],
		};
		const doc = createXmlTemplaterDocxNoRender(content, { tags: scope });
		doc.modules.forEach(function(module) {
			if (module.name === "LoopModule") {
				module.prefix.start = /^##?(.*)$/;
			}
		});
		doc.render();
		expect(doc.getFullText()).to.be.equal("ABAB");
	});

	it("should be possible to change the prefix of the raw xml module to a regexp", function() {
		const content = "<w:p><w:t>{!!raw}</w:t></w:p>";
		const scope = {
			raw: "<w:p><w:t>HoHo</w:t></w:p>",
		};
		const doc = createXmlTemplaterDocxNoRender(content, { tags: scope });
		doc.modules.forEach(function(module) {
			if (module.name === "RawXmlModule") {
				module.prefix = /^!!?(.*)$/;
			}
		});
		doc.render();

		expect(doc.getFullText()).to.be.equal("HoHo");
	});
});

describe("Load Office 365 file", function() {
	it("should handle files with word/document2.xml", function() {
		const doc = createDoc("office365.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc
			.setData({
				test: "Value",
				test2: "Value2",
			})
			.render();
		expect(doc.getFullText()).to.be.equal("Value Value2");
		shouldBeSame({ doc, expectedName: "expected-office365.docx" });
	});
});

describe("Resolver", function() {
	it("should work", function() {
		const doc = createDoc("office365.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc.compile();
		return doc
			.resolveData({
				test: resolveSoon("Value"),
				test2: "Value2",
			})
			.then(function() {
				doc.render();
				expect(doc.getFullText()).to.be.equal("Value Value2");
				shouldBeSame({ doc, expectedName: "expected-office365.docx" });
			});
	});

	it("should resolve loops", function() {
		const doc = createDoc("multi-loop.docx");
		doc.setOptions({
			paragraphLoop: true,
		});
		doc.compile();
		return doc
			.resolveData({
				companies: resolveSoon([
					{
						name: "Acme",
						users: resolveSoon([
							{
								name: "John",
							},
							{
								name: "James",
							},
						]),
					},
					{
						name: resolveSoon("Emca"),
						users: resolveSoon([
							{
								name: "Mary",
							},
							{
								name: "Liz",
							},
						]),
					},
				]),
				test2: "Value2",
			})
			.then(function() {
				doc.render();
				shouldBeSame({ doc, expectedName: "expected-multi-loop.docx" });
			});
	});

	it("should resolve with simple table", function() {
		const doc = createDoc("table-complex2-example.docx");
		doc.compile();
		return doc
			.resolveData({
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
			})
			.then(function(resolved) {
				const myresolved = cloneDeep(resolved);
				cleanRecursive(myresolved);
				expect(myresolved).to.be.deep.equal([
					{
						tag: "t1total1",
						value: "t1total1-data",
					},
					{
						tag: "t1total2",
						value: "t1total2-data",
					},
					{
						tag: "t1total3",
						value: "t1total3-data",
					},
					{
						tag: "table1",
						value: [
							[
								{
									tag: "t1data1",
									value: "t1-1row-data1",
								},
								{
									tag: "t1data2",
									value: "t1-1row-data2",
								},
								{
									tag: "t1data3",
									value: "t1-1row-data3",
								},
								{
									tag: "t1data4",
									value: "t1-1row-data4",
								},
							],
							[
								{
									tag: "t1data1",
									value: "t1-2row-data1",
								},
								{
									tag: "t1data2",
									value: "t1-2row-data2",
								},
								{
									tag: "t1data3",
									value: "t1-2row-data3",
								},
								{
									tag: "t1data4",
									value: "t1-2row-data4",
								},
							],
							[
								{
									tag: "t1data1",
									value: "t1-3row-data1",
								},
								{
									tag: "t1data2",
									value: "t1-3row-data2",
								},
								{
									tag: "t1data3",
									value: "t1-3row-data3",
								},
								{
									tag: "t1data4",
									value: "t1-3row-data4",
								},
							],
						],
					},
				]);
				doc.render();
				const fullText = doc.getFullText();
				expect(fullText).to.be.equal(
					"TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data"
				);
			});
	});

	it("should not regress 1 sync", function() {
		const doc = createDoc("regression-1.docx");
		doc.compile();
		doc.setData({ a: [{ d: "Hello world" }] });
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-regression-1.docx" });
	});

	it("should not regress when having [Content_Types.xml] contain Default instead of Override", function() {
		const doc = createDoc("with-default-contenttype.docx");
		doc.compile();
		doc.setData({});
		doc.render();
		shouldBeSame({
			doc,
			expectedName: "expected-with-default-contenttype.docx",
		});
	});

	it("should not regress 1 async", function() {
		const doc = createDoc("regression-1.docx");
		doc.compile();
		return doc.resolveData({ a: [{ d: "Hello world" }] }).then(function() {
			doc.render();
			shouldBeSame({ doc, expectedName: "expected-regression-1.docx" });
		});
	});

	const regress2Data = {
		amount_wheels_car_1: "4",
		amount_wheels_motorcycle_1: "2",

		amount_wheels_car_2: "6",
		amount_wheels_motorcycle_2: "3",

		id: [
			{
				car: "1",
				motorcycle: "",
			},
		],
	};

	it("should not regress 2 sync", function() {
		const doc = createDoc("regression-2.docx");
		doc.compile();
		doc.setData(regress2Data);
		doc.render();
		shouldBeSame({ doc, expectedName: "expected-regression-2.docx" });
	});

	it("should not regress 2 async", function() {
		const doc = createDoc("regression-2.docx");
		doc.compile();
		return doc.resolveData(regress2Data).then(function() {
			doc.render();
			shouldBeSame({ doc, expectedName: "expected-regression-2.docx" });
		});
	});
});
