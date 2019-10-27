/* eslint-disable no-console */
module.exports = class DebuggerModule {
	constructor() {}
	optionsTransformer(options, docxtemplater) {
		console.log(JSON.stringify({ options }));
		console.log(
			JSON.stringify({ files: Object.keys(docxtemplater.getZip().files) })
		);
		return options;
	}
	parse() {
		console.log(JSON.stringify({ msg: "parse" }));
		return null;
	}
	postparse(parsed) {
		console.log(JSON.stringify({ msg: "postparse" }));
		return {
			errors: [],
			parsed,
		};
	}
	render() {
		console.log(JSON.stringify({ msg: "render" }));
		return null;
	}
	postrender() {
		console.log(JSON.stringify({ msg: "postrender" }));
	}
};
