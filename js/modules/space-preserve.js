"use strict";

var wrapper = require("../module-wrapper");

var _require = require("../doc-utils"),
    isTextStart = _require.isTextStart,
    isTextEnd = _require.isTextEnd;

var spacePreserve = {
	name: "SpacePreserveModule",
	postparse: function postparse(postparsed) {
		var chunk = [];
		var inChunk = false;
		var result = postparsed.reduce(function (postparsed, part) {
			if (isTextStart(part) && part.tag === "w:t") {
				inChunk = true;
			}
			if (inChunk) {
				if (part.type === "placeholder" && !part.module) {
					chunk[0].value = '<w:t xml:space="preserve">';
				}
				chunk.push(part);
			} else {
				postparsed.push(part);
			}
			if (isTextEnd(part) && part.tag === "w:t") {
				Array.prototype.push.apply(postparsed, chunk);
				inChunk = false;
				chunk = [];
			}
			return postparsed;
		}, []);
		Array.prototype.push.apply(result, chunk);
		return result;
	}
};
module.exports = function () {
	return wrapper(spacePreserve);
};