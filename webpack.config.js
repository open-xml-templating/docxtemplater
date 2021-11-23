const path = require("path");
/* eslint-disable no-process-env */
const min = process.env.MIN === "true";
const FILE = process.env.FILE;
const outputFilename =
	FILE === "test" ? "test.js" : `docxtemplater.${min ? "min." : ""}js`;

const outputPath = path.resolve(
	__dirname,
	FILE === "test" ? "browser" : "build"
);
const entry =
	FILE === "test" ? "./es6/tests/index.js" : "./es6/docxtemplater.js";

const webpack = require("webpack");

module.exports = {
	entry,
	plugins: [
		new webpack.DefinePlugin({
			"process.env.FAST": "''",
			"process.env.SPEED_TEST": "'true'",
		}),
	],
	output: {
		path: outputPath,
		filename: outputFilename,
		library: "docxtemplater",
		libraryTarget: "window",
	},
	resolve: {
		alias: {
			"@xmldom/xmldom": path.resolve(
				__dirname,
				"es6/browser-versions/xmldom.js"
			),
			fs: path.resolve(__dirname, "es6/browser-versions/fs.js"),
		},
		fallback: { path: false },
	},
	module: {
		rules: [
			{
				test: [/\.js$/],
				exclude: [/node_modules/],
				loader: "babel-loader",
			},
		],
	},
	mode: "production",
	target: ["web", "es5"],
	optimization: {
		minimize: min,
	},
};
