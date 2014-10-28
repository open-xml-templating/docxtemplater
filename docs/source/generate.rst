..  _generate:

.. index::
   single: Generate a Document

Generate a document
===================

Here's a sample code to generate a document:


.. code-block:: javascript

    //Only for Node Usage
    DocxGen=require('docxtemplater'); 
    content=fs.readFileSync(__dirname+"/input.docx","binary")

    doc=new DocxGen(content);
    doc.setData({
        "first_name":"Hipp",
        "last_name":"Edgar",
        "phone":"0652455478",
        "description":"New Website"
    }) //set the templateVariables
    doc.render() //apply them (replace all occurences of {first_name} by Hipp, ...)
    zip=doc.getZip() //Get the zip representation of the docx

    //Only for Node Usage
    output=doc.getZip().generate({type:"nodebuffer"})
    fs.writeFileSync("output.docx",output)
