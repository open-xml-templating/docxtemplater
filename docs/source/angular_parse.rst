..  _angular_parse:

.. index::
   single: Angular parser

Angular parser
==============

Introduction
------------

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

Setup
-----

Here's a code sample for how to use the angularParser :

.. code-block:: javascript

    // Please make sure to use angular-expressions 1.0.1 or later
    // More detail at https://github.com/open-xml-templating/docxtemplater/issues/488
    var expressions = require('angular-expressions');
    var assign = require("lodash/assign");
    // define your filter functions here, for example, to be able to write {clientname | lower}
    expressions.filters.lower = function(input) {
        // This condition should be used to make sure that if your input is
        // undefined, your output will be undefined as well and will not
        // throw an error
        if(!input) return input;
        return input.toLowerCase();
    }
    function angularParser(tag) {
        if (tag === '.') {
            return {
                get: function(s){ return s;}
            };
        }
        const expr = expressions.compile(
            tag.replace(/(’|‘)/g, "'").replace(/(“|”)/g, '"')
        );
        return {
            get: function(scope, context) {
                let obj = {};
                const scopeList = context.scopeList;
                const num = context.num;
                for (let i = 0, len = num + 1; i < len; i++) {
                    obj = assign(obj, scopeList[i]);
                }
                return expr(scope, obj);
            }
        };
    }
    new Docxtemplater(zip, {parser:angularParser});

.. note::

    The require() will not work in a browser, you have to use a module bundler like `webpack`_ or `browserify`_. Alternatively, you can download an outdated version at https://raw.githubusercontent.com/open-xml-templating/docxtemplater/6c8c76210d555fd0f6b3dbc927522a3805f17469/vendor/angular-parse-browser.js

.. _`webpack`: https://webpack.github.io/
.. _`browserify`: http://browserify.org/

Conditions
----------

With the angularParser option set, you can also use conditions :

.. code-block:: text

    {#users.length>1}
    There are multiple users
    {/}

    {#userName == "John"}
    Hello John, welcome back
    {/}

The first conditional will render the section only if there are 2 users or more.

The second conditional will render the section only if the userName is the string "John".

It also handles the boolean operators AND ``&&``, OR ``||``, ``+``, ``-``, the ternary operator ``a ? b : c``, operator precendence with parenthesis ``(a && b) || c``, and many other javascript features.

For example, it is possible to write the following template :


.. code-block:: text

    {#generalCondition}
    {#cond1 || cond2}
    Paragraph 1
    {/}
    {#cond2 && cond3}
    Paragraph 2
    {/}
    {#cond4 ? users : usersWithAdminRights}
    Paragraph 3
    {/}
    There are {users.length} users.
    {/generalCondition}

Filters
-------

With filters, it is possible to write the following template to have the resulting string be uppercased:

.. code-block:: text

    {user.name | upper}

.. code-block:: javascript

    var expressions = require('angular-expressions');
    expressions.filters.upper = function(input) {
        // This condition should be used to make sure that if your input is
        // undefined, your output will be undefined as well and will not
        // throw an error
        if(!input) return input;
        return input.toUpperCase();
    }

More complex filters are possible, for example, if you would like to list the names of all active users. If your data is the following :

.. code-block:: json

    {
        "users": [
            {
                "name": "John",
                "age": 15,
            },
            {
                "name": "Mary",
                "age": 26,
            }
        ],
    }

You could show the list of users that are older than 18, by writing the following code :

.. code-block:: javascript

    var expressions = require('angular-expressions');
    expressions.filters.olderThan = function(users, minAge) {
        // This condition should be used to make sure that if your input is
        // undefined, your output will be undefined as well and will not
        // throw an error
        if(!users) return users;
        return users.filter(function(user) {
            return user.age >= minAge;
        });
    }

And in your template,

.. code-block:: text

    The allowed users are :

    {#users | olderThan:15}
    {name} - {age} years old
    {/}

There are some interesting use cases for filters

Data aggregation
~~~~~~~~~~~~~~~~

If your data is the following :

.. code-block:: json

    {
        "items": [
            {
                "name": "Acme Computer",
                "price": 1000,
            },
            {
                "name": "Mouse & Keyboard",
                "price": 150,
            }
        ],
    }

And you would like to show the total price, you can write in your template :

.. code-block:: text

    {#items}
    {name} for a price of {price} €
    {/}
    Total Price of your purchase : {items | sumby:'price'}€

The `sumby` is a filter that you can write like this :

.. code-block:: javascript

    expressions.filters.sumby = function(input, field) {
        // In our example field is the string "price"
        // This condition should be used to make sure that if your input is
        // undefined, your output will be undefined as well and will not
        // throw an error
        if(!input) return input;
        return input.reduce(function(sum, object) {
            return sum + object[field];
        }, 0);
    }

Data formatting
~~~~~~~~~~~~~~~

This example is to format numbers in the format : "150.00" (2 digits of precision)
If your data is the following :

.. code-block:: json

    {
        "items": [
            {
                "name": "Acme Computer",
                "price": 1000,
            },
            {
                "name": "Mouse & Keyboard",
                "price": 150,
            }
        ],
    }

And you would like to show the price with two digits of precision, you can write in your template :

.. code-block:: text

    {#items}
    {name} for a price of {price | toFixed:2} €
    {/}

The `toFixed` is an angular filter that you can write like this :

.. code-block:: javascript

    expressions.filters.toFixed = function(input, precision) {
        // In our example precision is the integer 2
        // This condition should be used to make sure that if your input is
        // undefined, your output will be undefined as well and will not
        // throw an error
        if(!input) return input;
        return input.toFixed(precision);
    }


Assignments
-----------

With the angular expression option, it is possible to assign a value to a variable directly from your template.

For example, in your template, write :

.. code-block:: text

    {full_name = first_name + last_name}

The problem with this expression is that it will return the value of full_name.
There are two ways to fix this issue, either, if you still would like to keep this as the default behavior, add `; ''` after your expression, for example

.. code-block:: text

    {full_name = first_name + last_name; ''}

This will first execute the expression, and then execute the second statement which is an empty string, and return it.

An other approach is to automatically silence the return values of expression containing variable assignments.

You can do so by using the following parser option :

.. code-block:: javascript

    var expressions = require("angular-expressions");
    var assign = require("lodash/assign");

    function angularParser(tag) {
        if (tag === ".") {
            return {
                get(s) {
                    return s;
                },
            };
        }
        const expr = expressions.compile(
            tag.replace(/(’|‘)/g, "'").replace(/(“|”)/g, '"')
        );
        // isAngularAssignment will be true if your tag contains a `=`, for example
        // when you write the following in your template :
        // {full_name = first_name + last_name}
        // In that case, it makes sense to return an empty string so
        // that the tag does not write something to the generated document.
        const isAngularAssignment =
            expr.ast.body[0] &&
            expr.ast.body[0].expression.type === "AssignmentExpression";

        return {
            get(scope, context) {
                let obj = {};
                const scopeList = context.scopeList;
                const num = context.num;
                for (let i = 0, len = num + 1; i < len; i++) {
                    obj = assign(obj, scopeList[i]);
                }
                const result = expr(scope, obj);
                if (isAngularAssignment) {
                    return "";
                }
                return result;
            },
        };
    }
    new Docxtemplater(zip, {parser:angularParser});

Note that if you use a standard tag, like `{full_name = first_name + last_name}` and if you put no other content on that paragraph, the line will still be there but it will be an empty line. If you wish to remove the line, you could use a rawXML tag which will remove the paragraph, like this :

.. code-block:: text

    {@full_name = first_name + last_name}
    {@vat = price * 0.2}
    {@total_price = price + vat}

This way, all these assignment lines will be dropped.
