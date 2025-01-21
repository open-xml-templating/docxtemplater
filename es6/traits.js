const {
	getRightOrNull,
	getRight,
	getLeft,
	getLeftOrNull,
	chunkBy,
	isTagStart,
	isTagEnd,
	isContent,
	last,
	first,
} = require("./doc-utils.js");
const {
	XTTemplateError,
	throwExpandNotFound,
	getLoopPositionProducesInvalidXMLError,
} = require("./errors.js");

function lastTagIsOpenTag(tags, tag) {
	if (tags.length === 0) {
		return false;
	}
	const innerLastTag = last(tags).substr(1);
	return innerLastTag.indexOf(tag) === 0;
}

function getListXmlElements(parts) {
	/*
	 * Gets the list of closing and opening tags between two texts. It doesn't take
	 * into account tags that are opened then closed. Those that are closed then
	 * opened are kept
	 *
	 * Example input :
	 *
	 * [
	 * 	{
	 * 		"type": "placeholder",
	 * 		"value": "table1",
	 * 		...
	 * 	},
	 * 	{
	 * 		"type": "placeholder",
	 * 		"value": "t1data1",
	 * 	},
	 * 	{
	 * 		"type": "tag",
	 * 		"position": "end",
	 * 		"text": true,
	 * 		"value": "</w:t>",
	 * 		"tag": "w:t",
	 * 		"lIndex": 112
	 * 	},
	 * 	{
	 * 		"type": "tag",
	 * 		"value": "</w:r>",
	 * 	},
	 * 	{
	 * 		"type": "tag",
	 * 		"value": "</w:p>",
	 * 	},
	 * 	{
	 * 		"type": "tag",
	 * 		"value": "</w:tc>",
	 * 	},
	 * 	{
	 * 		"type": "tag",
	 * 		"value": "<w:tc>",
	 * 	},
	 * 	{
	 * 		"type": "content",
	 * 		"value": "<w:tcPr><w:tcW w:w="2444" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/></w:tcPr>",
	 * 	},
	 * 	...
	 * 	{
	 * 		"type": "tag",
	 * 		"value": "<w:r>",
	 * 	},
	 * 	{
	 * 		"type": "tag",
	 * 		"value": "<w:t xml:space="preserve">",
	 * 	},
	 * 	{
	 * 		"type": "placeholder",
	 * 		"value": "t1data4",
	 * 	}
	 * ]
	 *
	 * Returns
	 *
	 * 	[
	 * 		{
	 * 			"tag": "</w:t>",
	 * 		},
	 * 		{
	 * 			"tag": "</w:r>",
	 * 		},
	 * 		{
	 * 			"tag": "</w:p>",
	 * 		},
	 * 		{
	 * 			"tag": "</w:tc>",
	 * 		},
	 * 		{
	 * 			"tag": "<w:tc>",
	 * 		},
	 * 		{
	 * 			"tag": "<w:p>",
	 * 		},
	 * 		{
	 * 			"tag": "<w:r>",
	 * 		},
	 * 		{
	 * 			"tag": "<w:t>",
	 * 		},
	 * 	]
	 */

	const result = [];

	for (const { position, value, tag } of parts) {
		// Stryker disable all : because removing this condition would also work but we want to make the API future proof
		if (!tag) {
			continue;
		}
		// Stryker restore all
		if (position === "end") {
			if (lastTagIsOpenTag(result, tag)) {
				result.pop();
			} else {
				result.push(value);
			}
		} else if (position === "start") {
			result.push(value);
		}
		// ignore position === "selfclosing"
	}
	return result;
}

function has(name, xmlElements) {
	for (const xmlElement of xmlElements) {
		if (xmlElement.indexOf(`<${name}`) === 0) {
			return true;
		}
	}
	return false;
}

function getExpandToDefault(postparsed, pair, expandTags) {
	const parts = postparsed.slice(pair[0].offset, pair[1].offset);
	const xmlElements = getListXmlElements(parts);
	const closingTagCount = xmlElements.filter((tag) => tag[1] === "/").length;
	const startingTagCount = xmlElements.filter(
		(tag) => tag[1] !== "/" && tag[tag.length - 2] !== "/"
	).length;
	if (closingTagCount !== startingTagCount) {
		return {
			error: getLoopPositionProducesInvalidXMLError({
				tag: first(pair).part.value,
				offset: [first(pair).part.offset, last(pair).part.offset],
			}),
		};
	}
	for (const { contains, expand, onlyTextInTag } of expandTags) {
		if (has(contains, xmlElements)) {
			if (onlyTextInTag) {
				const left = getLeftOrNull(postparsed, contains, pair[0].offset);
				const right = getRightOrNull(postparsed, contains, pair[1].offset);
				if (left === null || right === null) {
					continue;
				}

				const chunks = chunkBy(postparsed.slice(left, right), (p) =>
					isTagStart(contains, p)
						? "start"
						: isTagEnd(contains, p)
							? "end"
							: null
				);

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
	return {};
}

function getExpandLimit(part, index, postparsed, options) {
	const expandTo = part.expandTo || options.expandTo;
	// Stryker disable all : because this condition can be removed in v4 (the only usage was the image module before version 3.12.3 of the image module
	if (!expandTo) {
		return;
	}
	// Stryker restore all
	let right, left;
	try {
		left = getLeft(postparsed, expandTo, index);
		right = getRight(postparsed, expandTo, index);
	} catch (rootError) {
		const errProps = {
			part,
			rootError,
			postparsed,
			expandTo,
			index,
			...options.error,
		};
		if (options.onError) {
			const errorResult = options.onError(errProps);
			if (errorResult === "ignore") {
				return;
			}
		}
		throwExpandNotFound(errProps);
	}

	return [left, right];
}

function expandOne([left, right], part, postparsed, options) {
	const index = postparsed.indexOf(part);
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
	return { left, right, inner };
}

/* eslint-disable-next-line complexity */
function expandToOne(postparsed, options) {
	let errors = [];
	if (postparsed.errors) {
		errors = postparsed.errors;
		postparsed = postparsed.postparsed;
	}
	const limits = [];
	for (let i = 0, len = postparsed.length; i < len; i++) {
		const part = postparsed[i];
		if (
			part.type === "placeholder" &&
			part.module === options.moduleName &&
			/*
			 * The part.subparsed check is used to fix this github issue :
			 * https://github.com/open-xml-templating/docxtemplater/issues/671
			 */
			!part.subparsed &&
			!part.expanded
		) {
			try {
				const limit = getExpandLimit(part, i, postparsed, options);
				if (!limit) {
					continue;
				}
				const [left, right] = limit;
				limits.push({
					left,
					right,
					part,
					i,
					leftPart: postparsed[left],
					rightPart: postparsed[right],
				});
			} catch (error) {
				// The Error can only be a
				errors.push(error);
			}
		}
	}
	limits.sort((l1, l2) => {
		if (l1.left === l2.left) {
			return l2.part.lIndex < l1.part.lIndex ? 1 : -1;
		}
		return l2.left < l1.left ? 1 : -1;
	});
	let maxRight = -1;
	let offset = 0;

	for (let i = 0, len = limits.length; i < len; i++) {
		const limit = limits[i];
		maxRight = Math.max(maxRight, i > 0 ? limits[i - 1].right : 0);
		if (limit.left < maxRight) {
			continue;
		}
		let result;
		try {
			result = expandOne(
				[limit.left + offset, limit.right + offset],
				limit.part,
				postparsed,
				options
			);
		} catch (error) {
			if (options.onError) {
				const errorResult = options.onError({
					part: limit.part,
					rootError: error,
					postparsed,
					expandOne,
					...options.errors,
				});
				if (errorResult === "ignore") {
					continue;
				}
			}
			if (error instanceof XTTemplateError) {
				errors.push(error);
			} else {
				throw error;
			}
		}
		if (!result) {
			continue;
		}
		offset += result.inner.length - (result.right + 1 - result.left);
		postparsed.splice(
			result.left,
			result.right + 1 - result.left,
			...result.inner
		);
	}
	return { postparsed, errors };
}

module.exports = {
	expandToOne,
	getExpandToDefault,
};
