"use strict";
// res class responsibility is to parse the XML.

var _require = require("./doc-utils"),
    pregMatchAll = _require.pregMatchAll;

function handleRecursiveCase(res) {
	/*
 	 Because xmlTemplater is recursive (meaning it can call it self), we need to handle special cases where the XML is not valid:
 	 For example with res string "I am</w:t></w:r></w:p><w:p><w:r><w:t>sleeping",
 	 - we need to match also the string that is inside an implicit <w:t> (that's the role of replacerUnshift) (in res case 'I am')
 	 - we need to match the string that is at the right of a <w:t> (that's the role of replacerPush) (in res case 'sleeping')
 	 the test: describe "scope calculation" it "should compute the scope between 2 <w:t>" makes sure that res part of code works
 	 It should even work if they is no XML at all, for example if the code is just "I am sleeping", in res case however, they should only be one match
 	 */

	function replacerUnshift() {
		var pn = { array: Array.prototype.slice.call(arguments) };
		pn.array.shift();
		var match = pn.array[0] + pn.array[1];
		// add match so that pn[0] = whole match, pn[1]= first parenthesis,...
		pn.array.unshift(match);
		pn.array.pop();
		var offset = pn.array.pop();
		pn.offset = offset;
		pn.first = true;
		// add at the beginning
		res.matches.unshift(pn);
	}

	if (res.content.indexOf("<") === -1 && res.content.indexOf(">") === -1) {
		res.content.replace(/^()([^<>]*)$/, replacerUnshift);
	}

	var r = new RegExp("^()([^<]+)</(?:" + res.tagsXmlArrayJoined + ")>");
	res.content.replace(r, replacerUnshift);

	function replacerPush() {
		var pn = { array: Array.prototype.slice.call(arguments) };
		pn.array.pop();
		var offset = pn.array.pop();
		pn.offset = offset;
		pn.last = true;
		if (pn.array[0].indexOf("/>") !== -1) {
			return;
		}
		// add at the end
		res.matches.push(pn);
	}

	r = new RegExp("(<(?:" + res.tagsXmlArrayJoined + ")[^>]*>)([^>]+)$");
	res.content.replace(r, replacerPush);
	return res;
}

module.exports = function xmlMatcher(content, tagsXmlArray) {
	var res = {};
	res.content = content;
	res.tagsXmlArray = tagsXmlArray;
	res.tagsXmlArrayJoined = res.tagsXmlArray.join("|");
	var regexp = new RegExp("(?:(<(?:" + res.tagsXmlArrayJoined + ")[^>]*>)([^<>]*)</(?:" + res.tagsXmlArrayJoined + ")>)|(<(?:" + res.tagsXmlArrayJoined + ")[^>]*/>)", "g");
	res.matches = pregMatchAll(regexp, res.content);
	return handleRecursiveCase(res);
};