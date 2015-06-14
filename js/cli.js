#!/usr/bin/env node
var fs=require('fs');
var DocUtils, DocxGen, PptxGen, content, currentPath, debug, debugBool, doc, fileExts, genClass, inputFileName, jsonFileName, jsonInput, key, output, outputFile, res, showHelp, zip;

DocUtils = require('./docUtils');

DocxGen = require('./docxgen');

PptxGen = require('./pptxgen');

fileExts = ["pptx", "docx"];

showHelp = function() {
  console.info('Usage: docxtemplater <configFilePath>');
  console.info('--- ConfigFile Format: json');
  console.info('--- Supports filetypes: ' + fileExts.join(","));
  return console.info('--- see http://docxtemplater.readthedocs.org/en/latest/cli.html');
};

if (process.argv[2] === '--help' || process.argv[2] === '-h' || process.argv[2] === null || process.argv[2] === void 0) {
  showHelp();
  return;
}

res = fs.readFileSync(process.argv[2], 'utf-8');

jsonInput = JSON.parse(res);

DocUtils.config = {};

currentPath = process.cwd() + '/';

DocUtils.pathConfig = {
  "node": currentPath
};

for (key in jsonInput) {
  if (key.substr(0, 7) === 'config.') {
    DocUtils.config[key.substr(7)] = jsonInput[key];
  }
}

inputFileName = DocUtils.config["inputFile"];

genClass = inputFileName.indexOf(".pptx") > 0 ? PptxGen : DocxGen;

jsonFileName = process.argv[2];

outputFile = DocUtils.config["outputFile"];

debug = DocUtils.config["debug"];

debugBool = DocUtils.config["debugBool"];

if (jsonFileName === null || jsonFileName === void 0 || jsonFileName === '--help' || jsonFileName === '-h' || inputFileName === null || inputFileName === void 0) {
  showHelp();
} else {
  if (debug === '-d' || debug === '--debug') {
    debugBool = true;
  }
  if (debugBool) {
    console.info(process.cwd());
    console.info(debug);
  }
  if (debugBool) {
    console.info("loading docx:" + inputFileName);
  }
  content = fs.readFileSync(currentPath + inputFileName, "binary");
  doc = new genClass(content);
  doc.setData(jsonInput);
  doc.render();
  zip = doc.getZip();
  output = zip.generate({
    type: "nodebuffer"
  });
  fs.writeFileSync(currentPath + outputFile, output);
}
