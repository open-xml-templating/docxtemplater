/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
	packageManager: "npm",
	reporters: ["html", "clear-text", "progress"],
	testRunner: "mocha",
	coverageAnalysis: "perTest",
	ignorePatterns: [],
	mutate: [
		"es6/*.js",
		"es6/modules/*.js",
		"!es6/debugger-module.js",
		"!es6/error-logger.js",
		"!es6/memory-test.js",
		"!es6/uintarray-to-string.js",
		"!es6/proof-state-module.js",
	],
	mochaOptions: {
		spec: ["es6/tests/index.js"],
	},
};
