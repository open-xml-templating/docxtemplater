# docxtemplater

[![Build Status](https://travis-ci.org/open-xml-templating/docxtemplater.svg?branch=master&style=flat)](https://travis-ci.org/open-xml-templating/docxtemplater) [![Download count](https://img.shields.io/npm/dm/docxtemplater.svg?style=flat)](https://www.npmjs.org/package/docxtemplater) [![Current tag](https://img.shields.io/npm/v/docxtemplater.svg?style=flat)](https://www.npmjs.org/package/docxtemplater) [![CDNJS version](https://img.shields.io/cdnjs/v/docxtemplater.svg)](https://cdnjs.com/libraries/docxtemplater) [![size](http://img.badgesize.io/https://raw.githubusercontent.com/open-xml-templating/docxtemplater-build/master/build/docxtemplater-latest.min.js?label=size&style=flat-square)](https://raw.githubusercontent.com/open-xml-templating/docxtemplater-build/master/build/docxtemplater-latest.min.js) [![gzip size](http://img.badgesize.io/https://raw.githubusercontent.com/open-xml-templating/docxtemplater-build/master/build/docxtemplater-latest.min.js?compression=gzip&label=gzip%20size&style=flat-square)](https://raw.githubusercontent.com/open-xml-templating/docxtemplater-build/master/build/docxtemplater-latest.min.js)

[![Browser matrix](https://saucelabs.com/browser-matrix/jsninja.svg)](https://saucelabs.com/u/jsninja)

[![docxtemplater logo](https://raw.githubusercontent.com/open-xml-templating/docxtemplater/master/logo-small.png)](https://docxtemplater.com/)

**docxtemplater** is a library to generate docx/pptx documents from a docx/pptx template. It can replace {placeholders} with data and also supports loops and conditions. The templates can be edited by non-programmers, for example your clients.

## Features

[Demo Site](https://docxtemplater.com/demo)

- <a href="https://docxtemplater.com/demo#simple">Replace a {placeholder} by a value</a>
- <a href="https://docxtemplater.com/demo#loops">Use loops: {#users} {name} {/users} </a>
- <a href="https://docxtemplater.com/demo#loop-table">Use loops in tables to generate columns</a>
- <a href="https://docxtemplater.com/demo#conditions">Use conditions (if users.length>3) with angular Parsing</a>
- <a href="https://docxtemplater.com/demo#xml-insertion">Insert custom XML {@rawXml} (for formatted text for example)</a>

## Quickstart

- [Installation in node](https://docxtemplater.readthedocs.io/en/latest/installation.html#node)
- [Installation in the browser](https://docxtemplater.readthedocs.io/en/latest/installation.html#browser)
- [Generate a document in node](https://docxtemplater.readthedocs.io/en/latest/generate.html#node)
- [Generate a document in the browser](https://docxtemplater.readthedocs.io/en/latest/generate.html#browser)

## Documentation

The full documentation of the latest version can be found on [read the docs](http://docxtemplater.readthedocs.io/en/latest/).

See [CHANGELOG.md](CHANGELOG.md) for information about how to migrate from older versions.

## Similar libraries

There are a few similar libraries that work with docx, here’s a list of those I know a bit about:

- [docx4j](https://www.docx4java.org/trac/docx4j) : JAVA, this is probably the biggest docx library out there. There is no built in templating engine, but you can generate your docx yourself programmatically.
- [docx.js](https://github.com/stephen-hardy/DOCX.js) : Javascript in the browser, you can create (not modify) your docx from scratch, but only do very simple things such as adding non formatted text. Documentation is missing.
- [redocx](https://github.com/nitin42/redocx) : Create Docx document from scratch, using JSX syntax, last commit on December 2018.
- [officegen](https://github.com/Ziv-Barber/officegen) : works only server side for the moment.

## Modules

Functionality can be added with modules. Here is the list of existing modules:

PRO Modules developped by docxtemplater core team :

- [Image module](https://docxtemplater.com/modules/image/) to add a given image with the syntax: `{%image}`.
- [Html Module](https://docxtemplater.com/modules/html/) to insert formatted text in a docx document.
- [Html-Pptx Module](https://docxtemplater.com/modules/html-pptx/) to insert formatted text in a pptx document.
- [Slides Module](https://docxtemplater.com/modules/slides/) to create multiple slides dynamically.
- [Subtemplate Module](https://docxtemplater.com/modules/subtemplate) to include an external docx file inside a given docx file.
- [Subsection Module](https://docxtemplater.com/modules/subsection) to include subsections (headers/footers) from an other document.
- [Subtemplate-pptx Module](https://docxtemplater.com/modules/pptx-sub/) to include an external pptx file inside a given pptx file.
- [Word-Run Module](https://docxtemplater.com/modules/word-run) to include raw runs (<w:r>) inside the document. This makes it possible to include styled text without having to remove the enclosing paragraph like in the {@rawXml} tag.
- [QrCode Module](https://docxtemplater.com/modules/qrcode) to replace an image, keeping any existing properties.
- [Error Location Module](https://docxtemplater.com/modules/error-location) to show the errors in the template with comments inside the template.
- [Table Module](https://docxtemplater.com/modules/table) to create tables from two dimensional data.
- [Meta Module](https://docxtemplater.com/modules/meta) to make a document readonly, add a text watermark or update the margins.
- [Styling Module](https://docxtemplater.com/modules/styling) restyle a paragraph, a cell or a table depending on some data.
- [XLSX Module](https://docxtemplater.com/modules/xlsx) to be able to do templating on Excel files (xlsx extension), also with loops and conditions.
- [Footnotes Module](https://docxtemplater.com/modules/footnotes) to be able to add footnotes to a document.
- [Paragraph Placeholder Module](https://docxtemplater.com/modules/paragraph-placeholder) to simplify conditions that should show or hide a given paragraph.

User-contributed modules :

- [Chart Module](https://github.com/prog666/docxtemplater-chart-module) using the syntax: `{$chart}` , user contributed (compatible with v2 only)
- [Hyperlink module](https://github.com/sujith3g/docxtemplater-link-module) using the syntax: `{^link}`, (compatible with v2 only)
