..  _angular_parse:

.. index::
   single: Angular parser

Angular parser
==============

The angular-parser makes creating complex templates easier.
You can for example now use : 

.. code-block:: text

    {user.name}

To access the nested name property in the following data : 

.. code-block:: javascript

    {
        user: {
            name: 'John'
        }
    }

You can also use `+`, `-`, `*`, `/`, `>`, `<` operators.

You also get access to filters : 

.. code-block:: javascript

    expressions.filters.upper = function(input) {
        // This condition should be used to make sure that if your input is undefined, your output will be undefined as well and will not throw an error
        if(!input) return input;
        return input.toUpperCase(); 
    }

Will make it possible to write the template ``{user.name | upper}``, and have the resulting string be uppercased.

Here's a code sample for how to use the angularParser :

.. code-block:: javascript

    var expressions= require('angular-expressions');
    // define your filter functions here, for example, to be able to write {clientname | lower}
    expressions.filters.lower = function(input) {
        // This condition should be used to make sure that if your input is undefined, your output will be undefined as well and will not throw an error
        if(!input) return input;
        return input.toLowerCase(); 
    }
    var angularParser = function(tag) {
        return {
            get: tag === '.' ? function(s){ return s;} : expressions.compile(tag)
        };
    }
    new Docxtemplater().loadZip(zip).setOptions({parser:angularParser})

.. note::

    The require() works in the browser if you include vendor/angular-parser-browser.js

See for a complete reference of all possibilities of angularjs parsing:
http://teropa.info/blog/2014/03/23/angularjs-expressions-cheatsheet.html

Conditions
----------

With angularParser, you can also use conditions : 

.. code-block:: text

    {#users.length>1}
        They are multiple users
    {/}

Will render the section only if they are 2 users or more.
