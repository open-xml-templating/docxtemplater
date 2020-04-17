const wrapper = require("../module-wrapper");
const { concatArrays } = require("../doc-utils");
const docxContentType =
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
const docxmContentType =
	"application/vnd.ms-word.document.macroEnabled.main+xml";
const pptxContentType =
	"application/vnd.openxmlformats-officedocument.presentationml.slide+xml";
const dotxContentType =
	"application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml";
const dotmContentType =
	"application/vnd.ms-word.template.macroEnabledTemplate.main+xml";

const filetypes = {
	docx: [docxContentType, docxmContentType, dotxContentType, dotmContentType],
	pptx: [pptxContentType],
};

class Common {
	constructor() {
		this.name = "Common";
	}
	set({ invertedContentTypes }) {
		if (invertedContentTypes) {
			this.invertedContentTypes = invertedContentTypes;
		}
	}
	getFileType({ doc }) {
		const invertedContentTypes = this.invertedContentTypes;
		if (!this.invertedContentTypes) {
			return;
		}
		const keys = Object.keys(filetypes);
		for (let i = 0, len = keys.length; i < len; i++) {
			const ftCandidate = keys[i];
			const contentTypes = filetypes[ftCandidate];
			for (let j = 0, len2 = contentTypes.length; j < len2; j++) {
				const ct = contentTypes[j];
				if (invertedContentTypes[ct]) {
					doc.targets = concatArrays([doc.targets, invertedContentTypes[ct]]);
					return ftCandidate;
				}
			}
		}
	}
}
module.exports = () => wrapper(new Common());
