"use strict";
const { getScopeParserExecutionError } = require("./errors.js");
const { last } = require("./utils.js");
const { concatArrays } = require("./doc-utils.js");

function find(list, fn) {
	const length = list.length >>> 0;
	let value;

	for (let i = 0; i < length; i++) {
		value = list[i];
		if (fn.call(this, value, i, list)) {
			return value;
		}
	}
	return undefined;
}

function getValue(tag, meta, num) {
	const scope = this.scopeList[num];
	if (this.root.finishedResolving) {
		let w = this.resolved;
		this.scopePath.slice(this.resolveOffset).forEach((p, index) => {
			const lIndex = this.scopeLindex[index];
			w = find(w, function (r) {
				return r.lIndex === lIndex;
			});
			w = w.value[this.scopePathItem[index]];
		});
		return [
			this.scopePath.length - 1,
			find(w, function (r) {
				return meta.part.lIndex === r.lIndex;
			}).value,
		];
	}
	// search in the scopes (in reverse order) and keep the first defined value
	let result;

	let parser;
	if (!this.cachedParsers || !meta.part) {
		parser = this.parser(tag, {
			scopePath: this.scopePath,
		});
	} else if (this.cachedParsers[meta.part.lIndex]) {
		parser = this.cachedParsers[meta.part.lIndex];
	} else {
		parser = this.cachedParsers[meta.part.lIndex] = this.parser(tag, {
			scopePath: this.scopePath,
		});
	}
	try {
		result = parser.get(scope, this.getContext(meta, num));
	} catch (error) {
		throw getScopeParserExecutionError({
			tag,
			scope,
			error,
			offset: meta.part.offset,
		});
	}
	if (result == null && num > 0) {
		return getValue.call(this, tag, meta, num - 1);
	}
	return [num, result];
}

function getValueAsync(tag, meta, num) {
	const scope = this.scopeList[num];
	// search in the scopes (in reverse order) and keep the first defined value
	let parser;
	if (!this.cachedParsers || !meta.part) {
		parser = this.parser(tag, {
			scopePath: this.scopePath,
		});
	} else if (this.cachedParsers[meta.part.lIndex]) {
		parser = this.cachedParsers[meta.part.lIndex];
	} else {
		parser = this.cachedParsers[meta.part.lIndex] = this.parser(tag, {
			scopePath: this.scopePath,
		});
	}

	return Promise.resolve()
		.then(() => {
			return parser.get(scope, this.getContext(meta, num));
		})
		.catch(function (error) {
			throw getScopeParserExecutionError({
				tag,
				scope,
				error,
				offset: meta.part.offset,
			});
		})
		.then((result) => {
			if (result == null && num > 0) {
				return getValueAsync.call(this, tag, meta, num - 1);
			}
			return result;
		});
}

// This class responsibility is to manage the scope
const ScopeManager = class ScopeManager {
	constructor(options) {
		this.root = options.root || this;
		this.resolveOffset = options.resolveOffset || 0;
		this.scopePath = options.scopePath;
		this.scopePathItem = options.scopePathItem;
		this.scopePathLength = options.scopePathLength;
		this.scopeList = options.scopeList;
		this.scopeLindex = options.scopeLindex;
		this.parser = options.parser;
		this.resolved = options.resolved;
		this.cachedParsers = options.cachedParsers;
	}
	loopOver(tag, functor, inverted, meta) {
		return this.loopOverValue(this.getValue(tag, meta), functor, inverted);
	}
	functorIfInverted(inverted, functor, value, i, length) {
		if (inverted) {
			functor(value, i, length);
		}
		return inverted;
	}
	isValueFalsy(value, type) {
		return (
			value == null ||
			!value ||
			(type === "[object Array]" && value.length === 0)
		);
	}
	loopOverValue(value, functor, inverted) {
		if (this.root.finishedResolving) {
			inverted = false;
		}
		const type = Object.prototype.toString.call(value);
		if (this.isValueFalsy(value, type)) {
			return this.functorIfInverted(
				inverted,
				functor,
				last(this.scopeList),
				0,
				1
			);
		}
		if (type === "[object Array]") {
			for (let i = 0; i < value.length; i++) {
				this.functorIfInverted(!inverted, functor, value[i], i, value.length);
			}
			return true;
		}
		if (type === "[object Object]") {
			return this.functorIfInverted(!inverted, functor, value, 0, 1);
		}
		return this.functorIfInverted(
			!inverted,
			functor,
			last(this.scopeList),
			0,
			1
		);
	}
	getValue(tag, meta) {
		const [num, result] = getValue.call(
			this,
			tag,
			meta,
			this.scopeList.length - 1
		);
		this.num = num;
		return result;
	}
	getValueAsync(tag, meta) {
		return getValueAsync.call(this, tag, meta, this.scopeList.length - 1);
	}
	getContext(meta, num) {
		return {
			num,
			meta,
			scopeList: this.scopeList,
			resolved: this.resolved,
			scopePath: this.scopePath,
			scopePathItem: this.scopePathItem,
			scopePathLength: this.scopePathLength,
		};
	}
	createSubScopeManager(scope, tag, i, part, length) {
		return new ScopeManager({
			root: this.root,
			resolveOffset: this.resolveOffset,
			resolved: this.resolved,
			parser: this.parser,
			cachedParsers: this.cachedParsers,
			scopeList: concatArrays([this.scopeList, [scope]]),
			scopePath: concatArrays([this.scopePath, [tag]]),
			scopePathItem: concatArrays([this.scopePathItem, [i]]),
			scopePathLength: concatArrays([this.scopePathLength, [length]]),
			scopeLindex: concatArrays([this.scopeLindex, [part.lIndex]]),
		});
	}
};

module.exports = function (options) {
	options.scopePath = [];
	options.scopePathItem = [];
	options.scopePathLength = [];
	options.scopeLindex = [];
	options.scopeList = [options.tags];
	return new ScopeManager(options);
};
