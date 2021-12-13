const { setSingleAttribute, isTagStart } = require("../doc-utils.js");

module.exports = {
	name: "FixDocPRCorruptionModule",
	set(options) {
		if (options.Lexer) {
			this.Lexer = options.Lexer;
		}
		if (options.zip) {
			this.zip = options.zip;
		}
	},
	on(event) {
		/* Stryker disable all : because this is an optimisation that won't make any tests fail */
		if (event === "attached") {
			this.attached = false;
		}
		/* Stryker restore all */
		if (event !== "syncing-zip") {
			return;
		}
		const zip = this.zip;
		const Lexer = this.Lexer;
		let prId = 1;
		zip.file(/\.xml$/).forEach(function (f) {
			let text = f.asText();
			const xmllexed = Lexer.xmlparse(text, {
				text: [],
				other: ["wp:docPr"],
			});
			if (xmllexed.length > 1) {
				text = xmllexed.reduce(function (fullText, part) {
					if (isTagStart("wp:docPr", part)) {
						return fullText + setSingleAttribute(part.value, "id", prId++);
					}
					return fullText + part.value;
				}, "");
			}
			zip.file(f.name, text);
		});
	},
};
