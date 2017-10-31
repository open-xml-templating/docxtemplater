..  _installation:

.. index::
   single: Installation

Installation
============


Node
----

npm is the easiest way to install docxtemplater

.. code-block:: bash

    npm install docxtemplater
    npm install jszip@2

**jszip version 2 is important !** It won't work with jszip version 3

If you want to use the `command line interface`_, you should use the global flag:

.. code-block:: bash

    npm install docxtemplater --global

.. _`command line interface`: cli.html

Browser
-------

You can find ``.js`` and ``.min.js`` files for docxtemplater on this repository : 

https://github.com/open-xml-templating/docxtemplater-build/tree/master/build

You will also need JSZip version 2.x, which you can download here : https://github.com/Stuk/jszip/tree/v2.x/dist

Build it yourself
-----------------

If you want to build docxtemplater for the browser yourself, here is how you should do : 

.. code-block:: bash

    git clone https://github.com/open-xml-templating/docxtemplater.git
    cd docxtemplater
    npm install
    npm test
    npm run compile
    ./node_modules/.bin/browserify -r "./js/docxtemplater.js" -s docxtemplater > "browser/docxtemplater.js"
    ./node_modules/.bin/uglifyjs "browser/docxtemplater.js" > "browser/docxtemplater.min.js" --verbose --ascii-only

Docxtemplater will be exported to window.docxtemplater for easy usage.

The generated files of docxtemplater will be in /browser (minified and non minified).

Bower
-----

You can use bower to install docxtemplater 

.. code-block:: bash

    bower install --save docxtemplater
    
EmberCLI
--------

Installing with yarn:

.. code-block:: bash

   yarn add docxtemplater

**Use in a Single File**

Import docxtemplater where you need it at the top of your files:

.. code-block:: bash

   import docxtemplater from 'npm:docxtemplater';

Follow docs as normal. 

**Use Globally**

To import into your project call in ``ember-cli-build.js``:

.. code-block:: bash

   module.exports = function(defaults) {
     ...

     // Docxtemplater
     app.import('node_modules/docxtemplater/js/docxtemplater.js');

     return app.toTree();
   };
   
Update your ``.eslintrc.js`` to avoid linting errors:

.. code-block:: bash

   module.exports = {
     globals: {
       "docxtemplater": true
     }
   };

Follow docs as normal to use anywhere in your ember app. 

**Addons**

Follow the same patterns for any addons/plugins you need to use in your app

.. code-block:: bash

   import JSZip from 'npm:jszip';
   import JSZipUtils from 'npm:jszip-utils';
   import FileSaver from 'npm:file-saver';
