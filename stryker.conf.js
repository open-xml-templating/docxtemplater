/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
	packageManager: "npm",
	reporters: ["html", "clear-text", "progress"],
	testRunner: "mocha",
	coverageAnalysis: "perTest",
	mutate: ["es6/*.js", "es6/modules/*.js"],
	mochaOptions: {
		spec: ["es6/tests/index.js"],
	},
};
