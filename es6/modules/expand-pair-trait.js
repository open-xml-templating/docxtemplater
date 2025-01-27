const traitName = "expandPair";
const mergeSort = require("../merge-sort.js");
const { getLeft, getRight, pushArray } = require("../doc-utils.js");

const wrapper = require("../module-wrapper.js");
const { getExpandToDefault } = require("../traits.js");
const {
	getUnmatchedLoopException,
	getClosingTagNotMatchOpeningTag,
	getUnbalancedLoopException,
} = require("../errors.js");

function getOpenCountChange(part) {
	switch (part.location) {
		case "start":
			return 1;
		case "end":
			return -1;
	}
}

function match(start, end) {
	return (
		start != null &&
		end != null &&
		((start.part.location === "start" &&
			end.part.location === "end" &&
			start.part.value === end.part.value) ||
			end.part.value === "")
	);
}

function transformer(traits) {
	let i = 0;
	const errors = [];
	while (i < traits.length) {
		const part = traits[i].part;
		if (part.location === "end") {
			if (i === 0) {
				traits.splice(0, 1);
				errors.push(getUnmatchedLoopException(part));
				return {
					traits,
					errors,
				};
			}
			const endIndex = i;
			const startIndex = i - 1;
			let offseter = 1;
			if (match(traits[startIndex], traits[endIndex])) {
				traits.splice(endIndex, 1);
				traits.splice(startIndex, 1);
				return { errors, traits };
			}
			while (offseter < 50) {
				const startCandidate = traits[startIndex - offseter];
				const endCandidate = traits[endIndex + offseter];
				if (match(startCandidate, traits[endIndex])) {
					traits.splice(endIndex, 1);
					traits.splice(startIndex - offseter, 1);
					return { errors, traits };
				}
				if (match(traits[startIndex], endCandidate)) {
					traits.splice(endIndex + offseter, 1);
					traits.splice(startIndex, 1);
					return { errors, traits };
				}
				offseter++;
			}
			errors.push(
				getClosingTagNotMatchOpeningTag({
					tags: [traits[startIndex].part, traits[endIndex].part],
				})
			);
			traits.splice(endIndex, 1);
			traits.splice(startIndex, 1);
			return {
				traits,
				errors,
			};
		}
		i++;
	}
	for (const { part } of traits) {
		errors.push(getUnmatchedLoopException(part));
	}
	return {
		traits: [],
		errors,
	};
}

function getPairs(traits) {
	const levelTraits = {};
	const errors = [];
	const pairs = [];
	let transformedTraits = [];

	pushArray(transformedTraits, traits);

	while (transformedTraits.length > 0) {
		const result = transformer(transformedTraits);
		pushArray(errors, result.errors);
		transformedTraits = result.traits;
	}

	// Stryker disable all : because this check makes the function return quicker
	if (errors.length > 0) {
		return { pairs, errors };
	}
	// Stryker restore all
	let countOpen = 0;

	for (const currentTrait of traits) {
		const { part } = currentTrait;
		const change = getOpenCountChange(part);
		countOpen += change;
		if (change === 1) {
			levelTraits[countOpen] = currentTrait;
		} else {
			const startTrait = levelTraits[countOpen + 1];
			if (countOpen === 0) {
				pairs.push([startTrait, currentTrait]);
			}
		}
		countOpen = countOpen >= 0 ? countOpen : 0;
	}
	return { pairs, errors };
}

class ExpandPairTrait {
	constructor() {
		this.name = "ExpandPairTrait";
	}
	optionsTransformer(options, docxtemplater) {
		if (docxtemplater.options.paragraphLoop) {
			pushArray(
				docxtemplater.fileTypeConfig.expandTags,
				docxtemplater.fileTypeConfig.onParagraphLoop
			);
		}
		this.expandTags = docxtemplater.fileTypeConfig.expandTags;
		return options;
	}
	postparse(postparsed, { getTraits, postparse, fileType }) {
		let traits = getTraits(traitName, postparsed);
		traits = traits.map((trait) => trait || []);
		traits = mergeSort(traits);
		const { pairs, errors } = getPairs(traits);
		let lastRight = 0;
		let lastPair = null;
		const expandedPairs = pairs.map((pair) => {
			let { expandTo } = pair[0].part;
			if (expandTo === "auto" && fileType !== "text") {
				const result = getExpandToDefault(postparsed, pair, this.expandTags);
				if (result.error) {
					errors.push(result.error);
				}
				expandTo = result.value;
			}
			if (!expandTo || fileType === "text") {
				const left = pair[0].offset;
				const right = pair[1].offset;
				if (
					left < lastRight &&
					!this.docxtemplater.options.syntax.allowUnbalancedLoops
				) {
					errors.push(getUnbalancedLoopException(pair, lastPair));
				}

				lastPair = pair;
				lastRight = right;
				return [left, right];
			}
			let left, right;
			try {
				left = getLeft(postparsed, expandTo, pair[0].offset);
			} catch (e) {
				errors.push(e);
			}
			try {
				right = getRight(postparsed, expandTo, pair[1].offset);
			} catch (e) {
				errors.push(e);
			}
			if (
				left < lastRight &&
				!this.docxtemplater.options.syntax.allowUnbalancedLoops
			) {
				errors.push(getUnbalancedLoopException(pair, lastPair));
			}
			lastRight = right;
			lastPair = pair;
			return [left, right];
		});

		// Stryker disable all : because this check makes the function return quicker
		if (errors.length > 0) {
			return { postparsed, errors };
		}
		// Stryker restore all
		let currentPairIndex = 0;
		let innerParts;

		const newParsed = postparsed.reduce((newParsed, part, i) => {
			const inPair =
				currentPairIndex < pairs.length &&
				expandedPairs[currentPairIndex][0] <= i &&
				i <= expandedPairs[currentPairIndex][1];
			const pair = pairs[currentPairIndex];
			const expandedPair = expandedPairs[currentPairIndex];
			if (!inPair) {
				newParsed.push(part);
				return newParsed;
			}
			// We're inside the pair
			if (expandedPair[0] === i) {
				// Start pair
				innerParts = [];
			}
			if (pair[0].offset !== i && pair[1].offset !== i) {
				// Exclude inner pair indexes
				innerParts.push(part);
			}
			if (expandedPair[1] === i) {
				// End pair
				const basePart = postparsed[pair[0].offset];
				basePart.subparsed = postparse(innerParts, { basePart });
				basePart.endLindex = pair[1].part.lIndex;
				delete basePart.location;
				delete basePart.expandTo;
				newParsed.push(basePart);
				currentPairIndex++;
				let expandedPair = expandedPairs[currentPairIndex];
				while (expandedPair && expandedPair[0] < i) {
					/*
					 * If we have :
					 * expandedPairs =[[5,72],[51,67],[90,106]]
					 * Then after treating [5,72], we need to treat [90,106]
					 * Fixed since v3.58.4
					 */
					currentPairIndex++;
					expandedPair = expandedPairs[currentPairIndex];
				}
			}
			return newParsed;
		}, []);

		return { postparsed: newParsed, errors };
	}
}

module.exports = () => wrapper(new ExpandPairTrait());
