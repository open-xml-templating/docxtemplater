const spacePreserve = {
	postparse(parsed) {
		let chunk = [];
		let inChunk = false;
		return parsed.reduce(function (parsed, part) {
			if (part.type === "tag" && part.position === "start" && part.text && part.value === "<w:t>") {
				inChunk = true;
			}
			if (inChunk) {
				if (part.type === "placeholder" && !part.module) {
					chunk[0].value = '<w:t xml:space="preserve">';
				}
				chunk.push(part);
			}
			else {
				parsed.push(part);
			}
			if (part.type === "tag" && part.position === "end" && part.text && part.value === "</w:t>") {
				Array.prototype.push.apply(parsed, chunk);
				inChunk = false;
				chunk = [];
			}
			return parsed;
		}, []).concat(chunk);
	},
};
module.exports = spacePreserve;
