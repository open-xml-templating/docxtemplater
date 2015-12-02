..  _cli:

.. index::
   single: Errors

Possible Errors
===============

This section is about the possible errors that Docxtemplater will throw

Schema of the error
------------------

All errors thrown by docxtemplater have the following schema:

.. code-block:: json
    {
        ... : docxtemplater errors are Javascript errors, so they inherit from the properties.
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

If your content is `{user {name}`, docxtemplater will throw the following error :

try
    doc.render()
catch e
    e.name=="TemplateError"
    e.message=="Unclosed tag"
    e.properties.explanation=="The tag beginning with '{user ' is unclosed"
    e.properties.id=="unclosed_tag"
    e.properties.context=="{user {"
    e.properties.xtag=="user "
