"use strict";

module.exports = class ModuleManager {
	constructor() {
		var instances = {};
		this.getInstance = function (obj) {
			return instances[obj];
		};
		this.setInstance = function (key, value) {
			instances[key] = value;
		};
		this.modules = [];
	}
	attachModule(module) {
		this.modules.push(module);
		module.manager = this;
		return this;
	}
	sendEvent(eventName, data) {
		return (() => {
			var result = [];
			var iterable = this.modules;
			for (var i = 0, m; i < iterable.length; i++) {
				m = iterable[i];
				result.push(m.handleEvent(eventName, data));
			}
			return result;
		})();
	}
	get(value) {
		var result = null;
		var iterable = this.modules;
		for (var i = 0, m; i < iterable.length; i++) {
			m = iterable[i];
			var aux = m.get(value);
			result = aux != null ? aux : result;
		}
		return result;
	}
	handle(type, data) {
		var result = null;
		var iterable = this.modules;
		for (var i = 0, m; i < iterable.length; i++) {
			m = iterable[i];
			if (result != null) { return; }
			var aux = m.handle(type, data);
			result = aux != null ? aux : result;
		}
		return result;
	}
};
