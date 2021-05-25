const xmlMatcher = require("../xml-matcher.js");
const { expect } = require("./utils.js");
const xmlprettify = require("./xml-prettify.js");

describe("XmlMatcher", function () {
	it("should work with simple tag", function () {
		const matcher = xmlMatcher("<w:t>Text</w:t>", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("<w:t>Text</w:t>");
		expect(matcher.matches[0].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[0].array[2]).to.be.equal("Text");
		expect(matcher.matches[0].offset).to.be.equal(0);
	});

	it("should work with multiple tags", function () {
		const matcher = xmlMatcher("<w:t>Text</w:t> TAG <w:t>Text2</w:t>", ["w:t"]);
		expect(matcher.matches[1].array[0]).to.be.equal("<w:t>Text2</w:t>");
		expect(matcher.matches[1].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[1].array[2]).to.be.equal("Text2");
		expect(matcher.matches[1].offset).to.be.equal(20);
	});

	it("should work with selfclosing tag", function () {
		const matcher = xmlMatcher(' <w:spacing w:before="0" w:after="200"/> ', [
			"w:spacing",
		]);
		expect(matcher.matches.length).to.be.equal(1);
		expect(matcher.matches[0].array[0]).to.be.equal(
			'<w:spacing w:before="0" w:after="200"/>'
		);
	});

	it("should work with no tag, with w:t", function () {
		const matcher = xmlMatcher("Text1</w:t><w:t>Text2", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("Text1");
		expect(matcher.matches[0].array[1]).to.be.equal("");
		expect(matcher.matches[0].array[2]).to.be.equal("Text1");
		expect(matcher.matches[0].offset).to.be.equal(0);

		expect(matcher.matches[1].array[0]).to.be.equal("<w:t>Text2");
		expect(matcher.matches[1].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[1].array[2]).to.be.equal("Text2");
		expect(matcher.matches[1].offset).to.be.equal(11);
	});

	it("should work with no tag, no w:t", function () {
		const matcher = xmlMatcher("Text1", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("Text1");
		expect(matcher.matches[0].array[1]).to.be.equal("");
		expect(matcher.matches[0].array[2]).to.be.equal("Text1");
		expect(matcher.matches[0].offset).to.be.equal(0);
	});

	it("should not match with no </w:t> starter", function () {
		const matcher = xmlMatcher("TAG<w:t>Text1</w:t>", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("<w:t>Text1</w:t>");
		expect(matcher.matches[0].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[0].array[2]).to.be.equal("Text1");
		expect(matcher.matches[0].offset).to.be.equal(3);
	});

	it("should not match with no <w:t> ender", function () {
		const matcher = xmlMatcher("<w:t>Text1</w:t>TAG", ["w:t"]);
		expect(matcher.matches.length).to.be.equal(1);
	});
});

describe("XML prettify", function () {
	it("should sort attributes", function () {
		const str =
			'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><foo zanc="bar" bar="foo"></foo><foo zak="foo" uk="bar"/>';

		const prettified = xmlprettify(str);
		expect(prettified).to
			.equal(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<foo bar="foo" zanc="bar">
</foo>
<foo uk="bar" zak="foo"/>
`);
	});
	it("should remove space inside tags", function () {
		const str = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
	<sst count="9" uniqueCount="9" xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
		<si >
			<t xml:space="preserve">Property</t>
		</si>
		<si >
			<t xml:space="preserve">0 $</t>
		</si>
		<si >
			<t xml:space="preserve"/>
		</si>
		<si>
			<t xml:space="preserve"/>
		</si>
		<si>
			<t xml:space="preserve"/>
		</si>
		<si>
			<t xml:space="preserve"/>
		</si >
		<si>
			<t xml:space="preserve"/>
		</si>
		<si>
			<t xml:space="preserve"/>
		</si>
		<si />
	</sst>`;
		const prettified = xmlprettify(str);
		expect(prettified).to
			.equal(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst count="9" uniqueCount="9" xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <si>
        <t xml:space="preserve">Property</t>
    </si>
    <si>
        <t xml:space="preserve">0 $</t>
    </si>
    <si>
        <t xml:space="preserve"/>
    </si>
    <si>
        <t xml:space="preserve"/>
    </si>
    <si>
        <t xml:space="preserve"/>
    </si>
    <si>
        <t xml:space="preserve"/>
    </si>
    <si>
        <t xml:space="preserve"/>
    </si>
    <si>
        <t xml:space="preserve"/>
    </si>
    <si/>
</sst>
`);
	});
});
