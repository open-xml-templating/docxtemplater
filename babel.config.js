module.exports = {
	presets: ["@babel/preset-env"],
	babelrcRoots: [".", "node_modules/*"],
	plugins: [
		[
			"@babel/plugin-transform-for-of",
			{
				assumeArray: true,
			},
		],
	],
};
