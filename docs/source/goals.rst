..  _goals:

.. index::
   single: Goals

Goals
=====

docxtemplater was born out of the idea that you should be able to generate Docx
as easily as you generate Html with something like Mustache.

They are a lots of solutions like docx.js, docx4j, ...
that generate docx, but you will have to write specific code to create a title, an image, ...

I think this is a waste when you can just write your template with plain old Microsoft Word.

docxtemplater is just there for that

Why you should use a library for this
-------------------------------------

Docx is a zipped format that contains some xml.
If you want to build a simple replace {tag} by value system,
it can already become complicated, because the {tag} is internally separated into `<w:t>{</w:t><w:t>tag</w:t><w:t>}</w:t>`.
If you want to embed loops to iterate over an array, it becomes a real hassle.
