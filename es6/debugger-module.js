const safeStringify = require("./safe-json-stringify.js");
/* eslint-disable no-console */
module.exports = class DebuggerModule {
	constructor() {}

	optionsTransformer(options, docxtemplater) {
		console.log(safeStringify({ options }));
		console.log(
			safeStringify({ files: Object.keys(docxtemplater.getZip().files) })
		);
		return options;
	}

	parse() {
		console.log(safeStringify({ msg: "parse" }));
		return null;
	}

	postparse(parsed) {
		console.log(safeStringify({ msg: "postparse" }));
		return {
			errors: [],
			parsed,
		};
	}

	render() {
		console.log(safeStringify({ msg: "render" }));
		return null;
	}

	postrender() {
		console.log(safeStringify({ msg: "postrender" }));
	}
};
