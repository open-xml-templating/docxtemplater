const { wordToUtf8, convertSpaces, defaults } = require("./doc-utils");
const createScope = require("./scope-manager");
const xmlMatcher = require("./xml-matcher");
const { throwMultiError, throwContentMustBeString } = require("./errors");
const Lexer = require("./lexer");
const Parser = require("./parser.js");
const render = require("./render.js");
const postrender = require("./postrender.js");
const resolve = require("./resolve.js");
const joinUncorrupt = require("./join-uncorrupt");

function getFullText(content, tagsXmlArray) {
	const matcher = xmlMatcher(content, tagsXmlArray);
	const result = matcher.matches.map(function (match) {
		return match.array[2];
	});
	return wordToUtf8(convertSpaces(result.join("")));
}

module.exports = class XmlTemplater {
	constructor(content, options) {
		this.filePath = options.filePath;
		this.modules = options.modules;
		this.fileTypeConfig = options.fileTypeConfig;
		this.contentType = options.contentType;
		Object.keys(defaults).map(function (key) {
			this[key] = options[key] != null ? options[key] : defaults[key];
		}, this);
		this.setModules({ inspect: { filePath: this.filePath } });
		this.load(content);
	}
	load(content) {
		if (typeof content !== "string") {
			throwContentMustBeString(typeof content);
		}
		this.content = content;
	}
	setTags(tags) {
		this.tags = tags != null ? tags : {};
		this.scopeManager = createScope({ tags: this.tags, parser: this.parser });
		return this;
	}
	resolveTags(tags) {
		this.tags = tags != null ? tags : {};
		this.scopeManager = createScope({ tags: this.tags, parser: this.parser });
		const options = this.getOptions();
		options.scopeManager = createScope(options);
		options.resolve = resolve;
		return resolve(options).then(({ resolved, errors }) => {
			errors.forEach((error) => {
				// error properties might not be defined if some foreign
				// (unhandled error not throw by docxtemplater willingly) is
				// thrown.
				error.properties = error.properties || {};
				error.properties.file = this.filePath;
			});
			if (errors.length !== 0) {
				throw errors;
			}
			return Promise.all(
				resolved.map(function (r) {
					return Promise.resolve(r);
				})
			).then((resolved) => {
				this.setModules({ inspect: { resolved } });
				return (this.resolved = resolved);
			});
		});
	}
	getFullText() {
		return getFullText(this.content, this.fileTypeConfig.tagsXmlTextArray);
	}
	setModules(obj) {
		this.modules.forEach((module) => {
			module.set(obj);
		});
	}
	preparse() {
		this.allErrors = [];
		this.xmllexed = Lexer.xmlparse(this.content, {
			text: this.fileTypeConfig.tagsXmlTextArray,
			other: this.fileTypeConfig.tagsXmlLexedArray,
		});
		this.setModules({ inspect: { xmllexed: this.xmllexed } });
		const { lexed, errors: lexerErrors } = Lexer.parse(
			this.xmllexed,
			this.delimiters
		);
		this.allErrors = this.allErrors.concat(lexerErrors);
		this.lexed = lexed;
		this.setModules({ inspect: { lexed: this.lexed } });
		const options = this.getOptions();
		Parser.preparse(this.lexed, this.modules, options);
	}
	parse() {
		this.setModules({ inspect: { filePath: this.filePath } });
		const options = this.getOptions();
		this.parsed = Parser.parse(this.lexed, this.modules, options);
		this.setModules({ inspect: { parsed: this.parsed } });
		const { postparsed, errors: postparsedErrors } = Parser.postparse(
			this.parsed,
			this.modules,
			options
		);
		this.postparsed = postparsed;
		this.setModules({ inspect: { postparsed: this.postparsed } });
		this.allErrors = this.allErrors.concat(postparsedErrors);
		this.errorChecker(this.allErrors);
		return this;
	}
	errorChecker(errors) {
		if (errors.length) {
			this.modules.forEach(function (module) {
				errors = module.errorsTransformer(errors);
			});
			errors.forEach((error) => {
				// error properties might not be defined if some foreign
				// (unhandled error not throw by docxtemplater willingly) is
				// thrown.
				error.properties = error.properties || {};
				error.properties.file = this.filePath;
			});
			throwMultiError(errors);
		}
	}
	baseNullGetter(part, sm) {
		const value = this.modules.reduce((value, module) => {
			if (value != null) {
				return value;
			}
			return module.nullGetter(part, sm, this);
		}, null);
		if (value != null) {
			return value;
		}
		return this.nullGetter(part, sm);
	}
	getOptions() {
		return {
			compiled: this.postparsed,
			tags: this.tags,
			modules: this.modules,
			parser: this.parser,
			contentType: this.contentType,
			baseNullGetter: this.baseNullGetter.bind(this),
			filePath: this.filePath,
			fileTypeConfig: this.fileTypeConfig,
			linebreaks: this.linebreaks,
		};
	}
	render(to) {
		this.filePath = to;
		const options = this.getOptions();
		options.resolved = this.resolved;
		options.scopeManager = createScope(options);
		options.render = render;
		options.joinUncorrupt = joinUncorrupt;
		const { errors, parts } = render(options);
		this.errorChecker(errors);

		this.content = postrender(parts, options);
		this.setModules({ inspect: { content: this.content } });
		return this;
	}
};
