..  _generate:

.. index::
   single: Generate a Document

Generate a document
===================

.. note::

    Before starting, please make sure to use jszip version 3.x (see `Installation`_), the only compatible version.

.. _`Installation`: installation.html

Node
----

.. code-block:: javascript

    var JSZip = require('jszip');
    var Docxtemplater = require('docxtemplater');

    var fs = require('fs');
    var path = require('path');

    //Load the docx file as a binary
    var content = fs
        .readFileSync(path.resolve(__dirname, 'input.docx'), 'binary');

    JSZip.loadAsync(content).then(function (zip) {
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
            doc.render().then(function () {
                doc.getZip()
                    .generateAsync({type: 'nodebuffer'}).then(function (buf) {
                        // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
                        fs.writeFileSync(path.resolve(__dirname, 'output.docx'), buf);
                    });
            });
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
    });

You can download `input.docx`_ and put it in the same folder than your JS file.

.. _`input.docx`: https://github.com/open-xml-templating/docxtemplater/raw/master/examples/tag-example.docx

Browser
-------

.. code-block:: html

    <html>
        <script src="docxtemplater.js"></script>
        <script src="jszip.js"></script>
        <script src="vendor/file-saver.min.js"></script>
        <script src="vendor/jszip-utils.js"></script>
        <!--
        Mandatory in IE 6, 7, 8 and 9.
        -->
        <!--[if IE]>
            <script type="text/javascript" src="examples/vendor/jszip-utils-ie.js"></script>
        <![endif]-->
        <script>
        function loadFile(url,callback){
            JSZipUtils.getBinaryContent(url,callback);
        }
        loadFile("examples/tag-example.docx",function(error,content){
            if (error) { throw error };
            JSZip.loadAsync(content).then(function (zip) {
                var doc=new Docxtemplater().loadZip(zip)
                doc.setData({
                    first_name: 'John',
                    last_name: 'Doe',
                    phone: '0652455478',
                    description: 'New Website'
                });

                try {
                    // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
                    doc.render().then(function () {
                        doc.getZip().generateAsync({
                            type:"blob",
                            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        }).then(function (out) { //Output the document using Data-URI
                            saveAs(out,"output.docx");
                        });
                    });
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
            });
        })
        </script>
    </html>
