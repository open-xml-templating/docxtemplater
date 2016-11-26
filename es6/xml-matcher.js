"use strict";
// res class responsibility is to parse the XML.
const DocUtils = require("./doc-utils");
const memoize = require("./memoize");

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
		const pn = {array: Array.prototype.slice.call(arguments)};
		pn.array.shift();
		const match = pn.array[0] + pn.array[1];
		// add match so that pn[0] = whole match, pn[1]= first parenthesis,...
		pn.array.unshift(match);
		pn.array.pop();
		const offset = pn.array.pop();
		pn.offset = offset;
		pn.first = true;
		// add at the beginning
		res.matches.unshift(pn);
		res.charactersAdded.unshift(0);
		return res.charactersAddedCumulative.unshift(0);
	}

	if (res.content.indexOf("<") === -1 && res.content.indexOf(">") === -1) {
		res.content.replace(/^()([^<>]*)$/, replacerUnshift);
	}

	let r = new RegExp(`^()([^<]+)<\/(?:${res.tagsXmlArrayJoined})>`);
	res.content.replace(r, replacerUnshift);

	function replacerPush() {
		const pn = {array: Array.prototype.slice.call(arguments)};
		pn.array.pop();
		const offset = pn.array.pop();
		pn.offset = offset;
		pn.last = true;
		// add at the end
		res.matches.push(pn);
		res.charactersAdded.push(0);
		return res.charactersAddedCumulative.push(0);
	}

	r = new RegExp(`(<(?:${res.tagsXmlArrayJoined})[^>]*>)([^>]+)$`);
	res.content.replace(r, replacerPush);
	return res;
}

function xmlMatcher(content, tagsXmlArray) {
	const res = {};
	res.content = content;
	res.tagsXmlArray = tagsXmlArray;
	res.tagsXmlArrayJoined = res.tagsXmlArray.join("|");
	const regexp = new RegExp(`(<(?:${res.tagsXmlArrayJoined})[^>]*>)([^<>]*)</(?:${res.tagsXmlArrayJoined})>`, "g");
	res.matches = DocUtils.pregMatchAll(regexp, res.content);
	res.charactersAddedCumulative = res.matches.map(() => 0);
	res.charactersAdded = res.matches.map(() => 0);
	return handleRecursiveCase(res);
}

const memoized = memoize(xmlMatcher);

module.exports = function (content, tagsXmlArray) {
	return DocUtils.cloneDeep(memoized(content, tagsXmlArray));
};
