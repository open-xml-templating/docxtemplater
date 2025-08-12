const { pushArray, wordToUtf8, convertSpaces } = require("./doc-utils.js");
const xmlMatcher = require("./xml-matcher.js");
const Lexer = require("./lexer.js");
const Parser = require("./parser.js");
const render = require("./render.js");
const postrender = require("./postrender.js");
const resolve = require("./resolve.js");
const joinUncorrupt = require("./join-uncorrupt.js");

function getFullText(content, tagsXmlArray) {
	const matcher = xmlMatcher(content, tagsXmlArray);
	const result = matcher.matches.map((match) => match.array[2]);
	return wordToUtf8(convertSpaces(result.join("")));
}

module.exports = class XmlTemplater {
	constructor(content, options) {
		this.cachedParsers = {};
		this.content = content;
		for (const key in options) {
			this[key] = options[key];
		}
		this.setModules({ inspect: { filePath: options.filePath } });
	}
	resolveTags(tags) {
		this.tags = tags;
		const options = this.getOptions();
		const { filePath } = this;
		options.scopeManager = this.scopeManager;
		options.resolve = resolve;
		const errors = [];
		return Promise.all(
			this.modules.map((module) =>
				Promise.resolve(module.preResolve(options)).catch((e) => {
					errors.push(e);
				})
			)
		).then(() => {
			if (errors.length !== 0) {
				throw errors;
			}
			return resolve(options)
				.then(({ resolved, errors }) => {
					errors = errors.map((error) => {
						// If a string is thrown, convert it to a real Error
						if (!(error instanceof Error)) {
							error = new Error(error);
						}
						/*
						 * error properties might not be defined if some foreign error
						 * (unhandled error not thrown by docxtemplater willingly) is
						 * thrown.
						 */
						error.properties ||= {};
						error.properties.file = filePath;
						return error;
					});
					if (errors.length !== 0) {
						throw errors;
					}
					return Promise.all(resolved).then((resolved) => {
						options.scopeManager.root.finishedResolving = true;
						options.scopeManager.resolved = resolved;
						this.setModules({ inspect: { resolved, filePath } });
						return resolved;
					});
				})
				.catch((error) => {
					this.errorChecker(error);
					throw error;
				});
		});
	}
	getFullText() {
		return getFullText(this.content, this.fileTypeConfig.tagsXmlTextArray);
	}
	setModules(obj) {
		for (const module of this.modules) {
			module.set(obj);
		}
	}
	preparse() {
		this.allErrors = [];
		this.xmllexed = Lexer.xmlparse(this.content, {
			text: this.fileTypeConfig.tagsXmlTextArray,
			other: this.fileTypeConfig.tagsXmlLexedArray,
		});
		this.setModules({
			inspect: { filePath: this.filePath, xmllexed: this.xmllexed },
		});
		const { lexed, errors: lexerErrors } = Lexer.parse(
			this.xmllexed,
			this.delimiters,
			this.syntax,
			this.fileType
		);
		pushArray(this.allErrors, lexerErrors);
		this.lexed = lexed;
		this.setModules({
			inspect: { filePath: this.filePath, lexed: this.lexed },
		});
		const options = this.getOptions();
		this.lexed = Parser.preparse(this.lexed, this.modules, options);
	}
	parse({ noPostParse } = {}) {
		this.setModules({ inspect: { filePath: this.filePath } });
		const options = this.getOptions();
		this.parsed = Parser.parse(this.lexed, this.modules, options);
		this.setModules({
			inspect: { filePath: this.filePath, parsed: this.parsed },
		});
		if (noPostParse) {
			return this;
		}
		// In v4, we could remove this "this.postparse()" so that users have to call this manually.
		return this.postparse();
	}
	postparse() {
		const options = this.getOptions();
		const { postparsed, errors: postparsedErrors } = Parser.postparse(
			this.parsed,
			this.modules,
			options
		);
		this.postparsed = postparsed;
		this.setModules({
			inspect: { filePath: this.filePath, postparsed: this.postparsed },
		});
		pushArray(this.allErrors, postparsedErrors);
		this.errorChecker(this.allErrors);
		return this;
	}
	errorChecker(errors) {
		for (const error of errors) {
			/*
			 * error properties might not be defined if some foreign
			 * (unhandled error not thrown by docxtemplater willingly) is
			 * thrown.
			 */
			error.properties ||= {};
			error.properties.file = this.filePath;
		}
		for (const module of this.modules) {
			errors = module.errorsTransformer(errors);
		}
	}
	baseNullGetter(part, sm) {
		let value = null;
		for (const module of this.modules) {
			if (value != null) {
				continue;
			}
			value = module.nullGetter(part, sm, this);
		}
		if (value != null) {
			return value;
		}
		return this.nullGetter(part, sm);
	}
	getOptions() {
		return {
			compiled: this.postparsed,
			cachedParsers: this.cachedParsers,
			tags: this.tags,
			modules: this.modules,
			parser: this.parser,
			contentType: this.contentType,
			relsType: this.relsType,
			baseNullGetter: this.baseNullGetter.bind(this),
			filePath: this.filePath,
			fileTypeConfig: this.fileTypeConfig,
			fileType: this.fileType,
			linebreaks: this.linebreaks,
			stripInvalidXMLChars: this.stripInvalidXMLChars,
		};
	}
	render(to) {
		this.filePath = to;
		const options = this.getOptions();
		options.resolved = this.scopeManager.resolved;
		options.scopeManager = this.scopeManager;
		options.render = render;
		options.joinUncorrupt = joinUncorrupt;
		const { errors, parts } = render(options);
		if (errors.length > 0) {
			this.allErrors = errors;
			this.errorChecker(errors);
			return this;
		}

		this.content = postrender(parts, options);
		this.setModules({
			inspect: { filePath: this.filePath, content: this.content },
		});
		return this;
	}
};
