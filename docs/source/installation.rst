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
    npm install jszip
    npm install jszip-utils # only for the browser (webpack)

**jszip version 3 is important !** It won't work with jszip version < 3

**jszip-utils (only for browser) is not installed with jszip** and has to be installed separately

Browser
-------

You can find ``.js`` and ``.min.js`` files for docxtemplater on this repository : 

https://github.com/open-xml-templating/docxtemplater-build/tree/master/build

You will also need JSZip version 3.x, which you can download here : https://github.com/Stuk/jszip/tree/master/dist

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

Minifying the build
-------------------

On Browsers that have `window.XMLSerializer` and `window.DOMParser` (all browsers normally have it), you can use that as a replacement for the xmldom dependency.

As an example, if you use webpack, you can do the following in your webpack.config.js : 

.. code-block:: javascript

    module.exports = {
        // ...
        // ...
        resolve: {
            alias: {
                xmldom: path.resolve("./node_modules/docxtemplater/es6/browser-versions/xmldom.js"),
            },
        },
        // ...
        // ...
    }

Bower
-----

You can use bower to install docxtemplater 

.. code-block:: bash

    bower install --save docxtemplater
