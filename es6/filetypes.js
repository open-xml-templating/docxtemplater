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

module.exports = filetypes;
