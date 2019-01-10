const traits = require("../traits");
const { isContent, getNearestLeft, getNearestRight } = require("../doc-utils");
const { throwRawTagShouldBeOnlyTextInParagraph } = require("../errors");
const { match, getValue } = require("../prefix-matcher");

const moduleName = "rawxml";
const wrapper = require("../module-wrapper");

function getInner({ part, left, right, postparsed, index }) {
	const before = getNearestLeft(postparsed, ["w:p", "w:tc"], left - 1);
	const after = getNearestRight(postparsed, ["w:p", "w:tc"], right + 1);
	if (after === "w:tc" && before === "w:tc") {
		part.emptyValue = "<w:p></w:p>";
	}
	const paragraphParts = postparsed.slice(left + 1, right);
	paragraphParts.forEach(function(p, i) {
		if (i === index - left - 1) {
			return;
		}
		if (isContent(p)) {
			throwRawTagShouldBeOnlyTextInParagraph({ paragraphParts, part });
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
		if (match(this.prefix, placeHolderContent)) {
			return {
				type,
				value: getValue(this.prefix, placeHolderContent),
				module: moduleName,
			};
		}
		return null;
	}
	postparse(postparsed) {
		return traits.expandToOne(postparsed, {
			moduleName,
			getInner,
			expandTo: this.fileTypeConfig.tagRawXml,
		});
	}
	render(part, options) {
		if (part.module !== moduleName) {
			return null;
		}
		let value = options.scopeManager.getValue(part.value, { part });
		if (value == null) {
			value = options.nullGetter(part);
		}
		if (!value) {
			return { value: part.emptyValue || "" };
		}
		return { value };
	}
	resolve(part, options) {
		if (part.type !== "placeholder" || part.module !== moduleName) {
			return null;
		}
		return options.scopeManager
			.getValueAsync(part.value, { part })
			.then(function(value) {
				if (value == null) {
					return options.nullGetter(part);
				}
				return value;
			});
	}
}

module.exports = () => wrapper(new RawXmlModule());
