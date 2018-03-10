"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _require = require("./errors"),
    getUnclosedTagException = _require.getUnclosedTagException,
    getUnopenedTagException = _require.getUnopenedTagException,
    throwMalformedXml = _require.throwMalformedXml;

var _require2 = require("./doc-utils"),
    concatArrays = _require2.concatArrays,
    isTextStart = _require2.isTextStart,
    isTextEnd = _require2.isTextEnd;

var EQUAL = 0;
var START = -1;
var END = 1;

function inRange(range, match) {
	return range[0] <= match.offset && match.offset < range[1];
}

function updateInTextTag(part, inTextTag) {
	if (isTextStart(part)) {
		if (inTextTag) {
			throwMalformedXml(part);
		}
		return true;
	}
	if (isTextEnd(part)) {
		if (!inTextTag) {
			throwMalformedXml(part);
		}
		return false;
	}
	return inTextTag;
}

function getTag(tag) {
	var position = "start";
	var start = 1;
	if (tag[tag.length - 2] === "/") {
		position = "selfclosing";
	}
	if (tag[1] === "/") {
		start = 2;
		position = "end";
	}
	var index = tag.indexOf(" ");
	var end = index === -1 ? tag.length - 1 : index;
	return {
		tag: tag.slice(start, end),
		position: position
	};
}

function tagMatcher(content, textMatchArray, othersMatchArray) {
	var cursor = 0;
	var contentLength = content.length;
	var allMatches = concatArrays([textMatchArray.map(function (tag) {
		return { tag: tag, text: true };
	}), othersMatchArray.map(function (tag) {
		return { tag: tag, text: false };
	})]).reduce(function (allMatches, t) {
		allMatches[t.tag] = t.text;
		return allMatches;
	}, {});
	var totalMatches = [];

	while (cursor < contentLength) {
		cursor = content.indexOf("<", cursor);
		if (cursor === -1) {
			break;
		}
		var offset = cursor;
		cursor = content.indexOf(">", cursor);
		var tagText = content.slice(offset, cursor + 1);

		var _getTag = getTag(tagText),
		    tag = _getTag.tag,
		    position = _getTag.position;

		var text = allMatches[tag];
		if (text == null) {
			continue;
		}
		totalMatches.push({
			type: "tag",
			position: position,
			text: text,
			offset: offset,
			value: tagText,
			tag: tag
		});
	}

	return totalMatches;
}

function getDelimiterErrors(delimiterMatches, fullText, ranges) {
	if (delimiterMatches.length === 0) {
		return [];
	}
	var errors = [];
	var inDelimiter = false;
	var lastDelimiterMatch = { offset: 0 };
	var xtag = void 0;
	var rangeIndex = 0;
	delimiterMatches.forEach(function (delimiterMatch) {
		while (ranges[rangeIndex + 1]) {
			if (ranges[rangeIndex + 1].offset > delimiterMatch.offset) {
				break;
			}
			rangeIndex++;
		}
		xtag = fullText.substr(lastDelimiterMatch.offset, delimiterMatch.offset - lastDelimiterMatch.offset);
		if (delimiterMatch.position === "start" && inDelimiter || delimiterMatch.position === "end" && !inDelimiter) {
			if (delimiterMatch.position === "start") {
				errors.push(getUnclosedTagException({ xtag: xtag, offset: lastDelimiterMatch.offset }));
				delimiterMatch.error = true;
			} else {
				errors.push(getUnopenedTagException({ xtag: xtag, offset: delimiterMatch.offset }));
				delimiterMatch.error = true;
			}
		} else {
			inDelimiter = !inDelimiter;
		}
		lastDelimiterMatch = delimiterMatch;
	});
	var delimiterMatch = { offset: fullText.length };
	xtag = fullText.substr(lastDelimiterMatch.offset, delimiterMatch.offset - lastDelimiterMatch.offset);
	if (inDelimiter) {
		errors.push(getUnclosedTagException({ xtag: xtag, offset: lastDelimiterMatch.offset }));
		delimiterMatch.error = true;
	}
	return errors;
}

function compareOffsets(startOffset, endOffset) {
	if (startOffset === endOffset) {
		return 0;
	}
	if (startOffset === -1 || endOffset === -1) {
		return endOffset < startOffset ? START : END;
	}
	return startOffset < endOffset ? START : END;
}

function splitDelimiters(inside) {
	var newDelimiters = inside.split(" ");
	if (newDelimiters.length !== 2) {
		throw new Error("New Delimiters cannot be parsed");
	}

	var _newDelimiters = _slicedToArray(newDelimiters, 2),
	    start = _newDelimiters[0],
	    end = _newDelimiters[1];

	if (start.length === 0 || end.length === 0) {
		throw new Error("New Delimiters cannot be parsed");
	}
	return [start, end];
}

function getAllIndexes(fullText, delimiters) {
	var indexes = [];
	var start = delimiters.start,
	    end = delimiters.end;

	var offset = -1;
	while (true) {
		var startOffset = fullText.indexOf(start, offset + 1);
		var endOffset = fullText.indexOf(end, offset + 1);
		var position = null;
		var len = void 0;
		var compareResult = compareOffsets(startOffset, endOffset);
		if (compareResult === EQUAL) {
			return indexes;
		}
		if (compareResult === END) {
			offset = endOffset;
			position = "end";
			len = end.length;
		}
		if (compareResult === START) {
			offset = startOffset;
			position = "start";
			len = start.length;
		}
		if (position === "start" && fullText[offset + start.length] === "=") {
			indexes.push({
				offset: startOffset,
				position: "start",
				length: start.length,
				changedelimiter: true
			});
			var nextEqual = fullText.indexOf("=", offset + start.length + 1);
			var _endOffset = fullText.indexOf(end, nextEqual + 1);

			indexes.push({
				offset: _endOffset,
				position: "end",
				length: end.length,
				changedelimiter: true
			});
			var insideTag = fullText.substr(offset + start.length + 1, nextEqual - offset - start.length - 1);

			var _splitDelimiters = splitDelimiters(insideTag);

			var _splitDelimiters2 = _slicedToArray(_splitDelimiters, 2);

			start = _splitDelimiters2[0];
			end = _splitDelimiters2[1];

			offset = _endOffset;
			continue;
		}
		indexes.push({ offset: offset, position: position, length: len });
	}
}

function Reader(innerContentParts) {
	var _this = this;

	this.innerContentParts = innerContentParts;
	this.full = "";
	this.parseDelimiters = function (delimiters) {
		_this.full = _this.innerContentParts.map(function (p) {
			return p.value;
		}).join("");
		var delimiterMatches = getAllIndexes(_this.full, delimiters);

		var offset = 0;
		var ranges = _this.innerContentParts.map(function (part) {
			offset += part.value.length;
			return { offset: offset - part.value.length, lIndex: part.lIndex };
		});

		var errors = getDelimiterErrors(delimiterMatches, _this.full, ranges);
		var cutNext = 0;
		var delimiterIndex = 0;

		_this.parsed = ranges.map(function (p, i) {
			var offset = p.offset;

			var range = [offset, offset + this.innerContentParts[i].value.length];
			var partContent = this.innerContentParts[i].value;
			var delimitersInOffset = [];
			while (delimiterIndex < delimiterMatches.length && inRange(range, delimiterMatches[delimiterIndex])) {
				delimitersInOffset.push(delimiterMatches[delimiterIndex]);
				delimiterIndex++;
			}
			var parts = [];
			var cursor = 0;
			if (cutNext > 0) {
				cursor = cutNext;
				cutNext = 0;
			}
			var insideDelimiterChange = void 0;
			delimitersInOffset.forEach(function (delimiterInOffset) {
				var value = partContent.substr(cursor, delimiterInOffset.offset - offset - cursor);
				if (value.length > 0) {
					if (insideDelimiterChange) {
						if (delimiterInOffset.changedelimiter) {
							cursor = delimiterInOffset.offset - offset + delimiterInOffset.length;
							insideDelimiterChange = delimiterInOffset.position === "start";
						}
						return;
					}
					parts.push({ type: "content", value: value, offset: cursor + offset });
					cursor += value.length;
				}
				var delimiterPart = {
					type: "delimiter",
					position: delimiterInOffset.position,
					offset: cursor + offset
				};
				if (delimiterInOffset.error) {
					delimiterPart.error = delimiterInOffset.error;
				}
				if (delimiterInOffset.changedelimiter) {
					insideDelimiterChange = delimiterInOffset.position === "start";
					cursor = delimiterInOffset.offset - offset + delimiterInOffset.length;
					return;
				}
				parts.push(delimiterPart);
				cursor = delimiterInOffset.offset - offset + delimiterInOffset.length;
			});
			cutNext = cursor - partContent.length;
			var value = partContent.substr(cursor);
			if (value.length > 0) {
				parts.push({ type: "content", value: value, offset: offset });
			}
			return parts;
		}, _this);
		_this.errors = errors;
	};
}

module.exports = {
	parse: function parse(xmlparsed, delimiters) {
		var inTextTag = false;
		var innerContentParts = [];
		xmlparsed.forEach(function (part) {
			inTextTag = updateInTextTag(part, inTextTag);
			if (inTextTag && part.type === "content") {
				innerContentParts.push(part);
			}
		});
		var reader = new Reader(innerContentParts);
		reader.parseDelimiters(delimiters);

		var lexed = [];
		var index = 0;
		xmlparsed.forEach(function (part) {
			inTextTag = updateInTextTag(part, inTextTag);
			if (part.type === "content") {
				part.position = inTextTag ? "insidetag" : "outsidetag";
			}
			if (inTextTag && part.type === "content") {
				Array.prototype.push.apply(lexed, reader.parsed[index].map(function (p) {
					if (p.type === "content") {
						p.position = "insidetag";
					}
					return p;
				}));
				index++;
			} else {
				lexed.push(part);
			}
		});
		return { errors: reader.errors, lexed: lexed };
	},
	xmlparse: function xmlparse(content, xmltags) {
		var matches = tagMatcher(content, xmltags.text, xmltags.other);
		var cursor = 0;
		var parsed = matches.reduce(function (parsed, match) {
			var value = content.substr(cursor, match.offset - cursor);
			if (value.length > 0) {
				parsed.push({ type: "content", value: value });
			}
			cursor = match.offset + match.value.length;
			delete match.offset;
			if (match.value.length > 0) {
				parsed.push(match);
			}
			return parsed;
		}, []).map(function (p, i) {
			p.lIndex = i;
			return p;
		});
		var value = content.substr(cursor);
		if (value.length > 0) {
			parsed.push({ type: "content", value: value });
		}
		return parsed;
	}
};