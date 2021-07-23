const {
	mergeObjects,
	chunkBy,
	last,
	isParagraphStart,
	isParagraphEnd,
	isContent,
	startsWith,
} = require("../doc-utils.js");
const wrapper = require("../module-wrapper.js");

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

function isContinuous(parts) {
	return parts.some(function (part) {
		return (
			part.type === "tag" &&
			part.tag === "w:type" &&
			part.value.indexOf("continuous") !== -1
		);
	});
}

function addContinuousType(parts) {
	let stop = false;
	let inSectPr = false;
	return parts.reduce(function (result, part) {
		if (stop === false && startsWith(part, "<w:sectPr")) {
			inSectPr = true;
		}
		if (inSectPr) {
			if (startsWith(part, "<w:type")) {
				stop = true;
			}
			if (stop === false && startsWith(part, "</w:sectPr")) {
				result.push('<w:type w:val="continuous"/>');
			}
		}
		result.push(part);
		return result;
	}, []);
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

function getSectPr(chunks) {
	let collectSectPr = false;
	const sectPrs = [];
	chunks.forEach(function (part) {
		if (part.tag === "w:sectPr" && part.position === "start") {
			sectPrs.push([]);
			collectSectPr = true;
		}
		if (collectSectPr) {
			sectPrs[sectPrs.length - 1].push(part);
		}
		if (part.tag === "w:sectPr" && part.position === "end") {
			collectSectPr = false;
		}
	});
	return sectPrs;
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

function getLastSectPr(parsed) {
	const sectPr = [];
	let inSectPr = false;
	for (let i = parsed.length - 1; i >= 0; i--) {
		const part = parsed[i];
		if (part.type === "tag" && part.tag === "w:sectPr") {
			if (part.position === "end") {
				inSectPr = true;
			}
			if (part.position === "start") {
				sectPr.unshift(part);
				inSectPr = false;
			}
		}
		if (inSectPr) {
			sectPr.unshift(part);
		}
		if (isParagraphStart(part)) {
			if (sectPr.length > 0) {
				return sectPr;
			}
			break;
		}
	}
}

class LoopModule {
	constructor() {
		this.name = "LoopModule";
		this.totalSectPr = 0;
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
	preparse(parsed) {
		this.sects = getSectPr(parsed);
	}
	postparse(parsed, { basePart }) {
		if (basePart) {
			basePart.sectPrCount = getSectPrHeaderFooterChangeCount(parsed);
			this.totalSectPr += basePart.sectPrCount;

			const sects = this.sects;
			sects.some(function (sect, index) {
				if (sect[0].lIndex > basePart.lIndex) {
					if (index + 1 < sects.length && isContinuous(sects[index + 1])) {
						basePart.addContinuousType = true;
					}
					return true;
				}
			});
			const lastSectPr = getLastSectPr(parsed);
			if (lastSectPr) {
				basePart.lastParagrapSectPr = lastSectPr
					.map(function ({ value }) {
						return value;
					})
					.join("");
			}
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
		basePart.paragraphLoop = true;

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
			const isNotFirst = scopeManager.scopePathItem.some(function (i) {
				return i !== 0;
			});
			if (isNotFirst) {
				if (part.sectPrCount === 1) {
					subRendered.parts = dropHeaderFooterRefs(subRendered.parts);
				}
				if (part.addContinuousType) {
					subRendered.parts = addContinuousType(subRendered.parts);
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
			if (part.lastParagrapSectPr) {
				if (part.paragraphLoop) {
					return {
						value: `<w:p><w:pPr>${part.lastParagrapSectPr}</w:pPr></w:p>`,
					};
				}
				return {
					value: `</w:t></w:r></w:p><w:p><w:pPr>${part.lastParagrapSectPr}</w:pPr><w:r><w:t>`,
				};
			}
			return {
				value: getPageBreakIfApplies(part) || "",
				errors,
			};
		}
		return {
			value: options.joinUncorrupt(totalValue, { ...options, basePart: part }),
			errors,
		};
	}
	resolve(part, options) {
		if (part.type !== "placeholder" || part.module !== moduleName) {
			return null;
		}

		const sm = options.scopeManager;
		const promisedValue = sm.getValueAsync(part.value, { part });
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
