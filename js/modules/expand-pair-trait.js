"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var traitName = "expandPair";
var mergeSort = require("../mergesort");

var _require = require("../doc-utils"),
    getLeft = _require.getLeft,
    getRight = _require.getRight;

var wrapper = require("../module-wrapper");

var _require2 = require("../traits"),
    getExpandToDefault = _require2.getExpandToDefault;

var _require3 = require("../errors"),
    getUnmatchedLoopException = _require3.getUnmatchedLoopException,
    getClosingTagNotMatchOpeningTag = _require3.getClosingTagNotMatchOpeningTag,
    throwLocationInvalid = _require3.throwLocationInvalid;

function getOpenCountChange(part) {
	switch (part.location) {
		case "start":
			return 1;
		case "end":
			return -1;
		default:
			throwLocationInvalid(part);
	}
}

function getPairs(traits) {
	var errors = [];
	var pairs = [];
	if (traits.length === 0) {
		return { pairs: pairs, errors: errors };
	}
	var countOpen = 1;

	var _traits = _slicedToArray(traits, 1),
	    firstTrait = _traits[0];

	if (firstTrait.part.location === "start") {
		for (var i = 1; i < traits.length; i++) {
			var currentTrait = traits[i];
			countOpen += getOpenCountChange(currentTrait.part);
			if (countOpen === 0) {
				var _outer = getPairs(traits.slice(i + 1));
				if (currentTrait.part.value !== firstTrait.part.value && currentTrait.part.value !== "") {
					errors.push(getClosingTagNotMatchOpeningTag({
						tags: [firstTrait.part, currentTrait.part]
					}));
				} else {
					pairs = [[firstTrait, currentTrait]];
				}
				return {
					pairs: pairs.concat(_outer.pairs),
					errors: errors.concat(_outer.errors)
				};
			}
		}
	}
	var part = firstTrait.part;

	errors.push(getUnmatchedLoopException({ part: part, location: part.location }));
	var outer = getPairs(traits.slice(1));
	return { pairs: outer.pairs, errors: errors.concat(outer.errors) };
}

var expandPairTrait = {
	name: "ExpandPairTrait",
	optionsTransformer: function optionsTransformer(options, docxtemplater) {
		this.expandTags = docxtemplater.fileTypeConfig.expandTags.concat(docxtemplater.options.paragraphLoop ? docxtemplater.fileTypeConfig.onParagraphLoop : []);
		return options;
	},
	postparse: function postparse(postparsed, _ref) {
		var _this = this;

		var getTraits = _ref.getTraits,
		    _postparse = _ref.postparse;

		var traits = getTraits(traitName, postparsed);
		traits = traits.map(function (trait) {
			return trait || [];
		});
		traits = mergeSort(traits);

		var _getPairs = getPairs(traits),
		    pairs = _getPairs.pairs,
		    errors = _getPairs.errors;

		var expandedPairs = pairs.map(function (pair) {
			var expandTo = pair[0].part.expandTo;

			if (expandTo === "auto") {
				var result = getExpandToDefault(postparsed, pair, _this.expandTags);
				if (result.error) {
					errors.push(result.error);
				}
				expandTo = result.value;
			}
			if (!expandTo) {
				return [pair[0].offset, pair[1].offset];
			}
			var left = getLeft(postparsed, expandTo, pair[0].offset);
			var right = getRight(postparsed, expandTo, pair[1].offset);
			return [left, right];
		});

		var currentPairIndex = 0;
		var innerParts = void 0;
		var newParsed = postparsed.reduce(function (newParsed, part, i) {
			var inPair = currentPairIndex < pairs.length && expandedPairs[currentPairIndex][0] <= i;
			var pair = pairs[currentPairIndex];
			var expandedPair = expandedPairs[currentPairIndex];
			if (!inPair) {
				newParsed.push(part);
				return newParsed;
			}
			if (expandedPair[0] === i) {
				innerParts = [];
			}
			if (pair[0].offset !== i && pair[1].offset !== i) {
				innerParts.push(part);
			}
			if (expandedPair[1] === i) {
				var basePart = postparsed[pair[0].offset];
				basePart.subparsed = _postparse(innerParts, { basePart: basePart });
				delete basePart.location;
				delete basePart.expandTo;
				newParsed.push(basePart);
				currentPairIndex++;
			}
			return newParsed;
		}, []);
		return { postparsed: newParsed, errors: errors };
	}
};

module.exports = function () {
	return wrapper(expandPairTrait);
};