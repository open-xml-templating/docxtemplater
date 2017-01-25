..  _cli:

.. index::
   single: Errors

Error handling
==============

This section is about how to handle Docxtemplater errors.

To be able to see these errors, you need to catch them properly.

.. code-block:: javascript

    try {
        // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        doc.render()
    }
    catch (error) {
        var e = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties,
        }
        console.log(JSON.stringify(e));
        // Handle error
    }

Error Schema 
------------

All errors thrown by docxtemplater have the following schema:

.. code-block:: text

    {
        name: One of [GenericError, TemplateError, ScopeParserError, InternalError],
        message: The message of that error,
        properties : {
            explanation: An error that is user friendly (in english), explaining what failed exactly. This error could be shown as is to end users
            id: An identifier of the error that is unique for that type of Error
            ... : The other properties are specific to each type of error.
        }
    }

Error example
-------------

If the content of your template is `{user {name}`, docxtemplater will throw the following error :

.. code-block:: javascript

    try {
        doc.render()
    }
    catch (e) {
        // All these expressions are true
        e.name === "TemplateError" 
        e.message === "Unclosed tag"
        e.properties.explanation === "The tag beginning with '{user ' is unclosed"
        e.properties.id === "unclosed_tag"
        e.properties.context === "{user {"
        e.properties.xtag === "user "
    }

