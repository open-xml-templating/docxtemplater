const wrapper = require("../module-wrapper");
const {getScopeCompilationError} = require("../errors");

class Render {
	constructor() {
		this.name = "Render";
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
			mapper[from] = {from, data: this.data};
			return mapper;
		}, mapper);
	}
	optionsTransformer(options, docxtemplater) {
		this.parser = docxtemplater.parser;
		return options;
	}
	postparse(postparsed) {
		const errors = [];
		postparsed.forEach((p) => {
			if (p.type === "placeholder") {
				const tag = p.value;
				try {
					this.parser(tag);
				}
				catch (rootError) {
					errors.push(getScopeCompilationError({tag, rootError}));
				}
			}
		});
		return {postparsed, errors};
	}
}

module.exports = () => wrapper(new Render());
