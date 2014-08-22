.. index::
   single: Configuration

..  _configuration:

Configuration
=============

Here are documented the special options that you can set when creating a new DocxGen to get some more superpower : 

It documents the options parameter when you do:

.. code-block:: javascript

    new DocxGen(data,options);

Image Replacing
---------------

The name of this option is `qrCode` (function) (This was a boolean in 0.6.3 and before).

To stay a templating engine, I wanted that DocxTemplater doesn't add an image from scratch, but rather uses an existing image that can be detected, and DocxTemplater will just change the contents of that image, without changing it's style (border, shades, ...). The size of the replaced images will stay the same, ...

So I decided to use the qrCode format, which is a format that lets you identify images by their content.

The option for this is `qrCode` (false for off, a function for on, default off)

The function takes two parameter: The first one is the string, the second the callback.

For example your configuration could be:

.. code-block:: javascript

    new DocxGen(data,{qrCode:function(result,callback){
    		urloptions=(result.parse(path))
    		options =
    			hostname:urloptions.hostname
    			path:urloptions.path
    			method: 'GET'
    			rejectUnauthorized:false
    		errorCallback= (e) ->
    			throw new Error("Error on HTTPS Call")
    		reqCallback= (res)->
    			res.setEncoding('binary')
    			data = ""
    			res.on('data', (chunk)->
    				data += chunk
    			)
    			res.on('end', ()->
    				callback(null,data))
    		req = http.request(options, reqCallback).on('error',errorCallback)
    }})

.. note::

    If you don't use that functionality, you should disable it, because it is quite slow (the image decoding)

.. warning::

    The qrCode functionality only works for PNG !
    They is no support for other file formats yet.

.. warning::

    They is a security warning if you use true as the value for qrCode, because this will use the older qrcode loading function.
    This function can load any file on the filesystem, with a possible leak in api-keys or whatever you store on docxtemplater's server.

Angular Parser
--------------

The name of this option `parser` (function).

You can set the angular parser with the following code:

With a custom parser you can parse the tags to for example add operators
like '+', '-', or whatever the way you want to parse expressions.

To enable this, you need to specify a custom parser.
You need to create a parser function:

docxtemplater comes shipped with this parser:

.. code-block:: javascript

    parser=function(expression)
    {
        return {
            get:function(scope) {
                return scope[expression]
            }
        };
    }

To use the angular-parser, do the following:

.. code-block:: javascript

    expressions= require('angular-expressions');
    angularParser= function(tag) {
        return {
            get:expressions.compile(tag)
        };
    }
    new DocxGen(data,{parser:angularParser})

.. note::

    The require() works in the browser if you include vendor/angular-parser-browser.js

Intelligent LoopTagging
-----------------------

The name of this option `intelligentTagging` (boolean).

When looping over an element, docxtemplater needs to know over which
element you want to loop. By default, it tries to do that intelligently
(by looking what XML Tags are between the {tags}). However, if you want
to always use the <w:t> tag by default, set this option to false.

You can always specify over which element you want to loop with the dash loop syntax
