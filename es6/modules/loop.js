const {
	mergeObjects,
	chunkBy,
	last,
	isParagraphStart,
	isParagraphEnd,
	isContent,
} = require("../doc-utils");
const wrapper = require("../module-wrapper");
const { match, getValue, getValues } = require("../prefix-matcher");

const moduleName = "loop";

function hasContent(parts) {
	return parts.some(function(part) {
		return isContent(part);
	});
}

function isEnclosedByParagraphs(parsed) {
	if (parsed.length === 0) {
		return false;
	}
	return isParagraphStart(parsed[0]) && isParagraphEnd(last(parsed));
}

function getOffset(chunk) {
	return hasContent(chunk) ? 0 : chunk.length;
}

class LoopModule {
	constructor() {
		this.name = "LoopModule";
		this.prefix = {
			start: "#",
			end: "/",
			dash: /^-([^\s]+)\s(.+)$/,
			inverted: "^",
		};
	}
	parse(placeHolderContent) {
		const module = moduleName;
		const type = "placeholder";
		const { start, inverted, dash, end } = this.prefix;
		if (match(start, placeHolderContent)) {
			return {
				type,
				value: getValue(start, placeHolderContent),
				expandTo: "auto",
				module,
				location: "start",
				inverted: false,
			};
		}
		if (match(inverted, placeHolderContent)) {
			return {
				type,
				value: getValue(inverted, placeHolderContent),
				expandTo: "auto",
				module,
				location: "start",
				inverted: true,
			};
		}
		if (match(end, placeHolderContent)) {
			return {
				type,
				value: getValue(end, placeHolderContent),
				module,
				location: "end",
			};
		}
		if (match(dash, placeHolderContent)) {
			const [, expandTo, value] = getValues(dash, placeHolderContent);
			return {
				type,
				value,
				expandTo,
				module,
				location: "start",
				inverted: false,
			};
		}
		return null;
	}
	getTraits(traitName, parsed) {
		if (traitName !== "expandPair") {
			return;
		}

		return parsed.reduce(function(tags, part, offset) {
			if (part.type === "placeholder" && part.module === moduleName) {
				tags.push({ part, offset });
			}
			return tags;
		}, []);
	}
	postparse(parsed, { basePart }) {
		if (!isEnclosedByParagraphs(parsed)) {
			return parsed;
		}
		if (
			!basePart ||
			basePart.expandTo !== "auto" ||
			basePart.module !== moduleName
		) {
			return parsed;
		}
		let level = 0;
		const chunks = chunkBy(parsed, function(p) {
			if (isParagraphStart(p)) {
				level++;
				if (level === 1) {
					return "start";
				}
			}
			if (isParagraphEnd(p)) {
				level--;
				if (level === 0) {
					return "end";
				}
			}
			return null;
		});
		if (chunks.length <= 2) {
			return parsed;
		}

		const firstChunk = chunks[0];
		const lastChunk = last(chunks);
		const firstOffset = getOffset(firstChunk);
		const lastOffset = getOffset(lastChunk);
		if (firstOffset === 0 || lastOffset === 0) {
			return parsed;
		}
		return parsed.slice(firstOffset, parsed.length - lastOffset);
	}
	render(part, options) {
		if (part.type !== "placeholder" || part.module !== moduleName) {
			return null;
		}
		let totalValue = [];
		let errors = [];
		function loopOver(scope, i) {
			const scopeManager = options.scopeManager.createSubScopeManager(
				scope,
				part.value,
				i,
				part
			);
			const subRendered = options.render(
				mergeObjects({}, options, {
					compiled: part.subparsed,
					tags: {},
					scopeManager,
				})
			);
			totalValue = totalValue.concat(subRendered.parts);
			errors = errors.concat(subRendered.errors || []);
		}
		const result = options.scopeManager.loopOver(
			part.value,
			loopOver,
			part.inverted,
			{
				part,
			}
		);
		if (result === false) {
			return {
				value: part.emptyValue || "",
				errors,
			};
		}
		return { value: totalValue.join(""), errors };
	}
	resolve(part, options) {
		if (part.type !== "placeholder" || part.module !== moduleName) {
			return null;
		}

		const sm = options.scopeManager;
		const promisedValue = sm.getValue(part.value, { part });
		const promises = [];
		function loopOver(scope, i) {
			const scopeManager = sm.createSubScopeManager(scope, part.value, i, part);
			promises.push(
				options.resolve({
					filePath: options.filePath,
					modules: options.modules,
					baseNullGetter: options.baseNullGetter,
					resolve: options.resolve,
					compiled: part.subparsed,
					tags: {},
					scopeManager,
				})
			);
		}
		return Promise.resolve(promisedValue).then(function(value) {
			sm.loopOverValue(value, loopOver, part.inverted);
			return Promise.all(promises).then(function(r) {
				return r.map(function({ resolved }) {
					return resolved;
				});
			});
		});
	}
}

module.exports = () => wrapper(new LoopModule());
