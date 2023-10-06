const {
	getUnclosedTagException,
	getUnopenedTagException,
	getDuplicateOpenTagException,
	getDuplicateCloseTagException,
	throwMalformedXml,
	throwXmlInvalid,
	XTTemplateError,
} = require("./errors.js");
const { isTextStart, isTextEnd, wordToUtf8 } = require("./doc-utils.js");

const [DELIMITER_NONE, DELIMITER_EQUAL, DELIMITER_START, DELIMITER_END] = [
	0, 1, 2, 3,
];

function inRange(range, match) {
	return range[0] <= match.offset && match.offset < range[1];
}

function updateInTextTag(part, inTextTag) {
	if (isTextStart(part)) {
		if (inTextTag) {
			throwMalformedXml();
		}
		return true;
	}
	if (isTextEnd(part)) {
		if (!inTextTag) {
			throwMalformedXml();
		}
		return false;
	}
	return inTextTag;
}

function getTag(tag) {
	let position = "";
	let start = 1;
	let end = tag.indexOf(" ");
	if (tag[tag.length - 2] === "/") {
		position = "selfclosing";
		if (end === -1) {
			end = tag.length - 2;
		}
	} else if (tag[1] === "/") {
		start = 2;
		position = "end";
		if (end === -1) {
			end = tag.length - 1;
		}
	} else {
		position = "start";
		if (end === -1) {
			end = tag.length - 1;
		}
	}
	return {
		tag: tag.slice(start, end),
		position,
	};
}

function tagMatcher(content, textMatchArray, othersMatchArray) {
	let cursor = 0;
	const contentLength = content.length;

	const allMatches = {};
	for (let i = 0, len = textMatchArray.length; i < len; i++) {
		allMatches[textMatchArray[i]] = true;
	}
	for (let i = 0, len = othersMatchArray.length; i < len; i++) {
		allMatches[othersMatchArray[i]] = false;
	}
	const totalMatches = [];

	while (cursor < contentLength) {
		cursor = content.indexOf("<", cursor);
		if (cursor === -1) {
			break;
		}
		const offset = cursor;
		const nextOpening = content.indexOf("<", cursor + 1);
		cursor = content.indexOf(">", cursor);
		if (cursor === -1 || (nextOpening !== -1 && cursor > nextOpening)) {
			throwXmlInvalid(content, offset);
		}
		const tagText = content.slice(offset, cursor + 1);
		const { tag, position } = getTag(tagText);
		const text = allMatches[tag];
		if (text == null) {
			continue;
		}
		totalMatches.push({
			type: "tag",
			position,
			text,
			offset,
			value: tagText,
			tag,
		});
	}

	return totalMatches;
}

function getDelimiterErrors(delimiterMatches, fullText, syntaxOptions) {
	const errors = [];
	let inDelimiter = false;
	let lastDelimiterMatch = { offset: 0 };
	let xtag;

	const delimiterWithErrors = delimiterMatches.reduce(
		(delimiterAcc, currDelimiterMatch) => {
			const position = currDelimiterMatch.position;
			const delimiterOffset = currDelimiterMatch.offset;
			const lastDelimiterOffset = lastDelimiterMatch.offset;
			const lastDelimiterLength = lastDelimiterMatch.length;
			xtag = fullText.substr(
				lastDelimiterOffset,
				delimiterOffset - lastDelimiterOffset
			);

			if (inDelimiter && position === "start") {
				if (lastDelimiterOffset + lastDelimiterLength === delimiterOffset) {
					xtag = fullText.substr(
						lastDelimiterOffset,
						delimiterOffset - lastDelimiterOffset + lastDelimiterLength + 4
					);
					errors.push(
						getDuplicateOpenTagException({
							xtag,
							offset: lastDelimiterOffset,
						})
					);
					lastDelimiterMatch = currDelimiterMatch;
					delimiterAcc.push({ ...currDelimiterMatch, error: true });
					return delimiterAcc;
				}
				errors.push(
					getUnclosedTagException({
						xtag: wordToUtf8(xtag),
						offset: lastDelimiterOffset,
					})
				);
				lastDelimiterMatch = currDelimiterMatch;
				delimiterAcc.push({ ...currDelimiterMatch, error: true });
				return delimiterAcc;
			}

			if (!inDelimiter && position === "end") {
				if (syntaxOptions.allowUnopenedTag) {
					return delimiterAcc;
				}
				if (lastDelimiterOffset + lastDelimiterLength === delimiterOffset) {
					xtag = fullText.substr(
						lastDelimiterOffset - 4,
						delimiterOffset - lastDelimiterOffset + lastDelimiterLength + 4
					);
					errors.push(
						getDuplicateCloseTagException({
							xtag,
							offset: lastDelimiterOffset,
						})
					);
					lastDelimiterMatch = currDelimiterMatch;
					delimiterAcc.push({ ...currDelimiterMatch, error: true });
					return delimiterAcc;
				}
				errors.push(
					getUnopenedTagException({
						xtag,
						offset: delimiterOffset,
					})
				);
				lastDelimiterMatch = currDelimiterMatch;
				delimiterAcc.push({ ...currDelimiterMatch, error: true });
				return delimiterAcc;
			}

			inDelimiter = !inDelimiter;
			lastDelimiterMatch = currDelimiterMatch;
			delimiterAcc.push(currDelimiterMatch);
			return delimiterAcc;
		},
		[]
	);

	if (inDelimiter) {
		const lastDelimiterOffset = lastDelimiterMatch.offset;
		xtag = fullText.substr(
			lastDelimiterOffset,
			fullText.length - lastDelimiterOffset
		);
		errors.push(
			getUnclosedTagException({
				xtag: wordToUtf8(xtag),
				offset: lastDelimiterOffset,
			})
		);
	}

	return {
		delimiterWithErrors,
		errors,
	};
}

function compareOffsets(startOffset, endOffset) {
	if (startOffset === -1 && endOffset === -1) {
		return DELIMITER_NONE;
	}
	if (startOffset === endOffset) {
		return DELIMITER_EQUAL;
	}
	if (startOffset === -1 || endOffset === -1) {
		return endOffset < startOffset ? DELIMITER_START : DELIMITER_END;
	}
	return startOffset < endOffset ? DELIMITER_START : DELIMITER_END;
}

function splitDelimiters(inside) {
	const newDelimiters = inside.split(" ");
	if (newDelimiters.length !== 2) {
		const err = new XTTemplateError("New Delimiters cannot be parsed");
		err.properties = {
			id: "change_delimiters_invalid",
			explanation: "Cannot parser delimiters",
		};
		throw err;
	}
	const [start, end] = newDelimiters;
	if (start.length === 0 || end.length === 0) {
		const err = new XTTemplateError("New Delimiters cannot be parsed");
		err.properties = {
			id: "change_delimiters_invalid",
			explanation: "Cannot parser delimiters",
		};
		throw err;
	}
	return [start, end];
}

function getAllDelimiterIndexes(fullText, delimiters) {
	const indexes = [];
	let { start, end } = delimiters;
	let offset = -1;
	let insideTag = false;
	while (true) {
		const startOffset = fullText.indexOf(start, offset + 1);
		const endOffset = fullText.indexOf(end, offset + 1);
		let position = null;
		let len;
		let compareResult = compareOffsets(startOffset, endOffset);
		if (compareResult === DELIMITER_EQUAL) {
			compareResult = insideTag ? DELIMITER_END : DELIMITER_START;
		}
		switch (compareResult) {
			case DELIMITER_NONE:
				return indexes;
			case DELIMITER_END:
				insideTag = false;
				offset = endOffset;
				position = "end";
				len = end.length;
				break;
			case DELIMITER_START:
				insideTag = true;
				offset = startOffset;
				position = "start";
				len = start.length;
				break;
		}
		// if tag starts with =, such as {=[ ]=}
		if (
			compareResult === DELIMITER_START &&
			fullText[offset + start.length] === "="
		) {
			indexes.push({
				offset: startOffset,
				position: "start",
				length: start.length,
				changedelimiter: true,
			});
			const nextEqual = fullText.indexOf("=", offset + start.length + 1);
			const nextEndOffset = fullText.indexOf(end, nextEqual + 1);

			indexes.push({
				offset: nextEndOffset,
				position: "end",
				length: end.length,
				changedelimiter: true,
			});
			const insideTag = fullText.substr(
				offset + start.length + 1,
				nextEqual - offset - start.length - 1
			);
			[start, end] = splitDelimiters(insideTag);
			offset = nextEndOffset;
			continue;
		}
		indexes.push({ offset, position, length: len });
	}
}

function parseDelimiters(innerContentParts, delimiters, syntaxOptions) {
	const full = innerContentParts.map((p) => p.value).join("");
	const delimiterMatches = getAllDelimiterIndexes(full, delimiters);

	let offset = 0;
	const ranges = innerContentParts.map(function (part) {
		offset += part.value.length;
		return { offset: offset - part.value.length, lIndex: part.lIndex };
	});
	const { delimiterWithErrors, errors } = getDelimiterErrors(
		delimiterMatches,
		full,
		syntaxOptions
	);
	let cutNext = 0;
	let delimiterIndex = 0;

	const parsed = ranges.map(function (p, i) {
		const { offset } = p;
		const range = [offset, offset + innerContentParts[i].value.length];
		const partContent = innerContentParts[i].value;
		const delimitersInOffset = [];
		while (
			delimiterIndex < delimiterWithErrors.length &&
			inRange(range, delimiterWithErrors[delimiterIndex])
		) {
			delimitersInOffset.push(delimiterWithErrors[delimiterIndex]);
			delimiterIndex++;
		}
		const parts = [];
		let cursor = 0;
		if (cutNext > 0) {
			cursor = cutNext;
			cutNext = 0;
		}
		delimitersInOffset.forEach(function (delimiterInOffset) {
			const value = partContent.substr(
				cursor,
				delimiterInOffset.offset - offset - cursor
			);
			if (delimiterInOffset.changedelimiter) {
				if (delimiterInOffset.position === "start") {
					if (value.length > 0) {
						parts.push({ type: "content", value });
					}
				} else {
					cursor = delimiterInOffset.offset - offset + delimiterInOffset.length;
				}
				return;
			}
			if (value.length > 0) {
				parts.push({ type: "content", value });
				cursor += value.length;
			}
			const delimiterPart = {
				type: "delimiter",
				position: delimiterInOffset.position,
				offset: cursor + offset,
			};
			parts.push(delimiterPart);
			cursor = delimiterInOffset.offset - offset + delimiterInOffset.length;
		});
		cutNext = cursor - partContent.length;
		const value = partContent.substr(cursor);
		if (value.length > 0) {
			parts.push({ type: "content", value });
		}
		return parts;
	}, this);
	return { parsed, errors };
}

function isInsideContent(part) {
	// Stryker disable all : because the part.position === "insidetag" would be enough but we want to make the API future proof
	return part.type === "content" && part.position === "insidetag";
	// Stryker restore all
}

function getContentParts(xmlparsed) {
	return xmlparsed.filter(isInsideContent);
}

function decodeContentParts(xmlparsed) {
	let inTextTag = false;
	xmlparsed.forEach(function (part) {
		inTextTag = updateInTextTag(part, inTextTag);
		if (part.type === "content") {
			part.position = inTextTag ? "insidetag" : "outsidetag";
		}
		if (isInsideContent(part)) {
			part.value = part.value.replace(/>/g, "&gt;");
		}
	});
}

module.exports = {
	parseDelimiters,
	parse(xmlparsed, delimiters, syntaxOptions) {
		decodeContentParts(xmlparsed);
		const { parsed: delimiterParsed, errors } = parseDelimiters(
			getContentParts(xmlparsed),
			delimiters,
			syntaxOptions
		);

		const lexed = [];
		let index = 0;
		let lIndex = 0;
		xmlparsed.forEach(function (part) {
			if (isInsideContent(part)) {
				Array.prototype.push.apply(
					lexed,
					delimiterParsed[index].map(function (p) {
						if (p.type === "content") {
							p.position = "insidetag";
						}
						p.lIndex = lIndex++;
						return p;
					})
				);
				index++;
			} else {
				part.lIndex = lIndex++;
				lexed.push(part);
			}
		});
		return { errors, lexed };
	},
	xmlparse(content, xmltags) {
		const matches = tagMatcher(content, xmltags.text, xmltags.other);
		let cursor = 0;
		const parsed = matches.reduce(function (parsed, match) {
			const value = content.substr(cursor, match.offset - cursor);
			if (value.length > 0) {
				parsed.push({ type: "content", value });
			}
			cursor = match.offset + match.value.length;
			delete match.offset;
			parsed.push(match);
			return parsed;
		}, []);
		const value = content.substr(cursor);
		if (value.length > 0) {
			parsed.push({ type: "content", value });
		}
		return parsed;
	},
};
