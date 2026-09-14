"use strict";

const { createDeflateRaw } = require("node:zlib");
const { finished } = require("node:stream/promises");
const path = require("node:path");

const STORE = 0;
const DEFLATE = 8;
const DATA_DESCRIPTOR = 0x0008;
const UTF8 = 0x0800;
const MAX_16 = 0xffff;
const MAX_32 = 0xffffffff;
const STORE_EXTENSIONS = new Set([
	".avif",
	".gif",
	".jpeg",
	".jpg",
	".mp3",
	".mp4",
	".png",
	".webp",
	".zip",
]);

const crcTable = new Uint32Array(256);
for (let i = 0; i < crcTable.length; i++) {
	let value = i;
	for (let bit = 0; bit < 8; bit++) {
		value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
	}
	crcTable[i] = value >>> 0;
}

function updateCrc32(crc, chunk) {
	for (let i = 0; i < chunk.length; i++) {
		crc = crcTable[(crc ^ chunk[i]) & 0xff] ^ (crc >>> 8);
	}
	return crc >>> 0;
}

function toBuffer(value) {
	if (Buffer.isBuffer(value)) {
		return value;
	}
	if (value instanceof Uint8Array) {
		return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
	}
	if (typeof value === "string") {
		return Buffer.from(value, "binary");
	}
	throw new TypeError("PizZip returned unsupported ZIP entry data");
}

function writeUInt16LE(buffer, value, offset) {
	if (value < 0 || value > MAX_16) {
		throw new RangeError("ZIP field exceeds the classic ZIP 16-bit limit");
	}
	buffer.writeUInt16LE(value, offset);
}

function writeUInt32LE(buffer, value, offset) {
	if (value < 0 || value > MAX_32) {
		throw new RangeError(
			"ZIP64 is required but is not supported by this writer"
		);
	}
	buffer.writeUInt32LE(value >>> 0, offset);
}

function dosDateTime(date) {
	const value = date || new Date();
	const year = Math.min(2107, Math.max(1980, value.getFullYear()));
	return {
		date:
			((year - 1980) << 9) |
			((value.getMonth() + 1) << 5) |
			value.getDate(),
		time:
			(value.getHours() << 11) |
			(value.getMinutes() << 5) |
			(value.getSeconds() >> 1),
	};
}

function defaultFileOrder(files) {
	const names = Object.keys(files);
	const ordered = ["[Content_Types].xml", "_rels/.rels"];
	for (const name of names) {
		if (
			name.startsWith("word/") ||
			name.startsWith("xl/") ||
			name.startsWith("ppt/")
		) {
			ordered.push(name);
		}
	}
	for (const name of names) {
		if (!ordered.includes(name)) {
			ordered.push(name);
		}
	}
	return ordered.filter((name) => files[name]);
}

function isCompressedObject(data) {
	return (
		data &&
		typeof data.getCompressedContent === "function" &&
		typeof data.compressionMethod === "string"
	);
}

function compressionFromEntry(entry, options) {
	if (entry.dir) {
		return STORE;
	}
	if (entry.options.compression === "STORE") {
		return STORE;
	}
	if (entry.options.compression === "DEFLATE") {
		return DEFLATE;
	}
	const data = entry._data;
	if (options.reuseCompressed !== false && isCompressedObject(data)) {
		if (data.compressionMethod === "\x00\x00") {
			return STORE;
		}
		if (data.compressionMethod === "\x08\x00") {
			return DEFLATE;
		}
	}
	if (typeof options.compression === "function") {
		return options.compression(entry.name, entry) === "STORE"
			? STORE
			: DEFLATE;
	}
	if (options.compression === "STORE") {
		return STORE;
	}
	if (
		options.storeMedia !== false &&
		STORE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
	) {
		return STORE;
	}
	return DEFLATE;
}

function rawEntryData(zip, entry) {
	if (entry.dir) {
		return Buffer.alloc(0);
	}
	const clone = zip.file(entry.name);
	if (!clone) {
		throw new Error(`Unable to retrieve ZIP entry: ${entry.name}`);
	}
	return clone.asNodeBuffer();
}

function entrySource(zip, entry, method, options) {
	const data = entry._data;
	if (options.reuseCompressed !== false && isCompressedObject(data)) {
		const expectedMethod = method === STORE ? "\x00\x00" : "\x08\x00";
		if (data.compressionMethod === expectedMethod) {
			return {
				data: toBuffer(data.getCompressedContent()),
				reused: true,
			};
		}
	}
	return { data: rawEntryData(zip, entry), reused: false };
}

async function writeChunk(destination, chunk, signal) {
	if (signal && signal.aborted) {
		throw signal.reason || new Error("ZIP export aborted");
	}
	if (destination.destroyed || destination.writableEnded) {
		throw new Error("ZIP destination is no longer writable");
	}
	if (destination.write(chunk)) {
		return;
	}
	await new Promise((resolve, reject) => {
		function onDrain() {
			done(resolve);
		}
		function onError(error) {
			done(reject, error);
		}
		function onClose() {
			done(reject, new Error("ZIP destination closed before drain"));
		}
		function onAbort() {
			done(reject, signal.reason || new Error("ZIP export aborted"));
		}
		function done(callback, value) {
			destination.removeListener("drain", onDrain);
			destination.removeListener("error", onError);
			destination.removeListener("close", onClose);
			if (signal) {
				signal.removeEventListener("abort", onAbort);
			}
			callback(value);
		}
		destination.once("drain", onDrain);
		destination.once("error", onError);
		destination.once("close", onClose);
		if (signal) {
			signal.addEventListener("abort", onAbort, { once: true });
		}
	});
}

function utf8Flag(name, comment) {
	return Buffer.byteLength(name, "utf8") !== name.length ||
		Buffer.byteLength(comment, "utf8") !== comment.length
		? UTF8
		: 0;
}

function localHeader(entry) {
	const flags = entry.flags | (entry.usesDescriptor ? DATA_DESCRIPTOR : 0);
	const header = Buffer.alloc(30 + entry.name.length);
	header.writeUInt32LE(0x04034b50, 0);
	writeUInt16LE(header, entry.usesDescriptor ? 20 : 10, 4);
	writeUInt16LE(header, flags, 6);
	writeUInt16LE(header, entry.method, 8);
	writeUInt16LE(header, entry.time, 10);
	writeUInt16LE(header, entry.date, 12);
	writeUInt32LE(header, entry.usesDescriptor ? 0 : entry.crc32, 14);
	writeUInt32LE(header, entry.usesDescriptor ? 0 : entry.compressedSize, 18);
	writeUInt32LE(
		header,
		entry.usesDescriptor ? 0 : entry.uncompressedSize,
		22
	);
	writeUInt16LE(header, entry.name.length, 26);
	writeUInt16LE(header, 0, 28);
	entry.name.copy(header, 30);
	return header;
}

function dataDescriptor(crc32, compressedSize, uncompressedSize) {
	const descriptor = Buffer.alloc(16);
	descriptor.writeUInt32LE(0x08074b50, 0);
	writeUInt32LE(descriptor, crc32, 4);
	writeUInt32LE(descriptor, compressedSize, 8);
	writeUInt32LE(descriptor, uncompressedSize, 12);
	return descriptor;
}

function centralDirectoryHeader(entry) {
	const header = Buffer.alloc(46 + entry.name.length + entry.comment.length);
	header.writeUInt32LE(0x02014b50, 0);
	writeUInt16LE(header, 0x0014, 4);
	writeUInt16LE(header, entry.usesDescriptor ? 20 : 10, 6);
	writeUInt16LE(
		header,
		entry.flags | (entry.usesDescriptor ? DATA_DESCRIPTOR : 0),
		8
	);
	writeUInt16LE(header, entry.method, 10);
	writeUInt16LE(header, entry.time, 12);
	writeUInt16LE(header, entry.date, 14);
	writeUInt32LE(header, entry.crc32, 16);
	writeUInt32LE(header, entry.compressedSize, 20);
	writeUInt32LE(header, entry.uncompressedSize, 24);
	writeUInt16LE(header, entry.name.length, 28);
	writeUInt16LE(header, 0, 30);
	writeUInt16LE(header, entry.comment.length, 32);
	writeUInt16LE(header, 0, 34);
	writeUInt16LE(header, 0, 36);
	writeUInt32LE(header, entry.attributes, 38);
	writeUInt32LE(header, entry.offset, 42);
	entry.name.copy(header, 46);
	entry.comment.copy(header, 46 + entry.name.length);
	return header;
}

function endOfCentralDirectory(count, size, offset) {
	const footer = Buffer.alloc(22);
	footer.writeUInt32LE(0x06054b50, 0);
	writeUInt16LE(footer, 0, 4);
	writeUInt16LE(footer, 0, 6);
	writeUInt16LE(footer, count, 8);
	writeUInt16LE(footer, count, 10);
	writeUInt32LE(footer, size, 12);
	writeUInt32LE(footer, offset, 16);
	writeUInt16LE(footer, 0, 20);
	return footer;
}

function entryLength(entry) {
	return (
		30 +
		entry.name.length +
		entry.compressedSize +
		(entry.usesDescriptor ? 16 : 0)
	);
}

function externalAttributes(entry) {
	if (entry.dosPermissions != null) {
		return entry.dosPermissions & 0x3f;
	}
	return entry.dir ? 0x10 : 0;
}

async function writeEntry(destination, zip, entry, offset, options) {
	const name = Buffer.from(entry.name, "utf8");
	const comment = Buffer.from(entry.comment || "", "utf8");
	if (name.length > MAX_16 || comment.length > MAX_16) {
		throw new RangeError(
			"ZIP filename or comment exceeds the classic ZIP limit"
		);
	}
	const method = compressionFromEntry(entry, options);
	const dateTime = dosDateTime(entry.date);
	const source = entrySource(zip, entry, method, options);
	const usesDescriptor = !source.reused && method === DEFLATE;
	const uncompressedSize = source.reused
		? entry._data.uncompressedSize
		: source.data.length;
	let crc32;
	let compressedSize;
	if (source.reused) {
		crc32 = entry._data.crc32 >>> 0;
		compressedSize = source.data.length;
	} else {
		crc32 = (updateCrc32(0xffffffff, source.data) ^ 0xffffffff) >>> 0;
		compressedSize = method === STORE ? source.data.length : 0;
	}
	const written = {
		name,
		comment,
		method,
		time: dateTime.time,
		date: dateTime.date,
		crc32,
		compressedSize,
		uncompressedSize,
		attributes: externalAttributes(entry),
		flags: utf8Flag(entry.name, entry.comment || ""),
		offset,
		usesDescriptor,
		reused: source.reused,
	};
	await writeChunk(destination, localHeader(written), options.signal);
	if (source.reused || method === STORE) {
		await writeChunk(destination, source.data, options.signal);
	} else {
		const deflater = createDeflateRaw({ level: options.level });
		deflater.end(source.data);
		for await (const chunk of deflater) {
			written.compressedSize += chunk.length;
			await writeChunk(destination, chunk, options.signal);
		}
	}
	if (usesDescriptor) {
		await writeChunk(
			destination,
			dataDescriptor(
				written.crc32,
				written.compressedSize,
				written.uncompressedSize
			),
			options.signal
		);
	}
	return written;
}

/**
 * Write a PizZip archive without allocating a complete output archive.
 * This is Node-only and writes classic ZIP archives (no ZIP64 support).
 */
async function streamZip(zip, destination, options = {}) {
	if (!zip || !zip.files || typeof zip.file !== "function") {
		throw new TypeError("streamZip expects a PizZip instance");
	}
	if (!destination || typeof destination.write !== "function") {
		throw new TypeError("streamZip expects a Node writable stream");
	}
	const settings = {
		compression: options.compression || "DEFLATE",
		end: options.end !== false,
		fileOrder: options.fileOrder || defaultFileOrder,
		level: options.level,
		onEntry: options.onEntry,
		reuseCompressed: options.reuseCompressed !== false,
		signal: options.signal,
		storeMedia: options.storeMedia !== false,
	};
	const names = settings.fileOrder(zip.files);
	if (names.length > MAX_16) {
		throw new RangeError("ZIP64 is required for more than 65535 entries");
	}
	const entries = [];
	let offset = 0;
	for (const name of names) {
		const entry = zip.files[name];
		if (!entry) {
			continue;
		}
		const written = await writeEntry(
			destination,
			zip,
			entry,
			offset,
			settings
		);
		entries.push(written);
		offset += entryLength(written);
		if (settings.onEntry) {
			await settings.onEntry({
				compressedSize: written.compressedSize,
				name: entry.name,
				uncompressedSize: written.uncompressedSize,
			});
		}
	}
	const centralDirectoryOffset = offset;
	for (const entry of entries) {
		const header = centralDirectoryHeader(entry);
		await writeChunk(destination, header, settings.signal);
		offset += header.length;
	}
	const centralDirectorySize = offset - centralDirectoryOffset;
	await writeChunk(
		destination,
		endOfCentralDirectory(
			entries.length,
			centralDirectorySize,
			centralDirectoryOffset
		),
		settings.signal
	);
	if (settings.end) {
		destination.end();
		await finished(destination);
	}
	return {
		bytesWritten: offset + 22,
		entries: entries.length,
		reusedEntries: entries.filter((entry) => entry.reused).length,
	};
}

async function streamOutput(doc, destination, options) {
	if (!doc || typeof doc.getZip !== "function") {
		throw new TypeError(
			"streamOutput expects a rendered Docxtemplater instance"
		);
	}
	return streamZip(doc.getZip(), destination, options);
}

module.exports = {
	streamOutput,
};
