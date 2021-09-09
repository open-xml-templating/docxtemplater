const { pregMatchAll } = require("./doc-utils.js");

module.exports = function xmlMatcher(content, tagsXmlArray) {
	const res = { content };
	const taj = tagsXmlArray.join("|");
	const regexp = new RegExp(
		`(?:(<(?:${taj})[^>]*>)([^<>]*)</(?:${taj})>)|(<(?:${taj})[^>]*/>)`,
		"g"
	);
	res.matches = pregMatchAll(regexp, res.content);
	return res;
};
