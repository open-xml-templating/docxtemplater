"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require("./doc-utils"),
    wordToUtf8 = _require.wordToUtf8,
    concatArrays = _require.concatArrays;

function moduleParse(modules, placeHolderContent, parsed, startOffset) {
	var moduleParsed = void 0;
	for (var i = 0, l = modules.length; i < l; i++) {
		var _module = modules[i];
		moduleParsed = _module.parse(placeHolderContent);
		if (moduleParsed) {
			moduleParsed.offset = startOffset;
			parsed.push(moduleParsed);
			return parsed;
		}
	}
	parsed.push({
		type: "placeholder",
		value: placeHolderContent,
		offset: startOffset
	});
	return parsed;
}

var parser = {
	postparse: function postparse(postparsed, modules) {
		function getTraits(traitName, postparsed) {
			return modules.map(function (module) {
				return module.getTraits(traitName, postparsed);
			});
		}
		var errors = [];
		function postparse(postparsed, options) {
			return modules.reduce(function (postparsed, module) {
				var r = module.postparse(postparsed, _extends({}, options, {
					postparse: postparse,
					getTraits: getTraits
				}));
				if (r.errors) {
					errors = concatArrays([errors, r.errors]);
					return r.postparsed;
				}
				return r;
			}, postparsed);
		}
		return { postparsed: postparse(postparsed), errors: errors };
	},
	parse: function parse(lexed, modules) {
		var inPlaceHolder = false;
		var placeHolderContent = "";
		var startOffset = void 0;
		var tailParts = [];
		return lexed.reduce(function lexedToParsed(parsed, token) {
			if (token.type === "delimiter") {
				inPlaceHolder = token.position === "start";
				if (token.position === "end") {
					placeHolderContent = wordToUtf8(placeHolderContent);
					parsed = moduleParse(modules, placeHolderContent, parsed, startOffset);
					startOffset = null;
					Array.prototype.push.apply(parsed, tailParts);
					tailParts = [];
				}
				if (token.position === "start") {
					tailParts = [];
					startOffset = token.offset;
				}
				placeHolderContent = "";
				return parsed;
			}
			if (!inPlaceHolder) {
				parsed.push(token);
				return parsed;
			}
			if (token.type !== "content" || token.position !== "insidetag") {
				tailParts.push(token);
				return parsed;
			}
			placeHolderContent += token.value;
			return parsed;
		}, []);
	}
};

module.exports = parser;