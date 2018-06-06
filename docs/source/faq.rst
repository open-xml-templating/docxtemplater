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
    data = {text: "testing line 1 \n testing line 2"};
    docx.setData(data)


and then have your docx as : {@text|raw}

Insert HTML formatted text
--------------------------

It is possible to insert HTML formatted text using the `HTML pro module`_

.. _`HTML pro module`: https://docxtemplater.com/modules/html/


Generate smaller docx using compression
---------------------------------------

The size of the docx output can be big, in the case where you generate the zip the following way:

.. code-block:: javascript

    docx.getZip().generateAsync({ type: "nodebuffer"})

This is because the zip will not be compressed in that case. To force the compression (which could be slow because it is running in JS for files bigger than 10 MB)

.. code-block:: javascript

    docx.getZip().generateAsync({
            type: "nodebuffer",
            compression: "DEFLATE"
    }).then(function(zip) { ... });

Writing if else
---------------

To write if/else, see the documentation on `sections`_ for if and `inverted sections`_ for else.

You can also have conditions with operators `>` and `<` using `angular parser conditions`_.

.. _`sections`: tag_types.html#sections
.. _`inverted sections`: tag_types.html#inverted-sections
.. _`angular parser conditions`: angular_parse.html#conditions


Conditional Formatting
----------------------

With the `PRO styling module`_ it is possible to have a table cell be styled depending on a given condition (for example).

.. _`PRO styling module`: https://docxtemplater.com/modules/styling/. 

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

Docxtemplater is quite fast, for a pretty complex 50 page document, it can generate 250 output of those documents in 44 seconds, which is about 180ms per document.

There is also an interesting blog article https://javascript-ninja.fr/ at https://javascript-ninja.fr/optimizing-speed-in-node-js/ that explains how I optimized loops in docxtemplater.

Support for IE9 and lower 
-------------------------

docxtemplater should work on almost all browsers as of version 1 : IE7 + . Safari, Chrome, Opera, Firefox.

The only 'problem' is to load the binary file into the browser. This is not in docxtemplater's scope, but here is the code that jszip's creator recommends to use to load the zip from the browser:

https://github.com/Stuk/jszip/blob/master/documentation/howto/read_zip.md

The following code should load the binary content on all browsers:

.. code-block:: javascript

    JSZipUtils.getBinaryContent('path/to/content.zip', function(err, data) {
      if(err) {
        throw err; // or handle err
      }

      JSZip.loadAsync(data).then(function (zip) {
        // ...
      });
    });

Get list of placeholders
-------------------------

To be able to construct a form dynamically or to validate the document
beforehand, it can be useful to get access to all placeholders defined in a
given template.  Before rendering a document, docxtemplater parses the Word
document into a compiled form.  In this compiled form, the document is stored
in an `AST`_ which contains all the necessary information to get the list of
the variables and list them in a JSON object.

With the simple inspection module, it is possible to get this compiled form and
show the list of tags.
suite : 

.. _`AST`: https://en.wikipedia.org/wiki/Abstract_syntax_tree

.. code-block:: javascript

    var InspectModule = require("docxtemplater/js/inspect-module");
    var iModule = InspectModule();
    doc.attachModule(iModule);
    doc.render().then(function() { // doc.compile can also be used to avoid having runtime errors
      var tags = iModule.getAllTags();
      console.log(tags);
    });

With the following template : 

.. code-block:: text

    {company}

    {#users}
    {name}
    {age}
    {/users}

It will log this object :

.. code-block:: json

    {
        "company": {},
        "users": {
            "name": {},
            "age": {},
        },
    }

The code of the inspect-module is very simple, and can be found here : https://github.com/open-xml-templating/docxtemplater/blob/master/es6/inspect-module.js

Convert to PDF
--------------

It is not possible to convert docx to PDF with docxtemplater, because docxtemplater is a templating engine and doesn't know how to render a given document. There are many
tools to do this conversion.

The first one is to use `libreoffice headless`, which permits you to generate a
PDF from a docx document :

You just have to run :

.. code-block:: bash

   libreoffice --headless --convert-to pdf --outdir . input.docx

This will convert the input.docx file into input.pdf file.

The rendering is not 100% perfect, since it uses libreoffice and not microsoft
word.  If you just want to render some preview of a docx, I think this is a
possible choice.  You can do it from within your application by executing a
process, it is not the most beautiful solution but it works.

If you want something that does the rendering better, I think you should use
some specialized software. `PDFtron`_ is one of them, I haven't used it myself,
but I know that some of the users of docxtemplater use it. (I'm not affiliated to PDFtron in any way).

.. _`PDFtron`: https://www.pdftron.com/pdfnet/addons.html

Pptx support
------------

Docxtemplater handles pptx files without any special configuration (since version 3.0.4).

It does so by detecting whether there is a file called "/word/document.xml", if there is one, the file is "docx", if not, it is pptx.
