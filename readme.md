# DocxTemplater

[![Build Status](https://travis-ci.org/edi9999/docxtemplater.svg?branch=master)](https://travis-ci.org/edi9999/docxtemplater)
[![Download count](http://img.shields.io/npm/dm/docxtemplater.svg)](https://www.npmjs.org/package/docxtemplater)
[![Current tag](http://img.shields.io/npm/v/docxtemplater.svg)](https://www.npmjs.org/package/docxtemplater)

**docxtemplater** is a library to generate docx documents from a docx template. It can replace tags by their values and replace images with other images. It is very user oriented as users can without a lot of programming knowledge create their first template and automatically change variables in it.

## Documentation

The full documentation can be found on [read the docs](http://docxtemplater.readthedocs.org/en/latest/).

## Demo

[All demos can be found here](http://javascript-ninja.fr/docxgenjs/examples/demo.html)

Including:

- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#variables">Replace Variables</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#formating">Formating</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#parsing">Angular Parsing</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#loops">Loops</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#tables">Loops and tables</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#lists">Lists</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#images">Replacing images</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#naming">Naming the output</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#qrcode">Using QrCodes</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#qrcodeloop">Replacing many images with QrCode</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#rawxml">Raw Xml Insertion</a><br>



## Quickstart

Installation: `npm install docxtemplater`

    var DocXTemplater= require('docxtemplater');

    //loading the file
    docxtemplater=new DocXTemplater().loadFromFile("tagExample.docx");

    //setting the tags
    docxtemplater.setTags({"name":"Edgar"});

    //when finished
    docxtemplater.finishedCallback=function () {
        docxtemplater.output();
    }

    //apply the tags
    docxtemplater.applyTags();

You can download [tagExample.docx](https://github.com/edi9999/docxtemplater/raw/master/examples/tagExample.docx) and put it in the same folder than your script.

## Have 0.6.3 or less and using the qrcode module ? You probably have a security issue. See [upgrade.md](upgrade.md)

## Known issues

Todo:

 - [ ] Incompatibility with IE: Error : SCRIPT5022: End of stream reached (stream length = 14578, asked index = 18431). Corrupted zip ?
 - [ ] Use FileSaver API for output http://eligrey.com/blog/post/saving-generated-files-on-the-client-side
 - [ ] stop overflooding the global scope:
     - DocUtils
     - XmlTemplater
     - jsQrCode
     - jsZip
     - DocXTemplater
     - ScopeManager
     - XmlMatcher
 - [ ] output with FileSaver.js to name your file
 - [ ] Remove the node/browser specific code when possible
 - [ ] When not possible, create a NodeSpecific File or BrowserSpecific File
