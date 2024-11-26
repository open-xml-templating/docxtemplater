const {
	chunkBy,
	last,
	isParagraphStart,
	isModule,
	isParagraphEnd,
	isContent,
	startsWith,
	isTagEnd,
	isTagStart,
	getSingleAttribute,
	setSingleAttribute,
} = require("../doc-utils.js");
const filetypes = require("../filetypes.js");
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
	return part.hasPageBreak && isInsideParagraphLoop(part)
		? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
		: "";
}

function isEnclosedByParagraphs(parsed) {
	return (
		parsed.length && isParagraphStart(parsed[0]) && isParagraphEnd(last(parsed))
	);
}

function getOffset(chunk) {
	return hasContent(chunk) ? 0 : chunk.length;
}

function addPageBreakAtEnd(subRendered) {
	const j = subRendered.parts.length - 1;
	if (subRendered.parts[j] === "</w:p>") {
		subRendered.parts.splice(j, 0, '<w:r><w:br w:type="page"/></w:r>');
	} else {
		subRendered.parts.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
	}
}

function addPageBreakAtBeginning(subRendered) {
	subRendered.parts.unshift('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
}

function isContinuous(parts) {
	return parts.some(function (part) {
		return (
			isTagStart("w:type", part) && part.value.indexOf("continuous") !== -1
		);
	});
}

function isNextPage(parts) {
	return parts.some(function (part) {
		return (
			isTagStart("w:type", part) &&
			part.value.indexOf('w:val="nextPage"') !== -1
		);
	});
}

function addSectionBefore(parts, sect) {
	return [
		`<w:p><w:pPr>${sect
			.map(function ({ value }) {
				return value;
			})
			.join("")}</w:pPr></w:p>`,
	].concat(parts);
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
		return (
			!startsWith(text, "<w:headerReference") &&
			!startsWith(text, "<w:footerReference")
		);
	});
}

function hasPageBreak(chunk) {
	return chunk.some(function (part) {
		return part.tag === "w:br" && part.value.indexOf('w:type="page"') !== -1;
	});
}

function hasImage(chunk) {
	return chunk.some(function ({ tag }) {
		return tag === "w:drawing";
	});
}

function getSectPr(chunks) {
	let collectSectPr = false;
	const sectPrs = [];
	chunks.forEach(function (part) {
		if (isTagStart("w:sectPr", part)) {
			sectPrs.push([]);
			collectSectPr = true;
		}
		if (collectSectPr) {
			sectPrs[sectPrs.length - 1].push(part);
		}
		if (isTagEnd("w:sectPr", part)) {
			collectSectPr = false;
		}
	});
	return sectPrs;
}

function getSectPrHeaderFooterChangeCount(chunks) {
	let collectSectPr = false;
	let sectPrCount = 0;
	chunks.forEach(function (part) {
		if (isTagStart("w:sectPr", part)) {
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
		if (isTagEnd("w:sectPr", part)) {
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

		if (isTagEnd("w:sectPr", part)) {
			inSectPr = true;
		}
		if (isTagStart("w:sectPr", part)) {
			sectPr.unshift(part.value);
			inSectPr = false;
		}
		if (inSectPr) {
			sectPr.unshift(part.value);
		}
		if (isParagraphStart(part)) {
			if (sectPr.length > 0) {
				return sectPr.join("");
			}
			break;
		}
	}
	return "";
}

class LoopModule {
	constructor() {
		this.name = "LoopModule";
		this.inXfrm = false;
		this.totalSectPr = 0;
		this.prefix = {
			start: "#",
			end: "/",
			dash: /^-([^\s]+)\s(.+)/,
			inverted: "^",
		};
	}
	optionsTransformer(opts, docxtemplater) {
		this.docxtemplater = docxtemplater;
		return opts;
	}
	preparse(parsed, { contentType }) {
		if (filetypes.main.indexOf(contentType) !== -1) {
			this.sects = getSectPr(parsed);
		}
	}

	matchers() {
		const module = moduleName;
		return [
			[
				this.prefix.start,
				module,
				{
					expandTo: "auto",
					location: "start",
					inverted: false,
				},
			],
			[
				this.prefix.inverted,
				module,
				{
					expandTo: "auto",
					location: "start",
					inverted: true,
				},
			],
			[
				this.prefix.end,
				module,
				{
					location: "end",
				},
			],
			[
				this.prefix.dash,
				module,
				([, expandTo, value]) => ({
					location: "start",
					inverted: false,
					expandTo,
					value,
				}),
			],
		];
	}
	getTraits(traitName, parsed) {
		// Stryker disable all : because getTraits should disappear in v4
		if (traitName !== "expandPair") {
			return;
		}
		// Stryker restore all

		return parsed.reduce(function (tags, part, offset) {
			if (isModule(part, moduleName) && part.subparsed == null) {
				tags.push({ part, offset });
			}
			return tags;
		}, []);
	}
	postparse(parsed, { basePart }) {
		if (
			basePart &&
			this.docxtemplater.fileType === "docx" &&
			parsed.length > 0
		) {
			basePart.sectPrCount = getSectPrHeaderFooterChangeCount(parsed);
			this.totalSectPr += basePart.sectPrCount;

			const { sects } = this;
			sects.some(function (sect, index) {
				if (basePart.lIndex < sect[0].lIndex) {
					if (index + 1 < sects.length && isContinuous(sects[index + 1])) {
						basePart.addContinuousType = true;
					}
					return true;
				}
				if (
					parsed[0].lIndex < sect[0].lIndex &&
					sect[0].lIndex < basePart.lIndex
				) {
					if (isNextPage(sects[index])) {
						basePart.addNextPage = { index };
					}
					return true;
				}
			});
			basePart.lastParagrapSectPr = getLastSectPr(parsed);
		}
		if (
			!basePart ||
			basePart.expandTo !== "auto" ||
			basePart.module !== moduleName ||
			!isEnclosedByParagraphs(parsed)
		) {
			return parsed;
		}
		basePart.paragraphLoop = true;

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

		const firstChunk = chunks[0];
		const lastChunk = last(chunks);
		let firstOffset = getOffset(firstChunk);
		let lastOffset = getOffset(lastChunk);

		basePart.hasPageBreakBeginning = hasPageBreak(firstChunk);
		basePart.hasPageBreak = hasPageBreak(lastChunk);

		if (hasImage(firstChunk)) {
			firstOffset = 0;
		}
		if (hasImage(lastChunk)) {
			lastOffset = 0;
		}
		return parsed.slice(firstOffset, parsed.length - lastOffset);
	}
	resolve(part, options) {
		if (!isModule(part, moduleName)) {
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
					...options,
					compiled: part.subparsed,
					tags: {},
					scopeManager,
				})
			);
		}
		const errorList = [];
		return promisedValue.then(function (values) {
			return new Promise(function (resolve) {
				if (values instanceof Array) {
					Promise.all(values).then(resolve);
				} else {
					resolve(values);
				}
			}).then(function (values) {
				sm.loopOverValue(values, loopOver, part.inverted);
				return Promise.all(promises)
					.then(function (r) {
						return r.map(function ({ resolved, errors }) {
							errorList.push(...errors);
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
		});
	}
	render(part, options) {
		if (part.tag === "p:xfrm") {
			this.inXfrm = part.position === "start";
		}
		if (part.tag === "a:ext" && this.inXfrm) {
			this.lastExt = part;
			return part;
		}
		if (!isModule(part, moduleName)) {
			return null;
		}
		const totalValue = [];
		const errors = [];
		let heightOffset = 0;
		const self = this;
		const firstTag = part.subparsed[0];
		let tagHeight = 0;
		if (firstTag?.tag === "a:tr") {
			tagHeight = +getSingleAttribute(firstTag.value, "h");
		}
		heightOffset -= tagHeight;
		let a16RowIdOffset = 0;
		const insideParagraphLoop = isInsideParagraphLoop(part);

		function loopOver(scope, i, length) {
			heightOffset += tagHeight;
			const scopeManager = options.scopeManager.createSubScopeManager(
				scope,
				part.value,
				i,
				part,
				length
			);
			part.subparsed.forEach(function (pp) {
				if (isTagStart("a16:rowId", pp)) {
					const val = +getSingleAttribute(pp.value, "val") + a16RowIdOffset;
					a16RowIdOffset = 1;
					pp.value = setSingleAttribute(pp.value, "val", val);
				}
			});
			const subRendered = options.render({
				...options,
				compiled: part.subparsed,
				tags: {},
				scopeManager,
			});
			if (part.hasPageBreak && i === length - 1 && insideParagraphLoop) {
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
			} else if (part.addNextPage) {
				subRendered.parts = addSectionBefore(
					subRendered.parts,
					self.sects[part.addNextPage.index]
				);
			}
			if (part.addNextPage) {
				addPageBreakAtEnd(subRendered);
			}
			if (part.hasPageBreakBeginning && insideParagraphLoop) {
				addPageBreakAtBeginning(subRendered);
			}
			for (let i = 0, len = subRendered.parts.length; i < len; i++) {
				totalValue.push(subRendered.parts[i]);
			}
			Array.prototype.push.apply(errors, subRendered.errors);
		}
		const result = options.scopeManager.loopOver(
			part.value,
			loopOver,
			part.inverted,
			{
				part,
			}
		);
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
		if (heightOffset !== 0) {
			const cy = +getSingleAttribute(this.lastExt.value, "cy");
			this.lastExt.value = setSingleAttribute(
				this.lastExt.value,
				"cy",
				cy + heightOffset
			);
		}
		return {
			value: options.joinUncorrupt(totalValue, { ...options, basePart: part }),
			errors,
		};
	}
}

module.exports = () => wrapper(new LoopModule());
