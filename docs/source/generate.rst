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

    // The error object contains additional information when logged with JSON.stringify (it contains a properties object containing all suberrors).
    function replaceErrors(key, value) {
        if (value instanceof Error) {
            return Object.getOwnPropertyNames(value).reduce(function(error, key) {
                error[key] = value[key];
                return error;
            }, {});
        }
        return value;
    }

    function errorHandler(error) {
        console.log(JSON.stringify({error: error}, replaceErrors));

        if (error.properties && error.properties.errors instanceof Array) {
            const errorMessages = error.properties.errors.map(function (error) {
                return error.properties.explanation;
            }).join("\n");
            console.log('errorMessages', errorMessages);
            // errorMessages is a humanly readable message looking like this :
            // 'The tag beginning with "foobar" is unopened'
        }
        throw error;
    }

    //Load the docx file as a binary
    var content = fs
        .readFileSync(path.resolve(__dirname, 'input.docx'), 'binary');

    var zip = new PizZip(content);
    var doc;
    try {
        doc = new Docxtemplater(zip);
    } catch(error) {
        // Catch compilation errors (errors caused by the compilation of the template : misplaced tags)
        errorHandler(error);
    }

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
        // Catch rendering errors (errors relating to the rendering of the template : angularParser throws an error)
        errorHandler(error);
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
        <script src="https://cdnjs.cloudflare.com/ajax/libs/docxtemplater/3.17.9/docxtemplater.js"></script>
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

                // The error object contains additional information when logged with JSON.stringify (it contains a properties object containing all suberrors).
                function replaceErrors(key, value) {
                    if (value instanceof Error) {
                        return Object.getOwnPropertyNames(value).reduce(function(error, key) {
                            error[key] = value[key];
                            return error;
                        }, {});
                    }
                    return value;
                }

                function errorHandler(error) {
                    console.log(JSON.stringify({error: error}, replaceErrors));

                    if (error.properties && error.properties.errors instanceof Array) {
                        const errorMessages = error.properties.errors.map(function (error) {
                            return error.properties.explanation;
                        }).join("\n");
                        console.log('errorMessages', errorMessages);
                        // errorMessages is a humanly readable message looking like this :
                        // 'The tag beginning with "foobar" is unopened'
                    }
                    throw error;
                }

                var zip = new PizZip(content);
                var doc;
                try {
                    doc=new window.docxtemplater(zip);
                } catch(error) {
                    // Catch compilation errors (errors caused by the compilation of the template : misplaced tags)
                    errorHandler(error);
                }

                doc.setData({
                    first_name: 'John',
                    last_name: 'Doe',
                    phone: '0652455478',
                    description: 'New Website'
                });
                try {
                    // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
                    doc.render();
                }
                catch (error) {
                    // Catch rendering errors (errors relating to the rendering of the template : angularParser throws an error)
                    errorHandler(error);
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

It is also possible to read the docx from an `<input type="file" id="doc">`, by using the following :

.. code-block:: javascript

    var docs = document.getElementById('doc');
    function generate() {
        var reader = new FileReader();
        if (docs.files.length === 0) {
            alert("No files selected")
        }
        reader.readAsBinaryString(docs.files.item(0));

        reader.onerror = function (evt) {
            console.log("error reading file", evt);
            alert("error reading file" + evt)
        }
        reader.onload = function (evt) {
            const content = evt.target.result;
            var zip = new PizZip(content);
            // Same code as in the main HTML example.
        }
    }

