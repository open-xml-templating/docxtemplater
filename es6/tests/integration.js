const {
	expectToThrowAsync,
	createDoc,
	shouldBeSame,
	expect,
	resolveSoon,
} = require("./utils");

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

describe("Pptx generation", function() {
	it("should work with title", function(done) {
		createDoc("title-example.pptx").then(doc => {
			doc.getZip().files["docProps/app.xml"].async("string").then(con => {
				expect(con).not.to.contain("Edgar");
				doc.setData({ name: "Edgar" }).render().then(() => {
					con = doc.getZip().files["docProps/app.xml"].async("string").then(con => {
						expect(con).to.contain("Edgar");
						done();
					});
				});
			});
		});
	});
	it("should work with simple pptx", function(done) {
		createDoc("simple-example.pptx").then(doc => {
			doc.setData({ name: "Edgar" }).render().then(() => {
				doc.getFullText().then(text => {
					expect(text).to.be.equal("Hello Edgar");
					done();
				});
			});
		});
	});
	it("should work with table pptx", function(done) {
		createDoc("table-example.pptx").then(doc => {
			doc
			.setData({
				users: [{ msg: "hello", name: "mary" }, { msg: "hello", name: "john" }],
			})
			.render().then(() => {
				shouldBeSame({ doc, expectedName: "table-example-expected.pptx" }).then(() => {
					done();
				});
			});
		});
	});
	it("should work with loop pptx", function(done) {
		createDoc("loop-example.pptx").then(doc => {
			doc.setData({ users: [{ name: "Doe" }, { name: "John" }] }).render().then(() => {
				doc.getFullText().then(text => {
					expect(text).to.be.equal(" Doe  John ");
					shouldBeSame({ doc, expectedName: "expected-loop-example.pptx" }).then(() => {
						done();
					});
				});
			});
		});
	});

	it("should work with simple raw pptx", function(done) {
		createDoc("raw-xml-example.pptx").then(doc => {
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
			doc.setData({ raw }).render().then(() => {
				expect(calls).to.equal(1);
				expect(scope.raw).to.be.a("string");
				expect(meta).to.be.an("object");
				expect(meta.part).to.be.an("object");
				expect(meta.part.expanded).to.be.an("array");
				doc.getFullText().then(text => {
					expect(text).to.be.equal("Hello World");
					shouldBeSame({ doc, expectedName: "expected-raw-xml-example.pptx" }).then(() => {
						done();
					});
				});
			});
		});
	});

	it("should work with simple raw pptx async", function(done) {
		createDoc("raw-xml-example.pptx").then(doc => {
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
			doc.compile().then(() => {
				doc.resolveData({ raw }).then(() => {
					doc.render().then(() => {
						expect(calls).to.equal(1);
						expect(scope.raw).to.be.a("string");
						expect(meta).to.be.an("object");
						expect(meta.part).to.be.an("object");
						expect(meta.part.expanded).to.be.an("array");
						doc.getFullText().then(text => {
							expect(text).to.be.equal("Hello World");
							shouldBeSame({ doc, expectedName: "expected-raw-xml-example.pptx" }).then(() => {
								done();
							});
						});
					});
				});
			});
		});
	});
});

describe("Table", function() {
	it("should work with selfclosing tag inside table with paragraphLoop", function(done) {
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
		createDoc("loop-valid.docx").then(doc => {
			doc.setData(tags);
			doc.setOptions({ paragraphLoop: true });
			doc.render().then(() => {
				shouldBeSame({ doc, expectedName: "loop-valid-expected.docx" }).then(() => {
					done();
				});
			});
		});
	});

	it("should work with tables", function(done) {
		const tags = {
			clients: [
				{ first_name: "John", last_name: "Doe", phone: "+33647874513" },
				{ first_name: "Jane", last_name: "Doe", phone: "+33454540124" },
				{ first_name: "Phil", last_name: "Kiel", phone: "+44578451245" },
				{ first_name: "Dave", last_name: "Sto", phone: "+44548787984" },
			],
		};
		createDoc("tag-intelligent-loop-table.docx").then(doc => {
			doc.setData(tags);
			doc.render().then(() => {
				const expectedText =
					"JohnDoe+33647874513JaneDoe+33454540124PhilKiel+44578451245DaveSto+44548787984";
				doc.getFullText().then(text => {
					expect(text).to.be.equal(expectedText);
					shouldBeSame({
						doc,
						expectedName: "tag-intelligent-loop-table-expected.docx",
					}).then(() => {
						done();
					});
				});
			});
		});
	});

	it("should work with simple table", function(done) {
		createDoc("table-complex2-example.docx").then(doc => {
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
			doc.render().then(() => {
				doc.getFullText().then(fullText => {
					expect(fullText).to.be.equal(
						"TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data"
					);
					done();
				});
			});
		});
	});

	it("should work with more complex table", function(done) {
		createDoc("table-complex-example.docx").then(doc => {
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
			doc.render().then(() => {
				doc.getFullText().then(fullText => {
					expect(fullText).to.be.equal(
						"TABLE1COLUMN1COLUMN2COLUMN3COLUMN4TOTALt1total1-datat1total2-datat1total3-dataTABLE2COLUMN1COLUMN2COLUMN3COLUMN4t2-1row-data1t2-1row-data2t2-1row-data3t2-1row-data4t2-2row-data1t2-2row-data2t2-2row-data3t2-2row-data4TOTALt2total1-datat2total2-datat2total3-data"
					);
					done();
				});
			});
		});
	});

	it("should work when looping around tables", function(done) {
		createDoc("table-repeat.docx").then(doc => {
			doc.setData({
				table: [1, 2, 3, 4],
			});
			doc.render().then(() => {
				doc.getFullText().then(fullText => {
					expect(fullText).to.be.equal("1234123412341234");
					done();
				});
			});
		});
	});

	it("should not corrupt table with empty rawxml", function(done) {
		createDoc("table-raw-xml.docx").then(doc => {
			doc.setData({});
			doc.render().then(() => {
				shouldBeSame({ doc, expectedName: "expected-raw-xml.docx" }).then(() => {
					done();
				});
			});
		});
	});
});

describe("Dash Loop Testing", function() {
	it("dash loop ok on simple table -> w:tr", function(done) {
		const tags = {
			os: [
				{ type: "linux", price: "0", reference: "Ubuntu10" },
				{ type: "DOS", price: "500", reference: "Win7" },
				{ type: "apple", price: "1200", reference: "MACOSX" },
			],
		};
		createDoc("tag-dash-loop.docx").then(doc => {
			doc.setData(tags);
			doc.render().then(() => {
				const expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
				doc.getFullText().then(text => {
					expect(text).to.be.equal(expectedText);
					done();
				});
			});
		});
	});
	it("dash loop ok on simple table -> w:table", function(done) {
		const tags = {
			os: [
				{ type: "linux", price: "0", reference: "Ubuntu10" },
				{ type: "DOS", price: "500", reference: "Win7" },
				{ type: "apple", price: "1200", reference: "MACOSX" },
			],
		};
		createDoc("tag-dash-loop-table.docx").then(doc => {
			doc.setData(tags);
			doc.render().then(() => {
				const expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
				doc.getFullText().then(text => {
					expect(text).to.be.equal(expectedText);
					done();
				});
			});
		});
	});
	it("dash loop ok on simple list -> w:p", function(done) {
		const tags = {
			os: [
				{ type: "linux", price: "0", reference: "Ubuntu10" },
				{ type: "DOS", price: "500", reference: "Win7" },
				{ type: "apple", price: "1200", reference: "MACOSX" },
			],
		};
		createDoc("tag-dash-loop-list.docx").then(doc => {
			doc.setData(tags);
			doc.render().then(() => {
				const expectedText = "linux 0 Ubuntu10 DOS 500 Win7 apple 1200 MACOSX ";
				doc.getFullText().then(text => {
					expect(text).to.be.equal(expectedText);
					done();
				});
			});
		});
	});
});

describe("Templating", function() {
	describe("text templating", function() {
		it("should change values with template data", function(done) {
			const tags = {
				first_name: "Hipp",
				last_name: "Edgar",
				phone: "0652455478",
				description: "New Website",
			};
			createDoc("tag-example.docx").then(doc => {
				doc.setData(tags);
				doc.render().then(() => {
					const firstTest = doc.getFullText().then(text => {
						expect(text).to.be.equal("Edgar Hipp");
					});
					const secondTest = doc.getFullText("word/header1.xml").then(text => {
						expect(text).to.be.equal(
							"Edgar Hipp0652455478New Website"
						);
					});
					const thirdTest = doc.getFullText("word/footer1.xml").then(text => {
						expect(text).to.be.equal(
							"EdgarHipp0652455478"
						);
					});
					const fourthTest = shouldBeSame({ doc, expectedName: "tag-example-expected.docx" });
					Promise.all([firstTest, secondTest, thirdTest, fourthTest]).then(() => {
						done();
					});
				});
			});
		});
	});

	it("should work with paragraphloop", function(done) {
		createDoc("users.docx").then(doc => {
			doc.setOptions({
				paragraphLoop: true,
			});
			doc.setData({ users: ["John", "Jane", "Louis"] }).render().then(() => {
				shouldBeSame({ doc, expectedName: "users-expected.docx" }).then(() => {
					done();
				});
			});
		});
	});

	it("should work with paragraphloop without removing extra text", function(done) {
		createDoc("paragraph-loops.docx").then(doc => {
			doc.setOptions({
				paragraphLoop: true,
			});
			doc
				.setData({
					condition: [1, 2],
					placeholder: "placeholder-value",
				})
				.render().then(() => {
					shouldBeSame({ doc, expectedName: "expected-paragraph-loop.docx" }).then(() => {
						done();
					});
				});
		});
	});

	it("should work with paragraphloop pptx", function(done) {
		createDoc("paragraph-loop.pptx").then(doc => {
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
				.render().then(() => {
					shouldBeSame({ doc, expectedName: "expected-paragraph-loop.pptx" }).then(() => {
						done();
					});
				});
		});
	});

	it("should fail properly when having lexed + postparsed errors", function(done) {
		createDoc("multi-errors.docx").then(doc => {
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
			expectToThrowAsync(create, Errors.XTTemplateError, expectedError).then(() => {
				done();
			});
		});
	});

	it("should work with spacing at the end", function(done) {
		createDoc("spacing-end.docx").then(doc => {
			doc.setOptions({
				paragraphLoop: true,
			});
			doc.setData({ name: "John" }).render().then(() => {
				shouldBeSame({ doc, expectedName: "expected-spacing-end.docx" }).then(() => {
					done();
				});
			});
		});
	});
});

describe("Load Office 365 file", function() {
	it("should handle files with word/document2.xml", function(done) {
		createDoc("office365.docx").then(doc => {
			doc.setOptions({
				paragraphLoop: true,
			});
			doc
				.setData({
					test: "Value",
					test2: "Value2",
				})
				.render().then(() => {
					const firstTest = doc.getFullText().then(text => {
						expect(text).to.be.equal("Value Value2");
					});
					const secondTest = shouldBeSame({ doc, expectedName: "expected-office365.docx" });
					Promise.all([firstTest, secondTest]).then(() => {
						done();
					});
				});
		});
	});
});

describe("Resolver", function() {
	it("should work", function(done) {
		createDoc("office365.docx").then(doc => {
			doc.setOptions({
				paragraphLoop: true,
			});
			doc.compile().then(() => {
				doc
					.resolveData({
						test: resolveSoon("Value"),
						test2: "Value2",
					})
					.then(() => {
						doc.render().then(() => {
							const firstTest = doc.getFullText().then(text => {
								expect(text).to.be.equal("Value Value2");
							});
							const secondTest = shouldBeSame({ doc, expectedName: "expected-office365.docx" });
							Promise.all([firstTest, secondTest]).then(() => {
								done();
							});
						});
					});
			});
		});
	});

	it("should resolve loops", function(done) {
		createDoc("multi-loop.docx").then(doc => {
			doc.setOptions({
				paragraphLoop: true,
			});
			doc.compile().then(() => {
				doc
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
					.then(() => {
						doc.render().then(() => {
							shouldBeSame({ doc, expectedName: "multi-loop-expected.docx" }).then(() => {
								done();
							});
						});
					});
			});
		});
	});

	it("should resolve with simple table", function(done) {
		createDoc("table-complex2-example.docx").then(doc => {
			doc.compile().then(() => {
				doc
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
					.then((resolved) => {
						expect(resolved).to.be.deep.equal([
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
						doc.render().then(() => {
							doc.getFullText().then(fullText => {
								expect(fullText).to.be.equal(
									"TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data"
								);
								done();
							});
						});
					});
			});
		});
	});
});
