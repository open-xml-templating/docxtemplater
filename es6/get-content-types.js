const { str2xml } = require("./doc-utils.js");
const ctXML = "[Content_Types].xml";

function collectContentTypes(overrides, defaults, zip) {
	const partNames = {};
	for (const override of overrides) {
		const contentType = override.getAttribute("ContentType");
		const partName = override.getAttribute("PartName").substr(1);
		partNames[partName] = contentType;
	}
	for (const def of defaults) {
		const contentType = def.getAttribute("ContentType");
		const extension = def.getAttribute("Extension");
		zip.file(/./).map(({ name }) => {
			if (
				name.slice(name.length - extension.length) === extension &&
				!partNames[name] &&
				name !== ctXML
			) {
				partNames[name] = contentType;
			}
		});
	}
	return partNames;
}

function getContentTypes(zip) {
	const contentTypes = zip.files[ctXML];
	const contentTypeXml = contentTypes ? str2xml(contentTypes.asText()) : null;
	const overrides = contentTypeXml
		? contentTypeXml.getElementsByTagName("Override")
		: null;
	const defaults = contentTypeXml
		? contentTypeXml.getElementsByTagName("Default")
		: null;

	return { overrides, defaults, contentTypes, contentTypeXml };
}

module.exports = { collectContentTypes, getContentTypes };
