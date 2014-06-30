..  _syntax:

.. index::
   single: Syntax

Syntax
======

The syntax is highly inspired by Mustache_. The template is created in Microsoft Word or any equivalent that saves to docx.

.. _Mustache: http://mustache.github.io/

Synopsis
--------

A typical docxtemplater template:

.. code-block:: javascript

    Hello {name} !

Given the following hash:

.. code-block:: javascript

    {
        name:'Edgar'
    }

Will produce:

.. code-block:: javascript

    Hello Edgar !

Tag types
---------

Like Mustache, it has the loopopening {#} and loopclosing {/} brackets

Loop syntax
-----------

The following template:

.. code-block:: javascript

    {#products}
        {name}, {price} €
    {/products}

Given the following hash:

.. code-block:: javascript

    {
        "products":
            [
             {name:"Windows",price:100},
             {name:"Mac OSX",price:200},
             {name:"Ubuntu",price:0}
            ]
    }

will result in :

.. code-block:: javascript

    Windows, 100 €
    Mac OSX, 200 €
    Ubuntu, 0€

The loop behaves in the following way:

 * If the value is an array, it will loop over all the elements of that array.
 * If the value is a boolean, it will loop once if the value is true, keeping the same scope, and not loop at all if the value is false

.. note:: 

    Because the loops work also with boolean values, you can also use them for conditions.


Dash syntax
-----------

It is quite difficult to know on which element you are going to loop. By default, when using the for loop, docxgen will find that by himself:

If between the two tags {#tag}______{/tag}

 * they is the Xml Tag <w:tc> -> you are in a table, and it will loop over <w:tr>
 * else -> it will loop over <w:t>, which is the default Text Tag

With the Dash syntax you pass as a first argument the tag you want to loop on:

.. code-block:: javascript

    {-w:p loop} {inner} {/loop}

In this case this will loop over the first parent <w:p> tag

Inverted Selections
-------------------

An inverted section begins with a caret (hat) and ends with a slash. That is {^person} begins a "person" inverted section while {/person} ends it.

While sections can be used to render text one or more times based on the value of the key, inverted sections may render text once based on the inverse value of the key. That is, they will be rendered if the key doesn't exist, is false, or is an empty list.

Template:

.. code-block:: javascript

    {#repo}
      <b>{name}</b>
    {/repo}
    {^repo}
      No repos :(
    {/repo}

Hash:

.. code-block:: javascript

    {
      "repo": []
    }

Output:

.. code-block:: javascript

    No repos :(
