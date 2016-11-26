"use strict";
const Errors = require("./errors");

// This class responsibility is to manage the scope
const ScopeManager = class ScopeManager {
	constructor(options) {
		this.scopePath = options.scopePath;
		this.scopeList = options.scopeList;
		this.parser = options.parser;
	}
	loopOver(tag, callback, inverted) {
		inverted = inverted || false;
		return this.loopOverValue(this.getValue(tag), callback, inverted);
	}
	functorIfInverted(inverted, functor, value) {
		if (inverted) {
			functor(value);
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
			for (let i = 0, scope; i < value.length; i++) {
				scope = value[i];
				this.functorIfInverted(!inverted, functor, scope);
			}
			return;
		}
		if (type === "[object Object]") {
			return this.functorIfInverted(!inverted, functor, value);
		}
		if (value === true) {
			return this.functorIfInverted(!inverted, functor, currentValue);
		}
	}
	getValue(tag, num) {
		// search in the scopes (in reverse order) and keep the first defined value
		this.num = num == null ? (this.scopeList.length - 1) : num;
		let err;
		let parser;
		let result;
		const scope = this.scopeList[this.num];
		try {
			parser = this.parser(tag);
		}
		catch (error) {
			err = new Errors.XTScopeParserError("Scope parser compilation failed");
			err.properties = {
				id: "scopeparser_compilation_failed",
				tag,
				explanation: `The scope parser for the tag ${tag} failed to compile`,
				rootError: error,
			};
			throw err;
		}
		try {
			result = parser.get(scope, {num: this.num, scopeList: this.scopeList});
		}
		catch (error) {
			err = new Errors.XTScopeParserError("Scope parser execution failed");
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
	createSubScopeManager(scope, tag) {
		const options = {
			scopePath: this.scopePath.slice(0),
			scopeList: this.scopeList.slice(0),
		};

		options.parser = this.parser;
		options.scopeList = this.scopeList.concat(scope);
		options.scopePath = this.scopePath.concat(tag);
		return new ScopeManager(options);
	}
};

ScopeManager.createBaseScopeManager = function ({parser, tags}) {
	const options = {parser, tags};
	options.scopePath = [];
	options.scopeList = [tags];
	return new ScopeManager(options);
};

module.exports = ScopeManager;
