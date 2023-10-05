const { wordToUtf8, convertSpaces } = require("./doc-utils.js");
const xmlMatcher = require("./xml-matcher.js");
const Lexer = require("./lexer.js");
const Parser = require("./parser.js");
const render = require("./render.js");
const postrender = require("./postrender.js");
const resolve = require("./resolve.js");
const joinUncorrupt = require("./join-uncorrupt.js");

function getFullText(content, tagsXmlArray) {
	const matcher = xmlMatcher(content, tagsXmlArray);
	const result = matcher.matches.map(function (match) {
		return match.array[2];
	});
	return wordToUtf8(convertSpaces(result.join("")));
}

module.exports = class XmlTemplater {
	constructor(content, options) {
		this.cachedParsers = {};
		this.content = content;
		Object.keys(options).forEach((key) => {
			this[key] = options[key];
		});
		this.setModules({ inspect: { filePath: options.filePath } });
	}
	resolveTags(tags) {
		this.tags = tags;
		const options = this.getOptions();
		const filePath = this.filePath;
		options.scopeManager = this.scopeManager;
		options.resolve = resolve;
		const errors = [];
		return Promise.all(
			this.modules.map(function (module) {
				return Promise.resolve(module.preResolve(options)).catch(function (e) {
					errors.push(e);
				});
			})
		).then(() => {
			if (errors.length !== 0) {
				throw errors;
			}
			return resolve(options).then(({ resolved, errors }) => {
				errors.forEach((error) => {
					// error properties might not be defined if some foreign error
					// (unhandled error not thrown by docxtemplater willingly) is
					// thrown.
					error.properties = error.properties || {};
					error.properties.file = filePath;
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
			this.delimiters,
			this.syntax
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
		errors.forEach((error) => {
			// error properties might not be defined if some foreign
			// (unhandled error not thrown by docxtemplater willingly) is
			// thrown.
			error.properties = error.properties || {};
			error.properties.file = this.filePath;
		});
		this.modules.forEach(function (module) {
			errors = module.errorsTransformer(errors);
		});
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
		this.setModules({ inspect: { content: this.content } });
		return this;
	}
};
