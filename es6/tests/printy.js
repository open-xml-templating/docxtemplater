const repeat = require("./string-repeat.js");

module.exports = function printy(parsed, indent = 0) {
	let indentWasNegative = false;
	const result = parsed
		.reduce(function (output, p) {
			const splitted = p.value.split(/(?:\n|\r|\t)(?: |\r|\t)*/g);
			const value = splitted.join("");
			if (value === "") {
				return output;
			}
			if (p.type === "tag" && p.position === "end") {
				indent--;
			}
			if (indent < 0) {
				indentWasNegative = true;
			}
			const i =
				indent < 0 ? `(${indent})` : `(${indent})` + repeat("   ", indent);
			if (p.subparsed) {
				indent++;
				const stars = i.replace(/./g, "*");
				output += `\n${stars}START LOOP OF ${value}`;
				output += printy(p.subparsed, indent);
				output += `\n${stars}END LOOP OF ${value}`;
				indent--;
			} else if (p.type === "placeholder") {
				output += `\n${i.replace(/./g, "=")}{${value}}`;
			} else {
				output += `\n${i}${value}`;
			}
			if (p.type === "tag" && p.position === "start") {
				indent++;
			}
			return output;
		}, "")
		.split("\n")
		.map(function (line) {
			return line.replace(/[\s\uFEFF\xA0]+$/g, "");
		})
		.join("\n");
	if (indentWasNegative) {
		const err = new Error("Indent negative");
		err.properties = { result };
		throw err;
	}
	return result;
};
