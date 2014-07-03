..  _generate:

.. index::
   single: Generate a Document

Generate a document
===================

Here's a sample code to generate a document:


.. code-block:: javascript

    DocxGen=require('docxtemplater'); //Only for Node Usage
    new DocxGen().loadFromFile("tagExample.docx",{async:true}).success(function(doc){
	    doc.setTags({
            "first_name":"Hipp",
		    "last_name":"Edgar",
		    "phone":"0652455478",
		    "description":"New Website"
		}) //set the templateVariables
	    doc.applyTags() //apply them (replace all occurences of {first_name} by Hipp, ...)
	    doc.output() //Output the document using Data-URI
    });


The different steps are the following:

Loading a document:
-------------------

A docx can be loaded by it's base64 representation, like this:

.. code-block:: javascript

    doc=new DocxGen(base64Data,options);

However, loading the base64Data is not that easy, so I created a wrapper function to load a docx from a file via Ajax.


.. note::

    The options parameter are explained in :ref:`configuration`


.. code-block:: javascript

    doc=new DocxGen().loadFromFile(documentPath,options);

The documentPath is the path to the document you want to load.
The options are the same as in the constructor function, and I've added the async parameter.

 - If async is true, the document is loaded asynchronously and returns a promise (eg you can write .success(callback) to get when the document is loaded)
 - If async is false, the document is loaded synchronously and returns the document.


Setting the tags:
-----------------

The tags are the variables that are going to be replaced by their values.
To set them, just use:

.. code-block:: javascript

    doc.setTags(tags);


Applying the tags:
------------------

Applying the tags means opening all files that contain text (eg: footer, header, main document), and replace the variables by their values.


.. code-block:: javascript

    doc.applyTags(tags)

.. note::

    If you specify an argument for the applyTags method, the function setTags(tags) will be called before applying the tags.

Outputing the document:
-----------------------

They are several ways to output the document. The most basic usage is to download the document.

.. code-block:: javascript

	doc.output(options)

Depending on your environment, if you don't set any options, this will:

 - In the browser: Download the document using DataURI
 - In Node: Save the document with the given fileName (output.docx by default)


Here's the different options parameters:

.. code-block:: javascript

    name:
        Type:string["output.docx"]
        The name of the file that will be outputed (doesnt work in the browser because of dataUri download)

    callback:
       Type:function
       Function that is called without arguments when the output is done. Is used only in Node (because in the browser, the operation is synchronous)

    download:
        Type:boolean[true]
        If download is true, file will be downloaded automatically with data URI.
        returns the output file.

    type:
        Type:string["base64"]
        The type of zip to return. The possible values are : (same as in http://stuk.github.io/jszip/ @generate)
        base64 (default) : the result will be a string, the binary in a base64 form.
        string : the result will be a string in "binary" form, 1 byte per char.
        uint8array : the result will be a Uint8Array containing the zip. This requires a compatible browser.
        arraybuffer : the result will be a ArrayBuffer containing the zip. This requires a compatible browser.
        blob : the result will be a Blob containing the zip. This requires a compatible browser.
        nodebuffer : the result will be a nodejs Buffer containing the zip. This requires nodejs.


This function creates the docx file and downloads it on the user's computer. The name of the file is download.docx for Chrome, and some akward file names for Firefox: VEeTHCfS.docx.part.docx, and can't be changed because it is handled by the browser.
For more informations about how to solve this problem, see the **Filename Problems** section on [http://stuk.github.io/jszip/](http://stuk.github.io/jszip/)

.. note::

    Note: All browsers don't support the download of big files with Data URI, so you **should** use the `download` method for files bigger than 100kB data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAIAAABvSEP3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACXSURBVDhPtY7BDYAwDAMZhCf7b8YMxeCoatOQJhWc/KGxT2zlCyaWcz8Y+X7Bs1TFVJSwIHIYyFkQufWIRVX9cNJyW1QpEo4rixaEe7JuQagAUctb7ZFYFh5MVJPBe84CVBnB42//YsZRgKjFDBVg3cI9WbRwXLktQJX8cNIiFhM1ZuTWk7PIYSBhkVcLzwIiCjCxhCjlAkBqYnqFoQQ2AAAAAElFTkSuQmCC

In Node, to send the document to the client, you can write the following code snippet:

.. code-block:: javascript

    out=doc.output({download:false,type:"string"})
    res.send(new Buffer(out,"binary"));


