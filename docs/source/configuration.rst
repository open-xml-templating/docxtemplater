.. index::
   single: Configuration

..  _configuration:

Configuration
=============

You can configure docxtemplater with an options object by using the ``setOptions`` method.

.. code-block:: javascript

    var doc=new Docxtemplater();
    doc.loadZip(zip);
    doc.setOptions(options)

Custom Parser
--------------

The name of this option is `parser` (function).

With a custom parser you can parse the tags to for example add operators
like '+', '-', or whatever the way you want to parse expressions. 

To enable this, you need to specify a custom parser.
You need to create a parser function:

docxtemplater comes shipped with this parser:

.. code-block:: javascript

    parser: function(tag) {
      return {
        'get': function(scope) {
          if (tag === '.') {
            return scope;
          } 
          else {
            return scope[tag];
          }
        }
      };
    },

Custom delimiters
-----------------

You can set up your custom delimiters with this syntax:

.. code-block:: javascript

    new Docxtemplater()
        .loadZip(zip)
        .setOptions({delimiters:{start:'[[',end:']]'}})

nullGetter
----------

You can customize the value that is shown whenever the parser returns 'null' or undefined.
The nullGetter option is a function
By default the nullGetter is the following function

.. code-block:: javascript

	nullGetter(part) {
		if (!part.module) {
			return "undefined";
		}
		if (part.module === "rawxml") {
			return "";
		}
		return "";
	},

This means that the default value for simple tags is to show "undefined".
The default for rawTags ({@rawTag}) is to drop the paragraph completely (you could enter any xml here).
