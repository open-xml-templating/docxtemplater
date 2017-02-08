.. index::
   single: FAQ

..  _faq:

Frequently asked questions
==========================

Inserting new lines
-------------------

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

Insert HTML formatted text
--------------------------

It is possible to insert HTML formatted text using the `HTML pro module`_


Generate smaller docx using compression
---------------------------------------

The size of the docx output can be big, in the case where you generate the zip the following way:

.. code-block:: javascript

    docx.getZip().generate({ type: "nodebuffer"})

This is because the zip will not be compressed in that case. To force the compression (which could be slow because it is running in JS for files bigger than 10 MB)

.. code-block:: javascript

    var zip = docx.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE"
    });

Writing if else
---------------

To write if/else, see the documentation on `sections`_ for if and `inverted sections`_ for else.

You can also have conditions with operators `>` and `<` using `angular parser conditions`_.

.. _`sections`: tag_types.html#sections
.. _`inverted sections`: tag_types.html#inverted-sections
.. _`angular parser conditions`: angular_parse.html#conditions


Conditional Formatting
----------------------

I plan to develop a pro module to do conditional formatting https://modules.docxtemplater.com/modules/styling/. As a workaround, you could also use the `HTML pro module`_

.. _`HTML pro module`: https://modules.docxtemplater.com/modules/html/

Using data filters
------------------

You might want to be able to show data a bit differently for each template. For this, you can use the angular parser and the filters functionality.

For example, if a user wants to put something in uppercase, you could write in your template :


.. code-block:: text

    { user.name | uppercase }

See `angular parser`_ for comprehensive documentation

.. _`angular parser`: angular_parse.html

Performance
-----------

Docxtemplater is quite fast, for a pretty complex 50 page document, it can generate 250 output of those documents in 44 seconds, which is about 180ms per document

Support for IE9 and lower 
-------------------------

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

Pptx support
------------

Docxtemplater now handles pptx automatically (since version 3.0.4).

It does so by detecting whether they is a file called "/word/document.xml", if there is one, the file is "docx", if not, it is pptx.
