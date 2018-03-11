"use strict";
const { getScopeParserExecutionError } = require("./errors");

// This class responsibility is to manage the scope
const ScopeManager = class ScopeManager {
	constructor(options) {
		this.scopePath = options.scopePath;
		this.scopePathItem = options.scopePathItem;
		this.scopeList = options.scopeList;
		this.parser = options.parser;
		this.resolved = options.resolved;
	}
	loopOver(tag, callback, inverted) {
		inverted = inverted || false;
		return this.loopOverValue(this.getValue(tag), callback, inverted);
	}
	functorIfInverted(inverted, functor, value, i) {
		if (inverted) {
			functor(value, i);
		}
	}
	isValueFalsy(value, type) {
		return (
			value == null ||
			!value ||
			(type === "[object Array]" && value.length === 0)
		);
	}
	loopOverValue(value, functor, inverted) {
		const type = Object.prototype.toString.call(value);
		const currentValue = this.scopeList[this.num];
		if (this.isValueFalsy(value, type)) {
			return this.functorIfInverted(inverted, functor, currentValue, 0);
		}
		if (type === "[object Array]") {
			for (let i = 0, scope; i < value.length; i++) {
				scope = value[i];
				this.functorIfInverted(!inverted, functor, scope, i);
			}
			return;
		}
		if (type === "[object Object]") {
			return this.functorIfInverted(!inverted, functor, value, 0);
		}
		return this.functorIfInverted(!inverted, functor, currentValue, 0);
	}
	getValue(tag, num) {
		this.num = num == null ? this.scopeList.length - 1 : num;
		const scope = this.scopeList[this.num];
		if (this.resolved) {
			let w = this.resolved;
			this.scopePath.forEach((p, index) => {
				w = w.find(function(r) {
					if (r.tag === p) {
						return true;
					}
				});
				w = w.value[this.scopePathItem[index]];
			});
			return (w = w.find(function(r) {
				if (r.tag === tag) {
					return true;
				}
			}).value);
		}
		// search in the scopes (in reverse order) and keep the first defined value
		let result;
		const parser = this.parser(tag, { scopePath: this.scopePath });
		try {
			result = parser.get(scope, { num: this.num, scopeList: this.scopeList });
		} catch (error) {
			throw getScopeParserExecutionError({ tag, scope, error });
		}
		if (result == null && this.num > 0) {
			return this.getValue(tag, this.num - 1);
		}
		return result;
	}
	getValueAsync(tag, num) {
		this.num = num == null ? this.scopeList.length - 1 : num;
		const scope = this.scopeList[this.num];
		// search in the scopes (in reverse order) and keep the first defined value
		const parser = this.parser(tag, { scopePath: this.scopePath });
		return Promise.resolve(
			parser.get(scope, { num: this.num, scopeList: this.scopeList })
		)
			.catch(function(error) {
				throw getScopeParserExecutionError({ tag, scope, error });
			})
			.then(result => {
				if (result == null && this.num > 0) {
					return this.getValueAsync(tag, this.num - 1);
				}
				return result;
			});
	}
	createSubScopeManager(scope, tag, i) {
		return new ScopeManager({
			resolved: this.resolved,
			parser: this.parser,
			scopeList: this.scopeList.concat(scope),
			scopePath: this.scopePath.concat(tag),
			scopePathItem: this.scopePathItem.concat(i),
		});
	}
};

module.exports = function(options) {
	options.scopePath = [];
	options.scopePathItem = [];
	options.scopeList = [options.tags];
	return new ScopeManager(options);
};
