// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
const _utf8len = new Array(256);
for (let i = 0; i < 256; i++) {
	_utf8len[i] =
		i >= 252
			? 6
			: i >= 248
				? 5
				: i >= 240
					? 4
					: i >= 224
						? 3
						: i >= 192
							? 2
							: 1;
}
_utf8len[254] = _utf8len[254] = 1; // Invalid sequence start

function buf2string(buf) {
	let i, out, c, cLen;
	const len = buf.length;

	// Reserve max possible length (2 words per char)
	// NB: by unknown reasons, Array is significantly faster for
	//     String.fromCharCode.apply than Uint16Array.
	let utf16buf = new Array(len * 2);

	for (out = 0, i = 0; i < len; ) {
		c = buf[i++];
		// quick process ascii
		if (c < 0x80) {
			utf16buf[out++] = c;
			continue;
		}

		cLen = _utf8len[c];
		// skip 5 & 6 byte codes
		if (cLen > 4) {
			utf16buf[out++] = 0xfffd;
			i += cLen - 1;
			continue;
		}

		// apply mask on first byte
		c &= cLen === 2 ? 0x1f : cLen === 3 ? 0x0f : 0x07;
		// join the rest
		while (cLen > 1 && i < len) {
			c = (c << 6) | (buf[i++] & 0x3f);
			cLen--;
		}

		// terminated by end of string?
		if (cLen > 1) {
			utf16buf[out++] = 0xfffd;
			continue;
		}

		if (c < 0x10000) {
			utf16buf[out++] = c;
		} else {
			c -= 0x10000;
			utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
			utf16buf[out++] = 0xdc00 | (c & 0x3ff);
		}
	}

	// shrinkBuf(utf16buf, out)
	if (utf16buf.length !== out) {
		if (utf16buf.subarray) {
			utf16buf = utf16buf.subarray(0, out);
		} else {
			utf16buf.length = out;
		}
	}

	// return String.fromCharCode.apply(null, utf16buf);
	return applyFromCharCode(utf16buf);
}

function applyFromCharCode(array) {
	// Performances notes :
	// --------------------
	// String.fromCharCode.apply(null, array) is the fastest, see
	// see http://jsperf.com/converting-a-uint8array-to-a-string/2
	// but the stack is limited (and we can get huge arrays !).
	//
	// result += String.fromCharCode(array[i]); generate too many strings !
	//
	// This code is inspired by http://jsperf.com/arraybuffer-to-string-apply-performance/2
	let chunk = 65536;
	const result = [],
		len = array.length;
	let k = 0;
	String.fromCharCode.apply(null, new Uint8Array(0));

	while (k < len && chunk > 1) {
		try {
			result.push(
				String.fromCharCode.apply(
					null,
					array.slice(k, Math.min(k + chunk, len))
				)
			);
			k += chunk;
		} catch {
			chunk = Math.floor(chunk / 2);
		}
	}
	return result.join("");
}

function utf8border(buf, max) {
	let pos;

	max = max || buf.length;
	if (max > buf.length) {
		max = buf.length;
	}

	// go back from last position, until start of sequence found
	pos = max - 1;
	while (pos >= 0 && (buf[pos] & 0xc0) === 0x80) {
		pos--;
	}

	// Fuckup - very small and broken sequence,
	// return max, because we should return something anyway.
	if (pos < 0) {
		return max;
	}

	// If we came to start of buffer - that means vuffer is too small,
	// return max too.
	if (pos === 0) {
		return max;
	}

	return pos + _utf8len[buf[pos]] > max ? pos : max;
}

function utf8decode(buf) {
	const result = [],
		len = buf.length,
		chunk = 65536;
	let k = 0;
	while (k < len) {
		const nextBoundary = utf8border(buf, Math.min(k + chunk, len));
		result.push(buf2string(buf.subarray(k, nextBoundary)));
		k = nextBoundary;
	}
	return result.join("");
}

module.exports = utf8decode;
