/* eslint-disable complexity */

const reg = /(>)\s*(<)(\/*)/g;
const wsexp = / *(.*) +\n/g;
const contexp = /(<.+>)(.+\n)/g;

function xmlprettify(xml) {
	xml = xml
		.replace(reg, "$1\n$2$3")
		.replace(wsexp, "$1\n")
		.replace(contexp, "$1\n$2");
	let formatted = "";
	const lines = xml.split("\n");
	let indent = 0;
	let lastType = "other";
	// 4 types of tags - single, closing, opening, other (text, doctype, comment) - 4*4 = 16 transitions
	const transitions = {
		"single->single": 0,
		"single->closing": -1,
		"single->opening": 0,
		"single->other": 0,
		"closing->single": 0,
		"closing->closing": -1,
		"closing->opening": 0,
		"closing->other": 0,
		"opening->single": 1,
		"opening->closing": 0,
		"opening->opening": 1,
		"opening->other": 1,
		"other->single": 0,
		"other->closing": -1,
		"other->opening": 0,
		"other->other": 0,
	};

	for (let i = 0; i < lines.length; i++) {
		let ln = lines[i];
		const single = Boolean(ln.match(/<.+\/>/)); // is this line a single tag? ex. <br />
		const closing = Boolean(ln.match(/<\/.+>/)); // is this a closing tag? ex. </a>
		const opening = Boolean(ln.match(/<[^!].*>/)); // is this even a tag (that's not <!something>)
		const type = single
			? "single"
			: closing
			? "closing"
			: opening
			? "opening"
			: "other";

		const fromTo = lastType + "->" + type;
		if (type === "opening") {
			const aRegex = /<[A-Za-z0-9:]+ (.*)>/;
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
		}
		if (type === "single") {
			ln = ln.replace(/ +\/>/, "/>");
		}
		lastType = type;
		let padding = "";

		indent += transitions[fromTo];
		for (let j = 0; j < indent; j++) {
			padding += "\t";
		}
		if (fromTo === "opening->closing") {
			// substr removes line break (\n) from prev loop
			formatted = formatted.substr(0, formatted.length - 1) + ln + "\n";
		} else {
			formatted += padding + ln + "\n";
		}
	}
	return formatted;
}

module.exports = xmlprettify;
