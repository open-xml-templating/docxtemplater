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

The function takes two parameter: The first one is the string that was decoded by the qrcode module, the second the callback.

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

    If you don't use that functionality, you should not enable it (you don't have to do anything), because the qrcode module is quite slow.

.. warning::

    The qrCode functionality only works for PNG !
    They is no support for other file formats yet.
    The main problem being that their is no decoder for other file formats in Node.js.
    The library https://github.com/zhangyuanwei/node-images does support decoding for more file formats (gif, png, jpeg), but depends on 3 other none node dependencies.

.. warning::

    They is a security warning if you use true as the value for qrCode, because this will use the older qrcode loading function.
    This function can load any file on the filesystem, with a possible leak in api-keys or whatever you store on docxtemplater's server.

To generate qrcodes with nodejs, you can use for example this script brought by @ssured in issue #69 https://github.com/edi9999/docxtemplater/issues/69

`npm install qr-image canvas`

To install the dependencies of canvas, look here (platform specific)
https://github.com/Automattic/node-canvas/wiki


.. code-block:: javascript

    var Canvas, Image, canvas, column, ctx, fs, matrix, qr, qrString, size, textSize, value, x, y, _i, _j, _len, _len1;
    qr = require('qr-image');
    fs = require('fs');
    Canvas = require('canvas');
    Image = Canvas.Image;
    qrString = 'gen:{image}';
    size = 10;
    matrix = qr.matrix(qrString);
    canvas = new Canvas((2 + 5 + matrix.length) * size, (2 + 5 + matrix.length) * size);
    ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(1, 1, canvas.width - 2, canvas.height - 2);
    ctx.fillStyle = '#000';
    for (y = _i = 0, _len = matrix.length; _i < _len; y = ++_i) {
      column = matrix[y];
      for (x = _j = 0, _len1 = column.length; _j < _len1; x = ++_j) {
        value = column[x];
        if (value === 1) {
          ctx.fillRect((x + 1 + 2.5) * size, (y + 1) * size, size, size);
        }
      }
    }
    ctx.font = 4 * size + 'px Helvetica';
    ctx.fillStyle = '#000';
    textSize = ctx.measureText(qrString);
    ctx.fillText(qrString, (canvas.width - textSize.width) / 2, canvas.height - size - textSize.actualBoundingBoxDescent);
    canvas.pngStream().pipe(fs.createWriteStream('qr.png'));


Custom Parser
--------------

The name of this option is `parser` (function).

With a custom parser you can parse the tags to for example add operators
like '+', '-', or whatever the way you want to parse expressions. See for
a complete reference of all possibilities of angularjs parsing:
http://teropa.info/blog/2014/03/23/angularjs-expressions-cheatsheet.html

To enable this, you need to specify a custom parser.
You need to create a parser function:

docxtemplater comes shipped with this parser:

.. code-block:: javascript

    parser=function(expression)
    {
        return {
            get:function(scope) {
                if (expression===".") return scope;
                return scope[expression]
            }
        };
    }

To use the angular-parser, do the following:

.. code-block:: javascript

    expressions= require('angular-expressions');
    // define your filter functions here, eg:
    // expressions.filters.split = function(input, str) { return input.split(str); }
    angularParser= function(tag) {
        return {
            get: tag == '.' ? function(s){ return s;} : expressions.compile(tag)
        };
    }
    new DocxGen(data,{parser:angularParser})

.. note::

    The require() works in the browser if you include vendor/angular-parser-browser.js

Intelligent LoopTagging
-----------------------

The name of this option is `intelligentTagging` (boolean).

When looping over an element, docxtemplater needs to know over which
element you want to loop. By default, it tries to do that intelligently
(by looking what XML Tags are between the {tags}). However, if you want
to always use the <w:t> tag by default, set this option to false.

You can always specify over which element you want to loop with the dash loop syntax
