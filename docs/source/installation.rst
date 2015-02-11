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
    mkdir build -p
    browserify -r ./js/docxgen.js -s Docxgen > build/docxgen.js
    uglifyjs build/docxgen.js > build/docxgen.min.js

The -s Docxgen will export docxgen to window.Docxgen for easy usage (on some systems, it might export it in window.docxgen (see https://github.com/edi9999/docxtemplater/issues/118))

Your version of docxtemplater will be in /build (minified and non minified options) and already include all dependencies
