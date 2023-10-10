const diff = require("diff");
const { first } = require("../../utils.js");

function unifiedDiff(actual, expected) {
	const indent = "      ";
	function cleanUp(line) {
		const firstChar = first(line);
		if (firstChar === "+") {
			return indent + line;
		}
		if (firstChar === "-") {
			return indent + line;
		}
		if (line.match(/@@/)) {
			return "--";
		}
		if (line.match(/\\ No newline/)) {
			return null;
		}
		return indent + line;
	}
	function notBlank(line) {
		return typeof line !== "undefined" && line !== null;
	}
	const msg = diff.createPatch("string", actual, expected);
	const lines = msg.split("\n").splice(5);
	return (
		"\n      " +
		"+ expected" +
		" " +
		"- actual" +
		"\n\n" +
		lines.map(cleanUp).filter(notBlank).join("\n")
	);
}

/* eslint-disable no-console */
function captureLogs() {
	const oldLog = console.log;
	const collected = [];
	console.log = function (a) {
		// oldLog(a);
		collected.push(a);
	};
	return {
		logs() {
			return collected;
		},
		stop() {
			console.log = oldLog;
		},
	};
}
/* eslint-enable no-console */

module.exports = {
	captureLogs,
	unifiedDiff,
};
