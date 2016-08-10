"use strict";

var FileTypeConfig = require("../fileTypeConfig.js");

var expect = require("chai").expect;
var _ = require("lodash");

describe("FileTypeConfig", function () {
	it("has only immutable properties", function () {
		function modify(prop) {
			FileTypeConfig[prop].yoMama = "so fat";
		}
		_.keys(FileTypeConfig).forEach(function (key) {
			expect(modify.bind(modify, key)).to.throw(Error);
		});
	});

	it("can't be merged to have new properties", function () {
		function merge(prop) {
			const newObj = _.merge(FileTypeConfig[prop], {randoProp: "HI"});
			expect(FileTypeConfig[prop]).to.not.have.property("randoProp");
			expect(newObj).to.not.have.property("randoProp");
		}
		_.keys(FileTypeConfig).forEach(function (key) {
			merge(key);
		});
	});

	it("can't be merged to have old properties overwritten", function () {
		function merge(prop) {
			const newObj = _.merge(FileTypeConfig[prop], {tagRawXml: "HI"});
			expect(FileTypeConfig[prop].tagRawXml).to.not.equal("HI");
			expect(newObj.tagRawXml).to.not.equal("HI");
		}
		_.keys(FileTypeConfig).forEach(function (key) {
			merge(key);
		});
	});
});
