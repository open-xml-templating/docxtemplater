docxtemplater
=============

[![Join the chat at https://gitter.im/open-xml-templating/docxtemplater](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/open-xml-templating/docxtemplater?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Build Status](https://travis-ci.org/open-xml-templating/docxtemplater.svg?branch=master&style=flat)](https://travis-ci.org/open-xml-templating/docxtemplater) [![Download count](https://img.shields.io/npm/dm/docxtemplater.svg?style=flat)](https://www.npmjs.org/package/docxtemplater) [![Current tag](https://img.shields.io/npm/v/docxtemplater.svg?style=flat)](https://www.npmjs.org/package/docxtemplater) [![Issues closed](https://issuestats.com/github/open-xml-templating/docxtemplater/badge/issue?style=flat)](https://issuestats.com/github/open-xml-templating/docxtemplater)

![docxtemplater logo](https://raw.githubusercontent.com/open-xml-templating/docxtemplater/master/logo-small.png)

**docxtemplater** is a library to generate docx/pptx documents from a docx/pptx template. It can replace {placeholders} with data and also supports loops and conditions. The templates can be edited by non-programmers, eg for example your clients.

*Note*: The CLI will soon be moved to another repository : keep posted on https://github.com/open-xml-templating/docxtemplater-cli

Additional pro modules
----------------------

You can find pro-modules at http://modules.docxtemplater.com/

Features
--------

[Demo Site](http://javascript-ninja.fr/docxtemplater/v3/examples/demo.html)

-	<a href="http://javascript-ninja.fr/docxtemplater/v3/examples/demo.html#variables">Replace a {placeholder} by a value</a>
-	<a href="http://javascript-ninja.fr/docxtemplater/v3/examples/demo.html#loops">Use loops: {#users} {name} {/users} </a>
-	<a href="http://javascript-ninja.fr/docxtemplater/v3/examples/demo.html#tables">Use loops in tables to generate columns</a>
-	<a href="http://javascript-ninja.fr/docxtemplater/v3/examples/demo.html#parsing">Use expressions {product.unit_price*product.count} with angular Parsing</a>
-	<a href="http://javascript-ninja.fr/docxtemplater/v3/examples/demo.html#rawxml">Insert custom XML {@rawXml} (for formatted text for example)</a>

Quickstart in Node
------------------

Installation:

```
npm install docxtemplater
npm install jszip@2
```

**jszip version 2 is important !**, it won't work with version 3

```javascript
var fs = require('fs');
var Docxtemplater = require('docxtemplater');
var JSZip = require('jszip');

//Load the docx file as a binary
var content = fs
    .readFileSync(__dirname + "/input.docx", "binary");

var zip = new JSZip(content);
var doc=new Docxtemplater().loadZip(zip)

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

You can download [input.docx](https://github.com/open-xml-templating/docxtemplater/raw/master/examples/tag-example.docx) and put it in the same folder than your script.

Quickstart in the browser
-------------------------

### Installation

#### JS download

You can directly download built versions from github : https://github.com/open-xml-templating/docxtemplater-build/tree/master/build

#### Bower

```bash
bower install --save docxtemplater
```

#### Build it yourself

I recommend you to use the npm scripts I wrote (which can be found in the package.json).

```bash
git clone git@github.com:edi9999/docxtemplater.git && cd docxtemplater
# git checkout v3.0.0 # Optional
npm install
npm run compile
# Optionally :
# npm run browserify
# npm run uglify:lib
```

Docxtemplater will be exported to window.Docxtemplater for easy usage (on some systems, it might export it in window.docxtemplater (see https://github.com/edi9999/docxtemplater/issues/118)\)

Your version of docxtemplater will be in /build (minified and non minified options) and already include all dependencies

### Html demo

Create the following html

```html
<html>
    <script src="build/docxtemplater.js"></script>
    <script src="vendor/file-saver.min.js"></script>
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
    loadFile("examples/tag-example.docx",function(err,content){
        if (err) { throw e};
		var zip = new JSZip(content);
		var doc=new Docxtemplater().loadZip(zip)
        doc.setData( {"first_name":"Hipp",
            "last_name":"Edgar",
            "phone":"0652455478",
            "description":"New Website"
            }
        ) //set the templateVariables
        doc.render() //apply them (replace all occurences of {first_name} by Hipp, ...)
        out=doc.getZip().generate({
            type:"blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }) //Output the document using Data-URI
        saveAs(out,"output.docx")
    })
    </script>
</html>
```

Documentation
-------------

The full documentation of the latest version can be found on [read the docs](http://docxtemplater.readthedocs.io/en/latest/).
=============================================================================================================================

See [CHANGELOG.md](CHANGELOG.md) for information about how to migrate from older versions.

Similar libraries
-----------------

They are a few similar libraries that work with docx, here’s a list of those I know a bit about:

-	docx4j :JAVA, this is probably the biggest docx library out there. They is no built in templating engine, but you can generate your docx yourself programmatically
-	docx.js: Javascript in the browser, you can create (not modify) your docx from scratch, but only do very simple things such as adding non formatted text
-	xlsx-templater : its working quite well, does the same as here but for xlsx

Modules
=======

Functionality can be added with modules. They is yet no doc for the modules because it is not completely mature yet, but you can open an issue if you have any question about it.

Here is the list of existing modules:

-	Chart Module using the syntax: `{$chart}` , user contributed https://github.com/prog666/docxtemplater-chart-module (v2 module)
-	Image module using the syntax: `{%image}`, https://github.com/open-xml-templating/docxtemplater-image-module (v3 module)
-	Hyperlink module using the syntax: `{^link}`, https://github.com/sujith3g/docxtemplater-link-module (v2 module)

You can find pro-modules at http://modules.docxtemplater.com/

Professional Support
====================

I can give your company support for installing, extending, answering support questions, or maintainning your app that runs docxtemplater. You can find my email address on my [profile](https://github.com/edi9999)
