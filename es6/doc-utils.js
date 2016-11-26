"use strict";

const memoize = require("./memoize");
const DOMParser = require("xmldom").DOMParser;
const XMLSerializer = require("xmldom").XMLSerializer;
const Errors = require("./errors");

const DocUtils = {};

function parser(tag) {
	return {
		["get"](scope) {
			if (tag === ".") {
				return scope;
			}
			return scope[tag];
		},
	};
}

DocUtils.defaults = {
	nullGetter(part) {
		if (!part.module) {
			return "undefined";
		}
		if (part.module === "rawxml") {
			return "";
		}
		return "";
	},
	parser: memoize(parser),
	intelligentTagging: true,
	fileType: "docx",
	delimiters: {
		start: "{",
		end: "}",
	},
};

DocUtils.mergeObjects = function () {
	const resObj = {};
	let obj, keys;
	for(let i = 0; i < arguments.length; i += 1) {
		obj = arguments[i];
		keys = Object.keys(obj);
		for(let j = 0; j < keys.length; j += 1) {
			resObj[keys[j]] = obj[keys[j]];
		}
	}
	return resObj;
};

DocUtils.xml2str = function (xmlNode) {
	const a = new XMLSerializer();
	return a.serializeToString(xmlNode);
};

DocUtils.decodeUtf8 = function (s) {
	try {
		if (s === undefined) { return undefined; }
		// replace Ascii 160 space by the normal space, Ascii 32
		return decodeURIComponent(escape(DocUtils.convertSpaces(s)));
	}
	catch (e) {
		const err = new Error("End");
		err.properties.data = s;
		err.properties.explanation = "Could not decode string to UTF8";
		throw err;
	}
};

DocUtils.encodeUtf8 = function (s) {
	return unescape(encodeURIComponent(s));
};

DocUtils.str2xml = function (str, errorHandler) {
	const parser = new DOMParser({errorHandler});
	return parser.parseFromString(str, "text/xml");
};

DocUtils.charMap = {
	"&": "&amp;",
	"'": "&apos;",
	"<": "&lt;",
	">": "&gt;",
};

const regexStripRegexp = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;
DocUtils.escapeRegExp = function (str) {
	return str.replace(regexStripRegexp, "\\$&");
};

DocUtils.charMapRegexes = Object.keys(DocUtils.charMap).map(function (endChar) {
	const startChar = DocUtils.charMap[endChar];
	return {
		rstart: new RegExp(DocUtils.escapeRegExp(startChar), "g"),
		rend: new RegExp(DocUtils.escapeRegExp(endChar), "g"),
		start: startChar,
		end: endChar,
	};
});

DocUtils.wordToUtf8 = function (string) {
	let r;
	for (let i = 0, l = DocUtils.charMapRegexes.length; i < l; i++) {
		r = DocUtils.charMapRegexes[i];
		string = string.replace(r.rstart, r.end);
	}
	return string;
};

DocUtils.utf8ToWord = function (string) {
	if (typeof string !== "string") {
		string = string.toString();
	}
	let r;
	for (let i = 0, l = DocUtils.charMapRegexes.length; i < l; i++) {
		r = DocUtils.charMapRegexes[i];
		string = string.replace(r.rend, r.start);
	}
	return string;
};

DocUtils.cloneDeep = function (obj) {
	return JSON.parse(JSON.stringify(obj));
};

DocUtils.concatArrays = function (arrays) {
	return Array.prototype.concat.apply([], arrays);
};

const spaceRegexp = new RegExp(String.fromCharCode(160), "g");
DocUtils.convertSpaces = function (s) {
	return s.replace(spaceRegexp, " ");
};

DocUtils.pregMatchAll = function (regex, content) {
	/* regex is a string, content is the content. It returns an array of all matches with their offset, for example:
		 regex=la
		 content=lolalolilala
returns: [{array: {0: 'la'},offset: 2},{array: {0: 'la'},offset: 8},{array: {0: 'la'} ,offset: 10}]
*/
	const matchArray = [];
	let match;
	while ((match = regex.exec(content)) != null) {
		matchArray.push({array: match, offset: match.index});
	}
	return matchArray;
};

DocUtils.sizeOfObject = function (obj) {
	return Object.keys(obj).length;
};

function throwXmlTagNotFound(options) {
	const err = new Errors.XTTemplateError(`No tag '${options.element}' was found at the ${options.position}`);
	err.properties = {
		id: `no_xml_tag_found_at_${options.position}`,
		explanation: `No tag '${options.element}' was found at the ${options.position}`,
		parsed: options.parsed,
		index: options.index,
		element: options.element,
	};
	throw err;
}

DocUtils.getRight = function (parsed, element, index) {
	for (let i = index, l = parsed.length; i < l; i++) {
		const part = parsed[i];
		if (part.value === "</" + element + ">") {
			return i;
		}
	}
	throwXmlTagNotFound({position: "right", element, parsed, index});
};

DocUtils.getLeft = function (parsed, element, index) {
	const parts = parsed.slice(0, index);
	for (let i = parts.length - 1; i >= 0; i--) {
		const part = parts[i];
		if (part.value.indexOf("<" + element) === 0 && [">", " "].indexOf(part.value[element.length + 1]) !== -1) {
			return i;
		}
	}
	throwXmlTagNotFound({position: "left", element, parsed, index});
};

module.exports = DocUtils;

DocUtils.traits = require("./traits");
