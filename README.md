docxtemplater
=============

[![Build Status](https://travis-ci.org/open-xml-templating/docxtemplater.svg?branch=master&style=flat)](https://travis-ci.org/open-xml-templating/docxtemplater) [![Download count](https://img.shields.io/npm/dm/docxtemplater.svg?style=flat)](https://www.npmjs.org/package/docxtemplater) [![Current tag](https://img.shields.io/npm/v/docxtemplater.svg?style=flat)](https://www.npmjs.org/package/docxtemplater) [![CDNJS version](https://img.shields.io/cdnjs/v/docxtemplater.svg)](https://cdnjs.com/libraries/docxtemplater)

[![Browser matrix](https://saucelabs.com/browser-matrix/jsninja.svg)](https://saucelabs.com/u/jsninja)

![docxtemplater logo](https://raw.githubusercontent.com/open-xml-templating/docxtemplater/master/logo-small.png)

[![Join the chat at https://gitter.im/open-xml-templating/docxtemplater](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/open-xml-templating/docxtemplater?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**docxtemplater** is a library to generate docx/pptx documents from a docx/pptx template. It can replace {placeholders} with data and also supports loops and conditions. The templates can be edited by non-programmers, for example your clients.

Features
--------

[Demo Site](https://docxtemplater.com/demo)

-	<a href="https://docxtemplater.com/demo#simple">Replace a {placeholder} by a value</a>
-	<a href="https://docxtemplater.com/demo#loops">Use loops: {#users} {name} {/users} </a>
-	<a href="https://docxtemplater.com/demo#loop-table">Use loops in tables to generate columns</a>
-	<a href="https://docxtemplater.com/demo#conditions">Use conditions (if users.length>3) with angular Parsing</a>
-	<a href="https://docxtemplater.com/demo#xml-insertion">Insert custom XML {@rawXml} (for formatted text for example)</a>

Quickstart
----------

-	[Installation in node](https://docxtemplater.readthedocs.io/en/latest/installation.html#node)
-	[Installation in the browser](https://docxtemplater.readthedocs.io/en/latest/installation.html#browser)
-	[Generate a document in node](https://docxtemplater.readthedocs.io/en/latest/generate.html#node)
-	[Generate a document in the browser](https://docxtemplater.readthedocs.io/en/latest/generate.html#browser)

Documentation
-------------

The full documentation of the latest version can be found on [read the docs](http://docxtemplater.readthedocs.io/en/latest/).

See [CHANGELOG.md](CHANGELOG.md) for information about how to migrate from older versions.

A user of docxtemplater named Timofey also created a tool to create documents easily :

You can find the tool at : https://ntsdk.github.io/docxtemplater/docxtemplater-en.html , and a screencast showing how it works at https://www.youtube.com/watch?v=uE9By5zEwss

Similar libraries
-----------------

They are a few similar libraries that work with docx, here’s a list of those I know a bit about:

-	[docx4j](https://www.docx4java.org/trac/docx4j) :JAVA, this is probably the biggest docx library out there. They is no built in templating engine, but you can generate your docx yourself programmatically
-	[docx.js](https://github.com/stephen-hardy/DOCX.js): Javascript in the browser, you can create (not modify) your docx from scratch, but only do very simple things such as adding non formatted text
-	[xlsx-templater](https://github.com/optilude/xlsx-template) : its working quite well, does the same as here but for xlsx

Modules
-------

Functionality can be added with modules. Here is the list of existing modules:

Modules developped by docxtemplater core team members :

-	Image module using the syntax: `{%image}`, https://docxtemplater.com/modules/image/
-	Html Module to insert formatted text in a docx document https://docxtemplater.com/modules/html/
-	Slides Module to create multiple slides dynamically https://docxtemplater.com/modules/slides/
-	Subtemplate Module to include a document inside an other document https://docxtemplater.com/modules/subtemplate
-	Word-Run Module to include raw runs (<w:r>) inside the document. This makes it possible to include styled text without having to remove the enclosing paragraph like in the {@rawXml} tag. https://docxtemplater.com/modules/subtemplate
-	QrCode Module to replace an image, keeping any existing properties https://docxtemplater.com/modules/qrcode
-	Error Location Module to show the errors in the template with comments inside the template https://docxtemplater.com/modules/error-location

User contributed modules :

-	Chart Module using the syntax: `{$chart}` , user contributed https://github.com/prog666/docxtemplater-chart-module (compatible with v2 only)
-	Hyperlink module using the syntax: `{^link}`, https://github.com/sujith3g/docxtemplater-link-module (compatible with v2 only)

Professional Support
--------------------

I can give your company support for installing, extending, answering support questions, or maintaining your app that runs docxtemplater. The support plan is paid per month and can be booked from https://plasso.com/s/ycwo8O3hDH
