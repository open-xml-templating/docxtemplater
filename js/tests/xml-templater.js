"use strict";

var _require = require("./utils"),
    createXmlTemplaterDocx = _require.createXmlTemplaterDocx,
    expect = _require.expect,
    getContent = _require.getContent;

describe("XmlTemplater", function () {
	it("should work with simpleContent", function () {
		var content = "<w:t>Hello {name}</w:t>";
		var scope = { name: "Edgar" };
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with doublecontent in w:t", function () {
		var content = "<w:t>Hello {name}, you're {age} years old</w:t>";
		var scope = { name: "Edgar", age: "foo" };
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar, you're foo years old");
	});

	it("should work with {.} for this", function () {
		var content = "<w:t>Hello {.}</w:t>";
		var scope = "Edgar";
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with {.} for this inside loop", function () {
		var content = "<w:t>Hello {#names}{.},{/names}</w:t>";
		var scope = { names: ["Edgar", "John"] };
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,John,");
	});

	it("should work with non w:t content", function () {
		var content = "<w:t>{#loop}Hello {name}{/loop}</w:t>";
		var scope = { loop: { name: "edgar" } };
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		var c = getContent(xmlTemplater);
		expect(c).to.be.equal('<w:t xml:space="preserve">Hello edgar</w:t>');
	});

	it("should handle <w:p/> in loop without error", function () {
		var content = "<w:p><w:r><w:t>{#ab}</w:t></w:r></w:p>\n    <w:p w14:paraId=\"79563C14\" w14:textId=\"77777777\" w:rsidR=\"00F22CAA\" w:rsidRDefault=\"00F22CAA\" w:rsidP=\"00324963\"/>\n    <w:p><w:r><w:t>{.}{/ab}</w:t></w:r></w:p>";
		var scope = { ab: [1, 2, 3] };
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("123");
	});

	it("should work with tag in two elements", function () {
		var content = "<w:t>Hello {</w:t><w:t>name}</w:t>";
		var scope = { name: "Edgar" };
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with splitted tag in three elements", function () {
		var content = "<w:t>Hello {</w:t><w:t>name</w:t><w:t>}</w:t>";
		var scope = { name: "Edgar" };
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with simple loop with object value", function () {
		var content = "<w:t>Hello {#person}{name}{/person}</w:t>";
		var scope = { person: { name: "Edgar" } };
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with simple Loop", function () {
		var content = "<w:t>Hello {#names}{name},{/names}</w:t>";
		var scope = {
			names: [{ name: "Edgar" }, { name: "Mary" }, { name: "John" }]
		};
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,Mary,John,");
	});
	it("should work with simple Loop with boolean value truthy", function () {
		var content = "<w:t>Hello {#showName}{name},{/showName}</w:t>";
		var scope = { showName: true, name: "Edgar" };
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,");
	});
	it("should work with simple Loop with boolean value falsy", function () {
		var content = "<w:t>Hello {#showName}{name},{/showName}</w:t>";
		var scope = { showName: false, name: "Edgar" };
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello ");
	});
	it("should work with dash Loop", function () {
		var content = "<w:p><w:t>Hello {-w:p names}{name},{/names}</w:t></w:p>";
		var scope = {
			names: [{ name: "Edgar" }, { name: "Mary" }, { name: "John" }]
		};
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,Hello Mary,Hello John,");
	});
	it("should work with loop and innerContent", function () {
		var content = '<w:p><w:t>{#loop}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:pStyle w:val="Titre1"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRPr="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00923B77" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR="00713414"><w:t>oof</w:t></w:r><w:r><w:t xml:space="preserve">} </w:t></w:r><w:r w:rsidR="00713414"><w:t>It works because</w:t></w:r><w:r><w:t xml:space="preserve"> {</w:t></w:r><w:r w:rsidR="006F26AC"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00FD04E9" w:rsidRDefault="00923B77"><w:r><w:t>{/loop}</w:t></w:p>';
		var scope = {
			loop: {
				title: "Everyone uses it",
				proof: [{ reason: "it is quite cheap" }, { reason: "it is quit simple" }, { reason: "it works on a lot of different Hardware" }]
			}
		};
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware");
	});
	it("should work with loop and innerContent (with last)", function () {
		var content = '<w:p><w:t>{#loop}Start </w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:pStyle w:val="Titre1"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRPr="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00923B77" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR="00713414"><w:t>oof</w:t></w:r><w:r><w:t xml:space="preserve">} </w:t></w:r><w:r w:rsidR="00713414"><w:t>It works because</w:t></w:r><w:r><w:t xml:space="preserve"> {</w:t></w:r><w:r w:rsidR="006F26AC"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00FD04E9" w:rsidRDefault="00923B77"><w:r><w:t> End{/loop}</w:t></w:p>';
		var scope = {
			loop: {
				title: "Everyone uses it",
				proof: [{ reason: "it is quite cheap" }, { reason: "it is quit simple" }, { reason: "it works on a lot of different Hardware" }]
			}
		};
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Start Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware End");
	});
	it("should work with not w:t tag (if the for loop is like {#forloop} text {/forloop}) ", function () {
		var content = "<w:t>{#loop}Hello {#names}{name},{/names}{/loop}</w:t>";
		var scope = {
			loop: { names: [{ name: "Edgar" }, { name: "Mary" }, { name: "John" }] }
		};
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(getContent(xmlTemplater)).to.be.equal('<w:t xml:space="preserve">Hello Edgar,Mary,John,</w:t>');
	});
	it("should work with delimiter in value", function () {
		var content = "<w:t>Hello {name}</w:t>";
		var scope = { name: "{edgar}" };
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello {edgar}");
	});
	it("should work with delimiter in value with loop)", function () {
		var content = "<w:t>Hello {#names}{name},{/names}</w:t>";
		var scope = {
			names: [{ name: "{John}" }, { name: "M}}{ary" }, { name: "Di{{{gory" }]
		};
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello {John},M}}{ary,Di{{{gory,");
	});
	it("should work when replacing with exact same value", function () {
		var content = '<w:p><w:t xml:space="preserve">Hello {name}</w:t></w:p>';
		var scope = { name: "{name}" };
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		xmlTemplater.getFullText();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello {name}");
	});

	it("should work with equations", function () {
		var content = "<w:p>\n\t\t<m:oMathPara>\n\t\t<m:oMath>\n\t\t<m:sSup>\n\t\t<m:e>\n\t\t<m:r>\n\t\t<m:t>y</m:t>\n\t\t</m:r>\n\t\t</m:e>\n\t\t<m:sup>\n\t\t<m:r>\n\t\t<m:t>{bar}</m:t>\n\t\t</m:r>\n\t\t</m:sup>\n\t\t</m:sSup>\n\t\t<m:r>\n\t\t<m:t>*</m:t>\n\t\t</m:r>\n\t\t<m:r>\n\t\t<m:t>cos\u2061</m:t>\n\t\t</m:r>\n\t\t<m:r>\n\t\t<m:t>(</m:t>\n\t\t</m:r>\n\t\t<m:r>\n\t\t<m:t xml:space=\"preserve\"> {foo}</m:t>\n\t\t</m:r>\n\t\t<m:r>\n\t\t<m:t>+{baz})</m:t>\n\t\t</m:r>\n\t\t</m:oMath>\n\t\t</m:oMathPara>\n\t\t</w:p>\n\t\t<w:p>\n\t\t<w:t>Hello {</w:t>\n\t\t<w:t>name</w:t>\n\t\t<w:t>}</w:t>\n\t\t</w:p>\n\t\t";
		var scope = { name: "John", foo: "MyFoo", bar: "MyBar", baz: "MyBaz" };
		var xmlTemplater = createXmlTemplaterDocx(content, { tags: scope });
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("yMyBar*cos⁡( MyFoo+MyBaz)Hello John");
	});
});

describe("Change the nullGetter", function () {
	it("should work with null", function () {
		var content = "<w:t>Hello {name}</w:t>";
		var scope = {};
		function nullGetter() {
			return "null";
		}
		var xmlTemplater = createXmlTemplaterDocx(content, {
			tags: scope,
			nullGetter: nullGetter
		});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello null");
	});
});

describe("intelligent tagging multiple tables", function () {
	it("should work with multiple rows", function () {
		var content = "<w:tbl>\n\t\t<w:tr>\n\t\t<w:tc>\n\t\t<w:p>\n\t\t<w:r>\n\t\t<w:t>{#clauses} Clause {.}</w:t>\n\t\t</w:r>\n\t\t</w:p>\n\t\t</w:tc>\n\t\t</w:tr>\n\t\t<w:tr>\n\t\t<w:tc>\n\t\t<w:p>\n\t\t<w:r>\n\t\t<w:t>{/clauses}</w:t>\n\t\t</w:r>\n\t\t</w:p>\n\t\t</w:tc>\n\t\t</w:tr>\n\t\t</w:tbl>\n\t\t".replace(/\t|\n/g, "");
		var scope = { clauses: ["Foo", "Bar", "Baz"] };
		var doc = createXmlTemplaterDocx(content, { tags: scope });
		var c = getContent(doc);
		expect(c).to.be.equal('<w:tbl><w:tr><w:tc><w:p><w:r><w:t xml:space="preserve"> Clause Foo</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t xml:space="preserve"> Clause Bar</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t xml:space="preserve"> Clause Baz</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc></w:tr></w:tbl>');
	});
});

describe("Custom delimiters", function () {
	it("should work with custom tags", function () {
		var delimiters = {
			start: "[",
			end: "]"
		};
		var content = "<w:t>Hello [name]</w:t>";
		var scope = { name: "Edgar" };
		var xmlTemplater = createXmlTemplaterDocx(content, {
			tags: scope,
			delimiters: delimiters
		});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar");
	});

	it("should work with custom delimiters with two chars", function () {
		var delimiters = {
			start: "[[",
			end: "]]"
		};
		var content = "<w:t>Hello [[name]]</w:t>";
		var scope = { name: "Edgar" };
		var xmlTemplater = createXmlTemplaterDocx(content, {
			tags: scope,
			delimiters: delimiters
		});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.eql("Hello Edgar");
	});

	it("should work with custom delimiters as strings with different length", function () {
		var delimiters = {
			start: "[[[",
			end: "]]"
		};
		var content = "<w:t>Hello [[[name]]</w:t>";
		var scope = { name: "Edgar" };
		var xmlTemplater = createXmlTemplaterDocx(content, {
			tags: scope,
			delimiters: delimiters
		});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.eql("Hello Edgar");
	});

	it("should work with custom tags and loops", function () {
		var delimiters = {
			start: "[[[",
			end: "]]"
		};
		var content = "<w:t>Hello [[[#names]][[[.]],[[[/names]]</w:t>";
		var scope = { names: ["Edgar", "Mary", "John"] };
		var xmlTemplater = createXmlTemplaterDocx(content, {
			tags: scope,
			delimiters: delimiters
		});
		xmlTemplater.render();
		expect(xmlTemplater.getFullText()).to.be.equal("Hello Edgar,Mary,John,");
	});

	it("should work with loops", function () {
		var content = "<w:t>{#loop}{innertag</w:t><w:t>} {/loop}</w:t>";
		var xmlt = createXmlTemplaterDocx(content, {
			tags: { loop: [{ innertag: 10 }, { innertag: 5 }] }
		}).render();
		var c = getContent(xmlt);
		expect(c).to.be.equal('<w:t xml:space="preserve">10</w:t><w:t> 5</w:t><w:t> </w:t>');
	});

	it("should work with complex loops (1)", function () {
		var content = "<w:t>{#looptag}{innertag</w:t><w:t>}{/looptag}</w:t>";
		var xmlt = createXmlTemplaterDocx(content, {
			tags: { looptag: true, innertag: "foo" }
		}).render();
		var c = getContent(xmlt);
		expect(c).not.to.contain("</w:t></w:t>");
		expect(c).to.be.equal('<w:t xml:space="preserve">foo</w:t><w:t></w:t>');
	});

	it("should work with complex loops (2)", function () {
		var content = "<w:t>{#person}</w:t><w:t>{name}{/person}</w:t>";
		var xmlt = createXmlTemplaterDocx(content, {
			tags: { person: [{ name: "Henry" }] }
		}).render();
		var c = getContent(xmlt);
		expect(c).to.contain("Henry</w:t>");
		expect(c).not.to.contain("</w:t>Henry</w:t>");
	});
});

describe("getting parents context", function () {
	it("should work with simple loops", function () {
		var content = "<w:t>{#loop}{name}{/loop}</w:t>";
		var xmlt = createXmlTemplaterDocx(content, {
			tags: { loop: [1], name: "Henry" }
		}).render();
		var c = getContent(xmlt);
		expect(c).to.be.equal('<w:t xml:space="preserve">Henry</w:t>');
	});

	it("should work with double loops", function () {
		var content = "<w:t>{#loop_first}{#loop_second}{name_inner} {name_outer}{/loop_second}{/loop_first}</w:t>";
		var xmlt = createXmlTemplaterDocx(content, {
			tags: {
				loop_first: [1],
				loop_second: [{ name_inner: "John" }],
				name_outer: "Henry"
			}
		}).render();
		var c = getContent(xmlt);
		expect(c).to.be.equal('<w:t xml:space="preserve">John Henry</w:t>');
	});
});