.. index::
   single: Special Options
   
Special options
===============

Here are documented the special options that you can set when creating a new DocxGen to get some more superpower : 

Image Replacing
---------------

To stay a templating engine, I wanted that DocxTemplater doesn't add an image from scratch, but rather uses an existing image that can be detected, and DocxTemplater will just change the contents of that image, without changing it's style. The size of the replaced images will stay the same, ...

So I decided to use the qrcode format, which is a format that lets you identify images by their content.

.. note::
    
    If you don't use that functionality, you should disable it, because it is quite slow (the image decoding)

Angular Parser
--------------

You can set the angular parser with the following code:

