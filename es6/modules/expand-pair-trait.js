const traitName = "expandPair";
const mergeSort = require("../mergesort");
const {
	getLeft,
	getRight,
	getNearestLeft,
	getNearestRight,
} = require("../doc-utils");

const wrapper = require("../module-wrapper");
const { getExpandToDefault } = require("../traits");
const {
	getUnmatchedLoopException,
	getClosingTagNotMatchOpeningTag,
	throwLocationInvalid,
} = require("../errors");

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
	const errors = [];
	let pairs = [];
	if (traits.length === 0) {
		return { pairs, errors };
	}
	let countOpen = 1;
	const [firstTrait] = traits;
	if (firstTrait.part.location === "start") {
		for (let i = 1; i < traits.length; i++) {
			const currentTrait = traits[i];
			countOpen += getOpenCountChange(currentTrait.part);
			if (countOpen === 0) {
				const outer = getPairs(traits.slice(i + 1));
				if (
					currentTrait.part.value !== firstTrait.part.value &&
					currentTrait.part.value !== ""
				) {
					errors.push(
						getClosingTagNotMatchOpeningTag({
							tags: [firstTrait.part, currentTrait.part],
						})
					);
				} else {
					pairs = [[firstTrait, currentTrait]];
				}
				return {
					pairs: pairs.concat(outer.pairs),
					errors: errors.concat(outer.errors),
				};
			}
		}
	}
	const { part } = firstTrait;
	errors.push(getUnmatchedLoopException({ part, location: part.location }));
	const outer = getPairs(traits.slice(1));
	return { pairs: outer.pairs, errors: errors.concat(outer.errors) };
}

const expandPairTrait = {
	name: "ExpandPairTrait",
	optionsTransformer(options, docxtemplater) {
		this.expandTags = docxtemplater.fileTypeConfig.expandTags.concat(
			docxtemplater.options.paragraphLoop
				? docxtemplater.fileTypeConfig.onParagraphLoop
				: []
		);
		return options;
	},
	postparse(postparsed, { getTraits, postparse }) {
		let traits = getTraits(traitName, postparsed);
		traits = traits.map(function(trait) {
			return trait || [];
		});
		traits = mergeSort(traits);
		const { pairs, errors } = getPairs(traits);
		const expandedPairs = pairs.map(pair => {
			let { expandTo } = pair[0].part;
			if (expandTo === "auto") {
				const result = getExpandToDefault(postparsed, pair, this.expandTags);
				if (result.error) {
					errors.push(result.error);
				}
				expandTo = result.value;
			}
			if (!expandTo) {
				return [pair[0].offset, pair[1].offset];
			}
			const left = getLeft(postparsed, expandTo, pair[0].offset);
			const right = getRight(postparsed, expandTo, pair[1].offset);
			return [left, right];
		});

		let currentPairIndex = 0;
		let innerParts;
		const newParsed = postparsed.reduce(function(newParsed, part, i) {
			const inPair =
				currentPairIndex < pairs.length &&
				expandedPairs[currentPairIndex][0] <= i;
			const pair = pairs[currentPairIndex];
			const expandedPair = expandedPairs[currentPairIndex];
			if (!inPair) {
				newParsed.push(part);
				return newParsed;
			}
			const left = expandedPair[0];
			const right = expandedPair[1];
			const before = getNearestLeft(postparsed, ["w:p", "w:tc"], left - 1);
			const after = getNearestRight(postparsed, ["w:p", "w:tc"], right + 1);
			if (before === "w:tc" && after === "w:tc") {
				part.emptyValue = "<w:p></w:p>";
			}
			if (expandedPair[0] === i) {
				innerParts = [];
			}
			if (pair[0].offset !== i && pair[1].offset !== i) {
				innerParts.push(part);
			}
			if (expandedPair[1] === i) {
				const basePart = postparsed[pair[0].offset];
				basePart.subparsed = postparse(innerParts, { basePart });
				delete basePart.location;
				delete basePart.expandTo;
				newParsed.push(basePart);
				currentPairIndex++;
			}
			return newParsed;
		}, []);
		return { postparsed: newParsed, errors };
	},
};

module.exports = () => wrapper(expandPairTrait);
