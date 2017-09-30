const {createDoc, shouldBeSame, expect} = require("./utils");

describe("pptx generation", function () {
	it("should work with simple pptx", function () {
		const doc = createDoc("simple-example.pptx");
		const p = doc.setData({name: "Edgar"}).render();
		expect(p.getFullText()).to.be.equal("Hello Edgar");
	});
	it("should work with table pptx", function () {
		const doc = createDoc("table-example.pptx");
		doc.setData({users: [{msg: "hello", name: "mary"}, {msg: "hello", name: "john"}]}).render();
		shouldBeSame({doc, expectedName: "table-example-expected.pptx"});
	});
	it("should work with loop pptx", function () {
		const doc = createDoc("loop-example.pptx");
		const p = doc.setData({users: [{name: "Doe"}, {name: "John"}]}).render();
		expect(p.getFullText()).to.be.equal(" Doe  John ");
		shouldBeSame({doc, expectedName: "expected-loop-example.pptx"});
	});

	it("should work with simple raw pptx", function () {
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
		const doc = createDoc("raw-xml-example.pptx");
		const p = doc.setData({raw}).render();
		expect(p.getFullText()).to.be.equal("Hello World");
		shouldBeSame({doc, expectedName: "expected-raw-xml-example.pptx"});
	});
});

describe("Table", function () {
	it("should work with tables", function () {
		const tags = {clients: [{first_name: "John", last_name: "Doe", phone: "+33647874513"}, {first_name: "Jane", last_name: "Doe", phone: "+33454540124"}, {first_name: "Phil", last_name: "Kiel", phone: "+44578451245"}, {first_name: "Dave", last_name: "Sto", phone: "+44548787984"}]};
		const doc = createDoc("tag-intelligent-loop-table.docx");
		doc.setData(tags);
		doc.render();
		const expectedText = "JohnDoe+33647874513JaneDoe+33454540124PhilKiel+44578451245DaveSto+44548787984";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
		shouldBeSame({doc, expectedName: "tag-intelligent-loop-table-expected.docx"});
	});

	it("should work with simple table", function () {
		const doc = createDoc("table-complex2-example.docx");
		doc.setData({
			table1: [{
				t1data1: "t1-1row-data1",
				t1data2: "t1-1row-data2",
				t1data3: "t1-1row-data3",
				t1data4: "t1-1row-data4",
			}, {
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
			}],
			t1total1: "t1total1-data",
			t1total2: "t1total2-data",
			t1total3: "t1total3-data",
		});
		doc.render();
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data");
	});
	it("should work with more complex table", function () {
		const doc = createDoc("table-complex-example.docx");
		doc.setData({
			table2: [{
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
			}],
			t1total1: "t1total1-data",
			t1total2: "t1total2-data",
			t1total3: "t1total3-data",
			t2total1: "t2total1-data",
			t2total2: "t2total2-data",
			t2total3: "t2total3-data",
		});
		doc.render();
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4TOTALt1total1-datat1total2-datat1total3-dataTABLE2COLUMN1COLUMN2COLUMN3COLUMN4t2-1row-data1t2-1row-data2t2-1row-data3t2-1row-data4t2-2row-data1t2-2row-data2t2-2row-data3t2-2row-data4TOTALt2total1-datat2total2-datat2total3-data");
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
});

describe("Dash Loop Testing", function () {
	it("dash loop ok on simple table -> w:tr", function () {
		const tags = {os: [{type: "linux", price: "0", reference: "Ubuntu10"}, {type: "DOS", price: "500", reference: "Win7"}, {type: "apple", price: "1200", reference: "MACOSX"}]};
		const doc = createDoc("tag-dash-loop.docx");
		doc.setData(tags);
		doc.render();
		const expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});
	it("dash loop ok on simple table -> w:table", function () {
		const tags = {os: [{type: "linux", price: "0", reference: "Ubuntu10"}, {type: "DOS", price: "500", reference: "Win7"}, {type: "apple", price: "1200", reference: "MACOSX"}]};
		const doc = createDoc("tag-dash-loop-table.docx");
		doc.setData(tags);
		doc.render();
		const expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});
	it("dash loop ok on simple list -> w:p", function () {
		const tags = {os: [{type: "linux", price: "0", reference: "Ubuntu10"}, {type: "DOS", price: "500", reference: "Win7"}, {type: "apple", price: "1200", reference: "MACOSX"}]};
		const doc = createDoc("tag-dash-loop-list.docx");
		doc.setData(tags);
		doc.render();
		const expectedText = "linux 0 Ubuntu10 DOS 500 Win7 apple 1200 MACOSX ";
		const text = doc.getFullText();
		expect(text).to.be.equal(expectedText);
	});
});

describe("DocxtemplaterTemplating", function () {
	describe("text templating", function () {
		it("should change values with template data", function () {
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
			expect(doc.getFullText("word/header1.xml")).to.be.equal("Edgar Hipp0652455478New Website");
			expect(doc.getFullText("word/footer1.xml")).to.be.equal("EdgarHipp0652455478");
			shouldBeSame({doc, expectedName: "tag-example-expected.docx"});
		});
	});
});
