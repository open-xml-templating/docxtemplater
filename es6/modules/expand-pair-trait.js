const traitName = "expandPair";
const mergeSort = require("../mergesort");
const DocUtils = require("../doc-utils");
const {getExpandToDefault} = require("../traits");
const Errors = require("../errors");

function throwUnmatchedLoopException(options) {
	const location = options.location;
	const t = location === "start" ? "unclosed" : "unopened";
	const T = location === "start" ? "Unclosed" : "Unopened";

	const err = new Errors.XTTemplateError(`${T} loop`);
	const tag = options.part.value;
	err.properties = {
		id: `${t}_loop`,
		explanation: `The loop with tag ${tag} is ${t}`,
		xtag: tag,
	};
	throw err;
}

function throwClosingTagNotMatchOpeningTag(options) {
	const tags = options.tags;

	const err = new Errors.XTTemplateError("Closing tag does not match opening tag");
	err.properties = {
		id: "closing_tag_does_not_match_opening_tag",
		explanation: `The tag "${tags[0].value}" is closed by the tag "${tags[1].value}"`,
		openingtag: tags[0].value,
		closingtag: tags[1].value,
	};
	throw err;
}

function getOpenCountChange(part) {
	switch (part.location) {
		case "start":
			return 1;
		case "end":
			return -1;
		default:
			throw new Error(`Location should be one of 'start' or 'end' (given : ${part.location})`);

	}
}

function getPairs(traits) {
	if (traits.length === 0) {
		return [];
	}
	const firstTrait = traits[0];
	if (traits.length === 1) {
		const part = firstTrait.part;
		throwUnmatchedLoopException({part, location: firstTrait.part.location});
	}
	let countOpen = 1;
	for (let i = 1; i < traits.length; i++) {
		const currentTrait = traits[i];
		countOpen += getOpenCountChange(currentTrait.part);
		if (countOpen === 0) {
			if (currentTrait.part.value !== firstTrait.part.value && currentTrait.part.value !== "") {
				throwClosingTagNotMatchOpeningTag({tags: [firstTrait.part, currentTrait.part]});
			}
			const outer = getPairs(traits.slice(i + 1));
			return [[firstTrait, currentTrait]].concat(outer);
		}
	}
}

const expandPairTrait = {
	postparse(parsed, {getTraits, postparse}) {
		let traits = getTraits(traitName, parsed);
		traits = traits.map(function (trait) {
			return trait || [];
		});
		traits = mergeSort(traits);
		const pairs = getPairs(traits);
		const expandedPairs = pairs.map(function (pair) {
			let expandTo = pair[0].part.expandTo;
			if (expandTo === "auto") {
				expandTo = getExpandToDefault(parsed.slice(pair[0].offset, pair[1].offset));
			}
			if (!expandTo) {
				return [pair[0].offset, pair[1].offset];
			}
			const left = DocUtils.getLeft(parsed, expandTo, pair[0].offset);
			const right = DocUtils.getRight(parsed, expandTo, pair[1].offset);
			return [left, right];
		});

		let currentPairIndex = 0;
		let innerParts;
		return parsed.reduce(function (newParsed, part, i) {
			const inPair = currentPairIndex < pairs.length && expandedPairs[currentPairIndex][0] <= i;
			const pair = pairs[currentPairIndex];
			const expandedPair = expandedPairs[currentPairIndex];
			if(!inPair) {
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
				const basePart = parsed[pair[0].offset];
				delete basePart.location;
				delete basePart.expandTo;
				basePart.subparsed = postparse(innerParts);
				newParsed.push(basePart);
				currentPairIndex++;
				return newParsed;
			}
			return newParsed;
		}, []);
	},
};

module.exports = expandPairTrait;
