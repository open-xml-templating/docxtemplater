..  _generate:

.. index::
   single: Generate a Document

Generate a document
===================

Here's a sample code to generate a document:


.. code-block:: javascript

    fs=require(‘fs’)
    Docxtemplater = require('docxtemplater');

    //Load the docx file as a binary
    content = fs
        .readFileSync(__dirname+"/input.docx","binary")

    doc=new Docxtemplater(content);

    //set the templateVariables
    doc.setData({
        "first_name":"Hipp",
        "last_name":"Edgar",
        "phone":"0652455478",
        "description":"New Website"
    });

    //apply them (replace all occurences of {first_name} by Hipp, ...)
    doc.render();

    var buf = doc.getZip()
                 .generate({type:"nodebuffer"});

    fs.writeFileSync(__dirname+"/output.docx",buf);
