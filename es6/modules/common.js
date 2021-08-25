const wrapper = require("../module-wrapper.js");
const { concatArrays } = require("../doc-utils.js");

const filetypes = require("../filetypes.js");

class Common {
	constructor() {
		this.name = "Common";
	}
	getFileType({ doc }) {
		const { invertedContentTypes } = doc;
		if (!invertedContentTypes) {
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
