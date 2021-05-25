/* eslint-disable complexity */
const repeat = require("./string-repeat.js");

function getIndent(indent) {
	return repeat("    ", indent);
}

function attributeSorter(ln) {
	const aRegex = /<[A-Za-z0-9:]+ (.*?)([/ ]*)>/;
	let rest;
	if (aRegex.test(ln)) {
		rest = ln.replace(aRegex, "$1");
	}
	const attrRegex = / *([a-zA-Z0-9:]+)="([^"]+)"/g;
	let match = attrRegex.exec(rest);
	const attributes = [];
	while (match != null) {
		// matched text: match[0]
		// match start: match.index
		// capturing group n: match[n]
		attributes.push({ key: match[1], value: match[2] });
		match = attrRegex.exec(rest);
	}
	attributes.sort(function (a1, a2) {
		if (a1.key === a2.key) {
			return 0;
		}
		return a1.key > a2.key ? 1 : -1;
	});
	const stringifiedAttrs = attributes
		.map(function (attribute) {
			return `${attribute.key}="${attribute.value}"`;
		})
		.join(" ");
	if (rest != null) {
		ln = ln.replace(rest, stringifiedAttrs).replace(/ +>/, ">");
	}
	return ln;
}

function xmlprettify(xml) {
	let result = "",
		skip = 0,
		indent = 0;
	const parsed = miniparser(xml);
	parsed.forEach(function ({ type, value }, i) {
		if (skip > 0) {
			skip--;
			return;
		}
		const nextType = i < parsed.length - 1 ? parsed[i + 1].type : "";
		const nnextType = i < parsed.length - 2 ? parsed[i + 2].type : "";
		if (type === "declaration") {
			result += value + "\n";
		}
		if (
			type === "opening" &&
			nextType === "content" &&
			nnextType === "closing"
		) {
			result +=
				getIndent(indent) +
				value +
				parsed[i + 1].value +
				parsed[i + 2].value +
				"\n";
			skip = 2;
			return;
		}
		if (type === "opening") {
			result += getIndent(indent) + value + "\n";
			indent++;
		}
		if (type === "closing") {
			indent--;
			if (indent < 0) {
				throw new Error(`Malformed xml : ${xml}`);
			}
			result += getIndent(indent) + value + "\n";
		}
		if (type === "single") {
			result += getIndent(indent) + value + "\n";
		}
		if (type === "content" && !/^[ \n\r\t]+$/.test(value)) {
			result += getIndent(indent) + value.trim() + "\n";
		}
	});
	if (indent !== 0) {
		throw new Error(`Malformed xml : ${xml}`);
	}
	return result;
}

function miniparser(xml) {
	let cursor = 0;
	let state = "outside";
	let currentType = "";
	let content = "";
	const renderedArray = [];
	while (cursor < xml.length) {
		if (state === "outside") {
			const opening = xml.indexOf("<", cursor);
			if (opening !== -1) {
				if (opening !== cursor) {
					content = xml.substr(cursor, opening - cursor);
					content = content.replace(/>/g, "&gt;");
					renderedArray.push({ type: "content", value: content });
				}
				state = "inside";
				cursor = opening;
			} else {
				const content = xml.substr(cursor);
				renderedArray.push({ type: "content", value: content });
				return renderedArray;
			}
		}
		if (state === "inside") {
			const closing = xml.indexOf(">", cursor);
			if (closing !== -1) {
				let tag = xml.substr(cursor, closing - cursor + 1);
				const isSingle = Boolean(tag.match(/^<.+\/>/)); // is this line a single tag? ex. <br />
				const isClosing = Boolean(tag.match(/^<\/.+>/)); // is this a closing tag? ex. </a>
				const isXMLDeclaration = Boolean(tag.match(/^<\?xml/)); // is this a closing tag? ex. </a>

				state = "outside";
				cursor = closing + 1;
				if (isXMLDeclaration) {
					const encodingRegex = /encoding="([^"]+)"/;
					if (encodingRegex.test(tag)) {
						tag = tag.replace(encodingRegex, function (x, p0) {
							return `encoding="${p0.toUpperCase()}"`;
						});
					}
					currentType = "declaration";
				} else if (isSingle) {
					// drop whitespace at the end
					tag = tag.replace(/\s*\/\s*>$/g, "/>");
					tag = attributeSorter(tag);
					currentType = "single";
				} else if (isClosing) {
					// drop whitespace at the end
					tag = tag.replace(/\s+>$/g, ">");
					currentType = "closing";
				} else {
					// drop whitespace at the end
					tag = tag.replace(/\s+>$/g, ">");
					tag = attributeSorter(tag);
					currentType = "opening";
				}
				renderedArray.push({ type: currentType, value: tag });
			} else {
				const content = xml.substr(cursor);
				renderedArray.push({ type: "content", value: content });
				return renderedArray;
			}
		}
	}
	return renderedArray;
}

module.exports = xmlprettify;
