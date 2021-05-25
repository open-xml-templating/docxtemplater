const traitName = "expandPair";
const mergeSort = require("../mergesort.js");
const { getLeft, getRight } = require("../doc-utils.js");

const wrapper = require("../module-wrapper.js");
const { getExpandToDefault } = require("../traits.js");
const {
	getUnmatchedLoopException,
	getClosingTagNotMatchOpeningTag,
	throwLocationInvalid,
	getUnbalancedLoopException,
} = require("../errors.js");

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
		if (traits[i] == null) {
			break;
		}
		i++;
	}
	traits.forEach(function ({ part }) {
		errors.push(getUnmatchedLoopException(part));
	});
	return {
		traits: [],
		errors,
	};
}

function getPairs(traits) {
	const levelTraits = {};
	let errors = [];
	let pairs = [];
	let countOpen = 0;
	let transformedTraits = [];

	for (let i = 0; i < traits.length; i++) {
		const currentTrait = traits[i];
		const { part } = currentTrait;
		const change = getOpenCountChange(currentTrait.part);
		countOpen += change;
		let level;
		if (change === 1) {
			level = countOpen - 1;
		} else {
			level = countOpen;
		}
		transformedTraits.push({ level, part });
	}

	while (transformedTraits.length > 0) {
		const result = transformer(transformedTraits);
		errors = errors.concat(result.errors);
		transformedTraits = result.traits;
	}

	if (errors.length > 0) {
		return { pairs, errors };
	}
	countOpen = 0;

	for (let i = 0; i < traits.length; i++) {
		const currentTrait = traits[i];
		const { part } = currentTrait;
		const change = getOpenCountChange(part);
		countOpen += change;
		if (change === 1) {
			levelTraits[countOpen] = currentTrait;
		} else {
			const startTrait = levelTraits[countOpen + 1];
			if (countOpen === 0) {
				pairs = pairs.concat([[startTrait, currentTrait]]);
			}
		}
		countOpen = countOpen >= 0 ? countOpen : 0;
	}
	return { pairs, errors };
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
		traits = traits.map(function (trait) {
			return trait || [];
		});
		traits = mergeSort(traits);
		const { pairs, errors } = getPairs(traits);
		let lastRight = 0;
		let lastPair = null;
		const expandedPairs = pairs.map((pair) => {
			let { expandTo } = pair[0].part;
			if (expandTo === "auto") {
				const result = getExpandToDefault(postparsed, pair, this.expandTags);
				if (result.error) {
					errors.push(result.error);
				}
				expandTo = result.value;
			}
			if (!expandTo) {
				const left = pair[0].offset;
				const right = pair[1].offset;
				if (left < lastRight) {
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
			if (left < lastRight) {
				errors.push(getUnbalancedLoopException(pair, lastPair));
			}
			lastRight = right;
			lastPair = pair;
			return [left, right];
		});
		if (errors.length > 0) {
			return { postparsed, errors };
		}

		let currentPairIndex = 0;
		let innerParts;

		const newParsed = postparsed.reduce(function (newParsed, part, i) {
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
