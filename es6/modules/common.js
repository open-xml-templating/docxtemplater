const wrapper = require("../module-wrapper.js");
const filetypes = require("../filetypes.js");

const coreContentType =
	"application/vnd.openxmlformats-package.core-properties+xml";
const appContentType =
	"application/vnd.openxmlformats-officedocument.extended-properties+xml";
const customContentType =
	"application/vnd.openxmlformats-officedocument.custom-properties+xml";
const settingsContentType =
	"application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml";

const commonContentTypes = [
	settingsContentType,
	coreContentType,
	appContentType,
	customContentType,
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
		for (let j = 0, len2 = commonContentTypes.length; j < len2; j++) {
			const ct = commonContentTypes[j];
			if (invertedContentTypes[ct]) {
				Array.prototype.push.apply(doc.targets, invertedContentTypes[ct]);
			}
		}
		const keys = ["docx", "pptx"];
		let ftCandidate;
		for (let i = 0, len = keys.length; i < len; i++) {
			const contentTypes = filetypes[keys[i]];
			for (let j = 0, len2 = contentTypes.length; j < len2; j++) {
				const ct = contentTypes[j];
				if (invertedContentTypes[ct]) {
					for (let k = 0, len = invertedContentTypes[ct].length; k < len; k++) {
						const target = invertedContentTypes[ct][k];
						if (
							doc.relsTypes[target] &&
							[
								"http://purl.oclc.org/ooxml/officeDocument/relationships/officeDocument",
								"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
							].indexOf(doc.relsTypes[target]) === -1
						) {
							continue;
						}
						ftCandidate = keys[i];
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
