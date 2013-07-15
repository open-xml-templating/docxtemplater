(function() {

  docxFileName=process.argv[2]
  jsonFileName=process.argv[3]
  debug= process.argv[4]
  debugBool=false
  if (debug=='-d' || debug == '--debug')
    debugBool=true

  if (debugBool)
    console.log(debug);
  if (debugBool)
    console.log("loading docx: "+docxFileName)
  DocUtils.loadDoc(docxFileName,false,true,false,function(r){console.log(r)},process.cwd());
  if (debugBool)
    console.log("loading json: "+jsonFileName)
  DocUtils.loadDoc(jsonFileName,true,true,false,function(r){console.log(r)},process.cwd());
  if (debugBool)
    console.log('data:'+docXData[jsonFileName]);
  jsonInput=JSON.parse(docXData[jsonFileName])
  if (debugBool)
    console.log('decoded',jsonInput);
  if (debugBool)
    console.log(docX);
  if (debugBool)
    console.log(docX[docxFileName]);
  docX[docxFileName].setTemplateVars(jsonInput)
  docX[docxFileName].applyTemplateVars()
  docX[docxFileName].output()


}).call(this)