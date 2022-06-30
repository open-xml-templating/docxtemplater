const {
	startsWith,
	endsWith,
	isStarting,
	isEnding,
	isWhiteSpace,
} = require("./doc-utils.js");
const filetypes = require("./filetypes.js");

function addEmptyParagraphAfterTable(parts) {
	let lastNonEmpty = "";

	for (let i = 0, len = parts.length; i < len; i++) {
		let p = parts[i];
		if (isWhiteSpace(p)) {
			continue;
		}

		if (endsWith(lastNonEmpty, "</w:tbl>")) {
			if (
				!startsWith(p, "<w:p") &&
				!startsWith(p, "<w:tbl") &&
				!startsWith(p, "<w:sectPr")
			) {
				p = `<w:p/>${p}`;
			}
		}

		lastNonEmpty = p;
		parts[i] = p;
	}
	return parts;
}

// eslint-disable-next-line complexity
function joinUncorrupt(parts, options) {
	const contains = options.fileTypeConfig.tagShouldContain || [];
	/* Before doing this "uncorruption" method here, this was done with the
	 * `part.emptyValue` trick, however, there were some corruptions that were
	 * not handled, for example with a template like this :
	 *
	 * ------------------------------------------------
	 * | {-w:p falsy}My para{/falsy}   |              |
	 * | {-w:p falsy}My para{/falsy}   |              |
	 */
	let collecting = "";
	let currentlyCollecting = -1;
	if (filetypes.docx.indexOf(options.contentType) !== -1) {
		parts = addEmptyParagraphAfterTable(parts);
	}
	let startIndex = -1;

	for (let i = 0, len = parts.length; i < len; i++) {
		const part = parts[i];
		for (let j = 0, len2 = contains.length; j < len2; j++) {
			const { tag, shouldContain, value, drop } = contains[j];
			if (currentlyCollecting === j) {
				if (isEnding(part, tag)) {
					currentlyCollecting = -1;
					if (drop) {
						for (let k = startIndex; k <= i; k++) {
							parts[k] = "";
						}
					} else {
						for (let k = startIndex; k < i; k++) {
							parts[k] = "";
						}
						parts[i] = collecting + value + part;
					}
					break;
				}
				collecting += part;
				for (let k = 0, len3 = shouldContain.length; k < len3; k++) {
					const sc = shouldContain[k];
					if (isStarting(part, sc)) {
						currentlyCollecting = -1;
						// parts[i] = collecting;
						break;
					}
				}
				if (currentlyCollecting > -1) {
					// parts[i] = "";
				}
				break;
			}

			if (
				currentlyCollecting === -1 &&
				isStarting(part, tag) &&
				// to verify that the part doesn't have multiple tags, such as <w:tc><w:p>
				part.substr(1).indexOf("<") === -1
			) {
				// self-closing tag such as <w:t/>
				if (part[part.length - 2] === "/") {
					parts[i] = "";
					break;
				} else {
					startIndex = i;
					currentlyCollecting = j;
					collecting = part;
					// parts[i] = "";
					break;
				}
			}
		}
	}
	return parts;
}

module.exports = joinUncorrupt;
