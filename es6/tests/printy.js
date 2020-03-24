function repeat(input, count) {
	if (input == null) {
		throw new TypeError("can't convert " + input + " to object");
	}

	let str = "" + input;
	// To convert string to integer.
	count = +count;

	if (count < 0) {
		throw new RangeError("repeat count must be non-negative");
	}

	if (count === Infinity) {
		throw new RangeError("repeat count must be less than infinity");
	}

	count = Math.floor(count);
	if (str.length === 0 || count === 0) {
		return "";
	}

	// Ensuring count is a 31-bit integer allows us to heavily optimize the
	// main part. But anyway, most current (August 2014) browsers can't handle
	// strings 1 << 28 chars or longer, so:
	if (str.length * count >= 1 << 28) {
		throw new RangeError("repeat count must not overflow maximum string size");
	}

	const maxCount = str.length * count;
	count = Math.floor(Math.log(count) / Math.log(2));
	while (count) {
		str += str;
		count--;
	}
	str += str.substring(0, maxCount - str.length);
	return str;
}

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
