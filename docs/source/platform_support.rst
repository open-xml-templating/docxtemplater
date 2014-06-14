..  _browser_support:

.. index::
   single: Browser Support

Browser Support
===============

docxtemplater works with

- Node.js with 0.10 and 0.11
- Chrome **tested** on version 26
- Firefox 3+ (**tested** on version 21, but should work with 3+)
- Safari **not tested**

Internet explorer is not supported -even IE10- (basically because xhr Requests can't be made on binary files)

You can test if everything works fine on your browser by using the test runner: http://javascript-ninja.fr/docxgenjs/test/SpecRunner.html

Firefox has an other implementation of the xml parser, that's why all tests don't pass now.
However, all of the functionality works on Firefox too.
The output files are not exactly the same byte wise but the generated XML is correct.
