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
		return postparsed.map((part) => {
			if (part.type === "tag" && part.tag === "w:proofState") {
				return { type: "content", value: "" };
			}
			return part;
		});
	},
};
