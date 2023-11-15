const { merge, cloneDeep } = require("lodash");

function isPlaceholder(part) {
	return part.type === "placeholder";
}

const slideNumRegex = /ppt\/slides\/slide([0-9]+).xml/;

function getSlideIndex(path) {
	return parseInt(path.replace(slideNumRegex, "$1"), 10) - 1;
}

function getTags(postParsed) {
	return postParsed.filter(isPlaceholder).reduce(function (tags, part) {
		// Stryker disable all : because this is for the xlsx module
		if (part.cellParsed) {
			part.cellParsed.forEach(function (cp) {
				if (
					cp.type === "placeholder" &&
					cp.module !== "pro-xml-templating/xls-module-loop"
				) {
					tags[cp.value] = tags[cp.value] || {};
				}
			});
			return tags;
		}
		// Stryker disable all : because this is for the table,chart,image, xlsx module
		if (part.dataBound === false) {
			if (part.subparsed) {
				tags = merge(tags, getTags(part.subparsed));
			}
			return tags;
		}
		tags[part.value] = tags[part.value] || {};
		// Stryker restore all

		if (part.subparsed) {
			tags[part.value] = merge(tags[part.value], getTags(part.subparsed));
		}

		return tags;
	}, {});
}

function getStructuredTags(postParsed) {
	return postParsed.filter(isPlaceholder).map(function (part) {
		if (part.subparsed) {
			part.subparsed = getStructuredTags(part.subparsed);
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
	optionsTransformer(options, docxtemplater) {
		this.fileTypeConfig = docxtemplater.fileTypeConfig;
		this.zip = docxtemplater.zip;
		this.targets = docxtemplater.targets;
		this.fileType = docxtemplater.fileType;
		this.docxtemplater = docxtemplater;
		return options;
	}
	// eslint-disable-next-line complexity
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
	on(eventName) {
		if (eventName === "attached") {
			this.attached = false;
			this.inspect = {};
			this.fullInspected = {};
			this.filePath = null;
		}
	}

	nullGetter(part, scopeManager, xt) {
		const inspected = this.fullInspected[xt.filePath];
		inspected.nullValues = inspected.nullValues || { summary: [], detail: [] };
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
		file = file || this.fileTypeConfig.textPath(this.docxtemplater);
		const inspected = this.getInspected(file);
		return getTags(inspected);
	}
	getAllTags() {
		return Object.keys(this.fullInspected).reduce((result, file) => {
			return merge(result, this.getTags(file));
		}, {});
	}
	getStructuredTags(file) {
		file = file || this.fileTypeConfig.textPath(this);
		const inspected = this.getInspected(file);
		return getStructuredTags(inspected);
	}
	getAllStructuredTags() {
		return Object.keys(this.fullInspected).reduce((result, file) => {
			return result.concat(this.getStructuredTags(file));
		}, []);
	}
	getFileType() {
		return this.fileType;
	}
	getTemplatedFiles() {
		return this.docxtemplater.templatedFiles;
	}
}

module.exports = () => new InspectModule();
