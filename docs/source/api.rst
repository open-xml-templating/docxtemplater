..  _api:

.. index::
   single: API

API
===

Constructor
-----------

.. code-block:: text

    new Docxtemplater()

        This function returns a new Docxtemplater Object


Methods
-------

.. code-block:: text

    loadZip(zip)

        You have to pass a zip instance to that method, coming from jszip version 3

    setData(Tags)

        Tags:
            Type: Object {tag_name:tag_replacement}
            Object containing for each tag_name, the replacement for this tag. For example, if you want to replace firstName by David, your Object will be: {"firstName":"David"}

    render()

        This function replaces all template variables by their values and returns a Promise

    getZip()

        This will return you the zip that represents the docx. You can then call `.generateAsync` on this to generate a buffer, string , ... (see https://github.com/Stuk/jszip/blob/master/documentation/api_jszip/generate_async.md)
