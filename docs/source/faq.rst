.. index::
   single: FAQ

..  _faq:

Frequently asked questions
==========================

How to make docxtemplater work with IE9
---------------------------------------

docxtemplater should work on almost all browsers as of version 1 : IE7 + . Safari, Chrome, Opera, Firefox.

The only 'problem' is to load the binary file into the browser. This is not in docxtemplater's scope, but here is the code that jszip's creator recommends to use to load the zip from the browser:

https://stuk.github.io/jszip/documentation/howto/read_zip.html

The following code should load the binary content on all browsers:

.. code-block:: javascript

    JSZipUtils.getBinaryContent('path/to/content.zip', function(err, data) {
      if(err) {
        throw err; // or handle err
      }

      var zip = new JSZip(data);
    });

How to insert linebreaks
------------------------

.. code-block:: javascript

    pre = '<w:p><w:r><w:t>';
    post = '</w:t></w:r></w:p>';
    lineBreak = '<w:br/>';
    text = pre + 'testing line 1' + lineBreak + 'testing line 2' + post;
    data = {text : text}
    docx.setData(data)

then in your template, just put {@text} instead of the usual {text}

If you use the angular-parser, you can also write a filter like this:

.. code-block:: javascript

    angularexpressions.filters.raw = function (text) {
        var lines = text.split("\n");
        var pre = "<w:p><w:r><w:t>";
        var post = "</w:t></w:r></w:p>";
        var lineBreak = "<w:br/>";
        return pre + lines.join(lineBreak) + post;
    }

and then have your docx as : {@text|raw}

with

.. code-block:: javascript

    data = {text: "testing line 1 \n testing line 2"};
    docx.setData(data)

Smaller docx output using compression
-------------------------------------

The size of the docx output can be big, in the case where you generate the zip the following way:

.. code-block:: javascript

    docx.getZip().generate({ type: "nodebuffer"})

This is because the zip will not be compressed in that case. To force the compression (which could be slow because it is running in JS for files bigger than 10 MB)

.. code-block:: javascript

    var zip = docx.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE"
    });
