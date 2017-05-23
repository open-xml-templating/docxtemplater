const wrapper = require("../module-wrapper");
const spacePreserve = {
	name: "SpacePreserveModule",
	postparse(postparsed) {
		let chunk = [];
		let inChunk = false;
		const result = postparsed.reduce(function (postparsed, part) {
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
				postparsed.push(part);
			}
			if (part.type === "tag" && part.position === "end" && part.text && part.value === "</w:t>") {
				Array.prototype.push.apply(postparsed, chunk);
				inChunk = false;
				chunk = [];
			}
			return postparsed;
		}, []);
		Array.prototype.push.apply(result, chunk);
		return result;
	},
};
module.exports = () => wrapper(spacePreserve);
