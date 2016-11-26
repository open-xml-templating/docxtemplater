Please read the following before opening an issue :
===================================================

-	Read the docs at http://docxtemplater.readthedocs.io/en/latest/
-	Check whether your issue appears with the latest version of docxtemplater (lots of bugs have already been solved)

If you have an error message, please include the full error message + stacktrace, and you can also log the properties object of that error, with for example the following code :

```js
try {
	doc.render();
}
catch (error) {
	console.log(JSON.stringify({error: error}));
}
```

Please remove the text before this line when submitting your issue.

Environment
===========

-	Version of docxtemplater :
-	Used docxtemplater-modules :
-	Runner : Browser/Node.JS/...

How to reproduce my problem :
=============================

My template is the following : (Upload the docx file here inside github, which you have to name template.zip (github doesn't accept the docx extension))

With the following js file :

```js
var fs = require('fs');
var Docxtemplater = require('docxtemplater');

//Load the docx file as a binary
var content = fs
    .readFileSync(__dirname + "/template.zip", "binary");

var zip = new JSZip(content);
var doc=new Docxtemplater().loadZip(zip)

//set the templateVariables
doc.setData({
	( INSERT YOUR DATA HERE )
});

//apply them (replace all occurences of {first_name} by Hipp, ...)
doc.render();

var buf = doc.getZip()
             .generate({type:"nodebuffer"});

fs.writeFileSync(__dirname+"/output.docx",buf);
```

I would expect it to return the following template (upload your expected document if necessary), but it fails instead (include error message) / returns the following instead (upload your result here);
