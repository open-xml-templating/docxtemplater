..  _platform_support:

.. index::
   single: platform_support

Platform Support
================

docxtemplater works with

- Node.js with 0.10 and 0.11
- Chrome **tested** on version 26
- Firefox 3+ (**tested** on version 21, but should work with 3+)
- Safari **not tested**

Internet explorer is not supported -even IE10- (basically because xhr Requests can't be made on binary files)

You can test if everything works fine on your browser by using the test runner: http://javascript-ninja.fr/docxgenjs/test/SpecRunner.html

Dependencies
============

1. **docxgen.js** uses [jszip.js](http://stuk.github.io/jszip/) to zip and unzip the docx files

2. Optionally, if you want to be able to name the output files, you can use **Downloadify.js**, which is required to use method download. Be informed that it uses flash, this is why the method is not recommended. This method is howewer useful because a lot of browsers are limited for the download size with the Data-URI method. **Update**: I will probably implement in the future a way to use the FileSaver API, with [FileSaverJS](http://eligrey.com/demos/FileSaver.js/)
