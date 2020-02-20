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

.. code-block:: text

    new Docxtemplater(zip, options)

        You have to pass a valid zip file to use this constructor. You can pass an array of modules that are needed by templater to attach them at the time of instantiating.

            zip:
                a zip instance to that method, coming from pizzip or jszip version 2.

            options: (optional)
                Currently, It supports the ability to add modules. You can attach modules by calling the Docxtemplater like this
                const doc = new Docxtemplater(zip, { modules: [exampleModule, otherModule] })
                
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

    compile()

        This function parses the template to prepare for the rendering. If your template has some issues in the syntax (for example if your tag is never closed like in : `Hello {user`), this function will throw an error with extra properties describing the error. This function is called for you in render() if you didn't call it yourself. This function should be called before doing resolveData() if you have some async data.

    getZip()

        This will return you the zip that represents the docx. You can then call `.generate` on this to generate a buffer, string , ... (see https://github.com/open-xml-templating/pizzip/blob/master/documentation/api_pizzip/generate.md)

    attachModule(module)

        This will attach a module to the docxtemplater instance, which is usually used to add new generation features (possibility to include images, HTML, ...). Pro modules can be bought on https://docxtemplater.com/

        This method can be called multiple times, for example : `doc.loadZip(zip).attachModule(imageModule).attachModule(htmlModule)`
