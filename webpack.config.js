const path = require("path");
const webpack = require("webpack");
/* eslint-disable no-process-env */
const min = process.env.MIN === "true";

module.exports = {
	entry: "./es6/docxtemplater.js",
	output: {
		path: path.resolve(__dirname, "build"),
		filename: `docxtemplater.${min ? "min." : ""}js`,
		library: "docxtemplater",
		libraryTarget: "window",
	},
	resolve: {
		alias: {xmldom: path.resolve(__dirname, "es6/browser-versions/xmldom.js")},
	},
	module: {
		rules: [
			{
				test: [/\.js$/],
				exclude: [/node_modules/],
				loader: "babel-loader",
				options: {presets: ["es2015"]},
			},
		],
	},
	plugins: [].concat(
		min
			? [
				new webpack.optimize.UglifyJsPlugin({
					compress: {warnings: false},
				}),
			] : []
	),
};
