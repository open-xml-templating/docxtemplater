"use strict";

var XmlTemplater = require("../xmlTemplater.js");
var expect = require("chai").expect;
var FileTypeConfig = require("../fileTypeConfig.js");

describe.skip("compilation", function () {
	it("should work with dot", function () {
		var content = "<w:t>Hello {.}</w:t>";
		var scope = "Edgar";
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.render();
		var expected = ['<w:t xml:space="preserve">', "Hello ", {type: "tag", tag: "."}, "</w:t>"];
		expect(xmlTemplater.compiled.compiled).to.be.deep.equal(expected);
	});
	it("should work with text with special characters", function () {
		var content = "<w:t>Hello {&gt;name}</w:t>";
		var scope = {">name": "Edgar"};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.render();
		var expected = ['<w:t xml:space="preserve">', "Hello ", {type: "tag", tag: ">name"}, "</w:t>"];
		expect(xmlTemplater.compiled.compiled).to.be.deep.equal(expected);
	});
	it("should work with simple text", function () {
		var content = "<w:t>Hello {name}</w:t>";
		var scope = {name: "Edgar"};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.render();
		var expected = ['<w:t xml:space="preserve">', "Hello ", {type: "tag", tag: "name"}, "</w:t>"];
		expect(xmlTemplater.compiled.compiled).to.be.deep.equal(expected);
	});
	it("should work with two tags", function () {
		var content = `<w:t>Hello {name}</w:t>
		<w:t>Hello {name2}</w:t>`;
		var scope = {name: "Edgar", name2: "John"};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
			'<w:t xml:space="preserve">',
			"Hello ",
			{type: "tag", tag: "name"},
			"</w:t>",
			"\n		",
			'<w:t xml:space="preserve">',
			"Hello ",
			{type: "tag", tag: "name2"},
			"</w:t>",
		]);
	});
	it("should compile without start Tag", function () {
		var content = "Hello </w:t>TAGS...TAGS<w:t> {name}";
		var scope = {name: "Edgar"};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
			"Hello </w:t>TAGS...TAGS",
			'<w:t xml:space="preserve">',
			" ",
			{type: "tag", tag: "name"},
		]);
	});

	it("should compile without end Tag and without start tag", function () {
		var content = "Hello </w:t>TAGS...TAGS<w:t> {name} </w:t>TAGS2...TAGS2<w:t> {name} </w:t>TAGS3...TAGS3<w:t> Bye";
		var scope = {name: "Edgar"};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
			"Hello </w:t>TAGS...TAGS",
			'<w:t xml:space="preserve">',
			" ",
			{type: "tag", tag: "name"},
			" ",
			"</w:t>",
			"TAGS2...TAGS2",
			'<w:t xml:space="preserve">',
			" ",
			{type: "tag", tag: "name"},
			" ",
			"</w:t>",
			"TAGS3...TAGS3<w:t> Bye",
		]);
	});

	it("should with splitted tags", function () {
		var content = "{</w:t>TAGS...TAGS<w:t>name</w:t>TAGS2...TAGS2<w:t>} {name} </w:t>TAGS3...TAGS3<w:t> Bye";
		var scope = {};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
			{type: "tag", tag: "name"},
			"</w:t>TAGS...TAGS",
			"<w:t>",
			"</w:t>",
			"TAGS2...TAGS2",
			'<w:t xml:space="preserve">',
			" ",
			{type: "tag", tag: "name"},
			" ",
			"</w:t>",
			"TAGS3...TAGS3<w:t> Bye",
		]);
	});

	it("should work with loops", function () {
		var content = "<w:t> {#users} {name} {/users}</w:t>";
		var scope = {users: [{name: "Edgar"}]};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
			"<w:t> ",
			{type: "loop", inverted: false, tag: "users", template: [
				" ",
				{type: "tag", tag: "name"},
				" ",
			]},
			"</w:t>",
		]);
	});

	it("should work with inverted loops", function () {
		var content = "<w:t> {^users} {name} {/users}</w:t>";
		var scope = {users: [{name: "Edgar"}]};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
			"<w:t> ",
			{type: "loop", inverted: true, tag: "users", template: [
				" ",
				{type: "tag", tag: "name"},
				" ",
			]},
			"</w:t>",
		]);
	});

	it("should work with raw tag", function () {
		var content = "<w:t>Hi Hi </w:t><w:p><w:t>{@raw}</w:t></w:p><w:t>Ho</w:t>";
		var scope = {raw: ""};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
			"<w:t>Hi Hi </w:t>",
			{type: "raw", tag: "raw"},
			"<w:t>Ho</w:t>",
		]);
	});

	it("should not error with raw tag", function () {
		var content = "<w:t>Hi Hi </w:t><w:p><w:t>{@raw}</w:t></w:p><w:t>Ho</w:t>";
		var scope = {};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
			"<w:t>Hi Hi </w:t>",
			{type: "raw", tag: "raw"},
			"<w:t>Ho</w:t>",
		]);
		expect(xmlTemplater.content).to.be.deep.equal(
			"<w:t>Hi Hi </w:t><w:t>Ho</w:t>"
		);
	});

	it("should work with complicated loop", function () {
		var content = "<w:t> {#users} {name} </w:t>TAG..TAG<w:t>{/users}</w:t>TAG2<w:t>{name}";
		var scope = {users: [{user: "Edgar"}]};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
			"<w:t> ",
			{type: "loop", inverted: false, tag: "users", template: [
				" ",
				{type: "tag", tag: "name"},
				" ",
				"</w:t>TAG..TAG<w:t>",
			]},
			"</w:t>TAG2",
			'<w:t xml:space="preserve">',
			{type: "tag", tag: "name"}]);
	});

	it("should work with intelligent tagging", function () {
		var baseContent = `<w:t>Hello {name}</w:t>
TAG
<w:tr>
<w:tc><w:t>{#table1}Hi</w:t></w:tc>
<w:tc><w:t>{/table1}</w:t></w:tc>
</w:tr>
TAG2
<w:tr>
<w:tc><w:t>{#table2}Ho</w:t></w:tc>
<w:tc><w:p><w:t>{/table2}</w:t></w:p>
</w:tc>
</w:tr>
<w:t>{key}</w:t>`;
		var content = baseContent.replace(/\n/g, "");
		var scope = {
			table1: [1],
			key: "value",
		};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope, intelligentTagging: true});
		xmlTemplater.render();

		expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
			'<w:t xml:space="preserve">',
			"Hello ",
			{type: "tag", tag: "name"},
			"</w:t>",
			"TAG",
			{type: "loop", inverted: false, tag: "table1", template: [
				"<w:tr><w:tc><w:t xml:space=\"preserve\">Hi</w:t></w:tc><w:tc><w:t xml:space=\"preserve\"></w:t></w:tc></w:tr>",
			]},
			"TAG2",
			{type: "loop", inverted: false, tag: "table2", template: [
				"<w:tr><w:tc><w:t xml:space=\"preserve\">Ho</w:t></w:tc><w:tc><w:p><w:t xml:space=\"preserve\"></w:t></w:p></w:tc></w:tr>",
			]},
			'<w:t xml:space="preserve">',
			{type: "tag", tag: "key"},
			"</w:t>",
		]);
	});

	it.skip("should work with strangely formatted tags", function () {
		var content = "<w:t>{name} {</w:t> <w:t>age</w:t> <w:t>}</w:t>";
		var scope = {name: 12, age: 14};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.render();
		var expected = [
			'<w:t xml:space="preserve">',
			{
				type: "tag",
				tag: "name",
			},
			" ",
			{
				type: "tag",
				tag: "age",
			},
			"</w:t><w:t>age</w:t><w:t></w:t>",
		];
		expect(xmlTemplater.compiled.compiled).to.be.deep.equal(expected);
	});

	it.skip("should work with dash", function () {
		var content = `
		<w:body>
		<w:p w:rsidR="007A1494" w:rsidRPr="00994758" w:rsidRDefault="007A1494" w:rsidP="007A1494">
		<w:r>
		<w:t>{-</w:t>
			</w:r>
			<w:r>
			<w:rPr>
			</w:rPr>
			<w:t>w:</w:t>
			</w:r>
			<w:r w:rsidR="00C406D1">
			<w:rPr>
			</w:rPr>
			<w:t>p</w:t>
			</w:r>
			<w:r>
			<w:rPr>
			</w:rPr>
			<w:t xml:space="preserve"> os}</w:t>
			</w:r>
			<w:r w:rsidR="00B311FB">
			<w:rPr>
			</w:rPr>
			<w:t>{type} {</w:t>
				</w:r>
				<w:r w:rsidR="00B311FB">
				<w:rPr>
				</w:rPr>
				<w:t>price</w:t>
				</w:r>
				<w:r w:rsidR="00B311FB">
				<w:rPr>
				</w:rPr>
				<w:t>} {</w:t>
				</w:r>
				<w:r w:rsidR="00B311FB">
				<w:rPr>
				</w:rPr>
				<w:t>reference</w:t>
				</w:r>
				<w:r w:rsidR="00B311FB">
				<w:rPr>
				</w:rPr>
				<w:t>} {/os</w:t>
				</w:r>
				<w:r>
				<w:rPr>
				</w:rPr>
				<w:t>}</w:t>
				</w:r>
				</w:p>
				</w:body>
				`;
		// var content = " <w:p> <w:t>Bar {-w:p loop} {inner} </w:t> <w:t>{/loop}</w:t></w:p>";
		// var scope = {loop: "foo"};
		var scope = {os: [{type: "linux", price: "0", reference: "Ubuntu10"}, {type: "DOS", price: "500", reference: "Win7"}, {type: "apple", price: "1200", reference: "MACOSX"}]};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.render();
		var expected = [
			" ",
			{
				type: "loop",
				inverted: false,
				tag: "loop",
				template: [
					"<w:p> ",
					'<w:t xml:space="preserve">',
					" ",
					{type: "tag", tag: "inner"},
					" ",
					"</w:t>",
					' <w:t xml:space="preserve"></w:t></w:p>',
				],
			},
		];
		expect(xmlTemplater.compiled.compiled).to.be.deep.equal(expected);
	});
});

describe.skip("Render from compiled", function () {
	it("should work with complicated loop", function () {
		var content = "<w:t> {#users} {name} </w:t>TAG..TAG<w:t>{/users}</w:t>TAG2<w:t>{name}";
		var scope = {};
		var xmlTemplater = new XmlTemplater(content, {fileTypeConfig: FileTypeConfig.docx, tags: scope});
		xmlTemplater.compile();
		var result = xmlTemplater.renderFromCompiled({users: [{name: "Jack"}], name: "dummy"});
		expect(result).to.be.equal("<w:t>  Jack </w:t>TAG..TAG<w:t></w:t>TAG2<w:t xml:space=\"preserve\">dummy");
		result = xmlTemplater.renderFromCompiled({users: [{}, {name: "John"}], name: "default"});
		expect(result).to.be.equal("<w:t>  default </w:t>TAG..TAG<w:t> John </w:t>TAG..TAG<w:t></w:t>TAG2<w:t xml:space=\"preserve\">default");
	});
});

