const { cloneDeep } = require("lodash");
const {
	resolveSoon,
	cleanRecursive,
	createDocV3,
	captureLogs,
	makeDocxV3,
	createXmlTemplaterDocxNoRender,
	expect,
	shouldBeSame,
	expectToThrow,
	wrapMultiError,
	expectToThrowAsync,
} = require("../utils.js");
const Errors = require("../../errors.js");
const rawXMLValue = require("../data/raw-xml-pptx.js");

describe("V3 API", () => {
	beforeEach(function () {
		this.deprecations = null;
		this.capture = captureLogs();
	});
	afterEach(function () {
		this.capture.stop();
		if (this.deprecations != null) {
			const logs = this.capture.logs();
			for (const deprecation of this.deprecations) {
				const found = logs.some((log) => {
					if (log.indexOf(deprecation) !== -1) {
						return true;
					}
				});
				if (!found) {
					throw new Error(
						`Expected to get deprecation '${deprecation}'`
					);
				}
			}
		}
	});
	it("should work with setOptions", function () {
		this.deprecations = [
			"Deprecated docxtemplater constructor with no arguments, view upgrade guide : https://docxtemplater.com/docs/api/#upgrade-guide",
			'Deprecated method ".setOptions", view upgrade guide : https://docxtemplater.com/docs/api/#upgrade-guide',
			'Deprecated method ".attachModule", view upgrade guide : https://docxtemplater.com/docs/api/#upgrade-guide',
			'Deprecated method ".loadZip", view upgrade guide : https://docxtemplater.com/docs/api/#upgrade-guide',
		];
		const doc = createDocV3("tag-multiline.docx");
		expect(() => doc.setOptions()).to.throw(
			"setOptions should be called with an object as first parameter"
		);
	});

	it("should work when the delimiters are passed", function () {
		this.deprecations = [
			'Deprecated method ".setData", view upgrade guide : https://docxtemplater.com/docs/api/#upgrade-guide',
		];
		const options = { delimiters: { start: "<", end: ">" } };
		const doc = createDocV3("delimiter-gt.docx", options);
		doc.setData({
			user: "John",
		});
		doc.render();
		const fullText = doc.getFullText();
		expect(fullText).to.be.equal("Hello John");
	});

	it("should work when setting from the Docxtemplater interface", () => {
		const doc = createDocV3("tag-example.docx", {
			parser(tag) {
				return {
					["get"](scope) {
						return scope[tag].toUpperCase();
					},
				};
			},
		});
		doc.render({
			first_name: "Hipp",
			last_name: "Edgar",
			phone: "0652455478",
			description: "New Website",
		});
		expect(doc.getFullText()).to.be.equal("EDGAR HIPP");
		expect(doc.getFullText("word/header1.xml")).to.be.equal(
			"EDGAR HIPP0652455478NEW WEBSITE"
		);
		expect(doc.getFullText("word/footer1.xml")).to.be.equal(
			"EDGARHIPP0652455478"
		);
	});

	it("should work with simple raw pptx async", function () {
		this.deprecations = [
			'Deprecated method ".compile", view upgrade guide : https://docxtemplater.com/docs/api/#upgrade-guide, stack',
			'Deprecated method ".resolveData", view upgrade guide : https://docxtemplater.com/docs/api/#upgrade-guide',
			'Deprecated method ".loadZip", view upgrade guide : https://docxtemplater.com/docs/api/#upgrade-guide',
		];
		let scope, meta, tag;
		let calls = 0;
		const doc = createDocV3("raw-xml-example.pptx", {
			parser: (t) => {
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
		return doc.resolveData({ raw: resolveSoon(rawXMLValue) }).then(() => {
			doc.render();
			expect(calls).to.equal(1);
			expect(meta).to.be.an("object");
			expect(meta.part).to.be.an("object");
			expect(meta.part.expanded).to.be.an("array");
			expect(doc.getFullText()).to.be.equal("Hello World");
			shouldBeSame({
				doc,
				expectedName: "expected-raw-xml-example.pptx",
			});
		});
	});

	it("should fail when tag unclosed", () => {
		const content = "<w:t>{user {name}</w:t>";
		const expectedError = {
			name: "TemplateError",
			message: "Unclosed tag",
			properties: {
				file: "word/document.xml",
				id: "unclosed_tag",
				context: "{user ",
				xtag: "user",
				offset: 0,
			},
		};

		expectToThrow(
			() => makeDocxV3(content, { errorLogging: false }).compile(),
			Errors.XTTemplateError,
			wrapMultiError(expectedError)
		);
	});

	it("should show error when running resolveData before compile", () => {
		const content = "<w:t>{#users}{user}{/}</w:t>";
		const expectedError = {
			name: "InternalError",
			message:
				"You must run `.compile()` before running `.resolveData()`",
			properties: {
				id: "resolve_before_compile",
			},
		};
		const doc = makeDocxV3(content);
		return expectToThrowAsync(
			() => doc.resolveData(),
			Errors.XTInternalError,
			expectedError
		);
	});

	it("should resolve with simple table", () => {
		const doc = createDocV3("table-complex2-example.docx");
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
			.then((resolved) => {
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

	describe("Using the resolveOffset property", () => {
		it("should work", () => {
			const content =
				"<w:t>{#loop_first}{#loop_second}{name_inner} {name_outer}{/loop_second}{/loop_first}</w:t>";
			const xmlt = createXmlTemplaterDocxNoRender(content, {}).compile();
			return xmlt
				.resolveData({
					loop_first: [1],
					loop_second: [{ name_inner: "John" }],
					name_outer: "Henry",
				})
				.then(() => {
					const sm = xmlt.scopeManagers["word/document.xml"];

					expect(sm.finishedResolving).to.equal(true);

					sm.scopePath.unshift("aaa");
					sm.scopePathItem.unshift(122);
					sm.scopePathLength.unshift(144);
					sm.scopeLindex.unshift(555);
					sm.resolveOffset = 1;

					const part = {
						value: "loop_first",
						lIndex: 3,
					};
					const part2 = {
						value: "loop_second",
						lIndex: 6,
					};
					let val;

					function loopOver(scope, i, length) {
						const ssm = sm.createSubScopeManager(
							scope,
							part.value,
							i,
							part,
							length
						);

						val = ssm.getValue("loop_second", { part: part2 });
					}

					sm.loopOver("loop_first", loopOver, false, {
						part: { value: "loop_first", lIndex: 3 },
					});
					expect(val[0][0].tag).to.equal("name_inner");
					expect(val[0][0].value).to.equal("John");
				});
		});
	});
});
