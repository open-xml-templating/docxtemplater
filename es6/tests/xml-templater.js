const testUtils = require("./utils");
const expect = testUtils.expect;

describe("xmlTemplater", function () {
	it("should work with simpleContent", function () {
		const content = "<w:t>Hello {name}</w:t>";
		const scope = {name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with doublecontent in w:t", function () {
		const content = "<w:t>Hello {name}, you're {age} years old</w:t>";
		const scope = {name: "Edgar", age: "foo"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar, you're foo years old");
	});

	it("should work with {.} for this", function () {
		const content = "<w:t>Hello {.}</w:t>";
		const scope = "Edgar";
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with {.} for this inside loop", function () {
		const content = "<w:t>Hello {#names}{.},{/names}</w:t>";
		const scope = {names: ["Edgar", "John"]};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,John,");
	});

	it("should work with non w:t content", function () {
		const content = "<w:t>{#loop}Hello {name}{/loop}</w:t>";
		const scope = {loop: {name: "edgar"}};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.content).to.be.equal('<w:t xml:space="preserve">Hello edgar</w:t>');
	});
	it("should work with tag in two elements", function () {
		const content = "<w:t>Hello {</w:t><w:t>name}</w:t>";
		const scope = {name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with splitted tag in three elements", function () {
		const content = "<w:t>Hello {</w:t><w:t>name</w:t><w:t>}</w:t>";
		const scope = {name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with simple loop with object value", function () {
		const content = "<w:t>Hello {#person}{name}{/person}</w:t>";
		const scope = {person: {name: "Edgar"}};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with simple Loop", function () {
		const content = "<w:t>Hello {#names}{name},{/names}</w:t>";
		const scope = {names: [{name: "Edgar"}, {name: "Mary"}, {name: "John"}]};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,Mary,John,");
	});
	it("should work with simple Loop with boolean value truthy", function () {
		const content = "<w:t>Hello {#showName}{name},{/showName}</w:t>";
		const scope = {showName: true, name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,");
	});
	it("should work with simple Loop with boolean value falsy", function () {
		const content = "<w:t>Hello {#showName}{name},{/showName}</w:t>";
		const scope = {showName: false, name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello ");
	});
	it("should work with dash Loop", function () {
		const content = "<w:p><w:t>Hello {-w:p names}{name},{/names}</w:t></w:p>";
		const scope = {names: [{name: "Edgar"}, {name: "Mary"}, {name: "John"}]};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,Hello Mary,Hello John,");
	});
	it("should work with loop and innerContent", function () {
		const content = "<w:t>{#loop}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:pStyle w:val=\"Titre1\"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRPr=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00923B77\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>oof</w:t></w:r><w:r><w:t xml:space=\"preserve\">} </w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>It works because</w:t></w:r><w:r><w:t xml:space=\"preserve\"> {</w:t></w:r><w:r w:rsidR=\"006F26AC\"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00FD04E9\" w:rsidRDefault=\"00923B77\"><w:r><w:t>{/loop}</w:t>";
		const scope = {loop: {title: "Everyone uses it", proof: [{reason: "it is quite cheap"}, {reason: "it is quit simple"}, {reason: "it works on a lot of different Hardware"}]}};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware");
	});
	it("should work with loop and innerContent (with last)", function () {
		const content = "<w:t>{#loop}Start </w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:pStyle w:val=\"Titre1\"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRPr=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00923B77\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>oof</w:t></w:r><w:r><w:t xml:space=\"preserve\">} </w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>It works because</w:t></w:r><w:r><w:t xml:space=\"preserve\"> {</w:t></w:r><w:r w:rsidR=\"006F26AC\"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00FD04E9\" w:rsidRDefault=\"00923B77\"><w:r><w:t> End{/loop}</w:t>";
		const scope = {loop: {title: "Everyone uses it", proof: [{reason: "it is quite cheap"}, {reason: "it is quit simple"}, {reason: "it works on a lot of different Hardware"}]}};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Start Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware End");
	});
	it("should work with not w:t tag (if the for loop is like {#forloop} text {/forloop}) ", function () {
		const content = "<w:t>{#loop}Hello {#names}{name},{/names}{/loop}</w:t>";
		const scope = {loop: {names: [{name: "Edgar"}, {name: "Mary"}, {name: "John"}]}};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.content).to.be.equal('<w:t xml:space="preserve">Hello Edgar,Mary,John,</w:t>');
	});
	it("should work with delimiter in value", function () {
		const content = "<w:t>Hello {name}</w:t>";
		const scope = {name: "{edgar}"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello {edgar}");
	});
	it("should work with delimiter in value with loop)", function () {
		const content = "<w:t>Hello {#names}{name},{/names}</w:t>";
		const scope = {names: [{name: "{John}"}, {name: "M}}{ary"}, {name: "Di{{{gory"}]};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello {John},M}}{ary,Di{{{gory,");
	});
	it("should work when replacing with exact same value", function () {
		const content = "<w:p><w:t xml:space=\"preserve\">Hello {name}</w:t></w:p>";
		const scope = {name: "{name}"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		xmlTemplater.render();
		xmlTemplater.getFullText();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello {name}");
	});

	it("should work with equations", function () {
		const content = `<w:p>
		<m:oMathPara>
		<m:oMath>
		<m:sSup>
		<m:e>
		<m:r>
		<m:t>y</m:t>
		</m:r>
		</m:e>
		<m:sup>
		<m:r>
		<m:t>{bar}</m:t>
		</m:r>
		</m:sup>
		</m:sSup>
		<m:r>
		<m:t>*</m:t>
		</m:r>
		<m:r>
		<m:t>cos⁡</m:t>
		</m:r>
		<m:r>
		<m:t>(</m:t>
		</m:r>
		<m:r>
		<m:t xml:space="preserve"> {foo}</m:t>
		</m:r>
		<m:r>
		<m:t>+{baz})</m:t>
		</m:r>
		</m:oMath>
		</m:oMathPara>
		</w:p>
		<w:p>
		<w:t>Hello {</w:t>
		<w:t>name</w:t>
		<w:t>}</w:t>
		</w:p>
		`;
		const scope = {name: "John", foo: "MyFoo", bar: "MyBar", baz: "MyBaz"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		expect(xmlTemplater.getFullText()).to.be.equal("y{bar}*cos⁡( {foo}+{baz})Hello {name}");
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("yMyBar*cos⁡( MyFoo+MyBaz)Hello John");
	});
});

describe("Change the nullGetter", function () {
	it("should work with null", function () {
		const content = "<w:t>Hello {name}</w:t>";
		const scope = {};
		function nullGetter() { return "null"; }
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope, nullGetter});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello null");
	});
});

describe("intelligent tagging multiple tables", function () {
	it("should work with multiple rows", function () {
		const content = `<w:tbl>
		<w:tr>
		<w:tc>
		<w:p>
		<w:r>
		<w:t>{#clauses} Clause {.}</w:t>
		</w:r>
		</w:p>
		</w:tc>
		</w:tr>
		<w:tr>
		<w:tc>
		<w:p>
		<w:r>
		<w:t>{/clauses}</w:t>
		</w:r>
		</w:p>
		</w:tc>
		</w:tr>
		</w:tbl>
		`.replace(/\t|\n/g, "");
		const scope = {clauses: ["Foo", "Bar", "Baz"]};
		const doc = testUtils.createXmlTemplaterDocx(content, {tags: scope});
		doc.render();
		expect(doc.content).to.be.equal('<w:tbl><w:tr><w:tc><w:p><w:r><w:t xml:space="preserve"> Clause Foo</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t xml:space="preserve"> Clause Bar</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t xml:space="preserve"> Clause Baz</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc></w:tr></w:tbl>');
	});
});

describe("Custom delimiters", function () {
	it("should work with custom tags", function () {
		const delimiters = {
			start: "[",
			end: "]",
		};
		const content = "<w:t>Hello [name]</w:t>";
		const scope = {name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope, delimiters});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with custom delimiters with two chars", function () {
		const delimiters = {
			start: "[[",
			end: "]]",
		};
		const content = "<w:t>Hello [[name]]</w:t>";
		const scope = {name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope, delimiters});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.eql("Hello Edgar");
	});

	it("should work with custom delimiters as strings with different length", function () {
		const delimiters = {
			start: "[[[",
			end: "]]",
		};
		const content = "<w:t>Hello [[[name]]</w:t>";
		const scope = {name: "Edgar"};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope, delimiters});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.eql("Hello Edgar");
	});

	it("should work with custom tags and loops", function () {
		const delimiters = {
			start: "[[[",
			end: "]]",
		};
		const content = "<w:t>Hello [[[#names]][[[.]],[[[/names]]</w:t>";
		const scope = {names: ["Edgar", "Mary", "John"]};
		const xmlTemplater = testUtils.createXmlTemplaterDocx(content, {tags: scope, delimiters});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,Mary,John,");
	});

	it("should work with loops", function () {
		const content = "<w:t>{#loop}{innertag</w:t><w:t>} {/loop}</w:t>";
		const xmlt = testUtils.createXmlTemplaterDocx(content, {tags: {loop: [{innertag: 10}, {innertag: 5}]}}).render();
		expect(xmlt.content).to.be.equal('<w:t xml:space="preserve">10</w:t><w:t> 5</w:t><w:t> </w:t>');
	});

	it("should work with complex loops (1)", function () {
		const content = "<w:t>{#looptag}{innertag</w:t><w:t>}{/looptag}</w:t>";
		const xmlt = testUtils.createXmlTemplaterDocx(content, {tags: {looptag: true, innertag: "foo"}}).render();
		expect(xmlt.content).not.to.contain("</w:t></w:t>");
		expect(xmlt.content).to.be.equal('<w:t xml:space="preserve">foo</w:t><w:t></w:t>');
	});

	it("should work with complex loops (2)", function () {
		const content = "<w:t>{#person}</w:t><w:t>{name}{/person}</w:t>";
		const xmlt = testUtils.createXmlTemplaterDocx(content, {tags: {person: [{name: "Henry"}]}}).render();
		expect(xmlt.content).to.contain("Henry</w:t>");
		expect(xmlt.content).not.to.contain("</w:t>Henry</w:t>");
	});
});

describe("getting parents context", function () {
	it("should work with simple loops", function () {
		const content = "<w:t>{#loop}{name}{/loop}</w:t>";
		const xmlt = testUtils.createXmlTemplaterDocx(content, {tags: {loop: [1], name: "Henry"}}).render();
		expect(xmlt.content).to.be.equal('<w:t xml:space="preserve">Henry</w:t>');
	});

	it("should work with double loops", function () {
		const content = "<w:t>{#loop_first}{#loop_second}{name_inner} {name_outer}{/loop_second}{/loop_first}</w:t>";
		const xmlt = testUtils.createXmlTemplaterDocx(content, {tags: {loop_first: [1], loop_second: [{name_inner: "John"}], name_outer: "Henry"}}).render();
		expect(xmlt.content).to.be.equal('<w:t xml:space="preserve">John Henry</w:t>');
	});
});
