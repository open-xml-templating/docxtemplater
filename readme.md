# docxtemplater v1

[![Join the chat at https://gitter.im/open-xml-templating/docxtemplater](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/open-xml-templating/docxtemplater?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Build Status](https://travis-ci.org/open-xml-templating/docxtemplater.svg?branch=master&style=flat)](https://travis-ci.org/open-xml-templating/docxtemplater)
[![Download count](http://img.shields.io/npm/dm/docxtemplater.svg?style=flat)](https://www.npmjs.org/package/docxtemplater)
[![Current tag](http://img.shields.io/npm/v/docxtemplater.svg?style=flat)](https://www.npmjs.org/package/docxtemplater)
[![Issues closed](http://issuestats.com/github/open-xml-templating/docxtemplater/badge/issue?style=flat)](http://issuestats.com/github/open-xml-templating/docxtemplater)

![docxtemplater logo](https://raw.githubusercontent.com/open-xml-templating/docxtemplater/master/logo_small.png)

**docxtemplater** is a library to generate docx/pptx documents from a docx/pptx template.
It can replace {placeholders} with data and also supports loops and conditions.
The templates can be edited by non-programmers, eg for example your clients.

*Note*: The CLI will soon be moved to another repository : keep posted on https://github.com/open-xml-templating/docxtemplater-cli

## Features

[Demo Site](http://javascript-ninja.fr/docxtemplater/v1/examples/demo.html)

- <a href="http://javascript-ninja.fr/docxtemplater/v1/examples/demo.html#variables">Replace a {placeholder} by a value</a>
- <a href="http://javascript-ninja.fr/docxtemplater/v1/examples/demo.html#loops">Use loops: {#users} {name} {/users} </a>
- <a href="http://javascript-ninja.fr/docxtemplater/v1/examples/demo.html#tables">Use loops in tables to generate columns</a>
- <a href="http://javascript-ninja.fr/docxtemplater/v1/examples/demo.html#parsing">Use expressions {product.unit_price*product.count} with angular Parsing</a>
- <a href="http://javascript-ninja.fr/docxtemplater/v1/examples/demo.html#images">Replace {%images}</a>
- <a href="http://javascript-ninja.fr/docxtemplater/v1/examples/demo.html#rawxml">Insert custom XML {@rawXml} (for formatted text for example)</a>


## Quickstart in Node

Installation: `npm install docxtemplater`

```javascript
fs=require('fs')
Docxtemplater = require('docxtemplater');

//Load the docx file as a binary
content = fs
    .readFileSync(__dirname+"/input.docx","binary")

doc=new Docxtemplater(content);

//set the templateVariables
doc.setData({
    "first_name":"Hipp",
    "last_name":"Edgar",
    "phone":"0652455478",
    "description":"New Website"
});

//apply them (replace all occurences of {first_name} by Hipp, ...)
doc.render();

var buf = doc.getZip()
             .generate({type:"nodebuffer"});

fs.writeFileSync(__dirname+"/output.docx",buf);
```

You can download [input.docx](https://github.com/open-xml-templating/docxtemplater/raw/master/examples/tagExample.docx) and put it in the same folder than your script.

## Quickstart in the browser

Installation:

```bash
git clone git@github.com:open-xml-templating/docxtemplater.git && cd docxtemplater
# git checkout v1.0.4 # Optional
npm install -g gulp jasmine-node uglify-js browserify
npm install
gulp allCoffee
mkdir build -p
browserify -r ./js/docxgen.js -s Docxgen > build/docxgen.js
uglifyjs build/docxgen.js > build/docxgen.min.js # Optional
```

The -s Docxgen will export docxgen to window.Docxgen for easy usage (on some systems, it might export it in window.docxgen (see https://github.com/open-xml-templating/docxtemplater/issues/118))

create demo.html

```html
<html>
    <script src="build/docxgen.js"></script>
    <script src="vendor/FileSaver.min.js"></script>
    <script src="vendor/jszip-utils.js"></script>
    <!--
    Mandatory in IE 6, 7, 8 and 9.
    -->
    <!--[if IE]>
        <script type="text/javascript" src="examples/vendor/jszip-utils-ie.js"></script>
    <![endif]-->
    <script>
    var loadFile=function(url,callback){
        JSZipUtils.getBinaryContent(url,callback);
    }
    loadFile("examples/tagExample.docx",function(err,content){
        if (err) { throw e};
        doc=new Docxgen(content);
        doc.setData( {"first_name":"Hipp",
            "last_name":"Edgar",
            "phone":"0652455478",
            "description":"New Website"
            }
        ) //set the templateVariables
        doc.render() //apply them (replace all occurences of {first_name} by Hipp, ...)
        out=doc.getZip().generate({type:"blob"}) //Output the document using Data-URI
        saveAs(out,"output.docx")
    })
    </script>
</html>
```

## Documentation

The full documentation of v1 can be found on [read the docs](http://docxtemplater.readthedocs.org/en/latest/).

See [upgrade.md](upgrade.md) for information about how to migrate from 0.7

## Similar libraries

They are a few similar libraries that work with docx, here’s a list of those I know a bit about:

 * docx4j :JAVA, this is probably the biggest docx library out there. They is no built in templating engine, but you can generate your docx yourself programmatically
 * docx.js: Javascript in the browser, you can create (not modify) your docx from scratch, but only do very simple things such as adding non formatted text
 * xlsx-templater : its working quite well, does the same as here but for xlsx

# Modules

Functionality can be added with modules. They is yet no doc for the modules because it is not completely mature yet, but you can open an issue if you have any question about it.
I have already created one module that can add images using the syntax: `{%image}`, which is documented here: https://github.com/open-xml-templating/docxtemplater-image-module

# Professional Support

I can give your company support for installing, extending, answering support questions, or maintainning your app that runs docxtemplater. You can find my email address on my [profile](https://github.com/edi9999)
