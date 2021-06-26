..  _installation:

.. index::
   single: Installation

Installation
============

Node
----

npm is the easiest way to install docxtemplater

.. code-block:: bash

    npm install docxtemplater pizzip


Browser (Angular, React, Next.JS, Vue)
--------------------------------------

For React, Angular, and Vue, you can use the npm packages and use these code samples from the FAQ:

- `React <faq.html#docxtemplater-in-a-react-project>`_
- `Angular <faq.html#docxtemplater-in-an-angular-project>`_
- `Vue <faq.html#docxtemplater-in-a-vuejs-project>`_
- `Next.js <faq.html#docxtemplater-in-a-next-js-project>`_

Browser (JS files)
------------------

You can find ``.js`` and ``.min.js`` files for docxtemplater on `this repository <https://github.com/open-xml-templating/docxtemplater-build/tree/master/build>`__

You will also need Pizzip, which you can `download here <https://unpkg.com/pizzip@3.0.6/dist/pizzip.js>`__

Build the JS Files yourself
---------------------------

If you want to build docxtemplater for the browser yourself, here is how you should do:

.. code-block:: bash

    git clone https://github.com/open-xml-templating/docxtemplater.git
    cd docxtemplater
    npm install
    npm test
    npm run compile
    ./node_modules/.bin/browserify -r "./js/docxtemplater.js" -s docxtemplater > "browser/docxtemplater.js"
    ./node_modules/.bin/uglifyjs "browser/docxtemplater.js" > "browser/docxtemplater.min.js" --verbose --ascii-only

Docxtemplater will be exported to window.docxtemplater.

The generated files of docxtemplater will be in /browser (minified and non minified).

Minifying the build
-------------------

On Browsers that have `window.XMLSerializer` and `window.DOMParser` (all browsers normally have it), you can use that as a replacement for the xmldom dependency.

As an example, if you use webpack, you can do the following in your webpack.config.js:

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

When using bower, you can include the following script tag in your HTML:

.. code-block:: html

    <script src="bower_components/docxtemplater/build/docxtemplater-latest.min.js"></script>

This tag will expose docxtemplater in `window.docxtemplater`.


