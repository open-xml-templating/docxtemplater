(function() {

  docxFileName=process.argv[2]
  jsonFileName=process.argv[3]
  outputFile=process.argv[4] || "output.docx"
  debug= process.argv[5]
  debugBool=false
  currentPath= process.cwd()+'/';

  if(docxFileName=='--help' || docxFileName=='-h' || docxFileName==null || docxFileName==undefined || jsonFileName==null || jsonFileName==undefined)
  {
    console.log('Usage: docxgen <docxfile> <jsonfile> [<outputFile>] --debug');
    console.log('--- <docxfile> a docxFile that contains Mustache Tags and QrCodes');
    console.log('--- <jsonfile> a jsonFile that contains the variables ');
    console.log('--- [<outputfile>], default: output.docx  the output in docx format');
  }
  else
  {
      if (debug=='-d' || debug == '--debug')
      debugBool=true

    if (debugBool)
      {
        console.log(process.cwd())
        console.log(debug);
      }
    if (debugBool)
      console.log("loading docx:"+docxFileName)
    DocUtils.loadDoc(docxFileName,false,true,false,function(r){console.log('error:'+r)},currentPath);
    if (debugBool)
      console.log('data:'+docXData[docxFileName]);
      console.log("loading json:"+jsonFileName)
    DocUtils.loadDoc(jsonFileName,true,true,false,function(r){console.log('error:'+r)},currentPath);
    if (debugBool)
      console.log('data:'+docXData[jsonFileName]);
    if (docXData[jsonFileName]==undefined) throw 'no data found in json file'
    jsonInput=JSON.parse(docXData[jsonFileName])
    if (debugBool)
      console.log('decoded',jsonInput);
    if (debugBool)
      console.log(docX);
    if (debugBool)
      console.log(docX[docxFileName]);
    docX[docxFileName].setTemplateVars(jsonInput)
    docX[docxFileName].qrCode=true

    
    docX[docxFileName].finishedCallback=function () {
      this.output(true,outputFile)
      console.log('outputed')
    }
    docX[docxFileName].applyTemplateVars()

    // docX[docxFileName].output(true,outputFile)
  }

  

}).call(this)