const DocUtils = require("../doc-utils");
const Errors = require("../errors");

const moduleName = "rawxml";

function throwRawTagShouldBeOnlyTextInParagraph(options) {
	const err = new Errors.XTTemplateError("Raw tag should be the only text in paragraph");
	const tag = options.part.value;
	err.properties = {
		id: "raw_xml_tag_should_be_only_text_in_paragraph",
		explanation: `The tag ${tag}`,
		xtag: options.part.value,
		paragraphParts: options.paragraphParts,
	};
	throw err;
}

function getInner({part, left, right, postparsed, index}) {
	const paragraphParts = postparsed.slice(left + 1, right);
	paragraphParts.forEach(function (p, i) {
		if (i === index - left - 1) {
			return;
		}
		if (p.type === "placeholder" || (p.type === "content" && p.position === "insidetag")) {
			throwRawTagShouldBeOnlyTextInParagraph({paragraphParts, part});
		}
	});
	return part;
}

class rawXmlModule {
	constructor() {
	}
	optionsTransformer(options, docxtemplater) {
		this.fileTypeConfig = docxtemplater.fileTypeConfig;
		return options;
	}
	parse(placeHolderContent) {
		const type = "placeholder";
		if (placeHolderContent[0] !== "@") {
			return null;
		}
		return {type, value: placeHolderContent.substr(1), module: moduleName};
	}
	postparse(parsed) {
		return DocUtils.traits.expandToOne(parsed, {moduleName, getInner, expandTo: this.fileTypeConfig.tagRawXml});
	}
	render(part, options) {
		if (part.module !== moduleName) {
			return null;
		}
		let value = options.scopeManager.getValue(part.value);
		if (value == null) {
			value = options.nullGetter(part);
		}
		return {value};
	}

}

module.exports = rawXmlModule;

