const docxContentType =
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
const docxmContentType =
	"application/vnd.ms-word.document.macroEnabled.main+xml";
const dotxContentType =
	"application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml";
const dotmContentType =
	"application/vnd.ms-word.template.macroEnabledTemplate.main+xml";
const headerContentType =
	"application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml";
const footerContentType =
	"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml";

const pptxContentType =
	"application/vnd.openxmlformats-officedocument.presentationml.slide+xml";
const pptxSlideMaster =
	"application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml";

const filetypes = {
	docx: [
		docxContentType,
		docxmContentType,
		dotxContentType,
		dotmContentType,
		headerContentType,
		footerContentType,
	],
	pptx: [pptxContentType, pptxSlideMaster],
};

module.exports = filetypes;
