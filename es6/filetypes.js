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
const footnotesContentType =
	"application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml";
const commentsContentType =
	"application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml";

const footerContentType =
	"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml";

const pptxContentType =
	"application/vnd.openxmlformats-officedocument.presentationml.slide+xml";
const pptxSlideMaster =
	"application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml";
const pptxSlideLayout =
	"application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml";
const pptxPresentationContentType =
	"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml";

/*
 * This is used for the main part of the document, ie usually that would be the
 * type of word/document.xml
 */
const main = [
	docxContentType,
	docxmContentType,
	dotxContentType,
	dotmContentType,
];

const filetypes = {
	main,
	docx: [
		headerContentType,
		...main,
		footerContentType,
		footnotesContentType,
		commentsContentType,
	],
	pptx: [
		pptxContentType,
		pptxSlideMaster,
		pptxSlideLayout,
		pptxPresentationContentType,
	],
};

module.exports = filetypes;
