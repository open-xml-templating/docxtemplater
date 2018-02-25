.. index::
   single: Configuration

..  _configuration:

Configuration
=============

You can configure docxtemplater with an options object by using the ``setOptions`` method.

.. code-block:: javascript

    var doc = new Docxtemplater();
    doc.loadZip(zip);
    doc.setOptions(options)

Custom Parser
--------------

The name of this option is `parser` (function).

With a custom parser you can parse the tags to for example add operators
like '+', '-', or even create a Domain Specific Language to specify your tag values.

To enable this, you need to specify a custom parser.

docxtemplater comes shipped with this parser:

If the template is : 

.. code-block:: text

    Hello {user}

.. code-block:: javascript

    doc.setData({user: "John"})
    doc.setOptions({
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
    });


A very useful parser is the angular-expressions parser, which has implemented useful features.

See `angular parser`_ for comprehensive documentation

.. _`angular parser`: angular_parse.html

Custom delimiters
-----------------

You can set up your custom delimiters with this syntax:

.. code-block:: javascript

    new Docxtemplater()
        .loadZip(zip)
        .setOptions({delimiters:{start:'[[',end:']]'}})


paragraphLoop
-------------

The paragraphLoop option has been added in version 3.2.0.

It is recommended to turn that option on, since it makes the rendering a little bit easier to reason about.

However since it breaks backwards-compatibility, it is turned off by default.

.. code-block:: javascript

    new Docxtemplater()
        .loadZip(zip)
        .setOptions({paragraphLoop:true})

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
separate paragraphs, treat the loop as a paragraph loop (eg create one new
paragraph for each loop) where you remove the first and last paragraphs (the
ones containing the loop tags).


nullGetter
----------

You can customize the value that is shown whenever the parser (documented above) returns 'null' or undefined.
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
