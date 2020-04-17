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
		if (!this.invertedContentTypes) {
			return;
		}
		let fileType = null;
		const invertedContentTypes = this.invertedContentTypes;
		if (invertedContentTypes[docxContentType]) {
			fileType = "docx";
			doc.targets = concatArrays([
				doc.targets,
				invertedContentTypes[docxContentType],
			]);
		}
		if (invertedContentTypes[docxmContentType]) {
			fileType = "docx";
			doc.targets = concatArrays([
				doc.targets,
				invertedContentTypes[docxmContentType],
			]);
		}
		if (invertedContentTypes[dotxContentType]) {
			fileType = "docx";
			doc.targets = concatArrays([
				doc.targets,
				invertedContentTypes[dotxContentType],
			]);
		}
		if (invertedContentTypes[dotmContentType]) {
			fileType = "docx";
			doc.targets = concatArrays([
				doc.targets,
				invertedContentTypes[dotmContentType],
			]);
		}
		if (invertedContentTypes[pptxContentType]) {
			fileType = "pptx";
			doc.targets = concatArrays([
				doc.targets,
				invertedContentTypes[pptxContentType],
			]);
		}
		return fileType;
	}
}
module.exports = () => wrapper(new Common());
