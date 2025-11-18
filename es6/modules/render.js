const wrapper = require("../module-wrapper.js");
const {
	getScopeCompilationError,
	getCorruptCharactersException,
} = require("../errors.js");
const {
	utf8ToWord,
	hasCorruptCharacters,
	removeCorruptCharacters,
} = require("../doc-utils.js");

const {
	settingsContentType,
	coreContentType,
	appContentType,
	customContentType,
} = require("../content-types.js");

const NON_LINE_BREAKS_CONTENT_TYPE = [
	settingsContentType,
	coreContentType,
	appContentType,
	customContentType,
];

const ftprefix = {
	docx: "w",
	pptx: "a",
};

class Render {
	constructor() {
		this.name = "Render";
		this.recordRun = false;
		this.recordedRun = [];
	}

	set(obj) {
		if (obj.compiled) {
			this.compiled = obj.compiled;
		}
		if (obj.data != null) {
			this.data = obj.data;
		}
	}

	optionsTransformer(options, docxtemplater) {
		this.docxtemplater = docxtemplater;
		this.brTag =
			docxtemplater.fileType === "docx"
				? "<w:r><w:br/></w:r>"
				: "<a:br/>";
		this.prefix = ftprefix[docxtemplater.fileType];
		this.runStartTag = `${this.prefix}:r`;
		this.runPropsStartTag = `${this.prefix}:rPr`;
		return options;
	}

	postparse(postparsed, options) {
		const errors = [];
		for (const p of postparsed) {
			if (p.type === "placeholder") {
				const tag = p.value;
				try {
					options.cachedParsers[p.lIndex] = this.docxtemplater.parser(
						tag,
						{
							tag: p,
						}
					);
				} catch (rootError) {
					errors.push(
						getScopeCompilationError({
							tag,
							rootError,
							offset: p.offset,
						})
					);
				}
			}
		}
		return { postparsed, errors };
	}

	getRenderedMap(mapper) {
		for (const from in this.compiled) {
			mapper[from] = { from, data: this.data };
		}
		return mapper;
	}

	render(
		part,
		{
			contentType,
			scopeManager,
			linebreaks,
			nullGetter,
			fileType,
			stripInvalidXMLChars,
		}
	) {
		if (NON_LINE_BREAKS_CONTENT_TYPE.indexOf(contentType) !== -1) {
			// Fixes issue tested in #docprops-linebreak
			linebreaks = false;
		}
		if (linebreaks) {
			this.recordRuns(part);
		}
		if (part.type !== "placeholder" || part.module) {
			return;
		}
		let value;
		try {
			value = scopeManager.getValue(part.value, { part });
		} catch (e) {
			return { errors: [e] };
		}
		value ??= nullGetter(part);
		if (typeof value === "string") {
			if (stripInvalidXMLChars) {
				value = removeCorruptCharacters(value);
			} else if (
				["docx", "pptx", "xlsx"].indexOf(fileType) !== -1 &&
				hasCorruptCharacters(value)
			) {
				return {
					errors: [
						getCorruptCharactersException({
							tag: part.value,
							value,
							offset: part.offset,
						}),
					],
				};
			}
		}
		if (fileType === "text") {
			return { value };
		}
		return {
			value:
				linebreaks && typeof value === "string"
					? this.renderLineBreaks(value)
					: utf8ToWord(value),
		};
	}

	recordRuns(part) {
		if (part.tag === this.runStartTag) {
			this.recordedRun = "";
		} else if (part.tag === this.runPropsStartTag) {
			if (part.position === "start") {
				this.recordRun = true;
				this.recordedRun += part.value;
			}
			if (part.position === "end" || part.position === "selfclosing") {
				this.recordedRun += part.value;
				this.recordRun = false;
			}
		} else if (this.recordRun) {
			this.recordedRun += part.value;
		}
	}

	renderLineBreaks(value) {
		const result = [];
		const lines = value.split("\n");
		for (let i = 0, len = lines.length; i < len; i++) {
			result.push(utf8ToWord(lines[i]));
			if (i < lines.length - 1) {
				result.push(
					`</${this.prefix}:t></${this.prefix}:r>${this.brTag}<${this.prefix}:r>${this.recordedRun}<${this.prefix}:t${
						this.docxtemplater.fileType === "docx"
							? ' xml:space="preserve"'
							: ""
					}>`
				);
			}
		}
		return result;
	}
}

module.exports = () => wrapper(new Render());
