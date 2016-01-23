"use strict";
// This class responsibility is to parse the XML.
var DocUtils = require("./docUtils");

module.exports = class XmlMatcher {
	constructor(content) { this.content = content; }

	parse(tagsXmlArray) {
		this.tagsXmlArray = tagsXmlArray;
		this.tagsXmlArrayJoined = this.tagsXmlArray.join("|");
		this.matches = DocUtils.pregMatchAll(`(<(?:${this.tagsXmlArrayJoined})[^>]*>)([^<>]*)</(?:${this.tagsXmlArrayJoined})>`, this.content);
		this.charactersAdded = ((() => {
			var result = [];
			var end = this.matches.length;
			for (var i = 0; end > 0 ? i < end : i > end; end > 0 ? i++ : i--) {
				result.push(0);
			}
			return result;
		})());
		this.handleRecursiveCase();
		return this;
	}

	handleRecursiveCase() {
		/*
		Because xmlTemplater is recursive (meaning it can call it self), we need to handle special cases where the XML is not valid:
		For example with this string "I am</w:t></w:r></w:p><w:p><w:r><w:t>sleeping",
			- we need to match also the string that is inside an implicit <w:t> (that's the role of replacerUnshift) (in this case 'I am')
			- we need to match the string that is at the right of a <w:t> (that's the role of replacerPush) (in this case 'sleeping')
		the test: describe "scope calculation" it "should compute the scope between 2 <w:t>" makes sure that this part of code works
		It should even work if they is no XML at all, for example if the code is just "I am sleeping", in this case however, they should only be one match
		*/

		var replacerUnshift = (...pn) => {
			pn.shift();
			var match = pn[0] + pn[1];
			// add match so that pn[0] = whole match, pn[1]= first parenthesis,...
			pn.unshift(match);
			pn.pop();
			var offset = pn.pop();
			pn.offset = offset;
			pn.first = true;
			// add at the beginning
			this.matches.unshift(pn);
			return this.charactersAdded.unshift(0);
		};

		if (this.content.indexOf("<") === -1 && this.content.indexOf(">") === -1) {
			this.content.replace(/^()([^<>]*)$/, replacerUnshift);
		}

		var regex = `^()([^<]+)<\/(?:${this.tagsXmlArrayJoined})>`;
		var r = new RegExp(regex);
		this.content.replace(r, replacerUnshift);

		var replacerPush = (...pn) => {
			pn.pop();
			var offset = pn.pop();
			pn.offset = offset;
			pn.last = true;
			// add at the end
			this.matches.push(pn);
			return this.charactersAdded.push(0);
		};

		regex = `(<(?:${this.tagsXmlArrayJoined})[^>]*>)([^>]+)$`;
		r = new RegExp(regex);
		this.content.replace(r, replacerPush);
		return this;
	}
};
