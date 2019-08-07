const wrapper = require("../module-wrapper");
const ctXML = "[Content_Types].xml";
const docxContentType =
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
const docxmContentType =
	"application/vnd.ms-word.document.macroEnabled.main+xml";
const pptxContentType =
	"application/vnd.openxmlformats-officedocument.presentationml.slide+xml";

function getPartName(override) {
	let partName = override.getAttribute("PartName");
	if (partName[0] === "/") {
		partName = partName.substr(1);
	}
	return partName;
}

class Common {
	constructor() {
		this.name = "Common";
		this.recordRun = false;
		this.recordedRun = [];
	}
	getFileType({ zip, contentTypes, overrides, defaults, doc }) {
		if (!contentTypes) {
			return;
		}
		let fileType = null;
		const partNames = [];
		for (let i = 0, len = overrides.length; i < len; i++) {
			const override = overrides[i];
			const contentType = override.getAttribute("ContentType");
			const partName = getPartName(override);
			partNames.push(partName);
			if (contentType === docxContentType) {
				fileType = "docx";
				doc.targets.push(partName);
			}
			if (contentType === docxmContentType) {
				fileType = "docx";
				doc.targets.push(partName);
			}
			if (contentType === pptxContentType) {
				fileType = "pptx";
				doc.targets.push(partName);
			}
		}
		if (fileType) {
			return fileType;
		}
		for (let i = 0, len = defaults.length; i < len; i++) {
			const def = defaults[i];
			const contentType = def.getAttribute("ContentType");
			if (
				[docxContentType, docxmContentType, pptxContentType].indexOf(
					contentType
				) !== -1
			) {
				const extension = def.getAttribute("Extension");
				// eslint-disable-next-line no-loop-func
				zip.file(/./).map(({ name }) => {
					if (
						name.slice(name.length - extension.length - 1) === ".xml" &&
						partNames.indexOf(name) === -1 &&
						name !== ctXML
					) {
						doc.targets.push(name);
						fileType = contentType === pptxContentType ? "pptx" : "docx";
					}
				});
			}
		}
		return fileType;
	}
}
module.exports = () => wrapper(new Common());
