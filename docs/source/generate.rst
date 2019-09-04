..  _generate:

.. index::
   single: Generate a Document

Generate a document
===================

.. _`Installation`: installation.html

Node
----

.. code-block:: javascript

    var PizZip = require('pizzip');
    var Docxtemplater = require('docxtemplater');

    var fs = require('fs');
    var path = require('path');

    //Load the docx file as a binary
    var content = fs
        .readFileSync(path.resolve(__dirname, 'input.docx'), 'binary');

    var zip = new PizZip(content);

    var doc = new Docxtemplater();
    doc.loadZip(zip);

    //set the templateVariables
    doc.setData({
        first_name: 'John',
        last_name: 'Doe',
        phone: '0652455478',
        description: 'New Website'
    });

    try {
        // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        doc.render()
    }
    catch (error) {
        var e = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties,
        }
        console.log(JSON.stringify({error: e}));
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
        throw error;
    }

    var buf = doc.getZip()
                 .generate({type: 'nodebuffer'});

    // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
    fs.writeFileSync(path.resolve(__dirname, 'output.docx'), buf);

You can download `input.docx`_ and put it in the same folder than your JS file.

.. _`input.docx`: https://github.com/open-xml-templating/docxtemplater/raw/master/examples/tag-example.docx

Browser
-------

.. code-block:: html

    <html>
        <body>
            <button onclick="generate()">Generate document</button>
        </body>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/docxtemplater/3.14.0/docxtemplater.js"></script>
        <script src="https://unpkg.com/pizzip@3.0.6/dist/pizzip.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.js"></script>
        <script src="https://unpkg.com/pizzip@3.0.6/dist/pizzip-utils.js"></script>
        <!--
        Mandatory in IE 6, 7, 8 and 9.
        -->
        <!--[if IE]>
            <script type="text/javascript" src="https://unpkg.com/pizzip@3.0.6/dist/pizzip-utils-ie.js"></script>
        <![endif]-->
        <script>
        function loadFile(url,callback){
            PizZipUtils.getBinaryContent(url,callback);
        }
        function generate() {
            loadFile("https://docxtemplater.com/tag-example.docx",function(error,content){
                if (error) { throw error };
                var zip = new PizZip(content);
                var doc=new window.docxtemplater().loadZip(zip)
                doc.setData({
                    first_name: 'John',
                    last_name: 'Doe',
                    phone: '0652455478',
                    description: 'New Website'
                });
                try {
                    // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
                    doc.render()
                }
                catch (error) {
                    var e = {
                        message: error.message,
                        name: error.name,
                        stack: error.stack,
                        properties: error.properties,
                    }
                    console.log(JSON.stringify({error: e}));
                    // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
                    throw error;
                }
                var out=doc.getZip().generate({
                    type:"blob",
                    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                }) //Output the document using Data-URI
                saveAs(out,"output.docx")
            })
        }
        </script>
    </html>

Please note that if you want to load a docx from your filesystem, you will need a webserver or you will be blocked by CORS policy.

:ref:`cors`
