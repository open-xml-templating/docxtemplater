const traits = require("../traits");
const {throwRawTagShouldBeOnlyTextInParagraph} = require("../errors");

const moduleName = "rawxml";
const wrapper = require("../module-wrapper");

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

class RawXmlModule {
	constructor() {
		this.name = "RawXmlModule";
		this.prefix = "@";
	}
	optionsTransformer(options, docxtemplater) {
		this.fileTypeConfig = docxtemplater.fileTypeConfig;
		return options;
	}
	parse(placeHolderContent) {
		const type = "placeholder";
		if (placeHolderContent[0] !== this.prefix) {
			return null;
		}
		return {type, value: placeHolderContent.substr(1), module: moduleName};
	}
	postparse(postparsed) {
		return traits.expandToOne(postparsed, {moduleName, getInner, expandTo: this.fileTypeConfig.tagRawXml});
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

module.exports = () => wrapper(new RawXmlModule());

