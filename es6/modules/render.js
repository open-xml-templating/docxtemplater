const wrapper = require("../module-wrapper.js");
const { getScopeCompilationError } = require("../errors.js");
const { utf8ToWord, hasCorruptCharacters } = require("../doc-utils.js");
const { getCorruptCharactersException } = require("../errors.js");

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
	optionsTransformer(options, docxtemplater) {
		this.parser = docxtemplater.parser;
		this.fileType = docxtemplater.fileType;
		return options;
	}
	set(obj) {
		if (obj.compiled) {
			this.compiled = obj.compiled;
		}
		if (obj.data != null) {
			this.data = obj.data;
		}
	}
	getRenderedMap(mapper) {
		return Object.keys(this.compiled).reduce((mapper, from) => {
			mapper[from] = { from, data: this.data };
			return mapper;
		}, mapper);
	}

	postparse(postparsed, options) {
		const errors = [];
		postparsed.forEach((p) => {
			if (p.type === "placeholder") {
				const tag = p.value;
				try {
					options.cachedParsers[p.lIndex] = this.parser(tag, { tag: p });
				} catch (rootError) {
					errors.push(
						getScopeCompilationError({ tag, rootError, offset: p.offset })
					);
				}
			}
		});
		return { postparsed, errors };
	}
	render(part, { scopeManager, linebreaks, nullGetter }) {
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
		if (value == null) {
			value = nullGetter(part);
		}
		if (hasCorruptCharacters(value)) {
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
		return {
			value:
				linebreaks && typeof value === "string"
					? this.renderLineBreaks(value)
					: utf8ToWord(value),
		};
	}
	recordRuns(part) {
		if (part.tag === `${ftprefix[this.fileType]}:r`) {
			this.recordedRun = [];
		} else if (part.tag === `${ftprefix[this.fileType]}:rPr`) {
			if (part.position === "start") {
				this.recordRun = true;
				this.recordedRun = [part.value];
			}
			if (part.position === "end") {
				this.recordedRun.push(part.value);
				this.recordRun = false;
			}
		} else if (this.recordRun) {
			this.recordedRun.push(part.value);
		}
	}
	renderLineBreaks(value) {
		const p = ftprefix[this.fileType];
		const br = this.fileType === "docx" ? "<w:r><w:br/></w:r>" : "<a:br/>";
		const lines = value.split("\n");
		const runprops = this.recordedRun.join("");
		return lines
			.map(function (line) {
				return utf8ToWord(line);
			})
			.reduce((result, line, i) => {
				result.push(line);
				if (i < lines.length - 1) {
					result.push(
						`</${p}:t></${p}:r>${br}<${p}:r>${runprops}<${p}:t${
							this.fileType === "docx" ? ' xml:space="preserve"' : ""
						}>`
					);
				}
				return result;
			}, []);
	}
}

module.exports = () => wrapper(new Render());
