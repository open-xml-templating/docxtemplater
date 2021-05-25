const traits = require("../traits.js");
const { isContent } = require("../doc-utils.js");
const { throwRawTagShouldBeOnlyTextInParagraph } = require("../errors.js");

const moduleName = "rawxml";
const wrapper = require("../module-wrapper.js");

function getInner({ part, left, right, postparsed, index }) {
	const paragraphParts = postparsed.slice(left + 1, right);
	paragraphParts.forEach(function (p, i) {
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
	parse(placeHolderContent, { match, getValue }) {
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
			error: {
				message: "Raw tag not in paragraph",
				id: "raw_tag_outerxml_invalid",
				explanation: (part) =>
					`The tag "${part.value}" is not inside a paragraph, putting raw tags inside an inline loop is disallowed.`,
			},
		});
	}
	render(part, options) {
		if (part.module !== moduleName) {
			return null;
		}
		let value;
		const errors = [];
		try {
			value = options.scopeManager.getValue(part.value, { part });
			if (value == null) {
				value = options.nullGetter(part);
			}
		} catch (e) {
			errors.push(e);
			return { errors };
		}
		if (!value) {
			return { value: "" };
		}
		return { value };
	}
	resolve(part, options) {
		if (part.type !== "placeholder" || part.module !== moduleName) {
			return null;
		}
		return options.scopeManager
			.getValueAsync(part.value, { part })
			.then(function (value) {
				if (value == null) {
					return options.nullGetter(part);
				}
				return value;
			});
	}
}

module.exports = () => wrapper(new RawXmlModule());
