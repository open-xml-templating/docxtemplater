### From 0.6.0 to 0.7.0

**The QrCode Option had a security issue**. If you don’t upgrade according to this, the functionality should continue to work but the leak will still be there.

If you set qrCode:true, you are affected. The Command Line is not affected, but loading images over the filesystem doesn’t work in the cli now.

You should set qrCode to a function now, according to http://docxtemplater.readthedocs.org/en/latest/configuration.html#image-replacing.
