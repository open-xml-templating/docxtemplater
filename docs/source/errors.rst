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
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a properties object containing all suberrors).
        function replaceErrors(key, value) {
            if (value instanceof Error) {
                return Object.getOwnPropertyNames(value).reduce(function(error, key) {
                    error[key] = value[key];
                    return error;
                }, {});
            }
            return value;
        }
        console.log(JSON.stringify({error: error}, replaceErrors));

        if (error.properties && error.properties.errors instanceof Array) {
            const errorMessages = error.properties.errors.map(function (error) {
                return error.properties.explanation;
            }).join("\n");
            console.log('errorMessages', errorMessages);
            // errorMessages is a humanly readable message looking like this :
            // 'The tag beginning with "foobar" is unopened'
        }
        throw error;
    }

Error Schema
------------

All errors thrown by docxtemplater have the following schema:

.. code-block:: text

    {
        name: One of [GenericError, TemplateError, ScopeParserError, InternalError, MultiError],
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


List of all Error Identifiers
-----------------------------

All errors can be identified with their id (`e.properties.id`).

The ids are :

**multi_error**: This error means that multiple errors where found in the template (1 or more). See below for handling these errors.

**unopened_tag**: This error happens if a tag is closed but not opened. For example with the following template :

.. code-block:: text

    Hello name} !

**unclosed_tag**: This error happens if a tag is opened but not closed. For example with the following template :

.. code-block:: text

    Hello {name !

**no_xml_tag_found_at_left** and **no_xml_tag_found_at_right**: This error happens if a rawXMLTag doesn't find a `<w:p>` element

.. code-block:: text

    <w:p><w:t>{@raw}</w:t>
    // Note  that the `</w:p>` tag is missing.

**utf8_decode** is an internal error, please report it if you see it

**xmltemplater_content_must_be_string** is an internal error that happens if you try to template something that is not a string (a number for example)

**raw_xml_tag_should_be_only_text_in_paragraph** happens when a rawXMLTag {@raw} is not the only text in the paragraph. For example, writing `  {@raw}` (Note the spaces) is not acceptable because the {@raw} tag replaces the full paragraph. We prefer to throw an Error now rather than have "strange behavior" because the spaces "disappeared".

To correct this error, you have to add manually the text that you want in your raw tag. (Or you can use the https://docxtemplater.com/modules/word-run/ which adds a tag that can replace rawXML inside a tag).

Writing

.. code-block:: text

    {@my_first_tag}{my_second_tag}

Or even

.. code-block:: text

    Hello {@my_first_tag}

Is misusing docxtemplater.

The `@` at the beginning means "replace the xml of **the current paragraph** with scope.my_first_tag" so that means that everything else in that Paragraph will be removed.

**unclosed_loop** and **unopened_loop** happen when a loop is closed but never opened : for example

.. code-block:: text

    {#users}{name}

or

.. code-block:: text

    {name}{/users}

**closing_tag_does_not_match_opening_tag** happens when a loop is closed but doesn't match the opening tag

.. code-block:: text

    {#users}{name}{/people}

**scopeparser_compilation_failed** happens when your parser throws an error during compilation. The parser is the second argument of the constructor ``new Docxtemplater(zip, {parser: function parser(tag) {}});``

For example, if your template is :

.. code-block:: text

    {name++}

and you use the angularParser, you will have this error. The error happens when you call parser('name++'); The underlying error can be read in `e.properties.rootError`


**unimplemented_tag_type** happens when a tag type is not implemented. It should normally not happen, unless you changed docxtemplater code.

**malformed_xml** happens when a xml file of the document cannot be parsed correctly.

**loop_position_invalid** happens when a loop would produce invalid XML.

For example, if you write :

.. code-block:: text

    ======================
    | header1  | header2 |
    ----------------------
    | {#users} | content |
    ======================

    {/users}

this is not allowed since a loop that starts in a table should also end in that table.

Cannot attach a module that was already attached
------------------------------------------------

You might get this error :

`Cannot attach a module that was already attached : "ImageModule". Maybe you are instantiating the module at the root level, and using it for multiple instances of Docxtemplater`

In previous versions the error was `Cannot attach a module that was already attached`

This happens if you are reusing the same module instance twice.

It usually means that you are calling `new ImageModule()` just once, but you
should call it for each instance of docxtemplater.

The following code will throw the error when calling "generate" twice:

.. code-block:: javascript

    var Docxtemplater = require("docxtemplater");
    var ImageModule = require("docxtemplater-image-module");
    var imageModule = new ImageModule(opts);

    function generate(content) {
        var zip = new PizZip(content);
        var doc = new Docxtemplater(zip, {modules: [imageModule]});
        doc.setData(data);
        doc.render()
    }

You should always reconstruct an imageModule for each Docxtemplater instance.

The following code will no more throw the error :

.. code-block:: javascript

    var Docxtemplater = require("docxtemplater");
    var ImageModule = require("docxtemplater-image-module");

    function generate(content) {
        var zip = new PizZip(content);
        var imageModule = new ImageModule(opts);
        var doc = new Docxtemplater(zip, {modules: [imageModule] });
        doc.setData(data);
        doc.render()
    }


Handling multiple errors
------------------------

docxtemplater now has the ability to detect multiple errors in your template.
If it detects multiple errors, it will throw an error that has the id **multi_error**

You can then have the following to view all errors :

.. code-block:: javascript

    e.properties.errors.forEach(function(err) {
        console.log(err);
    });
