// convert string to array (typed, when possible)
// eslint-disable-next-line complexity
function string2buf(str) {
	let c,
		c2,
		mPos,
		i,
		bufLen = 0;

	const strLen = str.length;

	// count binary size
	for (mPos = 0; mPos < strLen; mPos++) {
		c = str.charCodeAt(mPos);
		if ((c & 0xfc00) === 0xd800 && mPos + 1 < strLen) {
			c2 = str.charCodeAt(mPos + 1);
			if ((c2 & 0xfc00) === 0xdc00) {
				c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
				mPos++;
			}
		}
		bufLen += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
	}

	// allocate buffer
	const buf = new Uint8Array(bufLen);

	// convert
	for (i = 0, mPos = 0; i < bufLen; mPos++) {
		c = str.charCodeAt(mPos);
		if ((c & 0xfc00) === 0xd800 && mPos + 1 < strLen) {
			c2 = str.charCodeAt(mPos + 1);
			if ((c2 & 0xfc00) === 0xdc00) {
				c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
				mPos++;
			}
		}
		if (c < 0x80) {
			/* one byte */
			buf[i++] = c;
		} else if (c < 0x800) {
			/* two bytes */
			buf[i++] = 0xc0 | (c >>> 6);
			buf[i++] = 0x80 | (c & 0x3f);
		} else if (c < 0x10000) {
			/* three bytes */
			buf[i++] = 0xe0 | (c >>> 12);
			buf[i++] = 0x80 | ((c >>> 6) & 0x3f);
			buf[i++] = 0x80 | (c & 0x3f);
		} else {
			/* four bytes */
			buf[i++] = 0xf0 | (c >>> 18);
			buf[i++] = 0x80 | ((c >>> 12) & 0x3f);
			buf[i++] = 0x80 | ((c >>> 6) & 0x3f);
			buf[i++] = 0x80 | (c & 0x3f);
		}
	}

	return buf;
}

function postrender(parts, options) {
	for (let i = 0, l = options.modules.length; i < l; i++) {
		const module = options.modules[i];
		parts = module.postrender(parts, options);
	}
	let fullLength = 0;
	const newParts = options.joinUncorrupt(parts, options);

	for (let i = 0, len = newParts.length; i < len; i++) {
		fullLength += newParts[i].length;
	}
	fullLength = 0;

	let longStr = "";
	let lenStr = 0;
	const maxCompact = 65536;

	const uintArrays = [];

	for (let i = 0, len = newParts.length; i < len; i++) {
		const part = newParts[i];

		if (part.length + lenStr > maxCompact) {
			const arr = string2buf(longStr);
			fullLength += arr.length;
			uintArrays.push(arr);
			longStr = "";
		}

		longStr += part;
		lenStr += part.length;
		delete newParts[i];
	}
	const arr = string2buf(longStr);
	fullLength += arr.length;
	uintArrays.push(arr);

	const array = new Uint8Array(fullLength);

	let j = 0;

	uintArrays.forEach(function (buf) {
		for (let i = 0; i < buf.length; ++i) {
			array[i + j] = buf[i];
		}
		j += buf.length;
	});
	return array;
}

module.exports = postrender;
