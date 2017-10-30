const {getUnclosedTagException, getUnopenedTagException, throwMalformedXml} = require("./errors");
const {concatArrays} = require("./doc-utils");

function inRange(range, match) {
	return range[0] <= match.offset && match.offset < range[1];
}

function updateInTextTag(part, inTextTag) {
	if (part.type === "tag" && part.position === "start" && part.text) {
		if (inTextTag) {
			throwMalformedXml(part);
		}
		return true;
	}
	if (part.type === "tag" && part.position === "end" && part.text) {
		if (!inTextTag) {
			throwMalformedXml(part);
		}
		return false;
	}
	return inTextTag;
}

function offsetSort(a, b) {
	return a.offset - b.offset;
}

function getTag(tag) {
	let position = "start";
	let start = 1;
	if (tag[tag.length - 2] === "/") {
		position = "selfclosing";
	}
	if (tag[1] === "/") {
		start = 2;
		position = "end";
	}
	const index = tag.indexOf(" ");
	const end = index === -1 ? tag.length - 1 : index;
	return {
		tag: tag.slice(start, end),
		position,
	};
}

function tagMatcher(content, textMatchArray, othersMatchArray) {
	let cursor = 0;
	const contentLength = content.length;
	const allMatches = concatArrays(
		[
			textMatchArray.map(function (tag) {
				return {tag, text: true};
			}),
			othersMatchArray.map(function (tag) {
				return {tag, text: false};
			}),
		]
	).reduce(function (allMatches, t) {
		allMatches[t.tag] = t.text;
		return allMatches;
	}, {});
	const totalMatches = [];

	while (cursor < contentLength) {
		cursor = content.indexOf("<", cursor);
		if (cursor === -1) {
			break;
		}
		const offset = cursor;
		cursor = content.indexOf(">", cursor);
		const tagText = content.slice(offset, cursor + 1);
		const {tag, position} = getTag(tagText);
		const text = allMatches[tag];
		if (text == null) {
			continue;
		}
		totalMatches.push({type: "tag", position, text, offset, value: tagText, tag});
	}

	return totalMatches;
}

function getDelimiterErrors(delimiterMatches, fullText, ranges) {
	if (delimiterMatches.length === 0) {
		return [];
	}
	const errors = [];
	let inDelimiter = false;
	let lastDelimiterMatch = {offset: 0};
	let xtag;
	let rangeIndex = 0;
	delimiterMatches.forEach(function (delimiterMatch) {
		while(ranges[rangeIndex + 1]) {
			if (ranges[rangeIndex + 1].offset > delimiterMatch.offset) {
				break;
			}
			rangeIndex++;
		}
		xtag = fullText.substr(lastDelimiterMatch.offset, delimiterMatch.offset - lastDelimiterMatch.offset);
		if (delimiterMatch.position === "start" && inDelimiter || delimiterMatch.position === "end" && !inDelimiter) {
			if (delimiterMatch.position === "start") {
				errors.push(getUnclosedTagException({xtag, offset: lastDelimiterMatch.offset}));
				delimiterMatch.error = true;
			}
			else {
				errors.push(getUnopenedTagException({xtag, offset: delimiterMatch.offset}));
				delimiterMatch.error = true;
			}
		}
		else {
			inDelimiter = !inDelimiter;
		}
		lastDelimiterMatch = delimiterMatch;
	});
	const delimiterMatch = {offset: fullText.length};
	xtag = fullText.substr(lastDelimiterMatch.offset, delimiterMatch.offset - lastDelimiterMatch.offset);
	if (inDelimiter) {
		errors.push(getUnclosedTagException({xtag, offset: lastDelimiterMatch.offset}));
		delimiterMatch.error = true;
	}
	return errors;
}

function getAllIndexes(arr, val, position) {
	const indexes = [];
	let offset = -1;
	do {
		offset = arr.indexOf(val, offset + 1);
		if (offset !== -1) {
			indexes.push({offset, position});
		}
	} while (offset !== -1);
	return indexes;
}

function Reader(innerContentParts) {
	this.innerContentParts = innerContentParts;
	this.full = "";
	this.parseDelimiters = (delimiters) => {
		this.full = this.innerContentParts.map((p) => p.value).join("");
		const delimiterMatches = concatArrays([getAllIndexes(this.full, delimiters.start, "start"), getAllIndexes(this.full, delimiters.end, "end")]).sort(offsetSort);

		let offset = 0;
		const ranges = this.innerContentParts.map(function (part) {
			offset += part.value.length;
			return {offset: offset - part.value.length, lIndex: part.lIndex};
		});

		const errors = getDelimiterErrors(delimiterMatches, this.full, ranges);
		const delimiterLength = {start: delimiters.start.length, end: delimiters.end.length};
		let cutNext = 0;
		let delimiterIndex = 0;

		this.parsed = ranges.map(function (p, i) {
			const {offset} = p;
			const range = [offset, offset + this.innerContentParts[i].value.length];
			const partContent = this.innerContentParts[i].value;
			const delimitersInOffset = [];
			while (delimiterIndex < delimiterMatches.length && inRange(range, delimiterMatches[delimiterIndex])) {
				delimitersInOffset.push(delimiterMatches[delimiterIndex]);
				delimiterIndex++;
			}
			const parts = [];
			let cursor = 0;
			if(cutNext > 0) {
				cursor = cutNext;
				cutNext = 0;
			}
			delimitersInOffset.forEach(function (delimiterInOffset) {
				const value = partContent.substr(cursor, delimiterInOffset.offset - offset - cursor);
				if (value.length > 0) {
					parts.push({type: "content", value, offset: cursor + offset});
					cursor += value.length;
				}
				const delimiterPart = {
					type: "delimiter",
					position: delimiterInOffset.position,
					offset: cursor + offset,
				};
				if (delimiterInOffset.error) {
					delimiterPart.error = delimiterInOffset.error;
				}
				parts.push(delimiterPart);
				cursor = delimiterInOffset.offset - offset + delimiterLength[delimiterInOffset.position];
			});
			cutNext = cursor - partContent.length;
			const value = partContent.substr(cursor);
			if (value.length > 0) {
				parts.push({type: "content", value, offset});
			}
			return parts;
		}, this);
		this.errors = errors;
	};
}

module.exports = {
	parse(xmlparsed, delimiters) {
		let inTextTag = false;
		const innerContentParts = [];
		xmlparsed.forEach(function (part) {
			inTextTag = updateInTextTag(part, inTextTag);
			if(inTextTag && part.type === "content") {
				innerContentParts.push(part);
			}
		});
		const reader = new Reader(innerContentParts);
		reader.parseDelimiters(delimiters);

		const lexed = [];
		let index = 0;
		xmlparsed.forEach(function (part) {
			inTextTag = updateInTextTag(part, inTextTag);
			if (part.type === "content") {
				part.position = inTextTag ? "insidetag" : "outsidetag";
			}
			if(inTextTag && part.type === "content") {
				Array.prototype.push.apply(lexed, reader.parsed[index].map(function (p) {
					if (p.type === "content") {
						p.position = "insidetag";
					}
					return p;
				}));
				index++;
			}
			else {
				lexed.push(part);
			}
		});
		return {errors: reader.errors, lexed};
	},
	xmlparse(content, xmltags) {
		const matches = tagMatcher(content, xmltags.text, xmltags.other);
		let cursor = 0;
		const parsed = matches.reduce(function (parsed, match) {
			const value = content.substr(cursor, match.offset - cursor);
			if (value.length > 0) {
				parsed.push({type: "content", value});
			}
			cursor = match.offset + match.value.length;
			delete match.offset;
			if(match.value.length > 0) {
				parsed.push(match);
			}
			return parsed;
		}, []).map(function (p, i) {
			p.lIndex = i;
			return p;
		});
		const value = content.substr(cursor);
		if (value.length > 0) {
			parsed.push({type: "content", value});
		}
		return parsed;
	},
};
