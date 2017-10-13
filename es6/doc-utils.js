"use strict";

const {DOMParser, XMLSerializer} = require("xmldom");
const {throwXmlTagNotFound} = require("./errors");

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
	parser,
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

DocUtils.str2xml = function (str, errorHandler) {
	const parser = new DOMParser({errorHandler});
	return parser.parseFromString(str, "text/xml");
};

DocUtils.charMap = {
	"&": "&amp;",
	"'": "&apos;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
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

// This function is written with for loops for performance
DocUtils.concatArrays = function (arrays) {
	const result = [];
	for (let i = 0; i < arrays.length; i++) {
		const array = arrays[i];
		for (let j = 0, len = array.length; j < len; j++) {
			result.push(array[j]);
		}
	}
	return result;
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
	for (let i = index; i >= 0; i--) {
		const part = parsed[i];
		if (part.value.indexOf("<" + element) === 0 && [">", " "].indexOf(part.value[element.length + 1]) !== -1) {
			return i;
		}
	}
	throwXmlTagNotFound({position: "left", element, parsed, index});
};

module.exports = DocUtils;

