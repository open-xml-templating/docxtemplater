"use strict";
// This class responsibility is to manage the scope
var Errors = require("./errors");
var DocUtils = require("./docUtils");

module.exports = class ScopeManager {
	constructor(options) {
		this.tags = options.tags;
		this.scopePath = options.scopePath;
		this.usedTags = options.usedTags;
		this.scopeList = options.scopeList;
		this.parser = options.parser;
		this.moduleManager = options.moduleManager;
		this.nullGetter = options.nullGetter;
		this.delimiters = options.delimiters;
		this.moduleManager.scopeManager = this;
	}
	loopOver(tag, callback, inverted) {
		inverted = inverted || false;
		var value = this.getValue(tag);
		return this.loopOverValue(value, callback, inverted);
	}
	functorIfInverted(inverted, functor, value) {
		if (inverted) {
			functor(value);
		}
	}
	functorIfNotInverted(inverted, functor, value) {
		if (!inverted) {
			functor(value);
		}
	}
	isValueFalsy(value, type) {
		return (!(typeof value !== "undefined" && value != null)) || (!value) || (type === "[object Array]" && value.length === 0);
	}
	loopOverValue(value, functor, inverted) {
		var type = Object.prototype.toString.call(value);
		var currentValue = this.scopeList[this.num];
		if (this.isValueFalsy(value, type)) {
			return this.functorIfInverted(inverted, functor, currentValue);
		}
		if (type === "[object Array]") {
			for (var i = 0, scope; i < value.length; i++) {
				scope = value[i];
				this.functorIfNotInverted(inverted, functor, scope);
			}
			return;
		}
		if (type === "[object Object]") {
			return this.functorIfNotInverted(inverted, functor, value);
		}
		if (value === true) {
			return this.functorIfNotInverted(inverted, functor, currentValue);
		}
	}
	getValue(tag, num) {
		this.num = num == null ? (this.scopeList.length - 1) : num;
		var err;
		var parser;
		var result;
		var scope = this.scopeList[this.num];
		try {
			parser = this.parser(tag);
		}
		catch (error) {
			err = new Errors.XTScopeParserError("Scope parser compilation failed");
			err.properties = {
				id: "scopeparser_compilation_failed",
				tag: tag,
				explanation: `The scope parser for the tag ${tag} failed to compile`,
			};
			throw err;
		}
		try {
			result = parser.get(scope);
		}
		catch (error) {
			err = new Errors.XTScopeParserError("Scope parser execution failed");
			err.properties = {
				id: "scopeparser_execution_failed",
				explanation: `The scope parser for the tag ${tag} failed to execute`,
				scope: scope,
				tag: tag,
			};
			throw err;
		}
		if (!(typeof result !== "undefined" && result != null) && this.num > 0) { return this.getValue(tag, this.num - 1); }
		return result;
	}
	getValueFromScope(tag) {
		// search in the scopes (in reverse order) and keep the first defined value
		var result = this.getValue(tag);
		var value;
		if ((typeof result !== "undefined" && result != null)) {
			if (typeof result === "string") {
				this.useTag(tag, true);
				value = result;
			}
			else if (typeof result === "number") {
				value = String(result);
			}
			else {
				value = result;
			}
		}
		else {
			this.useTag(tag, false);
			return null;
		}
		return value;
	}
	// set the tag as used, so that DocxGen can return the list of all tags
	useTag(tag, val) {
		var u;
		if (val) {
			u = this.usedTags.def;
		}
		else {
			u = this.usedTags.undef;
		}
		var iterable = this.scopePath;
		for (var i = 0, s; i < iterable.length; i++) {
			s = iterable[i];
			if (!(u[s] != null)) { u[s] = {}; }
			u = u[s];
		}
		if (tag !== "") {
			u[tag] = true;
		}
	}
	createSubScopeManager(scope, tag) {
		var options = DocUtils.cloneDeep({
			scopePath: this.scopePath,
			usedTags: this.usedTags,
			scopeList: this.scopeList,
		});

		options.parser = this.parser;
		options.moduleManager = this.moduleManager;
		options.nullGetter = this.nullGetter;
		options.delimiters = this.delimiters;

		options.tags = scope;
		if (tag != null) {
			options.scopeList = this.scopeList.concat(scope);
			options.scopePath = this.scopePath.concat(tag);
		}
		else {
			options.scopeList = [];
			options.scopePath = [];
		}
		return new ScopeManager(options);
	}
};
