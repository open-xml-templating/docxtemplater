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
	experimentalCompiledLoops: false,
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

DocUtils.escapeRegExp = function (str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

DocUtils.charMapRegexes = Object.keys(DocUtils.charMap).map(function (endChar) {
	var startChar = DocUtils.charMap[endChar];
	return {
		rstart: new RegExp(DocUtils.escapeRegExp(startChar), "g"),
		rend: new RegExp(DocUtils.escapeRegExp(endChar), "g"),
		start: startChar,
		end: endChar,
	};
});

DocUtils.wordToUtf8 = function (string) {
	if (typeof string !== "string") {
		string = string.toString();
	}
	DocUtils.charMapRegexes.forEach(function (object) {
		string = string.replace(object.rstart, object.end);
	});
	return string;
};

DocUtils.utf8ToWord = function (string) {
	if (typeof string !== "string") {
		string = string.toString();
	}
	DocUtils.charMapRegexes.forEach(function (object) {
		string = string.replace(object.rend, object.start);
	});
	return string;
};

DocUtils.cloneDeep = function (obj) {
	return JSON.parse(JSON.stringify(obj));
};

var spaceRegexp = new RegExp(String.fromCharCode(160), "g");
DocUtils.convertSpaces = function (s) {
	return s.replace(spaceRegexp, " ");
};

DocUtils.pregMatchAll = function (regex, content) {
	/* regex is a string, content is the content. It returns an array of all matches with their offset, for example:
	regex=la
	content=lolalolilala
	returns: [{0: 'la',offset: 2},{0: 'la',offset: 8},{0: 'la',offset: 10}]
	*/
	var matchArray = [];
	var replacer = function () {
		var pn = {array: Array.prototype.slice.call(arguments)};
		pn.array.pop();
		var offset = pn.array.pop();
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

module.exports = DocUtils;
