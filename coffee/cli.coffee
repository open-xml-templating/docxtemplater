`#!/usr/bin/env node
var fs=require('fs')`
DocUtils=require('./docUtils')
DocxGen=require('./docxgen')
PptxGen=require('./pptxgen')
fileExts = ["pptx", "docx"]

showHelp=()->
  console.info('Usage: docxtemplater <configFilePath>')
  console.info('--- ConfigFile Format: json')
  console.info('--- Supports filetypes: '+fileExts.join(","))
  console.info('--- see http://docxtemplater.readthedocs.org/en/latest/cli.html')

if(process.argv[2]=='--help' || process.argv[2]=='-h' || process.argv[2]==null || process.argv[2]==undefined)
  showHelp()
  return

res=fs.readFileSync(process.argv[2],'utf-8')
jsonInput=JSON.parse(res)

DocUtils.config={}

currentPath= process.cwd()+'/'
DocUtils.pathConfig={"node":currentPath}

for key of jsonInput
  if (key.substr(0,7)=='config.') then DocUtils.config[key.substr(7)]=jsonInput[key]

inputFileName=DocUtils.config["inputFile"]
genClass = if inputFileName.indexOf(".pptx") > 0 then PptxGen else DocxGen
jsonFileName=process.argv[2]
outputFile=DocUtils.config["outputFile"]
debug= DocUtils.config["debug"]
debugBool= DocUtils.config["debugBool"]
if(jsonFileName==null || jsonFileName==undefined || jsonFileName=='--help' || jsonFileName=='-h' || inputFileName==null || inputFileName==undefined)
  showHelp()
else
  if (debug=='-d' || debug == '--debug') then debugBool=true

  if debugBool
    console.info(process.cwd())
    console.info(debug)
  if (debugBool) then console.info("loading docx:"+inputFileName)
  content=fs.readFileSync(currentPath+inputFileName,"binary")
  doc = new genClass(content)
  doc.setData(jsonInput)
  doc.render()
  zip=doc.getZip()
  output = zip.generate({type:"nodebuffer"})
  fs.writeFileSync(currentPath + outputFile, output);
