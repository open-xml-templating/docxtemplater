const { merge, cloneDeep } = require("lodash");
const { pushArray } = require("./doc-utils.js");
const { isPlaceholder, getTags } = require("./get-tags.js");

const slideNumRegex = /ppt\/slides\/slide([0-9]+).xml/;

function getSlideIndex(path) {
	return parseInt(path.replace(slideNumRegex, "$1"), 10) - 1;
}

function getStructuredTags(postParsed) {
	return postParsed.filter(isPlaceholder).map((part) => {
		part.subparsed &&= getStructuredTags(part.subparsed);
		if (part.attrParsed) {
			part.subparsed = [];

			if (part.attrParsed) {
				part.subparsed = [];
				for (const key in part.attrParsed) {
					part.subparsed = part.subparsed.concat(
						part.attrParsed[key]
					);
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

	set(obj) {
		if (obj.data) {
			this.inspect.tags = obj.data;
		}
		if (obj.pptxCustomMap) {
			this.pptxCustomMap = obj.pptxCustomMap;
		}
		if (obj.pptxSectionMap) {
			this.pptxSectionMap = obj.pptxSectionMap;
		}
		if (obj.inspect) {
			if (obj.inspect.filePath) {
				this.filePath = obj.inspect.filePath;
				this.inspect = this.fullInspected[this.filePath] || {};
			}
			if (obj.inspect.content) {
				this.inspect.content = obj.inspect.content;
			} else if (obj.inspect.postparsed) {
				this.inspect.postparsed = obj.inspect.postparsed;
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

	getFileType() {
		return this.fileType;
	}

	optionsTransformer(options, docxtemplater) {
		this.fileTypeConfig = docxtemplater.fileTypeConfig;
		this.zip = docxtemplater.zip;
		this.targets = docxtemplater.targets;
		this.fileType = docxtemplater.fileType;
		this.docxtemplater = docxtemplater;
		return options;
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
		let inspected = this.fullInspected[file].postparsed;

		const si = getSlideIndex(file);
		if (si != null && !isNaN(si)) {
			if (this.pptxCustomMap && this.pptxCustomMap[si]) {
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
			if (this.pptxSectionMap) {
				for (const section of this.pptxSectionMap) {
					if (section.slideIndexes.indexOf(si) !== -1) {
						inspected = [
							{
								...section.part,
								module: "pro-xml-templating/slides-module-section",
								subparsed: inspected,
								slideIndexes: section.slideIndexes,
								subIds: section.subIds,
							},
						];
					}
				}
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
		const result = {};
		for (const file in this.fullInspected) {
			merge(result, this.getTags(file));
		}
		return result;
	}

	getStructuredTags(file) {
		file ||= this.fileTypeConfig.textPath(this.docxtemplater);
		return getStructuredTags(this.getInspected(file));
	}

	getAllStructuredTags() {
		const result = [];
		for (const file in this.fullInspected) {
			pushArray(result, this.getStructuredTags(file));
		}
		return result;
	}

	getTemplatedFiles() {
		return this.docxtemplater.templatedFiles;
	}
}

module.exports = () => new InspectModule();
