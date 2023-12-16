const Lexer = require("./lexer.js");
const Parser = require("./parser.js");
const DocUtils = require("./doc-utils.js");
const createScope = require("./scope-manager.js");
const utf8decode = require("./uintarray-to-string.js");
const { defaults } = DocUtils;

const { throwMultiError } = require("./errors.js");

const renderModule = require("./modules/render.js");
const loopModule = require("./modules/loop.js");
const expandPairTrait = require("./modules/expand-pair-trait.js");

const XmlTemplater = require("./xml-templater.js");

function TxtTemplater(text, options = {}) {
	const filePath = "text";
	const xmlt = new XmlTemplater(text, { modules: [] });
	xmlt.fileType = "text";
	xmlt.fileTypeConfig = options.fileTypeConfig = {
		droppedTagsInsidePlaceholder: [],
		expandTags: [],
	};
	this.fileTypeConfig = options.fileTypeConfig;
	Object.keys(defaults).forEach((key) => {
		const defaultValue = defaults[key];
		xmlt[key] = options[key] =
			options[key] != null ? options[key] : defaultValue;
	});
	xmlt.modules = [loopModule(), expandPairTrait(), renderModule()];
	xmlt.modules.forEach((module) => {
		module.optionsTransformer(options, {
			fileTypeConfig: xmlt.fileTypeConfig,
			parser: xmlt.parser,
			options: xmlt,
		});
	});

	xmlt.allErrors = [];
	// Fake XML parsing : surround the text with an empty tag of type text: true
	xmlt.xmllexed = [
		{
			type: "tag",
			position: "start",
			value: "",
			text: true,
		},
		{
			type: "content",
			value: text,
		},
		{
			type: "tag",
			position: "end",
			value: "",
		},
	];
	xmlt.setModules({ inspect: { filePath, xmllexed: xmlt.xmllexed } });
	const { lexed, errors: lexerErrors } = Lexer.parse(xmlt);
	xmlt.allErrors = xmlt.allErrors.concat(lexerErrors);
	xmlt.lexed = lexed;
	xmlt.setModules({ inspect: { filePath, lexed: xmlt.lexed } });
	Parser.preparse(xmlt.lexed, xmlt.modules, xmlt.getOptions());
	xmlt.parse();
	if (xmlt.allErrors.length > 0) {
		throwMultiError(xmlt.allErrors);
	}

	this.render = function (tags) {
		xmlt.scopeManager = createScope({
			tags,
			parser: xmlt.parser,
		});
		return utf8decode(xmlt.render().content);
	};

	return this;
}

module.exports = TxtTemplater;
