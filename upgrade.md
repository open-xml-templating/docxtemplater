### From 0.6.0 to 0.7.0

**The QrCode Option had a security issue**. If you don’t upgrade according to this, the functionality should continue to work but the leak will still be there.
If you are running in the browser, the vulnerability will not affect you (no access to the filesystem). If the users can’t change the qrCodes or their value, you’re safe too.

If you set qrCode:true, you are affected. The Command Line is not affected as of v0.7.0 (but was on 0.6.3 and less).
However the command line as of v0.7.0 is not more able to load images over the filesystem.

You should set qrCode to a function now, according to http://docxtemplater.readthedocs.org/en/latest/configuration.html#image-replacing.
