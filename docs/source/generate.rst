.. index::
   single: Generate a document

Generate a document
===================

The syntax is highly inspired by Mustache_. The template is created in Microsoft Word or any equivalent that saves to docx.

Synopsis
--------

A typical docxtemplater template:

    Hello {name} !

Given the following hash:

    {
        name:'Edgar'
    }

Will produce:

    Hello Edgar !

Tag types
---------

Like Mustache, it has the loopopening {#} and loopclosing {/} brackets

The following template:

    {#products}
        {name}, {price} €
    {/products}

Given the following hash:

    {
    	"products":
    		[
    		 {name:"Windows",price:100},
    		 {name:"Mac OSX",price:200},
    		 {name:"Ubuntu",price:0}
    		]
    }

will result in :

    Windows, 100 €
    Mac OSX, 200 €
    Ubuntu, 0€

Angular.js like parsing
-----------------------


	This year is {person.age+person.birthyear}

	vars={person:{age:50,birthyear:1964}}


.. _Mustache: http://mustache.github.io/
