.. index::
   single: Configuration

..  _configuration:

Configuration
=============

Here are documented the special options that you can set when creating a new DocxGen to get some more superpower : 

It documents the options parameter when you do:

.. code-block:: javascript

    var doc=new DocxGen(content);
    doc.setOptions(options)

Image Replacing
---------------

.. note::

    The imageReplacing feature has been removed from the main docxtemplater package. This feature has been implemented in an external module that can be found here : https://github.com/edi9999/docxtemplater-image-module.

Custom Parser
--------------

The name of this option is `parser` (function).

With a custom parser you can parse the tags to for example add operators
like '+', '-', or whatever the way you want to parse expressions. See for
a complete reference of all possibilities of angularjs parsing:
http://teropa.info/blog/2014/03/23/angularjs-expressions-cheatsheet.html

To enable this, you need to specify a custom parser.
You need to create a parser function:

docxtemplater comes shipped with this parser:

.. code-block:: javascript

    parser=function(expression)
    {
        return {
            get:function(scope) {
                if (expression===".") return scope;
                return scope[expression]
            }
        };
    }

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
    new DocxGen(data).setOptions({parser:angularParser})

.. note::

    The require() works in the browser if you include vendor/angular-parser-browser.js


Custom delimiters
-----------------

You can set up your custom delimiters with this syntax:

.. code-block:: javascript

    new DocxGen(data)
        .setOptions({delimiters:{start:'[[',end:']]'}})

.. warning::

    In previous versions, you could write `DocUtils.Tags={start:'[[',end:']]'};`, but this is deprecated now and will be removed in future versions.


Intelligent LoopTagging
-----------------------

The name of this option is `intelligentTagging` (boolean).

When looping over an element, docxtemplater needs to know over which
element you want to loop. By default, it tries to do that intelligently
(by looking what XML Tags are between the {tags}). However, if you want
to always use the <w:t> tag by default, set this option to false.

You can always specify over which element you want to loop with the dash loop syntax
