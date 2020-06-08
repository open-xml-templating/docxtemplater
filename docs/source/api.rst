..  _api:

.. index::
   single: API

API
===

Constructor
-----------

.. code-block:: text

    new Docxtemplater()

        This function returns a new Docxtemplater instance

.. code-block:: text

    new Docxtemplater(zip[, options])

        This constructor is preferred over the constructor without any arguments. The constructor without arguments will be removed in docxtemplater version 4.
        When calling the constructor with a zip file as the first argument, the document will be compiled during instantiation, meaning that this will throw an error if some tag is misplaced in your document.
        The options parameter allows you to attach some modules, and they will be attached before compilation.

            zip:
                a zip instance to that method, coming from pizzip or jszip version 2.

            options: (default {modules:[]})
                You can use this object to configure docxtemplater. It is possible to configure in the following ways:

                    * You can pass options to change custom parser, custom delimiters, etc.
                    * You can pass the list of modules that you would like to attach.

                For example :
                const options = {
                    modules: [ new ImageModule(imageOpts) ],
                    delimiters: {
                        start: "<",
                        end: ">",
                    },
                }
                const doc = new Docxtemplater(zip, options);

        This function returns a new Docxtemplater instance


Methods
-------

.. code-block:: text

    setData(Tags)

        Tags:
            Type: Object {tag_name:tag_replacement}
            Object containing for each tag_name, the replacement for this tag. For example, if you want to replace firstName by David, your Object should be: {"firstName":"David"}

    render()

        This function replaces all template variables by their values

    getZip()

        This will return you the zip that represents the docx. You can then call `.generate` on this to generate a buffer, string , ... (see https://github.com/open-xml-templating/pizzip/blob/master/documentation/api_pizzip/generate.md)

    compile()

        This function is **deprecated** and you should instead use the new constructor with two arguments.
        This function parses the template to prepare for the rendering. If your template has some issues in the syntax (for example if your tag is never closed like in : `Hello {user`), this function will throw an error with extra properties describing the error. This function is called for you in render() if you didn't call it yourself. This function should be called before doing resolveData() if you have some async data.

    loadZip(zip)

        This function is **deprecated** and you should instead use the new constructor with two arguments.
        You have to pass a zip instance to that method, coming from pizzip or jszip version 2

    setOptions()

        This function is **deprecated** and you should instead use the new constructor with two arguments.
        This function is used to configure the docxtemplater instance by changing parser, delimiters, etc. (See https://docxtemplater.readthedocs.io/en/latest/configuration.html).

    attachModule(module)

        This function is **deprecated** and you should instead use the new constructor with two arguments.
        This will attach a module to the docxtemplater instance, which is usually used to add new generation features (possibility to include images, HTML, ...). Pro modules can be bought on https://docxtemplater.com/

        This method can be called multiple times, for example : `doc.loadZip(zip).attachModule(imageModule).attachModule(htmlModule)`
