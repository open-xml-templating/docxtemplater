const { merge, cloneDeep } = require("lodash");

function isPlaceholder(part) {
	return part.type === "placeholder";
}

function getTags(postParsed) {
	return postParsed.filter(isPlaceholder).reduce(function (tags, part) {
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
		tags[part.value] = tags[part.value] || {};

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
		this.inspect = {};
		this.fullInspected = {};
		this.filePath = null;
		this.nullValues = [];
	}
	optionsTransformer(options, docxtemplater) {
		this.fileTypeConfig = docxtemplater.fileTypeConfig;
		this.zip = docxtemplater.zip;
		this.targets = docxtemplater.targets;
		this.templatedFiles = docxtemplater.getTemplatedFiles();
		this.fileType = docxtemplater.fileType;
		return options;
	}
	on(eventName) {
		if (eventName === "attached") {
			this.attached = false;
			this.inspect = {};
			this.fullInspected = {};
			this.filePath = null;
			this.nullValues = [];
		}
	}
	// eslint-disable-next-line complexity
	set(obj) {
		if (obj.data) {
			this.inspect.tags = obj.data;
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
		inspected.nullValues = inspected.nullValues || { summary: [], detail: [] };
		inspected.nullValues.detail.push({ part, scopeManager });
		inspected.nullValues.summary.push(
			scopeManager.scopePath.concat(part.value)
		);
	}
	getTags(file) {
		file = file || this.fileTypeConfig.textPath(this);
		return getTags(cloneDeep(this.fullInspected[file].postparsed));
	}
	getAllTags() {
		return Object.keys(this.fullInspected).reduce((result, file) => {
			return merge(result, this.getTags(file));
		}, {});
	}
	getStructuredTags(file) {
		file = file || this.fileTypeConfig.textPath(this);
		return getStructuredTags(cloneDeep(this.fullInspected[file].postparsed));
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
		return this.templatedFiles;
	}
}

module.exports = () => new InspectModule();
