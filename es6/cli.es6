#!/usr/bin/env node

"use strict";

/* eslint-disable no-console */
// Because we are in the cli

var fs = require("fs");
var DocUtils = require("./docUtils");
var DocxGen = require("./docxgen");
var fileExts = ["pptx", "docx"];

var showHelp = function () {
	console.info("Usage: docxtemplater <configFilePath>");
	console.info("--- ConfigFile Format: json");
	console.info("--- Supports filetypes: " + fileExts.join(","));
	return console.info("--- see http://docxtemplater.readthedocs.org/en/latest/cli.html");
};

if (process.argv[2] === "--help" || process.argv[2] === "-h" || process.argv[2] === null || process.argv[2] === undefined) {
	showHelp();
	throw new Error("Nothing to do");
}

var res = fs.readFileSync(process.argv[2], "utf-8");
var jsonInput = JSON.parse(res);

DocUtils.config = {};

var currentPath = process.cwd() + "/";
DocUtils.pathConfig = {node: currentPath};

for (var key in jsonInput) {
	if (key.substr(0, 7) === "config.") { DocUtils.config[key.substr(7)] = jsonInput[key]; }
}

var inputFileName = DocUtils.config.inputFile;
var fileType = inputFileName.indexOf(".pptx") > 0 ? "pptx" : "docx";
var jsonFileName = process.argv[2];
var outputFile = DocUtils.config.outputFile;
var debug = DocUtils.config.debug;
var debugBool = DocUtils.config.debugBool;
if (jsonFileName === null || jsonFileName === undefined || jsonFileName === "--help" || jsonFileName === "-h" || inputFileName === null || inputFileName === undefined) {
	showHelp();
}
else {
	if (debug === "-d" || debug === "--debug") { debugBool = true; }

	if (debugBool) {
		console.info(process.cwd());
		console.info(debug);
	}
	if (debugBool) { console.info("loading docx:" + inputFileName); }
	var content = fs.readFileSync(currentPath + inputFileName, "binary");
	var doc = new DocxGen(content);
	doc.setOptions({fileType: fileType});
	doc.setData(jsonInput);
	doc.render();
	var zip = doc.getZip();
	var output = zip.generate({type: "nodebuffer"});
	fs.writeFileSync(currentPath + outputFile, output);
}
