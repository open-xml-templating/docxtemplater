const { str2xml } = require("./doc-utils.js");
const relsFile = "_rels/.rels";

function getRelsTypes(zip) {
	const rootRels = zip.files[relsFile];
	const rootRelsXml = rootRels ? str2xml(rootRels.asText()) : null;
	const rootRelationships = rootRelsXml
		? rootRelsXml.getElementsByTagName("Relationship")
		: [];
	const relsTypes = {};
	for (const relation of rootRelationships) {
		relsTypes[relation.getAttribute("Target")] = relation.getAttribute("Type");
	}
	return relsTypes;
}

module.exports = { getRelsTypes };
