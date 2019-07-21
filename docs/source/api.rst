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

        You have to pass a zip instance to that method, coming from pizzip or jszip version 2

    setData(Tags)

        Tags:
            Type: Object {tag_name:tag_replacement}
            Object containing for each tag_name, the replacement for this tag. For example, if you want to replace firstName by David, your Object will be: {"firstName":"David"}

    render()

        This function replaces all template variables by their values

    getZip()

        This will return you the zip that represents the docx. You can then call `.generate` on this to generate a buffer, string , ... (see https://github.com/open-xml-templating/pizzip/blob/master/documentation/api_pizzip/generate.md)

    attachModule(module)

        This will attach a module to the docxtemplater instance, which is usually used to add new generation features (possibility to include images, HTML, ...). Pro modules can be bought on https://docxtemplater.com/

        This method can be called multiple times, for example : `doc.loadZip(zip).attachModule(imageModule).attachModule(htmlModule)`
