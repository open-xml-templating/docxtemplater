const xmlMatcher = require("../../xml-matcher.js");
const { expect } = require("../utils.js");
const xmlprettify = require("../xml-prettify.js");

describe("XmlMatcher", () => {
	it("should work with simple tag", () => {
		const matcher = xmlMatcher("<w:t>Text</w:t>", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("<w:t>Text</w:t>");
		expect(matcher.matches[0].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[0].array[2]).to.be.equal("Text");
		expect(matcher.matches[0].offset).to.be.equal(0);
	});

	it("should work with multiple tags", () => {
		const matcher = xmlMatcher("<w:t>Text</w:t> TAG <w:t>Text2</w:t>", [
			"w:t",
		]);
		expect(matcher.matches[1].array[0]).to.be.equal("<w:t>Text2</w:t>");
		expect(matcher.matches[1].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[1].array[2]).to.be.equal("Text2");
		expect(matcher.matches[1].offset).to.be.equal(20);
	});

	it("should work with selfclosing tag", () => {
		const matcher = xmlMatcher(
			' <w:spacing w:before="0" w:after="200"/> ',
			["w:spacing"]
		);
		expect(matcher.matches.length).to.be.equal(1);
		expect(matcher.matches[0].array[0]).to.be.equal(
			'<w:spacing w:before="0" w:after="200"/>'
		);
	});

	it("should not match with no </w:t> starter", () => {
		const matcher = xmlMatcher("TAG<w:t>Text1</w:t>", ["w:t"]);
		expect(matcher.matches[0].array[0]).to.be.equal("<w:t>Text1</w:t>");
		expect(matcher.matches[0].array[1]).to.be.equal("<w:t>");
		expect(matcher.matches[0].array[2]).to.be.equal("Text1");
		expect(matcher.matches[0].offset).to.be.equal(3);
	});

	it("should not match with no <w:t> ender", () => {
		const matcher = xmlMatcher("<w:t>Text1</w:t>TAG", ["w:t"]);
		expect(matcher.matches.length).to.be.equal(1);
	});
});

describe("XML prettify", () => {
	it("should work with > inside attribute", () => {
		const str =
			xmlprettify(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:lvlText w:val=">"/>`);
		expect(str).to.equal(`<?xml version="1.0" standalone="yes"?>
<w:lvlText w:val=">"/>
`);
	});

	it("should normalize space inside <w:rPr>", () => {
		const str =
			xmlprettify(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
	  <w:rPr>

</w:rPr>`);
		expect(str).to.equal(`<?xml version="1.0" standalone="yes"?>
<w:rPr>
</w:rPr>
`);
	});

	it("should not normalize space inside <w:t>, <t> or <a:t>", () => {
		const str =
			xmlprettify(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
	  <w:t>

</w:t>
<a:t>

</a:t>
<t>

</t>`);
		expect(str).to.equal(`<?xml version="1.0" standalone="yes"?>
<w:t>

</w:t>
<a:t>

</a:t>
<t>

</t>
`);
	});

	it("should deduplicate xmlns:w", () => {
		let str =
			'<w:sectPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:t xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/></w:sectPr>';
		str = xmlprettify(str);
		expect(str).to
			.equal(`<w:sectPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:t />
</w:sectPr>
`);
	});

	it("should normalize &#100;", () => {
		let str = '<w foo="Ry&#100;cy9Ry&#010;cy9"/>';
		str = xmlprettify(str);
		expect(str).to.equal(`<w foo="Ry&#x64;cy9Ry&#xA;cy9"/>
`);
	});

	it("should sort attributes", () => {
		const str =
			'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><foo zanc="bar" bar="foo"></foo><foo zak="foo" uk="bar"/>';

		const prettified = xmlprettify(str);
		expect(prettified).to.equal(`<?xml version="1.0" standalone="yes"?>
<foo bar="foo" zanc="bar">
</foo>
<foo uk="bar" zak="foo"/>
`);
	});

	it("should remove space inside tags", () => {
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
		expect(prettified).to.equal(`<?xml version="1.0" standalone="yes"?>
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

	it("should work with processing instruction : <?mso-contentType?>", () => {
		const str = xmlprettify(`<?xml version="1.0"?>
<?mso-contentType?>
<FormTemplates xmlns="http://schemas.microsoft.com/sharepoint/v3/contenttype/forms">
  <Display>DocumentLibraryForm</Display>
  <Edit>DocumentLibraryForm</Edit>
  <New>DocumentLibraryForm</New>
</FormTemplates>`);
		expect(str).to.equal(`<?xml version="1.0"?>
<?mso-contentType?>
<FormTemplates xmlns="http://schemas.microsoft.com/sharepoint/v3/contenttype/forms">
    <Display>DocumentLibraryForm</Display>
    <Edit>DocumentLibraryForm</Edit>
    <New>DocumentLibraryForm</New>
</FormTemplates>
`);
	});

	it("should remove space in processing instruction <?space in xml   ?>", () => {
		const str = xmlprettify(`<?xml version="1.0"   ?>
<a></a>`);
		expect(str.replace(/\n/g, "")).to.equal('<?xml version="1.0"?><a></a>');
	});
});
