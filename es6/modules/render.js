const wrapper = require("../module-wrapper");

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
}

module.exports = () => wrapper(new Render());
