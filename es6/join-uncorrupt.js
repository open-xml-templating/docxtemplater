function joinUncorrupt(parts, contains) {
	// Before doing this "uncorruption" method here, this was done with the `part.emptyValue` trick, however, there were some corruptions that were not handled, for example with a template like this :
	//
	// ------------------------------------------------
	// | {-w:p falsy}My para{/falsy}   |              |
	// | {-w:p falsy}My para{/falsy}   |              |
	// ------------------------------------------------
	let collecting = "";
	let currentlyCollecting = -1;
	return parts.reduce(function (full, part) {
		for (let i = 0, len = contains.length; i < len; i++) {
			const { tag, shouldContain, value } = contains[i];
			const startTagRegex = new RegExp(`^(<(${tag})[^>]*>)$`, "g");
			if (currentlyCollecting === i) {
				if (part === `</${tag}>`) {
					currentlyCollecting = -1;
					return full + collecting + value + part;
				}
				collecting += part;
				for (let j = 0, len2 = shouldContain.length; j < len2; j++) {
					const sc = shouldContain[j];
					if (
						part.indexOf(`<${sc} `) !== -1 ||
						part.indexOf(`<${sc}>`) !== -1
					) {
						currentlyCollecting = -1;
						return full + collecting;
					}
				}
				return full;
			}
			if (currentlyCollecting === -1 && startTagRegex.test(part)) {
				currentlyCollecting = i;
				collecting = part;
				return full;
			}
		}
		return full + part;
	}, "");
}

module.exports = joinUncorrupt;
