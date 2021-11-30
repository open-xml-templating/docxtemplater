<!---

# Please read the following before opening an issue :

- Read the docs at https://docxtemplater.com/docs
- Check whether your issue appears with the latest version of docxtemplater (lots of bugs have already been solved)

If you have an error message, please include the full error message + stacktrace.

-->

# Environment

- Version of docxtemplater :
- Used docxtemplater-modules :
- Runner : Browser/Node.JS/...

# How to reproduce my problem :

My template is the following : (Upload the docx file here inside github, which you have to name template.zip (github doesn't accept the docx extension))

With the following js file :

```js
const fs = require('fs');
const Docxtemplater = require('docxtemplater');

const content = fs
    .readFileSync(__dirname + "/template.zip", "binary");

const zip = new PizZip(content);
const doc = new Docxtemplater(zip)

doc.render({
	( INSERT YOUR DATA HERE )
});

const buf = doc.getZip()
             .generate({type:"nodebuffer"});

fs.writeFileSync(__dirname+"/output.docx",buf);
```

I would expect it to :

- return the following template (please upload your generated document and expected document)
- not fail (include error message)
