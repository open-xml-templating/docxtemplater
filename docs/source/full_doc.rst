..  _full_doc

.. index::
   single: Full_doc

Full Documentation per method
=============================

Creating a new Docxtemplater Object
-----------------------------

.. code-block:: javascript

    new Docxtemplater()

        This function returns a new Docxtemplater Object


Docxtemplater methods
---------------

.. code-block:: javascript

    loadZip(zip)

        You have to pass a zip instance to that method, coming from jszip.

    setData(Tags)

        Tags:
            Type: Object {tag_name:tag_replacement}
            Object containing for each tag_name, the replacement for this tag. For example, if you want to replace firstName by David, your Object will be: {"firstName":"David"}

    render()

        This function replaces all template variables by their values

    getZip()

        This will return you the zip that represents the docx. You can then call `.generate` on this to generate a buffer, string , ... (see https://stuk.github.io/jszip/documentation/api_jszip/generate.html)
