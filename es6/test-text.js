const TxtTemplater = require("../text.js");
const doc = new TxtTemplater("Hello {user}, how are you ?");
const result = doc.render({ user: "John" });

if (result !== "Hello John, how are you ?") {
	// eslint-disable-next-line no-console
	console.log(result);
	throw new Error("TxtTemplater did not work as expected");
}
