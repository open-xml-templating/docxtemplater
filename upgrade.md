### From 0.7.x to 1

 * docxtemplater doesn’t depend on fs anymore, for transparency and security reasons.
 * `loadFromFile` has been removed. You now just have to pass the content to DocxGen’s constructor.
 * `setTags` has been renamed to `setData`
 * `applyTags` has been renamed to `render`
 * the constructor has changed: eg `new DocxGen(content,options)` will now call `JSzip.load(content,options)`.
 * To pass options (such as the parser), you will have to call `setOptions`
 * The `output` function has been removed. You should now call `getZip().generate(options)` where the options are documented here: http://stuk.github.io/jszip/documentation/api_jszip/generate.html
 * the qrcode module has been removed, and will be developped in an other package that will be attached to docxtemplater

### From 0.6.0 to 0.7.0

**The QrCode Option had a security issue**. If you don’t upgrade according to this, the functionality should continue to work but the leak will still be there.
If you are running in the browser, the vulnerability will not affect you (no access to the filesystem). If the users can’t change the qrCodes or their value, you’re safe too.

If you set qrCode:true, you are affected. The Command Line is not affected as of v0.7.0 (but was on 0.6.3 and less).
However the command line as of v0.7.0 is not more able to load images over the filesystem.

You should set qrCode to a function now, according to http://docxtemplater.readthedocs.org/en/latest/configuration.html#image-replacing.
