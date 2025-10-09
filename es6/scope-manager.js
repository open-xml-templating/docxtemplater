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
		for (
			let i = this.resolveOffset, len = this.scopePath.length;
			i < len;
			i++
		) {
			const lIndex = this.scopeLindex[i];
			w = find(w, (r) => r.lIndex === lIndex);
			w = w.value[this.scopePathItem[i]];
		}
		return find(w, (r) => meta.part.lIndex === r.lIndex).value;
	}
	// search in the scopes (in reverse order) and keep the first defined value
	let result;

	let parser;
	if (!this.cachedParsers || !meta.part) {
		parser = this.parser(tag, {
			tag: meta.part,
			scopePath: this.scopePath,
		});
	} else if (this.cachedParsers[meta.part.lIndex]) {
		parser = this.cachedParsers[meta.part.lIndex];
	} else {
		parser = this.cachedParsers[meta.part.lIndex] = this.parser(tag, {
			tag: meta.part,
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
	return result;
}

function getValueAsync(tag, meta, num) {
	const scope = this.scopeList[num];
	// search in the scopes (in reverse order) and keep the first defined value
	let parser;
	if (!this.cachedParsers || !meta.part) {
		parser = this.parser(tag, {
			tag: meta.part,
			scopePath: this.scopePath,
		});
	} else if (this.cachedParsers[meta.part.lIndex]) {
		parser = this.cachedParsers[meta.part.lIndex];
	} else {
		parser = this.cachedParsers[meta.part.lIndex] = this.parser(tag, {
			tag: meta.part,
			scopePath: this.scopePath,
		});
	}

	return Promise.resolve()
		.then(() => parser.get(scope, this.getContext(meta, num)))
		.catch((error) => {
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

const ScopeManager = class ScopeManager {
	constructor(options) {
		this.root = options.root || this;
		this.resolveOffset = options.resolveOffset || 0;
		this.scopePath = options.scopePath;
		this.scopePathItem = options.scopePathItem;
		this.scopePathLength = options.scopePathLength;
		this.scopeList = options.scopeList;
		this.scopeType = "";
		this.scopeTypes = options.scopeTypes;
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
			this.scopeType = false;
			return this.functorIfInverted(
				inverted,
				functor,
				last(this.scopeList),
				0,
				1
			);
		}
		if (type === "[object Array]") {
			this.scopeType = "array";
			for (let i = 0; i < value.length; i++) {
				this.functorIfInverted(
					!inverted,
					functor,
					value[i],
					i,
					value.length
				);
			}
			return true;
		}
		if (type === "[object Object]") {
			this.scopeType = "object";
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
		const result = getValue.call(
			this,
			tag,
			meta,
			this.scopeList.length - 1
		);
		if (typeof result === "function") {
			return result(this.scopeList[this.scopeList.length - 1], this);
		}
		return result;
	}
	getValueAsync(tag, meta) {
		return getValueAsync
			.call(this, tag, meta, this.scopeList.length - 1)
			.then((result) => {
				if (typeof result === "function") {
					return result(
						this.scopeList[this.scopeList.length - 1],
						this
					);
				}
				return result;
			});
	}
	getContext(meta, num) {
		return {
			num,
			meta,
			scopeList: this.scopeList,
			resolved: this.resolved,
			scopePath: this.scopePath,
			scopeTypes: this.scopeTypes,
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
			scopeTypes: concatArrays([this.scopeTypes, [this.scopeType]]),
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
	options.scopeTypes = [];
	options.scopeLindex = [];
	options.scopeList = [options.tags];
	return new ScopeManager(options);
};
