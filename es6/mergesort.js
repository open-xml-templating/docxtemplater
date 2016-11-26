function getMinFromArrays(arrays, state) {
	let minIndex = -1;
	for (let i = 0, l = arrays.length; i < l; i++) {
		if (state[i] >= arrays[i].length) {
			continue;
		}
		if (minIndex === -1 || arrays[i][state[i]].offset < arrays[minIndex][state[minIndex]].offset) {
			minIndex = i;
		}
	}
	if (minIndex === -1) {
		throw new Error("minIndex negative");
	}
	return minIndex;
}

module.exports = function (arrays) {
	const totalLength = arrays.reduce(function (sum, array) {
		return sum + array.length;
	}, 0);
	arrays = arrays.filter(function (array) {
		return array.length > 0;
	});

	const resultArray = new Array(totalLength);

	const state = arrays.map(function () { return 0; });

	let i = 0;

	while(i <= totalLength - 1) {
		const arrayIndex = getMinFromArrays(arrays, state);
		resultArray[i] = arrays[arrayIndex][state[arrayIndex]];
		state[arrayIndex]++;
		i++;
	}

	return resultArray;
};
