const repeat = require("./string-repeat.js");

function getIndent(indent) {
	return repeat("    ", indent);
}

const attributeRegex = /<[A-Za-z0-9:]+ (.*?)([/ ]*)>/;

function normalizeValue(value) {
	return value.replace(/&#([0-9]+);/g, function (_, int) {
		return `&#x${parseInt(int, 10).toString(16).toUpperCase()};`;
	});
}

function attributeSorter(ln, namespaces) {
	let rest;
	if (attributeRegex.test(ln)) {
		rest = ln.replace(attributeRegex, "$1");
	}
	const attrRegex = / *([a-zA-Z0-9:]+)="([^"]+)"/g;
	let match = attrRegex.exec(rest);
	const attributes = [];
	while (match != null) {
		// matched text: match[0]
		// match start: match.index
		// capturing group n: match[n]
		const key = match[1];
		let value = match[2];

		value = normalizeValue(value);

		let found = false;
		namespaces.forEach(function (ns) {
			if (ns) {
				ns.forEach(function (n) {
					if (n.key === key && n.value === value) {
						found = true;
					}
				});
			}
		});
		if (!found) {
			attributes.push({ key, value });
		}
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
	return { replacement: ln, attributes };
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
		if (type === "processing-instruction") {
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
				throw new Error(
					`Malformed xml near ${result.substr(
						result.length - 30
					)}**${value}** : ${xml}`
				);
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
		throw new Error(`Malformed xml indent at the end : ${indent} : ${xml}`);
	}
	return result;
}

function getNamespaces(attributes) {
	return attributes.filter(function ({ key }) {
		return key.indexOf("xmlns") !== -1;
	});
}

function miniparser(xml) {
	let cursor = 0;
	let state = "outside";
	let currentType = "";
	let content = "";
	const renderedArray = [];
	let level = 0;
	const namespaces = [];
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
			let closing = xml.indexOf(">", cursor);
			if (closing !== -1) {
				let inAttr = false;
				let i = cursor;
				while (inAttr || xml[i] !== ">") {
					i++;
					if (xml[i] === '"') {
						inAttr = !inAttr;
					}
				}
				closing = i;

				let tag = xml.substr(cursor, closing - cursor + 1);
				const isSingle = Boolean(tag.match(/^<.+\/>/)); // is this line a single tag? ex. <br />
				const isClosing = Boolean(tag.match(/^<\/.+>/)); // is this a closing tag? ex. </a>
				const isProcessingInstruction = Boolean(tag.match(/^<\?.*\?>$/)); // is this an xml declaration tag? ex. <?xml version="1.0" encoding="UTF-8" standalone="yes"?> or <?mso-contentType?>

				state = "outside";
				cursor = closing + 1;
				if (isProcessingInstruction) {
					const encodingRegex = / encoding="([^"]+)"/;
					if (encodingRegex.test(tag)) {
						tag = tag.replace(encodingRegex, function (x, encoding) {
							encoding = encoding.toUpperCase();
							if (encoding === "UTF-8") {
								return "";
							}
							return ` encoding="${encoding}"`;
						});
					}
					tag = tag.replace(/^(<\?.*?) *(\?>$)/, "$1$2"); // Drop all spaces before ?>
					currentType = "processing-instruction";
				} else if (isSingle) {
					// drop whitespace at the end
					tag = tag.replace(/\s*\/\s*>$/g, "/>");
					const sorted = attributeSorter(tag, namespaces);
					tag = sorted.replacement;
					currentType = "single";
				} else if (isClosing) {
					// drop whitespace at the end
					tag = tag.replace(/\s+>$/g, ">");
					currentType = "closing";
					namespaces.pop();
					level--;
				} else {
					// drop whitespace at the end
					tag = tag.replace(/\s+>$/g, ">");
					const sorted = attributeSorter(tag, namespaces);
					tag = sorted.replacement;
					namespaces[level] = getNamespaces(sorted.attributes);
					currentType = "opening";
					level++;
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
