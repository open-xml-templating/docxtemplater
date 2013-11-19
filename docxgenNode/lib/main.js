(function() {
   showHelp= function()
    {
	console.log('Usage: docxgen <configFilePath>');
	console.log('--- ConfigFile Format: json');
	console.log('--- see Config.json in docxgenjs/docxgenNode');
    }
	/*docxFileName=process.argv[2]
  outputFile=process.argv[4] || "output.docx"
  debug= process.argv[5]
  */

  if(process.argv[2]=='--help' || process.argv[2]=='-h' || process.argv[2]==null || process.argv[2]==undefined)
	{
	showHelp();
	return;
	}

  res=global.fs.readFileSync(process.argv[2],'utf-8')
  jsonInput=JSON.parse(res)

  for(var key in jsonInput){
    if (key.substr(0,7)=='config.') {
      DocUtils.config[key.substr(7)]=jsonInput[key]
    };
  }

  docxFileName=DocUtils.config["docxFile"];
  jsonFileName=process.argv[2];

  outputFile=DocUtils.config["outputFile"];
  debug= DocUtils.config["debug"];
  debugBool= DocUtils.config["debugBool"];

  console.log(DocUtils.config)

  currentPath= process.cwd()+'/';

  if(docxFileName=='--help' || docxFileName=='-h' || docxFileName==null || docxFileName==undefined || jsonFileName==null || jsonFileName==undefined)
  {
	showHelp();
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
