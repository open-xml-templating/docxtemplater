# docxtemplater

[![Download count](https://img.shields.io/npm/dm/docxtemplater.svg?style=flat)](https://www.npmjs.org/package/docxtemplater) [![Current tag](https://img.shields.io/npm/v/docxtemplater.svg?style=flat)](https://www.npmjs.org/package/docxtemplater) [![CDNJS version](https://img.shields.io/cdnjs/v/docxtemplater.svg)](https://cdnjs.com/libraries/docxtemplater) [![size](http://img.badgesize.io/https://raw.githubusercontent.com/open-xml-templating/docxtemplater-build/master/build/docxtemplater-latest.min.js?label=size&style=flat-square)](https://raw.githubusercontent.com/open-xml-templating/docxtemplater-build/master/build/docxtemplater-latest.min.js) [![gzip size](http://img.badgesize.io/https://raw.githubusercontent.com/open-xml-templating/docxtemplater-build/master/build/docxtemplater-latest.min.js?compression=gzip&label=gzip%20size&style=flat-square)](https://raw.githubusercontent.com/open-xml-templating/docxtemplater-build/master/build/docxtemplater-latest.min.js)

**docxtemplater** is a library to generate docx/pptx documents from a docx/pptx template. It can replace {placeholders} with data and also supports loops and conditions. The templates can be edited by non-programmers, for example your clients.

## Features

[Demo Site](https://docxtemplater.com/demo)

- <a href="https://docxtemplater.com/demo#simple">Replace a {placeholder} by a value</a>
- <a href="https://docxtemplater.com/demo#loops">Use loops: {#users} {name} {/users} </a>
- <a href="https://docxtemplater.com/demo#loop-table">Use loops in tables to generate columns</a>
- <a href="https://docxtemplater.com/demo#conditions">Use conditions (if users.length>3) with angular Parsing</a>
- <a href="https://docxtemplater.com/demo#xml-insertion">Insert custom XML {@rawXml} (for formatted text for example)</a>

## Quickstart

- [Installation in node](https://docxtemplater.com/docs/installation#node)
- [Installation in the browser](https://docxtemplater.com/docs/installation#browser)
- [Generate a document in node](https://docxtemplater.com/docs/generate#node)
- [Generate a document in the browser](https://docxtemplater.com/docs/generate#browser)
- [Generate a document in React, Angular or Vue](https://docxtemplater.com/docs/generate#react-angular-vue)

## Documentation

The full documentation of the latest version can be found [here](https://docxtemplater.com/docs).

See [CHANGELOG.md](CHANGELOG.md) for information about how to migrate from older versions.

## Modules

Functionality can be added with paid modules.

- [Image module](https://docxtemplater.com/modules/image/) to add a given image with the syntax: `{%image}`;
- [Html Module](https://docxtemplater.com/modules/html/) to insert formatted text in a docx document with the syntax `{~html}`;
- [XLSX Module](https://docxtemplater.com/modules/xlsx) to be able to do templating on Excel files (xlsx extension), also with loops and conditions;
- [Chart Module](https://docxtemplater.com/modules/chart/) to replace a chart by using data from the JSON object that you give with the syntax `{$chart};
- [Html-Pptx Module](https://docxtemplater.com/modules/html-pptx/) to insert formatted text in a pptx document with the syntax `{~html}`;
- [Error Location Module](https://docxtemplater.com/modules/error-location) to show the errors in the template with comments inside the template;
- [Slides Module](https://docxtemplater.com/modules/slides/) to create multiple slides dynamically with the syntax `{:users}`;
- [Subtemplate Module](https://docxtemplater.com/modules/subtemplate) to include an external docx file inside a given docx file with the syntax `{:include doc}`;
- [Subsection Module](https://docxtemplater.com/modules/subsection) to include subsections (headers/footers) from an other document with the syntax `{:subsection doc}`;
- [Subtemplate-pptx Module](https://docxtemplater.com/modules/pptx-sub/) to include an external pptx file inside a given pptx file with the syntax `{:include doc}`;
- [Word-Run Module](https://docxtemplater.com/modules/word-run) to include raw runs (<w:r>) inside the document with the syntax `{r@wrun}`. This makes it possible to include styled text without having to remove the enclosing paragraph like in the {@rawXml} tag;
- [QrCode Module](https://docxtemplater.com/modules/qrcode) to replace an image, keeping any existing properties;
- [Table Module](https://docxtemplater.com/modules/table) to create tables from two dimensional data using the syntax `{:table data}`;
- [Meta Module](https://docxtemplater.com/modules/meta) to make a document readonly, add a text watermark or update the margins;
- [Styling Module](https://docxtemplater.com/modules/styling) restyle a paragraph, a cell or a table depending on some data using the syntax `{:stylepar style}`;
- [Footnotes Module](https://docxtemplater.com/modules/footnotes) to be able to add footnotes to a document using the syntax `{:footnotes foot}`
- [Paragraph Placeholder Module](https://docxtemplater.com/modules/paragraph-placeholder) to simplify conditions that should show or hide a given paragraph using the syntax `{?tag}`

## Similar libraries

There are a few similar libraries that work with docx, here’s a list of those I know a bit about:

- [docx4j](https://www.docx4java.org/trac/docx4j) : JAVA, this is probably the biggest docx library out there. There is no built in templating engine, but you can generate your docx yourself programmatically.
- [docx](https://github.com/dolanmiu/docx) : Javascript in the browser, you can create your docx from scratch, but not with template syntax, you need to "code your document" in Javascript.
- [redocx](https://github.com/nitin42/redocx) : Create Docx document from scratch, using JSX syntax, last commit on December 2018.
- [officegen](https://github.com/Ziv-Barber/officegen) : works only server side for the moment.
