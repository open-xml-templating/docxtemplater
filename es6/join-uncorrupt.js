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
	/*
	 * Before doing this "uncorruption" method here, this was done with the
	 * `part.emptyValue` trick, however, there were some corruptions that were
	 * not handled, for example with a template like this :
	 *
	 * ------------------------------------------------
	 * | {-w:p falsy}My para{/falsy}   |              |
	 * | {-w:p falsy}My para{/falsy}   |              |
	 * ------------------------------------------------
	 */
	let collecting = "";
	let currentlyCollecting = -1;
	if (filetypes.docx.indexOf(options.contentType) !== -1) {
		parts = addEmptyParagraphAfterTable(parts);
	}
	let startIndex = -1;

	for (let j = 0, len2 = contains.length; j < len2; j++) {
		const { tag, shouldContain, value, drop, dropParent } = contains[j];
		for (let i = 0, len = parts.length; i < len; i++) {
			const part = parts[i];
			if (currentlyCollecting === j) {
				if (isEnding(part, tag)) {
					currentlyCollecting = -1;
					if (dropParent) {
						let start = -1;
						for (let k = startIndex; k > 0; k--) {
							if (isStarting(parts[k], dropParent)) {
								start = k;
								break;
							}
						}
						for (let k = start; k <= parts.length; k++) {
							if (isEnding(parts[k], dropParent)) {
								parts[k] = "";
								break;
							}
							parts[k] = "";
						}
					} else {
						for (let k = startIndex; k <= i; k++) {
							parts[k] = "";
						}
						if (!drop) {
							parts[i] = collecting + value + part;
						}
					}
				}
				collecting += part;
				for (let k = 0, len3 = shouldContain.length; k < len3; k++) {
					const sc = shouldContain[k];
					if (isStarting(part, sc)) {
						currentlyCollecting = -1;
						break;
					}
				}
			}

			if (
				currentlyCollecting === -1 &&
				isStarting(part, tag) &&
				// to verify that the part doesn't have multiple tags,
				// such as <w:tc><w:p>
				part.substr(1).indexOf("<") === -1
			) {
				// self-closing tag such as <w:t/>
				if (part[part.length - 2] === "/") {
					parts[i] = "";
				} else {
					startIndex = i;
					currentlyCollecting = j;
					collecting = part;
				}
			}
		}
	}
	return parts;
}

module.exports = joinUncorrupt;
