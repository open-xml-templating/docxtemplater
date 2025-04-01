function isPlaceholder(part) {
	return part.type === "placeholder";
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

module.exports = { getTags, isPlaceholder };
