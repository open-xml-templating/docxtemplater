const { settingsContentType } = require("./content-types.js");

module.exports = {
	name: "ProofStateModule",
	on(eventName) {
		if (eventName === "attached") {
			this.attached = false;
		}
	},
	postparse(postparsed, { contentType }) {
		if (contentType !== settingsContentType) {
			return null;
		}
		const result = [];
		for (const part of postparsed) {
			if (part.type === "tag" && part.tag === "w:proofState") {
				result.push({ type: "content", value: "" });
			} else {
				result.push(part);
			}
		}
		return result;
	},
};
