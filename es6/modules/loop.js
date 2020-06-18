const {
	mergeObjects,
	chunkBy,
	last,
	isParagraphStart,
	isParagraphEnd,
	isContent,
	startsWith,
} = require("../doc-utils");
const wrapper = require("../module-wrapper");

const moduleName = "loop";

function hasContent(parts) {
	return parts.some(function (part) {
		return isContent(part);
	});
}

function getFirstMeaningFulPart(parsed) {
	for (let i = 0, len = parsed.length; i < len; i++) {
		if (parsed[i].type !== "content") {
			return parsed[i];
		}
	}
	return null;
}

function isInsideParagraphLoop(part) {
	const firstMeaningfulPart = getFirstMeaningFulPart(part.subparsed);
	return firstMeaningfulPart != null && firstMeaningfulPart.tag !== "w:t";
}

function getPageBreakIfApplies(part) {
	if (part.hasPageBreak) {
		if (isInsideParagraphLoop(part)) {
			return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
		}
	}
	return "";
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

function addPageBreakAtEnd(subRendered) {
	let found = false;
	let i = subRendered.parts.length - 1;
	for (let j = subRendered.parts.length - 1; i >= 0; i--) {
		const p = subRendered.parts[j];
		if (p === "</w:p>" && !found) {
			found = true;
			subRendered.parts.splice(j, 0, '<w:r><w:br w:type="page"/></w:r>');
			break;
		}
	}

	if (!found) {
		subRendered.parts.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
	}
}

function addPageBreakAtBeginning(subRendered) {
	subRendered.parts.unshift('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
}

function dropHeaderFooterRefs(parts) {
	return parts.filter(function (text) {
		if (
			startsWith(text, "<w:headerReference") ||
			startsWith(text, "<w:footerReference")
		) {
			return false;
		}
		return true;
	});
}

function hasPageBreak(chunk) {
	return chunk.some(function (part) {
		if (part.tag === "w:br" && part.value.indexOf('w:type="page"') !== -1) {
			return true;
		}
	});
}

function getSectPrHeaderFooterChangeCount(chunks) {
	let collectSectPr = false;
	let sectPrCount = 0;
	chunks.forEach(function (part) {
		if (part.tag === "w:sectPr" && part.position === "start") {
			collectSectPr = true;
		}
		if (collectSectPr) {
			if (
				part.tag === "w:headerReference" ||
				part.tag === "w:footerReference"
			) {
				sectPrCount++;
				collectSectPr = false;
			}
		}
		if (part.tag === "w:sectPr" && part.position === "end") {
			collectSectPr = false;
		}
	});
	return sectPrCount;
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
	parse(placeHolderContent, { match, getValue, getValues }) {
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

		return parsed.reduce(function (tags, part, offset) {
			if (
				part.type === "placeholder" &&
				part.module === moduleName &&
				part.subparsed == null
			) {
				tags.push({ part, offset });
			}
			return tags;
		}, []);
	}
	postparse(parsed, { basePart }) {
		if (basePart) {
			basePart.sectPrCount = getSectPrHeaderFooterChangeCount(parsed);
		}
		if (
			!basePart ||
			basePart.expandTo !== "auto" ||
			basePart.module !== moduleName ||
			!isEnclosedByParagraphs(parsed)
		) {
			return parsed;
		}

		let level = 0;
		const chunks = chunkBy(parsed, function (p) {
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

		basePart.hasPageBreak = hasPageBreak(lastChunk);
		basePart.hasPageBreakBeginning = hasPageBreak(firstChunk);

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
		function loopOver(scope, i, length) {
			const scopeManager = options.scopeManager.createSubScopeManager(
				scope,
				part.value,
				i,
				part,
				length
			);
			const subRendered = options.render(
				mergeObjects({}, options, {
					compiled: part.subparsed,
					tags: {},
					scopeManager,
				})
			);
			if (
				part.hasPageBreak &&
				i === length - 1 &&
				isInsideParagraphLoop(part)
			) {
				addPageBreakAtEnd(subRendered);
			}
			if (part.sectPrCount === 1) {
				if (
					i !== 0 ||
					scopeManager.scopePathItem.some(function (i) {
						return i !== 0;
					})
				) {
					subRendered.parts = dropHeaderFooterRefs(subRendered.parts);
				}
			}
			if (part.hasPageBreakBeginning && isInsideParagraphLoop(part)) {
				addPageBreakAtBeginning(subRendered);
			}
			totalValue = totalValue.concat(subRendered.parts);
			errors = errors.concat(subRendered.errors || []);
		}
		let result;
		try {
			result = options.scopeManager.loopOver(
				part.value,
				loopOver,
				part.inverted,
				{
					part,
				}
			);
		} catch (e) {
			errors.push(e);
			return { errors };
		}
		// if the loop is showing empty content
		if (result === false) {
			return {
				value: getPageBreakIfApplies(part) || "",
				errors,
			};
		}
		const contains = options.fileTypeConfig.tagShouldContain || [];

		return { value: options.joinUncorrupt(totalValue, contains), errors };
	}
	resolve(part, options) {
		if (part.type !== "placeholder" || part.module !== moduleName) {
			return null;
		}

		const sm = options.scopeManager;
		const promisedValue = Promise.resolve().then(function () {
			return sm.getValue(part.value, { part });
		});
		const promises = [];
		function loopOver(scope, i, length) {
			const scopeManager = sm.createSubScopeManager(
				scope,
				part.value,
				i,
				part,
				length
			);
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
		const errorList = [];
		return promisedValue.then(function (value) {
			sm.loopOverValue(value, loopOver, part.inverted);
			return Promise.all(promises)
				.then(function (r) {
					return r.map(function ({ resolved, errors }) {
						if (errors.length > 0) {
							errorList.push(...errors);
						}
						return resolved;
					});
				})
				.then(function (value) {
					if (errorList.length > 0) {
						throw errorList;
					}
					return value;
				});
		});
	}
}

module.exports = () => wrapper(new LoopModule());
