.. index::
   single: Configuration

..  _configuration:

Configuration
=============

You can configure docxtemplater with an options object by using the ``v4 constructor`` with two arguments.

.. code-block:: javascript

    var doc = new Docxtemplater(zip, options);

Custom Parser
--------------

The name of this option is `parser` (function).

With a custom parser you can parse the tags to for example add operators
like '+', '-', or even create a Domain Specific Language to specify your tag values.

To enable this, you need to specify a custom parser.

Introduction
~~~~~~~~~~~~

To understand this option better, it is good to understand how docxtemplater manages the scope.

Whenever docxtemplater needs to render any tag, for example `{name}`, docxtemplater will delegate the retrieval of the value to the scopemanager.

The scopemanager does the following : 

 * it compiles the tag, by calling `parser('name')`  where 'name' is the string representing what is inside the docxtemplater tag. For loop tags, if the tag is `{#condition}`,  the passed string is only `condition` (it does not contain the #).

   The compilation of that tag should return an object containing a function at the `get` property.

 * whenever the tag needs to be rendered, docxtemplater calls `parser('name').get({name: 'John'})`, if `{name: 'John'}` is the current scope.

When inside a loop, for example : `{#users}{name}{/users}`, there are several "scopes" in which it is possible to evaluate the `{name}` property. The "deepest" scope is always evaluated first, so if the data is : `{users: [{name: "John"}], name: "Mary"}`, the parser calls the function `parser('name').get({name:"John"})`. Now if the returned value from the `.get` method is `null` or `undefined`, docxtemplater will call the same parser one level up, until it reaches the end of the scope.

If the root scope also returns `null` or `undefined` for the `.get` call, then the value from the nullGetter is used.

As a second argument to the `parser()` call, you receive more meta data about the tag of the document (and you could check if it is a loop tag for example).

As a second argument to the `get()` call, you receive more meta data about the scope, including the full scopeList.

Lets take an example, If your template is : 

.. code-block:: text

    Hello {user}

And we call `doc.setData({user: "John"})`

Default Parser
~~~~~~~~~~~~~~

docxtemplater uses by default the following parser :

.. code-block:: javascript

    const options = {
        parser: function(tag) {
          // tag is "user"
          return {
            'get': function(scope) {
              // scope will be {user: "John"}
              if (tag === '.') {
                return scope;
              }
              else {
                // Here we return the property "user" of the object {user: "John"}
                return scope[tag];
              }
            }
          };
        },
    };
    const doc = new Docxtemplater(zip, options);

Angular Parser
~~~~~~~~~~~~~~

A very useful parser is the angular-expressions parser, which has implemented useful features.

See `angular parser`_ for comprehensive documentation

.. _`angular parser`: angular_parse.html

Deep Dive on the parser
~~~~~~~~~~~~~~~~~~~~~~~

The parser function is given two arguments, 

For the template 

.. code-block:: text

    Hello {#users}{.}{/}

Using following data : 

.. code-block:: javascript

    {users: ['Mary', 'John']}

And with this parser

.. code-block:: javascript

    function parser(scope, context) [
        console.log(scope); 
        console.log(context);
    }


For the tag `.` in the first iteration, the arguments will be : 

.. code-block:: javascript

    scope = { "name": "Jane" }
    context = {
      "num": 1, // This corresponds to the level of the nesting, the {#users} tag is level 0, the {.} is level 1
      "scopeList": [
        {
          "users": [
            {
              "name": "Jane"
            },
            {
              "name": "Mary"
            }
          ]
        },
        {
          "name": "Jane"
        }
      ],
      "scopePath": [
        "users"
      ],
      "scopePathItem": [
        0
      ]
      // Together, scopePath and scopePathItem describe where we are in the data, in this case, we are in the tag users[0] (the first user)
    }


Simple Parser example for [lower] and [upper]
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Here is an example parser that allows you to lowercase or uppercase the data if writing your tag as : `{user[lower]}` or `{user[upper]}` :

.. code-block:: javascript

    options = {
        parser: function(tag) {
          // tag is "foo[lower]"
          let changeCase = false;
          if(tag.endsWith("[lower]") {
            changeCase = "lower";
          }
          if(tag.endsWith("[upper]") {
            changeCase = "upper";
          }
          return {
            'get': function(scope) {
              let result = null;
              // scope will be {user: "John"}
              if (tag === '.') {
                result = scope;
              }
              else {
                // Here we use the property "user" of the object {user: "John"}
                result = scope[tag];
              }

              if (typeof result === "string") {
                if(changeCase === "upper") {
                  return result.toUpperCase();
                }
                else if(changeCase === "lower") {
                  return result.toLowerCase();
                }
              }
              return result;
            }
          };
        },
    };
    new Docxtemplater(zip, options);

Simple Parser example for {$index} and {$isLast} inside loops
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

As an other example, it is possible to use the `{$index}` tag inside a loop by using following parser : 

.. code-block:: javascript

    function parser(tag) {
        return {
            get(scope, context) {
                if (tag === "$index") {
                    const indexes = context.scopePathItem;
                    return indexes[indexes.length - 1];
                }
                if (tag === "$isLast") {
                    const totalLength =
                        context.scopePathLength[context.scopePathLength.length - 1];
                    const index =
                        context.scopePathItem[context.scopePathItem.length - 1];
                    return index === totalLength - 1;
                }
                if (tag === "$isFirst") {
                    const index =
                        context.scopePathItem[context.scopePathItem.length - 1];
                    return index === 0;
                }
                return scope[tag];
            },
        };
    }


Custom delimiters
-----------------

You can set up your custom delimiters:

.. code-block:: javascript

    new Docxtemplater(zip, {delimiters:{start:'[[',end:']]'}});


paragraphLoop
-------------

The paragraphLoop option has been added in version 3.2.0.

It is recommended to turn that option on, since it makes the rendering a little bit easier to reason about. Since it breaks backwards-compatibility, it is turned off by default.

.. code-block:: javascript

    new Docxtemplater(zip, {paragraphLoop:true});

It allows to loop around paragraphs without having additional spacing.

When you write the following template

.. code-block:: text

    The users list is : 
    {#users}
    {name}
    {/users}
    End of users list

Most users of the library would expect to have no spaces between the different
names.

The output without the option is as follows : 

.. code-block:: text

    The users list is : 

    John

    Jane

    Mary

    End of users list


With the paragraphLoop option turned on, the output becomes : 


.. code-block:: text

    The users list is : 
    John
    Jane
    Mary
    End of users list

The rule is quite simple : 

If the opening loop ({#users}) and the closing loop ({/users}) are both on
separate paragraphs (and there is no other content on those paragraphs), treat
the loop as a paragraph loop (eg create one new paragraph for each loop) where
you remove the first and last paragraphs (the ones containing the loop open and
loop close tags).

nullGetter
----------

You can customize the value that is shown whenever the parser (documented
above) returns 'null' or undefined. By default the nullGetter is the following
function

.. code-block:: javascript

    nullGetter(part, scopeManager) {
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

The scopeManager variable contains some meta information about the tag, for example, if the template is : {#users}{name}{/users} and the tag `{name}` is undefined, `scopeManager.scopePath === ["users", "name"]`

linebreaks
----------

You can enable linebreaks, if your data contains newlines, those will be shown as linebreaks in the document

.. code-block:: javascript

    const doc = new Docxtemplater(zip, {linebreaks:true});
    doc.setData({text: "My text,\nmultiline"});
    doc.render();

