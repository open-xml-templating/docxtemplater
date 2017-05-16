docxtemplater
=============

[![Build Status](https://travis-ci.org/open-xml-templating/docxtemplater.svg?branch=master&style=flat)](https://travis-ci.org/open-xml-templating/docxtemplater) [![Download count](https://img.shields.io/npm/dm/docxtemplater.svg?style=flat)](https://www.npmjs.org/package/docxtemplater) [![Current tag](https://img.shields.io/npm/v/docxtemplater.svg?style=flat)](https://www.npmjs.org/package/docxtemplater) [![Issues closed](https://issuestats.com/github/open-xml-templating/docxtemplater/badge/issue?style=flat)](https://issuestats.com/github/open-xml-templating/docxtemplater) [![CDNJS version](https://img.shields.io/cdnjs/v/docxtemplater.svg)](https://cdnjs.com/libraries/docxtemplater)

![docxtemplater logo](https://raw.githubusercontent.com/open-xml-templating/docxtemplater/master/logo-small.png)

[![Join the chat at https://gitter.im/open-xml-templating/docxtemplater](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/open-xml-templating/docxtemplater?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**docxtemplater** is a library to generate docx/pptx documents from a docx/pptx template. It can replace {placeholders} with data and also supports loops and conditions. The templates can be edited by non-programmers, eg for example your clients.

Features
--------

[Demo Site](http://javascript-ninja.fr/docxtemplater/v3/examples/demo.html)

-	<a href="http://javascript-ninja.fr/docxtemplater/v3/examples/demo.html#variables">Replace a {placeholder} by a value</a>
-	<a href="http://javascript-ninja.fr/docxtemplater/v3/examples/demo.html#loops">Use loops: {#users} {name} {/users} </a>
-	<a href="http://javascript-ninja.fr/docxtemplater/v3/examples/demo.html#tables">Use loops in tables to generate columns</a>
-	<a href="http://javascript-ninja.fr/docxtemplater/v3/examples/demo.html#parsing">Use expressions {product.unit_price*product.count} with angular Parsing</a>
-	<a href="http://javascript-ninja.fr/docxtemplater/v3/examples/demo.html#rawxml">Insert custom XML {@rawXml} (for formatted text for example)</a>

Quickstart
----------

-	[Installation in node](https://docxtemplater.readthedocs.io/en/latest/installation.html#node)
-	[Installation in the browser](https://docxtemplater.readthedocs.io/en/latest/installation.html#browser)
-	[Generate a document in node](https://docxtemplater.readthedocs.io/en/latest/generate.html#node)
-	[Generate a document in browser](https://docxtemplater.readthedocs.io/en/latest/generate.html#browser)

Documentation
-------------

The full documentation of the latest version can be found on [read the docs](http://docxtemplater.readthedocs.io/en/latest/).

See [CHANGELOG.md](CHANGELOG.md) for information about how to migrate from older versions.

Similar libraries
-----------------

They are a few similar libraries that work with docx, here’s a list of those I know a bit about:

-	docx4j :JAVA, this is probably the biggest docx library out there. They is no built in templating engine, but you can generate your docx yourself programmatically
-	docx.js: Javascript in the browser, you can create (not modify) your docx from scratch, but only do very simple things such as adding non formatted text
-	xlsx-templater : its working quite well, does the same as here but for xlsx

Modules
-------

Functionality can be added with modules. There is yet no documentation on how to write modules yourself because the API might change in the future, but you can open an issue if you have any question about it.

Here is the list of existing modules:

Free modules (by docxtemplater core team members):

-	Image module using the syntax: `{%image}`, https://github.com/open-xml-templating/docxtemplater-image-module (v3 module)

Pro modules (developped by docxtemplater core team members):

-	Html Module to insert formatted text in a docx document https://modules.docxtemplater.com/modules/html/
-	Slides Module to create multiple slides dynamically https://modules.docxtemplater.com/modules/slides/
-	Subtemplater Module to include a document inside an other document https://modules.docxtemplater.com/modules/subtemplate
-	Table module to create beautiful tables https://modules.docxtemplater.com/modules/table

User contributed modules :

-	Chart Module using the syntax: `{$chart}` , user contributed https://github.com/prog666/docxtemplater-chart-module (v2 module)
-	Hyperlink module using the syntax: `{^link}`, https://github.com/sujith3g/docxtemplater-link-module (v2 module)

Professional Support
--------------------

I can give your company support for installing, extending, answering support questions, or maintaining your app that runs docxtemplater. The support plan is paid per month and can be booked from https://plasso.com/s/ycwo8O3hDH
