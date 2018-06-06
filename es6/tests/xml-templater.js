const {
	createXmlTemplaterDocx,
	expect,
	getContent,
	createXmlTemplaterDocxNoRender,
} = require("./utils");

describe("XmlTemplater", function() {
	it("should work with simpleContent", function(done) {
		const content = "<w:t>Hello {name}</w:t>";
		const scope = { name: "Edgar" };
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal("Hello Edgar");
					done();
				});
			});
		});
	});

	it("should work with doublecontent in w:t", function(done) {
		const content = "<w:t>Hello {name}, you're {age} years old</w:t>";
		const scope = { name: "Edgar", age: "foo" };
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal(
						"Hello Edgar, you're foo years old"
					);
					done();
				});
			});
		});
	});

	it("should work with {.} for this", function(done) {
		const content = "<w:t>Hello {.}</w:t>";
		const scope = "Edgar";
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal("Hello Edgar");
					done();
				});
			});
		});
	});

	it("should work with {.} for this inside loop", function(done) {
		const content = "<w:t>Hello {#names}{.},{/names}</w:t>";
		const scope = { names: ["Edgar", "John"] };
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal("Hello Edgar,John,");
					done();
				});
			});
		});
	});

	it("should work with non w:t content", function(done) {
		const content = "<w:t>{#loop}Hello {name}{/loop}</w:t>";
		const scope = { loop: { name: "edgar" } };
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				getContent(xmlTemplater).then(c => {
					expect(c).to.be.equal('<w:t xml:space="preserve">Hello edgar</w:t>');
					done();
				});
			});
		});
	});

	it("should handle <w:p/> in loop without error", function(done) {
		const content = `<w:p><w:r><w:t>{#ab}</w:t></w:r></w:p>
    <w:p w14:paraId="79563C14" w14:textId="77777777" w:rsidR="00F22CAA" w:rsidRDefault="00F22CAA" w:rsidP="00324963"/>
    <w:p><w:r><w:t>{.}{/ab}</w:t></w:r></w:p>`;
		const scope = { ab: [1, 2, 3] };
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal("123");
					done();
				});
			});
		});
	});

	it("should work with tag in two elements", function(done) {
		const content = "<w:t>Hello {</w:t><w:t>name}</w:t>";
		const scope = { name: "Edgar" };
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal("Hello Edgar");
					done();
				});
			});
		});
	});

	it("should work with splitted tag in three elements", function(done) {
		const content = "<w:t>Hello {</w:t><w:t>name</w:t><w:t>}</w:t>";
		const scope = { name: "Edgar" };
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal("Hello Edgar");
					done();
				});
			});
		});
	});

	it("should work with simple loop with object value", function(done) {
		const content = "<w:t>Hello {#person}{name}{/person}</w:t>";
		const scope = { person: { name: "Edgar" } };
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal("Hello Edgar");
					done();
				});
			});
		});
	});

	it("should work with simple Loop", function(done) {
		const content = "<w:t>Hello {#names}{name},{/names}</w:t>";
		const scope = {
			names: [{ name: "Edgar" }, { name: "Mary" }, { name: "John" }],
		};
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal("Hello Edgar,Mary,John,");
					done();
				});
			});
		});
	});
	it("should work with simple Loop with boolean value truthy", function(done) {
		const content = "<w:t>Hello {#showName}{name},{/showName}</w:t>";
		const scope = { showName: true, name: "Edgar" };
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal("Hello Edgar,");
					done();
				});
			});
		});
	});
	it("should work with simple Loop with boolean value falsy", function(done) {
		const content = "<w:t>Hello {#showName}{name},{/showName}</w:t>";
		const scope = { showName: false, name: "Edgar" };
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal("Hello ");
					done();
				});
			});
		});
	});
	it("should work with dash Loop", function(done) {
		const content = "<w:p><w:t>Hello {-w:p names}{name},{/names}</w:t></w:p>";
		const scope = {
			names: [{ name: "Edgar" }, { name: "Mary" }, { name: "John" }],
		};
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal(
						"Hello Edgar,Hello Mary,Hello John,"
					);
					done();
				});
			});
		});
	});
	it("should work with loop and innerContent", function(done) {
		const content =
			'<w:p><w:t>{#loop}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:pStyle w:val="Titre1"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRPr="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00923B77" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR="00713414"><w:t>oof</w:t></w:r><w:r><w:t xml:space="preserve">} </w:t></w:r><w:r w:rsidR="00713414"><w:t>It works because</w:t></w:r><w:r><w:t xml:space="preserve"> {</w:t></w:r><w:r w:rsidR="006F26AC"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00FD04E9" w:rsidRDefault="00923B77"><w:r><w:t>{/loop}</w:t></w:p>';
		const scope = {
			loop: {
				title: "Everyone uses it",
				proof: [
					{ reason: "it is quite cheap" },
					{ reason: "it is quit simple" },
					{ reason: "it works on a lot of different Hardware" },
				],
			},
		};
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal(
						"Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware"
					);
					done();
				});
			});
		});
	});
	it("should work with loop and innerContent (with last)", function(done) {
		const content =
			'<w:p><w:t>{#loop}Start </w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:pStyle w:val="Titre1"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRPr="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00923B77" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR="00713414"><w:t>oof</w:t></w:r><w:r><w:t xml:space="preserve">} </w:t></w:r><w:r w:rsidR="00713414"><w:t>It works because</w:t></w:r><w:r><w:t xml:space="preserve"> {</w:t></w:r><w:r w:rsidR="006F26AC"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00923B77" w:rsidRDefault="00713414" w:rsidP="00923B77"><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR="00923B77"><w:t>}</w:t></w:r></w:p><w:p w:rsidR="00FD04E9" w:rsidRDefault="00923B77"><w:r><w:t> End{/loop}</w:t></w:p>';
		const scope = {
			loop: {
				title: "Everyone uses it",
				proof: [
					{ reason: "it is quite cheap" },
					{ reason: "it is quit simple" },
					{ reason: "it works on a lot of different Hardware" },
				],
			},
		};
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal(
						"Start Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware End"
					);
					done();
				});
			});
		});
	});
	it("should work with not w:t tag (if the for loop is like {#forloop} text {/forloop}) ", function(done) {
		const content = "<w:t>{#loop}Hello {#names}{name},{/names}{/loop}</w:t>";
		const scope = {
			loop: { names: [{ name: "Edgar" }, { name: "Mary" }, { name: "John" }] },
		};
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				getContent(xmlTemplater).then(xmlContent => {
					expect(xmlContent).to.be.equal(
						'<w:t xml:space="preserve">Hello Edgar,Mary,John,</w:t>'
					);
					done();
				});
			});
		});
	});
	it("should work with delimiter in value", function(done) {
		const content = "<w:t>Hello {name}</w:t>";
		const scope = { name: "{edgar}" };
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal("Hello {edgar}");
					done();
				});
			});
		});
	});
	it("should work with delimiter in value with loop)", function(done) {
		const content = "<w:t>Hello {#names}{name},{/names}</w:t>";
		const scope = {
			names: [{ name: "{John}" }, { name: "M}}{ary" }, { name: "Di{{{gory" }],
		};
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal(
						"Hello {John},M}}{ary,Di{{{gory,"
					);
					done();
				});
			});
		});
	});
	it("should work when replacing with exact same value", function(done) {
		const content = '<w:p><w:t xml:space="preserve">Hello {name}</w:t></w:p>';
		const scope = { name: "{name}" };
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(() => {
					xmlTemplater.getFullText().then(text => {
						expect(text).to.be.equal("Hello {name}");
						done();
					});
				});
			});
		});
	});

	it("should work with equations", function(done) {
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
		const scope = { name: "John", foo: "MyFoo", bar: "MyBar", baz: "MyBaz" };
		createXmlTemplaterDocx(content, { tags: scope }).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal(
						"yMyBar*cos⁡( MyFoo+MyBaz)Hello John"
					);
					done();
				});
			});
		});
	});
});

describe("Change the nullGetter", function() {
	it("should work with null", function(done) {
		const content = "<w:t>Hello {#names}{#foo}{bar}{/foo}{/names}</w:t>";
		function nullGetter(part, scopeManager) {
			expect(scopeManager.scopePath).to.deep.equal(["names", "foo"]);
			expect(scopeManager.scopePathItem).to.deep.equal([0, 0]);
			return "null";
		}
		createXmlTemplaterDocxNoRender(content, {
			tags: {
				names: [{ foo: [{}] }],
			},
			nullGetter,
		}).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal("Hello null");
					done();
				});
			});
		});
	});

	it("should work with null in resolve", function(done) {
		const content = "<w:t>Hello {#names}{#foo}{bar}{/foo}{/names}</w:t>";
		let calls = 0;
		function nullGetter(part, scopeManager) {
			calls++;
			expect(scopeManager.scopePath).to.deep.equal(["names", "foo"]);
			expect(scopeManager.scopePathItem).to.deep.equal([0, 0]);
			return "null";
		}
		const data = {
			names: [{ foo: [{}] }],
		};
		createXmlTemplaterDocxNoRender(content, {
			nullGetter,
		}).then(xmlTemplater => {
			xmlTemplater.compile().then(() => {
				return xmlTemplater.resolveData(data).then(function() {
					expect(calls).to.be.equal(1);
					xmlTemplater.render().then(() => {
						expect(calls).to.be.equal(1);
						xmlTemplater.getFullText().then(text => {
							expect(text).to.be.equal("Hello null");
							done();
						});
					});
				});
			});
		});
	});
});

describe("intelligent tagging multiple tables", function() {
	it("should work with multiple rows", function(done) {
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
		const scope = { clauses: ["Foo", "Bar", "Baz"] };
		createXmlTemplaterDocx(content, { tags: scope }).then(doc => {
			getContent(doc).then(c => {
				expect(c).to.be.equal(
					'<w:tbl><w:tr><w:tc><w:p><w:r><w:t xml:space="preserve"> Clause Foo</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t xml:space="preserve"> Clause Bar</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t xml:space="preserve"> Clause Baz</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
				);
				done();
			});
		});
	});
});

describe("Custom delimiters", function() {
	it("should work with custom tags", function(done) {
		const delimiters = {
			start: "[",
			end: "]",
		};
		const content = "<w:t>Hello [name]</w:t>";
		const scope = { name: "Edgar" };
		createXmlTemplaterDocx(content, {
			tags: scope,
			delimiters,
		}).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal("Hello Edgar");
					done();
				});
			});
		});
	});

	it("should work with custom delimiters with two chars", function(done) {
		const delimiters = {
			start: "[[",
			end: "]]",
		};
		const content = "<w:t>Hello [[name]]</w:t>";
		const scope = { name: "Edgar" };
		createXmlTemplaterDocx(content, {
			tags: scope,
			delimiters,
		}).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.eql("Hello Edgar");
					done();
				});
			});
		});
	});

	it("should work with custom delimiters as strings with different length", function(done) {
		const delimiters = {
			start: "[[[",
			end: "]]",
		};
		const content = "<w:t>Hello [[[name]]</w:t>";
		const scope = { name: "Edgar" };
		createXmlTemplaterDocx(content, {
			tags: scope,
			delimiters,
		}).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.eql("Hello Edgar");
					done();
				});
			});
		});
	});

	it("should work with custom tags and loops", function(done) {
		const delimiters = {
			start: "[[[",
			end: "]]",
		};
		const content = "<w:t>Hello [[[#names]][[[.]],[[[/names]]</w:t>";
		const scope = { names: ["Edgar", "Mary", "John"] };
		createXmlTemplaterDocx(content, {
			tags: scope,
			delimiters,
		}).then(xmlTemplater => {
			xmlTemplater.render().then(() => {
				xmlTemplater.getFullText().then(text => {
					expect(text).to.be.equal("Hello Edgar,Mary,John,");
					done();
				});
			});
		});
	});

	it("should work with loops", function(done) {
		const content = "<w:t>{#loop}{innertag</w:t><w:t>} {/loop}</w:t>";
		createXmlTemplaterDocx(content, {
			tags: { loop: [{ innertag: 10 }, { innertag: 5 }] },
		}).then(xmlt => {
			xmlt.render().then(() => {
				getContent(xmlt).then(c => {
					expect(c).to.be.equal(
						'<w:t xml:space="preserve">10</w:t><w:t xml:space="preserve"> 5</w:t><w:t xml:space="preserve"> </w:t>'
					);
					done();
				});
			});
		});
	});

	it("should work with complex loops (1)", function(done) {
		const content = "<w:t>{#looptag}{innertag</w:t><w:t>}{/looptag}</w:t>";
		createXmlTemplaterDocx(content, {
			tags: { looptag: true, innertag: "foo" },
		}).then(xmlt => {
			xmlt.render().then(() => {
				getContent(xmlt).then(c => {
					expect(c).not.to.contain("</w:t></w:t>");
					expect(c).to.be.equal(
						'<w:t xml:space="preserve">foo</w:t><w:t xml:space="preserve"></w:t>'
					);
					done();
				});
			});
		});
	});

	it("should work with complex loops (2)", function(done) {
		const content = "<w:t>{#person}</w:t><w:t>{name}{/person}</w:t>";
		createXmlTemplaterDocx(content, {
			tags: { person: [{ name: "Henry" }] },
		}).then(xmlt => {
			xmlt.render().then(() => {
				getContent(xmlt).then(c => {
					expect(c).to.contain("Henry</w:t>");
					expect(c).not.to.contain("</w:t>Henry</w:t>");
					done();
				});
			});
		});
	});
});

describe("getting parents context", function() {
	it("should work with simple loops", function(done) {
		const content = "<w:t>{#loop}{name}{/loop}</w:t>";
		createXmlTemplaterDocx(content, {
			tags: { loop: [1], name: "Henry" },
		}).then(xmlt => {
			xmlt.render().then(() => {
				getContent(xmlt).then(c => {
					expect(c).to.be.equal('<w:t xml:space="preserve">Henry</w:t>');
					done();
				});
			});
		});
	});

	it("should work with double loops", function(done) {
		const content =
			"<w:t>{#loop_first}{#loop_second}{name_inner} {name_outer}{/loop_second}{/loop_first}</w:t>";
		createXmlTemplaterDocx(content, {
			tags: {
				loop_first: [1],
				loop_second: [{ name_inner: "John" }],
				name_outer: "Henry",
			},
		}).then(xmlt => {
			xmlt.render().then(() => {
				getContent(xmlt).then(c => {
					expect(c).to.be.equal('<w:t xml:space="preserve">John Henry</w:t>');
					done();
				});
			});
		});
	});
});
