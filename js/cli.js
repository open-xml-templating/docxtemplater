#!/usr/bin/env node


"use strict";

/* eslint-disable no-console */
// Because we are in the cli

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var fs = require("fs");
var JSZip = require("jszip");
var DocUtils = require("./doc-utils");
var Docxtemplater = require("./docxtemplater");
var fileExts = ["pptx", "docx"];
var path = require("path");

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

var res = fs.readFileSync(process.argv[2], "utf-8");
var jsonInput = JSON.parse(res);

DocUtils.config = {};

var currentPath = process.cwd() + path.sep;
DocUtils.pathConfig = { node: currentPath };

for (var key in jsonInput) {
	if (key.substr(0, 7) === "config.") {
		DocUtils.config[key.substr(7)] = jsonInput[key];
	}
}

var inputFileName = DocUtils.config.inputFile;

var _process$argv = _slicedToArray(process.argv, 3),
    jsonFileName = _process$argv[2];

var _DocUtils$config = DocUtils.config,
    outputFile = _DocUtils$config.outputFile,
    debug = _DocUtils$config.debug;
var debugBool = DocUtils.config.debugBool;

if (jsonFileName == null || jsonFileName === "--help" || jsonFileName === "-h" || inputFileName == null) {
	showHelp();
	throw new Error("Nothing to do");
}
if (debug === "-d" || debug === "--debug") {
	debugBool = true;
}

if (debugBool) {
	console.info(process.cwd());
	console.info(debug);
}
if (debugBool) {
	console.info("loading docx:" + inputFileName);
}

var content = fs.readFileSync(currentPath + inputFileName, "binary");
var zip = new JSZip(content);
var doc = new Docxtemplater();

doc.loadZip(zip);
doc.setData(jsonInput);
doc.render();
var output = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });

fs.writeFileSync(currentPath + outputFile, output);