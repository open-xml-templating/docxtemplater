..  _goals:

.. index::
   single: Goals

What is docxtemplater ?
=======================

docxtemplater is a mail merging tool that is used programmatically and handles conditions, loops, and can be extended to insert anything (tables, html, images).

docxtemplater uses JSON (Javascript objects) as data input, so it can also be used easily from other languages. It handles docx but also pptx templates.

It works in the same way as a templating engine.

They are a lots of solutions like `docx.js`_, docx4j, ...
that generate docx, but they require you to write specific code to create a title, an image, ...

In contrast, docxtemplater is based on the concepts of tags, and each type of tag exposes a feature to the user writing the template.

.. _docx.js: https://github.com/MrRio/DOCX.js/

Why you shouldn't write it from scratch
---------------------------------------

Docx is a zipped format that contains some xml.
If you want to build a simple replace {tag} by value system, it can become complicated, because the {tag} is internally separated into `<w:t>{</w:t><w:t>tag</w:t><w:t>}</w:t>`.

If you want to have loops to iterate over an array, it will become even more complex. 

docxtemplater provides a very simple API that gives you abstraction to deal with loops, conditions, ...

If you need additional features, you can either build your own module, or use one of the free or paid modules that you can find here : 

* https://github.com/open-xml-templating/docxtemplater-image-module
* https://modules.docxtemplater.com/
