const { resolveSoon } = require("../utils.js");

describe("Nullgetter", () => {
	it("should call nullgetter for loops synchonously", function () {
		return this.render({
			name: "multi-loop.docx",
			data: {
				test2: "Value2",
			},
			options: {
				paragraphLoop: true,
				nullGetter(part) {
					if (part.module === "loop") {
						return [
							{
								name: "Acme",
								users: [
									{
										name: "John",
									},
									{
										name: "James",
									},
								],
							},
							{
								name: "Emca",
								users: [
									{
										name: "Mary",
									},
									{
										name: "Liz",
									},
								],
							},
						];
					}
				},
			},
			expectedName: "expected-multi-loop.docx",
		});
	});

	it("should call nullgetter for loops async", function () {
		return this.render({
			name: "multi-loop.docx",
			data: {
				test2: "Value2",
			},
			options: {
				paragraphLoop: true,
				nullGetter(part) {
					if (part.module === "loop") {
						return resolveSoon([
							{
								name: "Acme",
								users: resolveSoon(
									[
										{
											name: resolveSoon("John", 25),
										},
										resolveSoon({
											name: "James",
										}),
									],
									5
								),
							},
							resolveSoon(
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
								20
							),
						]);
					}
				},
				async: true,
			},
			expectedName: "expected-multi-loop.docx",
			async: true,
		});
	});

	it("should call nullGetter with empty rawxml", function () {
		return this.renderV4({
			name: "table-raw-xml.docx",
			options: {
				nullGetter: (part) => {
					if (part.module === "rawxml") {
						return `<w:p>
                        <w:r>
                            <w:rPr><w:color w:val="FF0000"/></w:rPr>
                            <w:t>UNDEFINED</w:t>
                        </w:r>
                        </w:p>`;
					}
				},
			},
			expectedName: "expected-raw-xml-null.docx",
		});
	});
});
