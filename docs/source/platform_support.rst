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

Firefox has an other implementation of the xml parser, that's why all tests don't pass now.
However, all of the functionality works on Firefox too.
The output files are not exactly the same byte wise but the generated XML is correct.

Dependencies
============

1. **docxgen.js** uses [jszip.js](http://stuk.github.io/jszip/) to zip and unzip the docx files

2. Optionally, if you want to be able to name the output files, you can use **Downloadify.js**, which is required to use method download. Be informed that it uses flash, this is why the method is not recommended. This method is howewer useful because a lot of browsers are limited for the download size with the Data-URI method. **Update**: I will probably implement in the future a way to use the FileSaver API, with [FileSaverJS](http://eligrey.com/demos/FileSaver.js/)

3. Optionnaly, if you want to replace images by images situated at a particular URL, you can use QR codes. For example If you store an image at http://website.com/image.png , you should encode the URL in QR-Code format. ![Qr Code Sample](http://qrfree.kaywa.com/?l=1&s=8&d=http%3A%2F%2Fwebsite.com%2Fimage.png "Qrcode Sample to http://website.com/image.png"). You can even use bracket tags in images. http://website.com/image.png?color={color} will take the *Tags[color]* variable to make a dynamic URL. For this too work, you will need [jsqrcode](http://github.com/edi9999/jsqrcode "jsqrcode repositoty forked") and include the following files, in this order (only for browser support, node support already comes out of the box):


.. code-block:: javascript

    <script type="text/javascript" src="grid.js"></script>
    <script type="text/javascript" src="version.js"></script>
    <script type="text/javascript" src="detector.js"></script>
    <script type="text/javascript" src="formatinf.js"></script>
    <script type="text/javascript" src="errorlevel.js"></script>
    <script type="text/javascript" src="bitmat.js"></script>
    <script type="text/javascript" src="datablock.js"></script>
    <script type="text/javascript" src="bmparser.js"></script>
    <script type="text/javascript" src="datamask.js"></script>
    <script type="text/javascript" src="rsdecoder.js"></script>
    <script type="text/javascript" src="gf256poly.js"></script>
    <script type="text/javascript" src="gf256.js"></script>
    <script type="text/javascript" src="decoder.js"></script>
    <script type="text/javascript" src="qrcode.js"></script>
    <script type="text/javascript" src="findpat.js"></script>
    <script type="text/javascript" src="alignpat.js"></script>
    <script type="text/javascript" src="databr.js"></script>
