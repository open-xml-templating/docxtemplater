const DocUtils = require("./doc-utils");
const Errors = require("./errors");

function throwRawTagNotInParagraph(options) {
	const err = new Errors.XTTemplateError("Raw tag not in paragraph");
	const tag = options.part.value;
	err.properties = {
		id: "raw_tag_outerxml_invalid",
		explanation: `The tag "${tag}"`,
		rootError: options.rootError,
		xtag: tag,
	};
	throw err;
}

function lastTagIsOpenTag(array, tag) {
	if (array.length === 0) {
		return false;
	}
	const lastTag = array[array.length - 1];
	const innerLastTag = lastTag.tag.substr(1);
	const innerCurrentTag = tag.substr(2, tag.length - 3);
	return innerLastTag.indexOf(innerCurrentTag) === 0;
}

function addTag(array, tag) {
	return array.concat({tag});
}

function getListXmlElements(parts) {
	/*
	get the different closing and opening tags between two texts (doesn't take into account tags that are opened then closed (those that are closed then opened are returned)):
	returns:[{"tag":"</w:r>","offset":13},{"tag":"</w:p>","offset":265},{"tag":"</w:tc>","offset":271},{"tag":"<w:tc>","offset":828},{"tag":"<w:p>","offset":883},{"tag":"<w:r>","offset":1483}]
	*/
	const tags = parts.filter(function (part) {
		return part.type === "tag";
	}).map(function (part) {
		return part.value;
	});

	let result = [];

	for (let i = 0, tag; i < tags.length; i++) {
		tag = tags[i];
		// closing tag
		if (tag[1] === "/") {
			if (lastTagIsOpenTag(result, tag)) {
				result.pop();
			}
			else {
				result = addTag(result, tag);
			}
		}
		else if (tag[tag.length - 1] !== "/") {
			result = addTag(result, tag);
		}
	}
	return result;
}

function getExpandToDefault(parts) {
	const xmlElements = getListXmlElements(parts);
	for (let i = 0; i < xmlElements.length; i++) {
		const xmlElement = xmlElements[i];
		if(xmlElement.tag.indexOf("<w:tc") === 0) {
			return "w:tr";
		}
	}
	return false;
}

function expandOne(part, postparsed, options) {
	const expandTo = part.expandTo || options.expandTo;
	const index = postparsed.indexOf(part);
	if (!expandTo) {
		return postparsed;
	}
	let right, left;
	try {
		right = DocUtils.getRight(postparsed, expandTo, index);
		left = DocUtils.getLeft(postparsed, expandTo, index);
	}
	catch (rootError) {
		throwRawTagNotInParagraph({part, rootError});
	}
	const leftParts = postparsed.slice(left, index);
	const rightParts = postparsed.slice(index + 1, right + 1);
	let inner = options.getInner({index, part, leftParts, rightParts, left, right, postparsed});
	const type = Object.prototype.toString.call(inner);
	if (type === "[object Array]") {
		inner = DocUtils.concatArrays(inner);
	}
	return DocUtils.concatArrays([
		postparsed.slice(0, left),
		inner,
		postparsed.slice(right + 1),
	]);
}

function expandToOne(postparsed, options) {
	const expandToElements = postparsed.reduce(function (elements, part) {
		if (part.type === "placeholder" && part.module === options.moduleName) {
			elements.push(part);
		}
		return elements;
	}, []);

	expandToElements.forEach(function (part) {
		postparsed = expandOne(part, postparsed, options);
	});
	return postparsed;
}

module.exports = {
	expandToOne,
	getExpandToDefault,
};
