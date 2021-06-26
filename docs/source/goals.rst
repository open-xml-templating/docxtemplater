..  _goals:

.. index::
   single: Goals

What is docxtemplater ?
=======================

docxtemplater is a mail merging tool that is used programmatically and handles conditions, loops, and can be extended to insert anything (tables, html, images).

docxtemplater uses JSON (Javascript objects) as data input, so it can also be used easily from other languages. It handles docx but also pptx templates.

It works in the same way as a templating engine.


Many solutions like `docx.js`_, `docx4j`_, `python-docx`_  can generate docx, but they require you to write specific code to create a title, an image, ...

In contrast, docxtemplater is based on the concepts of tags, and each type of tag exposes a feature to the user writing the template.

.. _docx.js: https://github.com/MrRio/DOCX.js/
.. _docx4j: https://www.docx4java.org/trac/docx4j
.. _python-docx: https://python-docx.readthedocs.io/en/latest/

Why you shouldn't write a similar library from scratch
------------------------------------------------------

Docx is a zipped format that contains some xml.
If you want to build a simple replace {tag} by value system, it could easily be challenging, because the {tag} is internally separated into:

.. code-block:: text

	<w:t>{</w:t>
	<w:t>tag</w:t>
	<w:t>}</w:t>

The fact that the tags can be splitted into multiple xml tags makes the code challenging to write. I had to rewrite most of the parsing engine between version 2 and version 3 of docxtemplater to make the code more straighforward: See the migration here: https://github.com/open-xml-templating/docxtemplater/commit/59af93bd281932da4586175bb2428d28298d1e65.

If you want to have loops to iterate over an array, it will become even more complicated.

docxtemplater provides a very simple API that gives you abstraction to deal with loops, conditions, and other features.

If you need additional features, you can either build your own module, or use one of the free or paid modules that you can find at https://docxtemplater.com/
