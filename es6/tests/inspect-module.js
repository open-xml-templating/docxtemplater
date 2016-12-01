const _ = require("lodash");

class inspectModule {
	constructor() {
		this.inspect = {};
		this.fullInspected = {};
		this.filePath = null;
	}
	set(obj) {
		if (obj.inspect) {
			if (obj.inspect.filePath) {
				this.filePath = obj.inspect.filePath;
			}
			this.inspect = _.merge({}, this.inspect, obj.inspect);
			this.fullInspected[this.filePath] = this.inspect;
		}
	}
}

module.exports = inspectModule;
