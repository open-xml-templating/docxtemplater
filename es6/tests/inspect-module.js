const _ = require("lodash");

class inspectModule {
	constructor() {
		this.inspect = {};
	}
	set(obj) {
		if (obj.inspect) {
			this.inspect = _.merge({}, this.inspect, obj.inspect);
		}
	}

}

module.exports = inspectModule;
