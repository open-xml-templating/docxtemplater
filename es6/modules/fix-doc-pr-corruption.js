const { setSingleAttribute, isTagStart } = require("../doc-utils.js");
const filetypes = require("../filetypes.js");

/*
 * We use a class here because this object is storing "state" in this.Lexer,
 * this.zip, this.xmlDocuments
 *
 * In version 3.34.3 and before, the state could be overwritten if the module
 * was attached to two docxtemplater instances
 *
 * Now, since the module will be cloned if already attached, it should work
 * correctly even on multiple instances in parallel
 */
class FixDocPRCorruptionModule {
	constructor() {
		this.name = "FixDocPRCorruptionModule";
		this.supportedFileTypes = ["docx"];
	}
	clone() {
		return new FixDocPRCorruptionModule();
	}
	set(options) {
		if (options.Lexer) {
			this.Lexer = options.Lexer;
		}
		if (options.zip) {
			this.zip = options.zip;
		}
		if (options.xmlDocuments) {
			this.xmlDocuments = options.xmlDocuments;
		}
	}
	on(event) {
		// Stryker disable all : because this is an optimisation that won't make any tests fail
		if (event !== "syncing-zip") {
			return;
		}
		// Stryker disable all : because this is an optimisation that won't make any tests fail
		if (this.docxtemplater.fileType !== "docx") {
			return;
		}
		const { filesContentTypes } = this.docxtemplater;
		this.attached = false;
		// Stryker restore all
		const { zip, Lexer } = this;
		let prId = 1;
		for (const f of zip.file(/.xml$/)) {
			const ct = filesContentTypes[f.name];
			if (ct && filetypes.docx.indexOf(ct) === -1) {
				continue;
			}
			const xmlDoc = this.xmlDocuments[f.name];
			if (xmlDoc) {
				for (const pr of xmlDoc.getElementsByTagName("wp:docPr")) {
					pr.setAttribute("id", prId++);
				}
				continue;
			}
			let text = f.asText();
			const xmllexed = Lexer.xmlparse(text, {
				text: [],
				other: ["wp:docPr"],
			});
			if (xmllexed.length > 1) {
				/* eslint-disable-next-line no-loop-func */
				text = xmllexed.reduce((fullText, part) => {
					if (isTagStart("wp:docPr", part)) {
						return (
							fullText +
							setSingleAttribute(part.value, "id", prId++)
						);
					}
					return fullText + part.value;
				}, "");
			}
			zip.file(f.name, text);
		}
	}
}

module.exports = new FixDocPRCorruptionModule();
