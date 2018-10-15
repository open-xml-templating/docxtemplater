.. index::
   single: FAQ

..  _faq:

Frequently asked questions
==========================

Inserting new lines
-------------------

.. code-block:: javascript

    doc.setOptions({linebreaks: true})

then in your data, if a string contains a newline, it will be translated to a linebreak in the document.

Insert HTML formatted text
--------------------------

It is possible to insert HTML formatted text using the `HTML pro module`_

.. _`HTML pro module`: https://docxtemplater.com/modules/html/


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

https://stuk.github.io/jszip/documentation/howto/read_zip.html

The following code should load the binary content on all browsers:

.. code-block:: javascript

    JSZipUtils.getBinaryContent('path/to/content.zip', function(err, data) {
      if(err) {
        throw err; // or handle err
      }

      var zip = new JSZip(data);
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
    doc.render(); // doc.compile can also be used to avoid having runtime errors
    var tags = iModule.getAllTags();
    console.log(tags);

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

You can also get a more detailled tree by using : 

.. code-block:: javascript

    console.log(iModule.fullInspected["word/document.xml"]);

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

My document is corrupted, what should I do ?
--------------------------------------------

If you are inserting multiple images inside a loop, it is possible that word cannot handle the docPr attributes correctly. You can try to add the following code instead of your `doc.render` call : 

.. code-block:: javascript

    const str2xml = Docxtemplater.DocUtils.str2xml;
    const xml2str = Docxtemplater.DocUtils.xml2str;
    doc.render();
    const zip = doc.getZip();
    let prId = 1;
    zip.file(/\.xml$/).forEach(function (f) {
        const xml = str2xml(f.asText());
        const nodes = xml.childNodes[0];
        const pr = xml.getElementsByTagName("wp:docPr");
        for (var i = 0, len = pr.length; i < len; i++) {
            pr[i].setAttribute("id", prId++);
        }
        const text = xml2str(xml);
        zip.file(f.name, text);
    });

Attaching modules for extra functionality
-----------------------------------------

If you have created or have access to docxtemplater PRO modules, you can attach them with the following code : 


.. code-block:: javascript

    var doc = new Docxtemplater();
    doc.loadZip(zip);

    // You can call attachModule for each modules you wish to include
    doc.attachModule(imageModule)
    doc.attachModule(htmlModule)

    //set the templateVariables
    doc.setData(data);
