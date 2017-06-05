"use strict";
const {XTScopeParserError} = require("./errors");

// This class responsibility is to manage the scope
const ScopeManager = class ScopeManager {
	constructor(options) {
		this.scopePath = options.scopePath;
		this.scopeList = options.scopeList;
		this.loopMetaData = options.loopMetaData;
		this.parser = options.parser;
	}
	loopOver(tag, callback, inverted) {
		inverted = inverted || false;
		return this.loopOverValue(this.getValue(tag), callback, inverted);
	}
	functorIfInverted(inverted, functor, value, loopMetaData) {
		if (inverted) {
			functor(value, loopMetaData);
		}
	}
	isValueFalsy(value, type) {
		return (value == null || !value || (type === "[object Array]" && value.length === 0));
	}
	loopOverValue(value, functor, inverted) {
		const type = Object.prototype.toString.call(value);
		const currentValue = this.scopeList[this.num];
		if (this.isValueFalsy(value, type)) {
			return this.functorIfInverted(inverted, functor, currentValue);
		}
		if (type === "[object Array]") {
			for (let i = 0; i < value.length; i++) {
				const loopMetaData = {
					length: value.length,
					index: i,
				};
				this.functorIfInverted(!inverted, functor, value[i], loopMetaData);
			}
			return;
		}
		if (type === "[object Object]") {
			return this.functorIfInverted(!inverted, functor, value);
		}
		return this.functorIfInverted(!inverted, functor, currentValue);
	}
	getValue(tag, num) {
		// search in the scopes (in reverse order) and keep the first defined value
		this.num = num == null ? (this.scopeList.length - 1) : num;
		let err;
		let result;
		const scope = this.scopeList[this.num];
		const parser = this.parser(tag, {scopePath: this.scopePath});
		try {
			result = parser.get(scope, {loopMetaData: this.loopMetaData, num: this.num, scopeList: this.scopeList});
		}
		catch (error) {
			err = new XTScopeParserError("Scope parser execution failed");
			err.properties = {
				id: "scopeparser_execution_failed",
				explanation: `The scope parser for the tag ${tag} failed to execute`,
				scope,
				tag,
				rootError: error,
			};
			throw err;
		}
		if (result == null && this.num > 0) { return this.getValue(tag, this.num - 1); }
		return result;
	}
	createSubScopeManager(scope, tag, loopMetaData) {
		return new ScopeManager({
			scopePath: this.scopePath.slice(0).concat(tag),
			scopeList: this.scopeList.slice(0).concat(scope),
			parser: this.parser,
			loopMetaData,
		});
	}
};

ScopeManager.createBaseScopeManager = function ({parser, tags}) {
	return new ScopeManager({parser, tags, scopePath: [], scopeList: [tags]});
};

module.exports = ScopeManager;
