..  _platform_support:

.. index::
   single: platform_support

Platform Support
================

docxtemplater works on most modern platforms, and also some older ones. Here is a list of what is tested regularly :

- Node.js versions 6, 7, 8, 9, 10, 11, 12 and all future versions (older versions will also work, but support has ended)
- Chrome version 58,71,73
- Firefox 55,60,66
- Safari 11,12
- IE10, IE11, Edge 16-18
- Android 4.2+
- iPads and iPhones v8.1, 10.3

You can test if everything works fine on your browser by using the test runner: http://javascript-ninja.fr/docxtemplater/v3/test/mocha.html

Dependencies
------------

1. `PizZip`_  to zip and unzip the docx files
2. `xmldom`_  to parse the files as xml

.. _`PizZip`: https://github.com/open-xml-templating/pizzip
.. _`xmldom`: https://github.com/jindw/xmldom
