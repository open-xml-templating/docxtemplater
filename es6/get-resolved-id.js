function getResolvedId(part, options) {
	if (part.lIndex == null) {
		return null;
	}
	let path = options.scopeManager.scopePathItem;
	if (part.parentPart) {
		path = path.slice(0, path.length - 1);
	}
	const res =
		options.filePath + "@" + part.lIndex.toString() + "-" + path.join("-");
	return res;
}

module.exports = getResolvedId;
