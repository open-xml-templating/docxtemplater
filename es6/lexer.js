const Errors = require("./errors");

function inRange(range, match) {
	return range[0] <= match.offset && match.offset < range[1];
}

function updateInTextTag(part, inTextTag) {
	if (part.type === "tag" && part.position === "start" && part.text) {
		if (inTextTag) {
			throw new Error("Malformed xml : Already in text tag");
		}
		return true;
	}
	if (part.type === "tag" && part.position === "end" && part.text) {
		if (!inTextTag) {
			throw new Error("Malformed xml : Already not in text tag");
		}
		return false;
	}
	return inTextTag;
}

function offsetSort(a, b) {
	return a.offset - b.offset;
}

function getTag(tag) {
	let start = 1;
	if (tag[1] === "/") {
		start = 2;
	}
	const index = tag.indexOf(" ");
	const end = index === -1 ? tag.length - 1 : index;
	return {
		tag: tag.slice(start, end),
		position: start === 1 ? "start" : "end",
	};
}

function tagMatcher(content, textMatchArray, othersMatchArray) {
	let cursor = 0;
	const contentLength = content.length;
	const allMatches = textMatchArray.map(function (tag) {
		return {tag, text: true};
	}).concat(othersMatchArray.map(function (tag) {
		return {tag, text: false};
	})).reduce(function (allMatches, t) {
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
		totalMatches.push({type: "tag", position, text, offset, value: tagText});
	}

	return totalMatches;
}

function throwUnopenedTagException(options) {
	const err = new Errors.XTTemplateError("Unopened tag");
	err.properties = {
		xtag: options.xtag.split(" ")[0],
		id: "unopened_tag",
		context: options.xtag,
		explanation: `The tag beginning with '${options.xtag.substr(0, 10)}' is unclosed`,
	};
	throw err;
}

function throwUnclosedTagException(options) {
	const err = new Errors.XTTemplateError("Unclosed tag");
	err.properties = {
		xtag: options.xtag.split(" ")[0].substr(1),
		id: "unclosed_tag",
		context: options.xtag,
		explanation: `The tag beginning with '${options.xtag.substr(0, 10)}' is unclosed`,
	};
	throw err;
}

function assertDelimiterOrdered(delimiterMatches, fullText) {
	let inDelimiter = false;
	let lastDelimiterMatch = {offset: 0};
	let xtag;
	delimiterMatches.forEach(function (delimiterMatch) {
		xtag = fullText.substr(lastDelimiterMatch.offset, delimiterMatch.offset - lastDelimiterMatch.offset);
		if ((delimiterMatch.position === "start" && inDelimiter) || (delimiterMatch.position === "end" && !inDelimiter)) {
			if (delimiterMatch.position === "start") {
				throwUnclosedTagException({xtag});
			}
			else {
				throwUnopenedTagException({xtag});
			}
		}
		inDelimiter = !inDelimiter;
		lastDelimiterMatch = delimiterMatch;
	});
	const delimiterMatch = {offset: fullText.length};
	xtag = fullText.substr(lastDelimiterMatch.offset, delimiterMatch.offset - lastDelimiterMatch.offset);
	if (inDelimiter) {
		throwUnclosedTagException({xtag});
	}
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
		this.full = this.innerContentParts.join("");
		let offset = 0;
		this.ranges = this.innerContentParts.map(function (part) {
			offset += part.length;
			return offset - part.length;
		});

		const delimiterMatches = getAllIndexes(this.full, delimiters.start, "start").concat(getAllIndexes(this.full, delimiters.end, "end")).sort(offsetSort);
		assertDelimiterOrdered(delimiterMatches, this.full);
		const delimiterLength = {start: delimiters.start.length, end: delimiters.end.length};
		let cutNext = 0;
		let delimiterIndex = 0;

		this.parsed = this.ranges.map(function (offset, i) {
			const range = [offset, offset + this.innerContentParts[i].length];
			const partContent = this.innerContentParts[i];
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
					parts.push({type: "content", value});
				}
				parts.push({type: "delimiter", position: delimiterInOffset.position});
				cursor = delimiterInOffset.offset - offset + delimiterLength[delimiterInOffset.position];
			});
			cutNext = cursor - partContent.length;
			const value = partContent.substr(cursor);
			if (value.length > 0) {
				parts.push({type: "content", value});
			}
			return parts;
		}, this);
	};
}

module.exports = {
	parse(xmlparsed, delimiters) {
		let inTextTag = false;
		const innerContentParts = [];
		xmlparsed.forEach(function (part) {
			inTextTag = updateInTextTag(part, inTextTag);
			if(inTextTag && part.type === "content") {
				innerContentParts.push(part.value);
			}
		});
		const reader = new Reader(innerContentParts);
		reader.parseDelimiters(delimiters);

		const newArray = [];
		let index = 0;
		xmlparsed.forEach(function (part) {
			inTextTag = updateInTextTag(part, inTextTag);
			if (part.type === "content") {
				part.position = inTextTag ? "insidetag" : "outsidetag";
			}
			if(inTextTag && part.type === "content") {
				Array.prototype.push.apply(newArray, reader.parsed[index].map(function (p) {
					if (p.type === "content") {
						p.position = "insidetag";
					}
					return p;
				}));
				index++;
			}
			else {
				newArray.push(part);
			}
		});
		return newArray;
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
		}, []);
		const value = content.substr(cursor);
		if (value.length > 0) {
			parsed.push({type: "content", value});
		}
		return parsed;
	},
};
