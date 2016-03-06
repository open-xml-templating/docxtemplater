"use strict";

var DocUtils = require("./docUtils");
var XmlUtil = {};

var addTag = function (array, tag) {
	return array.concat([{tag: "<" + tag.array[1] + ">", offset: tag.offset}]);
};

var lastTagIsOpenTag = function (array, tag) {
	if (array.length === 0) {
		return false;
	}
	var lastTag = array[array.length - 1];
	var innerLastTag = lastTag.tag.substr(1, lastTag.tag.length - 2);
	var innerCurrentTag = tag.array[1].substr(1);
	// tag was just opened
	return innerLastTag === innerCurrentTag;
};

XmlUtil.getListXmlElements = function (text) {
	/*
	get the different closing and opening tags between two texts (doesn't take into account tags that are opened then closed (those that are closed then opened are returned)):
	returns:[{"tag":"</w:r>","offset":13},{"tag":"</w:p>","offset":265},{"tag":"</w:tc>","offset":271},{"tag":"<w:tc>","offset":828},{"tag":"<w:p>","offset":883},{"tag":"<w:r>","offset":1483}]
	*/
	// getThemAll (the opening and closing tags)!
	var tags = DocUtils.pregMatchAll(/<(\/?[^/> ]+)([^>]*)>/g, text);
	var result = [];
	for (var i = 0, tag; i < tags.length; i++) {
		tag = tags[i];
		// closing tag
		if (tag.array[1][0] === "/") {
			var justOpened = lastTagIsOpenTag(result, tag);
			if (justOpened) {
				result.pop();
			}
			else {
				result = addTag(result, tag);
			}
		}
		else if (tag.array[2][tag.array[2].length - 1] !== "/") {
			result = addTag(result, tag);
		}
	}
	return result;
};
module.exports = XmlUtil;
