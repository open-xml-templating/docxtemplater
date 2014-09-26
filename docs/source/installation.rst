..  _installation:

.. index::
   single: Installation

Installation
============


Node
----

To install docxtemplater, we recommend you to use npm.

.. code-block:: javascript

    npm install docxtemplater


If you want to use the command line interface, you should use the global flag, eg:

.. code-block:: javascript

    npm install docxtemplater -g


Browser
-------

I recommend you to use browserify.

.. code-block:: javascript

    git clone git@github.com:edi9999/docxtemplater.git && cd docxtemplater
    npm install -g gulp jasmine-node uglify-js
    npm install
    gulp allCoffee
    browserify -r './js/docxgen.js' > build/docxgen.js
    uglifyjs build/docxgen.js > build/docxgen.min.js

Your version of docxtemplater will be in /build (minified and non minified options).
