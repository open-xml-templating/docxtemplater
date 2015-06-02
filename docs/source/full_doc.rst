..  _full_doc

.. index::
   single: Full_doc

Full Documentation per method
=============================

Creating a new Docxgen Object
-----------------------------

.. code-block:: javascript

    new DocxGen()

        This function returns a new DocxGen Object

    new DocxGen(content,options)

        if content is defined, it will call `.load(content,options)`


Docxgen methods
---------------

.. code-block:: javascript

    load(content,options)

        This will call new JSzip().load(content,options) under the hood. See http://stuk.github.io/jszip/documentation/api_jszip/load.html
        You can also pass a JSzip object as the first argument.

    setData(Tags)

        Tags:
            Type: Object {tag_name:tag_replacement}
            Object containing for each tag_name, the replacement for this tag. For example, if you want to replace firstName by David, your Object will be: {"firstName":"David"}

    render()

        This function replaces all template variables by their values

    getZip()

        This will return you the zip that represents the docx. You can then call `.generate` on this to generate a buffer, string , ... (see http://stuk.github.io/jszip/documentation/api_jszip/generate.html)

    getFullText:([path])

        path
            Type:"String"
            Default:"word/document.xml"
            This argument determines from which document you want to get the text. The main document is called word/document.xml, but they are other documents: "word/header1.xml", "word/footer1.xml"

        @returns
            Type:"String"
            The string containing all the text from the document

        This method gets only the text of a given document (not the formatting)

    getTags()

        This function returns the template variables contained in the opened document. For example if the content of the document.xml is the following:

            {name}
            {first_name}
            {phone}

        The function will return:
            [{
                filename:"document.xml",
                vars:
                {
                    name:true,
                    first_name:true,
                    phone:true
                }
            }]

        If the content contains tagLoops:

            {title}
            {#customer}
            {name}
            {phone}
            {/customer}


        The function will return:

            [{
                filename:"document.xml",
                vars:
                {
                    title:true,
                    customer:
                    {
                        name:true,
                        phone:true
                    }
                }
            }]
