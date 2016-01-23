"use strict";

var Errors = require("./errors");

var DocUtils = {};

DocUtils.defaults = {
	nullGetter(tag, props) {
		if (props.tag === "simple") {
			return "undefined";
		}
		if (props.tag === "raw") {
			return "";
		}
		return "";
	},
	parser(tag) {
		return {
			["get"](scope) {
				if (tag === ".") {
					return scope;
				}
				return scope[tag];
			},
		};
	},
	intelligentTagging: true,
	fileType: "docx",
	delimiters: {
		start: "{",
		end: "}",
	},
};

DocUtils.charMap = {
	"&": "&amp;",
	"'": "&apos;",
	"<": "&lt;",
	">": "&gt;",
};

DocUtils.wordToUtf8 = function (string) {
	if (typeof string !== "string") {
		string = string.toString();
	}
	Object.keys(DocUtils.charMap).forEach(function (endChar) {
		var startChar = DocUtils.charMap[endChar];
		string = string.replace(new RegExp(DocUtils.escapeRegExp(startChar), "g"), endChar);
	});
	return string;
};

DocUtils.utf8ToWord = function (string) {
	if (typeof string !== "string") {
		string = string.toString();
	}
	Object.keys(DocUtils.charMap).forEach(function (startChar) {
		var endChar = DocUtils.charMap[startChar];
		string = string.replace(new RegExp(DocUtils.escapeRegExp(startChar), "g"), endChar);
	});
	return string;
};

DocUtils.clone = function (obj) {
	if (!(typeof obj !== "undefined" && obj != null) || typeof obj !== "object") {
		return obj;
	}

	var newInstance = new obj.constructor();

	for (var key in obj) {
		if ({}.hasOwnProperty.call(obj, key)) {
			newInstance[key] = DocUtils.clone(obj[key]);
		}
	}

	return newInstance;
};

DocUtils.convertSpaces = function (s) {
	return s.replace(new RegExp(String.fromCharCode(160), "g"), " ");
};

DocUtils.pregMatchAll = function (regex, content) {
	/* regex is a string, content is the content. It returns an array of all matches with their offset, for example:
	regex=la
	content=lolalolilala
	returns: [{0: 'la',offset: 2},{0: 'la',offset: 8},{0: 'la',offset: 10}]
	*/
	if (typeof regex !== "object") {
		regex = (new RegExp(regex, "g"));
	}
	var matchArray = [];
	var replacer = function (...pn) {
		pn.pop();
		var offset = pn.pop();
		// add match so that pn[0] = whole match, pn[1]= first parenthesis,...
		pn.offset = offset;
		return matchArray.push(pn);
	};
	content.replace(regex, replacer);
	return matchArray;
};

DocUtils.sizeOfObject = function (obj) {
	return Object.keys(obj).length;
};

// Deprecated methods, to be removed
DocUtils.encode_utf8 = function (s) {
	return unescape(encodeURIComponent(s));
};
DocUtils.decode_utf8 = function (s) {
	try {
		if (s === undefined) { return undefined; }
		// replace Ascii 160 space by the normal space, Ascii 32
		return decodeURIComponent(escape(DocUtils.convert_spaces(s)));
	}
	catch (e) {
		var err = new Errors.XTError("Could not decode utf8");
		err.properties = {
			toDecode: s,
			baseErr: e,
		};
		throw err;
	}
};

DocUtils.base64encode = function (b) {
	return btoa(unescape(encodeURIComponent(b)));
};

DocUtils.tags = DocUtils.defaults.delimiters;
DocUtils.defaultParser = DocUtils.defaults.parser;
DocUtils.convert_spaces = DocUtils.convertSpaces;
DocUtils.preg_match_all = DocUtils.pregMatchAll;

DocUtils.escapeRegExp = function (str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

module.exports = DocUtils;
