#!/usr/bin/env node

"use strict";

/* eslint-disable no-console */
// Because we are in the cli

const fs = require("fs");
const JSZip = require("jszip");
const DocUtils = require("./doc-utils");
const Docxtemplater = require("./docxtemplater");
const fileExts = ["pptx", "docx"];

function showHelp() {
	console.info("Usage: docxtemplater <configFilePath>");
	console.info("--- ConfigFile Format: json");
	console.info("--- Supports filetypes: " + fileExts.join(","));
	return console.info("--- see https://docxtemplater.readthedocs.io/en/latest/cli.html");
}

if (process.argv[2] === "--help" || process.argv[2] === "-h" || process.argv[2] == null) {
	showHelp();
	throw new Error("Nothing to do");
}

const res = fs.readFileSync(process.argv[2], "utf-8");
const jsonInput = JSON.parse(res);

DocUtils.config = {};

const currentPath = process.cwd() + "/";
DocUtils.pathConfig = {node: currentPath};

for (const key in jsonInput) {
	if (key.substr(0, 7) === "config.") {
		DocUtils.config[key.substr(7)] = jsonInput[key];
	}
}

const inputFileName = DocUtils.config.inputFile;
const fileType = inputFileName.indexOf(".pptx") !== -1 ? "pptx" : "docx";
const jsonFileName = process.argv[2];
const outputFile = DocUtils.config.outputFile;
const debug = DocUtils.config.debug;
let debugBool = DocUtils.config.debugBool;
if (jsonFileName == null || jsonFileName === "--help" || jsonFileName === "-h" || inputFileName == null) {
	showHelp();
	throw new Error("Nothing to do");
}
if (debug === "-d" || debug === "--debug") { debugBool = true; }

if (debugBool) {
	console.info(process.cwd());
	console.info(debug);
}
if (debugBool) {
	console.info("loading docx:" + inputFileName);
}
const content = fs.readFileSync(currentPath + inputFileName, "binary");
const zip = new JSZip(content);
const doc = new Docxtemplater().loadZip(zip);
doc.setOptions({fileType});
doc.setData(jsonInput);
doc.render();
const output = doc.getZip().generate({type: "nodebuffer", compression: "DEFLATE"});

fs.writeFileSync(currentPath + outputFile, output);
