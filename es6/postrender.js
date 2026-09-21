/*
 * UTF-8 helpers avoid retaining one Uint8Array per part before creating the
 * final output buffer. A pending high surrogate preserves pairs split across
 * adjacent string parts.
 *
 * Parts can be either strings or Uint8Arrays.
 */

function utf8Length(parts) {
	let length = 0;
	let pendingHighSurrogate = -1;

	for (const part of parts) {
		if (part instanceof Uint8Array) {
			if (pendingHighSurrogate !== -1) {
				length += 3;
				pendingHighSurrogate = -1;
			}

			length += part.length;
			continue;
		}

		for (let i = 0; i < part.length; i++) {
			const codePoint = part.charCodeAt(i);

			if (pendingHighSurrogate !== -1) {
				if ((codePoint & 0xfc00) === 0xdc00) {
					length += 4;
					pendingHighSurrogate = -1;
					continue;
				}

				length += 3;
				pendingHighSurrogate = -1;
			}

			if ((codePoint & 0xfc00) === 0xd800) {
				if (i + 1 < part.length) {
					const next = part.charCodeAt(i + 1);

					if ((next & 0xfc00) === 0xdc00) {
						length += 4;
						i++;
						continue;
					}
				} else {
					pendingHighSurrogate = codePoint;
					continue;
				}
			}

			length += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : 3;
		}
	}

	return length + (pendingHighSurrogate === -1 ? 0 : 3);
}

function writeUtf8(parts, output) {
	let offset = 0;
	let pendingHighSurrogate = -1;

	function writeCodePoint(codePoint) {
		if (codePoint < 0x80) {
			output[offset++] = codePoint;
		} else if (codePoint < 0x800) {
			output[offset++] = 0xc0 | (codePoint >>> 6);
			output[offset++] = 0x80 | (codePoint & 0x3f);
		} else if (codePoint < 0x10000) {
			output[offset++] = 0xe0 | (codePoint >>> 12);
			output[offset++] = 0x80 | ((codePoint >>> 6) & 0x3f);
			output[offset++] = 0x80 | (codePoint & 0x3f);
		} else {
			output[offset++] = 0xf0 | (codePoint >>> 18);
			output[offset++] = 0x80 | ((codePoint >>> 12) & 0x3f);
			output[offset++] = 0x80 | ((codePoint >>> 6) & 0x3f);
			output[offset++] = 0x80 | (codePoint & 0x3f);
		}
	}

	for (const part of parts) {
		if (part instanceof Uint8Array) {
			if (pendingHighSurrogate !== -1) {
				writeCodePoint(pendingHighSurrogate);
				pendingHighSurrogate = -1;
			}

			output.set(part, offset);
			offset += part.length;
			continue;
		}

		for (let i = 0; i < part.length; i++) {
			let codePoint = part.charCodeAt(i);

			if (pendingHighSurrogate !== -1) {
				if ((codePoint & 0xfc00) === 0xdc00) {
					writeCodePoint(
						0x10000 +
							((pendingHighSurrogate - 0xd800) << 10) +
							(codePoint - 0xdc00)
					);
					pendingHighSurrogate = -1;
					continue;
				}

				writeCodePoint(pendingHighSurrogate);
				pendingHighSurrogate = -1;
			}

			if ((codePoint & 0xfc00) === 0xd800) {
				if (i + 1 < part.length) {
					const next = part.charCodeAt(i + 1);

					if ((next & 0xfc00) === 0xdc00) {
						codePoint =
							0x10000 +
							((codePoint - 0xd800) << 10) +
							(next - 0xdc00);
						i++;
					} else {
						writeCodePoint(codePoint);
						continue;
					}
				} else {
					pendingHighSurrogate = codePoint;
					continue;
				}
			}

			writeCodePoint(codePoint);
		}
	}

	if (pendingHighSurrogate !== -1) {
		writeCodePoint(pendingHighSurrogate);
	}
}

function postrender(parts, options) {
	for (let i = 0, len = parts.length; i < len; i++) {
		if (typeof parts[i] === "number") {
			parts[i] = parts[i].toString();
		}
	}
	// @probe 01 before for loop
	for (const module of options.modules) {
		// @probe 01.x before ${module.name}.postrender
		parts = module.postrender(parts, options);
		// @probe 01.x after ${module.name}.postrender
	}

	// @probe 02 after for loop
	const newParts = options.joinUncorrupt(parts, options);
	// @probe 03 after joinUncorrupt

	const output = new Uint8Array(utf8Length(newParts));

	// @probe 04 after Uint8Array
	writeUtf8(newParts, output);
	// @probe 05 after writeUtf8

	for (let i = 0; i < newParts.length; i++) {
		delete newParts[i];
	}

	// @probe 06 after loop-delete
	return output;
}

module.exports = postrender;
