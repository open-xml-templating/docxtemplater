const {
	getRightOrNull,
	getRight,
	getLeft,
	getLeftOrNull,
	concatArrays,
	chunkBy,
	isTagStart,
	isTagEnd,
	isContent,
	last,
	first,
} = require("./doc-utils");
const {
	XTTemplateError,
	throwExpandNotFound,
	getLoopPositionProducesInvalidXMLError,
} = require("./errors");

function lastTagIsOpenTag(tags, tag) {
	if (tags.length === 0) {
		return false;
	}
	const innerLastTag = last(tags).tag.substr(1);
	const innerCurrentTag = tag.substr(2, tag.length - 3);
	return innerLastTag.indexOf(innerCurrentTag) === 0;
}

function addTag(tags, tag) {
	tags.push({ tag });
	return tags;
}

function getListXmlElements(parts) {
	/*
	get the different closing and opening tags between two texts (doesn't take into account tags that are opened then closed (those that are closed then opened are returned)):
	returns:[{"tag":"</w:r>","offset":13},{"tag":"</w:p>","offset":265},{"tag":"</w:tc>","offset":271},{"tag":"<w:tc>","offset":828},{"tag":"<w:p>","offset":883},{"tag":"<w:r>","offset":1483}]
	*/
	const tags = parts.filter(function (part) {
		return part.type === "tag";
	});

	let result = [];

	for (let i = 0, tag; i < tags.length; i++) {
		tag = tags[i].value;
		// closing tag
		if (tag[1] === "/") {
			if (lastTagIsOpenTag(result, tag)) {
				result.pop();
			} else {
				result = addTag(result, tag);
			}
		} else if (tag[tag.length - 2] !== "/") {
			result = addTag(result, tag);
		}
	}
	return result;
}

function has(name, xmlElements) {
	for (let i = 0; i < xmlElements.length; i++) {
		const xmlElement = xmlElements[i];
		if (xmlElement.tag.indexOf(`<${name}`) === 0) {
			return true;
		}
	}
	return false;
}

function getExpandToDefault(postparsed, pair, expandTags) {
	const parts = postparsed.slice(pair[0].offset, pair[1].offset);
	const xmlElements = getListXmlElements(parts);
	const closingTagCount = xmlElements.filter(function (xmlElement) {
		return xmlElement.tag[1] === "/";
	}).length;
	const startingTagCount = xmlElements.filter(function (xmlElement) {
		const { tag } = xmlElement;
		return tag[1] !== "/" && tag[tag.length - 2] !== "/";
	}).length;
	if (closingTagCount !== startingTagCount) {
		return {
			error: getLoopPositionProducesInvalidXMLError({
				tag: first(pair).part.value,
				offset: [first(pair).part.offset, last(pair).part.offset],
			}),
		};
	}
	for (let i = 0, len = expandTags.length; i < len; i++) {
		const { contains, expand, onlyTextInTag } = expandTags[i];
		if (has(contains, xmlElements)) {
			if (onlyTextInTag) {
				const left = getLeftOrNull(postparsed, contains, pair[0].offset);
				const right = getRightOrNull(postparsed, contains, pair[1].offset);
				if (left === null || right === null) {
					continue;
				}

				const chunks = chunkBy(postparsed.slice(left, right), function (p) {
					if (isTagStart(contains, p)) {
						return "start";
					}
					if (isTagEnd(contains, p)) {
						return "end";
					}
					return null;
				});

				if (chunks.length <= 2) {
					continue;
				}

				const firstChunk = first(chunks);
				const lastChunk = last(chunks);

				const firstContent = firstChunk.filter(isContent);
				const lastContent = lastChunk.filter(isContent);
				if (firstContent.length !== 1 || lastContent.length !== 1) {
					continue;
				}
			}
			return { value: expand };
		}
	}
	return false;
}

function expandOne(part, index, postparsed, options) {
	const expandTo = part.expandTo || options.expandTo;
	if (!expandTo) {
		return postparsed;
	}
	let right, left;
	try {
		left = getLeft(postparsed, expandTo, index);
		right = getRight(postparsed, expandTo, index);
	} catch (rootError) {
		if (rootError instanceof XTTemplateError) {
			throwExpandNotFound({
				part,
				rootError,
				postparsed,
				expandTo,
				index,
				...options.error,
			});
		}
		throw rootError;
	}
	const leftParts = postparsed.slice(left, index);
	const rightParts = postparsed.slice(index + 1, right + 1);
	let inner = options.getInner({
		postparse: options.postparse,
		index,
		part,
		leftParts,
		rightParts,
		left,
		right,
		postparsed,
	});
	if (!inner.length) {
		inner.expanded = [leftParts, rightParts];
		inner = [inner];
	}
	return concatArrays([
		postparsed.slice(0, left),
		inner,
		postparsed.slice(right + 1),
	]);
}

function expandToOne(postparsed, options) {
	let errors = [];
	if (postparsed.errors) {
		errors = postparsed.errors;
		postparsed = postparsed.postparsed;
	}
	for (let i = 0, len = postparsed.length; i < len; i++) {
		const part = postparsed[i];
		if (options.lIndex != null && part.lIndex <= options.lIndex) {
			continue;
		}
		if (part.type === "placeholder" && part.module === options.moduleName) {
			try {
				postparsed = expandOne(part, i, postparsed, options);
			} catch (error) {
				if (error instanceof XTTemplateError) {
					errors.push(error);
				} else {
					throw error;
				}
			}
			options.lIndex = part.lIndex;
			return expandToOne({ postparsed, errors }, options);
		}
	}
	return { postparsed, errors };
}

module.exports = {
	expandToOne,
	getExpandToDefault,
};
