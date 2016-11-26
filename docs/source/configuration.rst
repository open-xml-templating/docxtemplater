.. index::
   single: Configuration

..  _configuration:

Configuration
=============

The options that you can set when creating a new Docxtemplater

It documents the options parameter when you do:

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

To use the angular-parser, do the following:

.. code-block:: javascript

    expressions= require('angular-expressions');
    // define your filter functions here, eg:
    // expressions.filters.split = function(input, str) { return input.split(str); }
    angularParser= function(tag) {
        return {
            get: tag == '.' ? function(s){ return s;} : expressions.compile(tag)
        };
    }
    new Docxtemplater().loadZip(zip).setOptions({parser:angularParser})

.. note::

    The require() works in the browser if you include vendor/angular-parser-browser.js

See for a complete reference of all possibilities of angularjs parsing:
http://teropa.info/blog/2014/03/23/angularjs-expressions-cheatsheet.html

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

Intelligent LoopTagging
-----------------------

The name of this option is `intelligentTagging` (boolean).

When looping over an element, docxtemplater needs to know over which
element you want to loop. By default, it tries to do that intelligently
(by looking what XML Tags are between the {tags}). However, if you want
to always use the <w:t> tag by default, set this option to false.

You can always specify over which element you want to loop with the dash loop syntax

Image Replacing
---------------

.. note::

    The imageReplacing feature has been removed from the main docxtemplater package. This feature has been implemented in an external module that can be found here : https://github.com/open-xml-templating/docxtemplater-image-module.
