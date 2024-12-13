const wrapper = require("../module-wrapper.js");
const filetypes = require("../filetypes.js");

const {
	settingsContentType,
	coreContentType,
	appContentType,
	customContentType,
	diagramDataContentType,
	diagramDrawingContentType,
} = require("../content-types.js");

const commonContentTypes = [
	settingsContentType,
	coreContentType,
	appContentType,
	customContentType,
	diagramDataContentType,
	diagramDrawingContentType,
];

class Common {
	constructor() {
		this.name = "Common";
	}
	getFileType({ doc }) {
		const { invertedContentTypes } = doc;
		if (!invertedContentTypes) {
			return;
		}
		for (const ct of commonContentTypes) {
			if (invertedContentTypes[ct]) {
				Array.prototype.push.apply(doc.targets, invertedContentTypes[ct]);
			}
		}
		const keys = ["docx", "pptx"];
		let ftCandidate;
		for (const key of keys) {
			const contentTypes = filetypes[key];
			for (const ct of contentTypes) {
				if (invertedContentTypes[ct]) {
					for (const target of invertedContentTypes[ct]) {
						if (
							doc.relsTypes[target] &&
							[
								"http://purl.oclc.org/ooxml/officeDocument/relationships/officeDocument",
								"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
							].indexOf(doc.relsTypes[target]) === -1
						) {
							continue;
						}
						ftCandidate = key;
						if (filetypes.main.indexOf(ct) !== -1 || ct === filetypes.pptx[0]) {
							doc.textTarget ||= target;
						}
						doc.targets.push(target);
					}
				}
			}
			if (ftCandidate) {
				return ftCandidate;
			}
		}
		return ftCandidate;
	}
}
module.exports = () => wrapper(new Common());
