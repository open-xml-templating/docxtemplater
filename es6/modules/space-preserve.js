const wrapper = require("../module-wrapper.js");
const {
	isTextStart,
	isTextEnd,
	endsWith,
	startsWith,
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

const spacePreserve = {
	name: "SpacePreserveModule",
	postparse(postparsed, meta) {
		let chunk = [],
			inTextTag = false,
			endLindex = 0,
			lastTextTag = 0;
		function isStartingPlaceHolder(part, chunk) {
			return (
				part.type === "placeholder" &&
				(!part.module || part.module === "loop") &&
				chunk.length > 1
			);
		}
		const result = postparsed.reduce(function (postparsed, part) {
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
					chunk[lastTextTag].value = addXMLPreserve(chunk, lastTextTag);
				}
				Array.prototype.push.apply(postparsed, chunk);
				chunk = [];
				inTextTag = false;
				endLindex = 0;
				lastTextTag = 0;
			}
			return postparsed;
		}, []);
		Array.prototype.push.apply(result, chunk);
		return result;
	},
	postrender(parts) {
		let lastNonEmpty = "";
		let lastNonEmptyIndex = 0;
		return parts.reduce(function (newParts, p, index) {
			if (p === "") {
				newParts.push(p);
				return newParts;
			}
			if (p.indexOf('<w:t xml:space="preserve"></w:t>') !== -1) {
				p = p.replace(/<w:t xml:space="preserve"><\/w:t>/g, "<w:t/>");
			}
			if (endsWith(lastNonEmpty, wTpreserve) && startsWith(p, wtEnd)) {
				newParts[lastNonEmptyIndex] =
					lastNonEmpty.substr(0, lastNonEmpty.length - wTpreservelen) +
					"<w:t/>";
				p = p.substr(wtEndlen);
			}
			lastNonEmpty = p;
			lastNonEmptyIndex = index;
			newParts.push(p);
			return newParts;
		}, []);
	},
};
module.exports = () => wrapper(spacePreserve);
