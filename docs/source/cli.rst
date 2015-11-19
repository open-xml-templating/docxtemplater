..  _cli:

.. index::
   single: Command Line Interface (CLI)

Command Line Interface (CLI)
============================

This section is about the commandline interface of docxtemplater.

The syntax is the following:

    docxtemplater config.json

The full config.json should be the following:

.. code-block:: javascript

    {
        "config.inputFile":"input.docx",
        "config.outputFile":"output.docx",
        "config.debug":true,
        "first_name":"John",
        "last_name":"Smith",
        "age":62
    }


Config.json Syntax
------------------


Config properties:
^^^^^^^^^^^^^^^^^^

These are the properties to configure docxtemplater:

.. code-block:: javascript

    {
        "config.docxFile":"input.docx", //The input file path
        "config.outputFile":"output.docx", //The output file path
        "config.debug":true //whether to show debug output or not
    }

Data properties:
^^^^^^^^^^^^^^^^

To add data to your template, just use keys that don't start with "config."

.. code-block:: javascript

    {
        "first_name":"John",
        "last_name":"Smith",
        "age":62
    }

