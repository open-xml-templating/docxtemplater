function getMinFromArrays(arrays, state) {
	let minIndex = -1;
	for (let i = 0, l = arrays.length; i < l; i++) {
		if (state[i] >= arrays[i].length) {
			continue;
		}
		if (
			minIndex === -1 ||
			arrays[i][state[i]].offset < arrays[minIndex][state[minIndex]].offset
		) {
			minIndex = i;
		}
	}
	return minIndex;
}

module.exports = function (arrays) {
	const totalLength = arrays.reduce((sum, array) => sum + array.length, 0);
	arrays = arrays.filter((array) => array.length > 0);

	const resultArray = new Array(totalLength);
	const state = arrays.map(() => 0);

	for (let i = 0; i < totalLength; i++) {
		const arrayIndex = getMinFromArrays(arrays, state);
		resultArray[i] = arrays[arrayIndex][state[arrayIndex]];
		state[arrayIndex]++;
	}

	return resultArray;
};
