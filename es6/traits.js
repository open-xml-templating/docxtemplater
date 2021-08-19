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
	Gets the list of closing and opening tags between two texts. It doesn't take
	into account tags that are opened then closed. Those that are closed then
	opened are kept

	Example input :

	[
		{
			"type": "placeholder",
			"value": "table1",
			...
		},
		{
			"type": "placeholder",
			"value": "t1data1",
		},
		{
			"type": "tag",
			"position": "end",
			"text": true,
			"value": "</w:t>",
			"tag": "w:t",
			"lIndex": 112
		},
		{
			"type": "tag",
			"value": "</w:r>",
		},
		{
			"type": "tag",
			"value": "</w:p>",
		},
		{
			"type": "tag",
			"value": "</w:tc>",
		},
		{
			"type": "tag",
			"value": "<w:tc>",
		},
		{
			"type": "content",
			"value": "<w:tcPr><w:tcW w:w="2444" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/></w:tcPr>",
		},
		...
		{
			"type": "tag",
			"value": "<w:r>",
		},
		{
			"type": "tag",
			"value": "<w:t xml:space="preserve">",
		},
		{
			"type": "placeholder",
			"value": "t1data4",
		}
	]

	returns
		[
			{
				"tag": "</w:t>",
			},
			{
				"tag": "</w:r>",
			},
			{
				"tag": "</w:p>",
			},
			{
				"tag": "</w:tc>",
			},
			{
				"tag": "<w:tc>",
			},
			{
				"tag": "<w:p>",
			},
			{
				"tag": "<w:r>",
			},
			{
				"tag": "<w:t>",
			},
		]
	*/
	const tags = parts.filter(function ({ type }) {
		return type === "tag";
	});

	const result = [];

	for (let i = 0; i < tags.length; i++) {
		const { position, value, tag } = tags[i];
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
	for (let i = 0; i < xmlElements.length; i++) {
		const xmlElement = xmlElements[i];
		if (xmlElement.indexOf(`<${name}`) === 0) {
			return true;
		}
	}
	return false;
}

function getExpandToDefault(postparsed, pair, expandTags) {
	const parts = postparsed.slice(pair[0].offset, pair[1].offset);
	const xmlElements = getListXmlElements(parts);
	const closingTagCount = xmlElements.filter(function (tag) {
		return tag[1] === "/";
	}).length;
	const startingTagCount = xmlElements.filter(function (tag) {
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
					return isTagStart(contains, p)
						? "start"
						: isTagEnd(contains, p)
						? "end"
						: null;
				});

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
	return { left, right, inner };
}

function expandToOne(postparsed, options) {
	let errors = [];
	if (postparsed.errors) {
		errors = postparsed.errors;
		postparsed = postparsed.postparsed;
	}
	const results = [];
	for (let i = 0, len = postparsed.length; i < len; i++) {
		const part = postparsed[i];
		if (part.type === "placeholder" && part.module === options.moduleName) {
			try {
				const result = expandOne(part, i, postparsed, options);
				i = result.right;
				results.push(result);
			} catch (error) {
				if (error instanceof XTTemplateError) {
					errors.push(error);
				} else {
					throw error;
				}
			}
		}
	}
	const newParsed = [];
	let currentResult = 0;
	for (let i = 0, len = postparsed.length; i < len; i++) {
		const part = postparsed[i];
		const result = results[currentResult];
		if (result && result.left === i) {
			newParsed.push(...results[currentResult].inner);
			currentResult++;
			i = result.right;
		} else {
			newParsed.push(part);
		}
	}
	return { postparsed: newParsed, errors };
}

module.exports = {
	expandToOne,
	getExpandToDefault,
};
