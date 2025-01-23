const { merge, cloneDeep } = require("lodash");
const { pushArray } = require("./doc-utils.js");

function isPlaceholder(part) {
	return part.type === "placeholder";
}

const slideNumRegex = /ppt\/slides\/slide([0-9]+).xml/;

function getSlideIndex(path) {
	return parseInt(path.replace(slideNumRegex, "$1"), 10) - 1;
}

/* eslint-disable-next-line complexity */
function getTags(postParsed) {
	const tags = {};
	const stack = [
		{
			items: postParsed.filter(isPlaceholder),
			parents: [],
			path: [],
		},
	];

	function processFiltered(part, current, filtered) {
		if (filtered.length) {
			stack.push({
				items: filtered,
				parents: [...current.parents, part],
				path:
					part.dataBound !== false &&
					!part.attrParsed &&
					part.value &&
					!part.attrParsed
						? [...current.path, part.value]
						: [...current.path],
			});
		}
	}

	function getLocalTags(tags, path, sizeScope = path.length) {
		let localTags = tags;
		for (let i = 0; i < sizeScope; i++) {
			localTags = localTags[path[i]];
		}
		return localTags;
	}

	function getScopeSize(part, parents) {
		return parents.reduce((size, parent) => {
			const lIndexLoop =
				typeof parent.lIndex === "number"
					? parent.lIndex
					: parseInt(parent.lIndex.split("-")[0], 10);
			return lIndexLoop > part.lIndex ? size - 1 : size;
		}, parents.length);
	}

	while (stack.length > 0) {
		const current = stack.pop();
		let localTags = getLocalTags(tags, current.path);

		for (const part of current.items) {
			if (part.attrParsed) {
				for (const key in part.attrParsed) {
					processFiltered(
						part,
						current,
						part.attrParsed[key].filter(isPlaceholder)
					);
				}
				continue;
			}
			if (part.subparsed) {
				if (part.dataBound !== false) {
					localTags[part.value] ||= {};
				}
				processFiltered(part, current, part.subparsed.filter(isPlaceholder));
				continue;
			}

			if (part.cellParsed) {
				for (const cp of part.cellPostParsed) {
					if (cp.type === "placeholder") {
						if (cp.module === "pro-xml-templating/xls-module-loop") {
							continue;
						} else if (cp.subparsed) {
							localTags[cp.value] ||= {};
							processFiltered(cp, current, cp.subparsed.filter(isPlaceholder));
						} else {
							const sizeScope = getScopeSize(part, current.parents);
							localTags = getLocalTags(tags, current.path, sizeScope);
							localTags[cp.value] ||= {};
						}
					}
				}
				continue;
			}

			if (part.dataBound === false) {
				continue;
			}

			localTags[part.value] ||= {};
		}
	}
	return tags;
}

function getStructuredTags(postParsed) {
	return postParsed.filter(isPlaceholder).map((part) => {
		part.subparsed &&= getStructuredTags(part.subparsed);
		if (part.attrParsed) {
			part.subparsed = [];

			if (part.attrParsed) {
				part.subparsed = [];
				for (const key in part.attrParsed) {
					part.subparsed = part.subparsed.concat(part.attrParsed[key]);
				}
				return part;
			}
		}
		return part;
	}, {});
}

class InspectModule {
	constructor() {
		this.name = "InspectModule";
		this.inspect = {};
		this.fullInspected = {};
		this.filePath = null;
	}
	clone() {
		return new InspectModule();
	}
	optionsTransformer(options, docxtemplater) {
		this.fileTypeConfig = docxtemplater.fileTypeConfig;
		this.zip = docxtemplater.zip;
		this.targets = docxtemplater.targets;
		this.fileType = docxtemplater.fileType;
		this.docxtemplater = docxtemplater;
		return options;
	}
	set(obj) {
		if (obj.data) {
			this.inspect.tags = obj.data;
		}
		if (obj.pptxCustomMap) {
			this.pptxCustomMap = obj.pptxCustomMap;
		}
		if (obj.inspect) {
			if (obj.inspect.filePath) {
				this.filePath = obj.inspect.filePath;
				this.inspect = this.fullInspected[this.filePath] || {};
			}
			if (obj.inspect.content) {
				this.inspect.content = obj.inspect.content;
			} else if (obj.inspect.postparsed) {
				this.inspect.postparsed = cloneDeep(obj.inspect.postparsed);
			} else if (obj.inspect.parsed) {
				this.inspect.parsed = cloneDeep(obj.inspect.parsed);
			} else if (obj.inspect.lexed) {
				this.inspect.lexed = cloneDeep(obj.inspect.lexed);
			} else if (obj.inspect.xmllexed) {
				this.inspect.xmllexed = cloneDeep(obj.inspect.xmllexed);
			}
			if (obj.inspect.resolved) {
				this.inspect.resolved = obj.inspect.resolved;
			}
			this.fullInspected[this.filePath] = this.inspect;
		}
	}
	nullGetter(part, scopeManager, xt) {
		const inspected = this.fullInspected[xt.filePath];
		inspected.nullValues ||= { summary: [], detail: [] };
		inspected.nullValues.detail.push({ part, scopeManager });
		inspected.nullValues.summary.push(
			scopeManager.scopePath.concat(part.value)
		);
	}

	getInspected(file) {
		const si = getSlideIndex(file);
		let inspected = cloneDeep(this.fullInspected[file].postparsed);
		if (
			si != null &&
			!isNaN(si) &&
			this.pptxCustomMap &&
			this.pptxCustomMap[si]
		) {
			const map = this.pptxCustomMap[si];
			if (map) {
				inspected = [
					{
						...map,
						type: "placeholder",
						module: "pro-xml-templating/slides-module-repeat",
						subparsed: inspected,
					},
				];
			}
		}
		return inspected;
	}

	getTags(file) {
		file ||= this.fileTypeConfig.textPath(this.docxtemplater);
		const inspected = this.getInspected(file);
		return getTags(inspected);
	}
	getAllTags() {
		return Object.keys(this.fullInspected).reduce(
			(result, file) => merge(result, this.getTags(file)),
			{}
		);
	}
	getStructuredTags(file) {
		file ||= this.fileTypeConfig.textPath(this.docxtemplater);
		const inspected = this.getInspected(file);
		return getStructuredTags(inspected);
	}
	getAllStructuredTags() {
		return Object.keys(this.fullInspected).reduce(
			(result, file) => pushArray(result, this.getStructuredTags(file)),
			[]
		);
	}
	getFileType() {
		return this.fileType;
	}
	getTemplatedFiles() {
		return this.docxtemplater.templatedFiles;
	}
}

module.exports = () => new InspectModule();
