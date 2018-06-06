const { createDoc, shouldBeSame, expect } = require("./utils");

describe("Docx docprops", function() {
	it("should change values with template data", function(done) {
		const tags = {
			first_name: "Hipp",
			last_name: "Edgar",
			phone: "0652455478",
			description: "New Website",
		};
		createDoc("tag-docprops.docx").then(doc => {
			doc.setData(tags);
			doc.render().then(() => {
				const results = [];
				results.push(doc.getFullText().then(text => {
					expect(text).to.be.equal("Edgar Hipp");
				}));
				results.push(doc.getFullText("word/header1.xml").then(text => {
					expect(text).to.be.equal("Edgar Hipp0652455478New Website");
				}));
				results.push(doc.getFullText("word/footer1.xml").then(text => {
					expect(text).to.be.equal("EdgarHipp0652455478");
				}));
				shouldBeSame({ doc, expectedName: "tag-docprops-expected.docx" });
				Promise.all(results).then(() => {
					done();
				});
			});
		});
	});
});
