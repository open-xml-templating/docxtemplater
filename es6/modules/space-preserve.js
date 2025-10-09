const wrapper = require("../module-wrapper.js");
const {
	isTextStart,
	isTextEnd,
	endsWith,
	startsWith,
	pushArray,
} = require("../doc-utils.js");
const wTpreserve = '<w:t xml:space="preserve">';
const wTpreservelen = wTpreserve.length;
const wtEnd = "</w:t>";
const wtEndlen = wtEnd.length;

function isWtStart(part) {
	return isTextStart(part) && part.tag === "w:t";
}

function addXMLPreserve(chunk, index) {
	const tag = chunk[index].value;
	if (chunk[index + 1].value === "</w:t>") {
		return tag;
	}
	if (tag.indexOf('xml:space="preserve"') !== -1) {
		return tag;
	}
	return tag.substr(0, tag.length - 1) + ' xml:space="preserve">';
}

function isInsideLoop(meta, chunk) {
	return meta && meta.basePart && chunk.length > 1;
}

// This module is used only for `docx` files
class SpacePreserve {
	constructor() {
		this.name = "SpacePreserveModule";
	}
	postparse(postparsed, meta) {
		let chunk = [],
			inTextTag = false,
			endLindex = 0,
			lastTextTag = 0;

		function isStartingPlaceHolder(part, chunk) {
			return part.type === "placeholder" && chunk.length > 1;
		}
		const result = postparsed.reduce((postparsed, part) => {
			if (isWtStart(part)) {
				inTextTag = true;
				lastTextTag = chunk.length;
			}
			if (!inTextTag) {
				postparsed.push(part);
				return postparsed;
			}
			chunk.push(part);
			if (isInsideLoop(meta, chunk)) {
				endLindex = meta.basePart.endLindex;
				chunk[0].value = addXMLPreserve(chunk, 0);
			}
			if (isStartingPlaceHolder(part, chunk)) {
				chunk[lastTextTag].value = addXMLPreserve(chunk, lastTextTag);
				endLindex = part.endLindex;
			}
			if (isTextEnd(part) && part.lIndex > endLindex) {
				if (endLindex !== 0) {
					chunk[lastTextTag].value = addXMLPreserve(
						chunk,
						lastTextTag
					);
				}
				pushArray(postparsed, chunk);
				chunk = [];
				inTextTag = false;
				endLindex = 0;
				lastTextTag = 0;
			}
			return postparsed;
		}, []);
		pushArray(result, chunk);
		return result;
	}
	postrender(parts) {
		let lastNonEmpty = "";
		let lastNonEmptyIndex = 0;

		for (let i = 0, len = parts.length; i < len; i++) {
			let p = parts[i];
			if (p === "") {
				continue;
			}
			if (endsWith(lastNonEmpty, wTpreserve) && startsWith(p, wtEnd)) {
				parts[lastNonEmptyIndex] =
					lastNonEmpty.substr(
						0,
						lastNonEmpty.length - wTpreservelen
					) + "<w:t/>";
				p = p.substr(wtEndlen);
			}

			lastNonEmpty = p;
			lastNonEmptyIndex = i;
			parts[i] = p;
		}

		return parts;
	}
}
module.exports = () => wrapper(new SpacePreserve());
