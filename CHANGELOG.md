### master

### 3.0.1

-	The modules are now ordered in the following order : baseModules, and then attachedModules. Before version 3.0.1, the attachedModules came before baseModules. This fixes : https://github.com/open-xml-templating/docxtemplater-image-module/issues/76

### 3.0.0

-	The rendering of the templates has now multiple steps : Lexing, Parsing, and Rendering. This makes the code much more robust, they might be bugs at the beginning, but in the long run, the code is much easier to understand/debug/change.
-	The module system was completely changed, no compatibility is kept between version 2 and version 3, please make sure to update your modules if needed.
-	You can't have the same startTag and endTag (for example `$foo$`), because this would make the code more complex and the errorHandling quite impossible.
-	All extended features (loop, rawxml, invertedloops), are written as v3 modules. We dogfood our own module system, and will hopefully improve it that way.

-	The constructor arguments have been removed, and you are responsible to load the JSZip.

	Instead of :

	```
	var doc = new Docxtemplater(content);
	```

	You now should do :

	```
	var zip = new JSZip(content);
	var doc=new Docxtemplater().loadZip(zip)
	```

-	getTags() has been removed. It is now not easily possible to get the tags. See https://github.com/open-xml-templating/docxtemplater/issues/258 for a alternate solution

The **JSZip version that you use should be 2.x**, the 3.x is now exclusively async, which Docxtemplater doesn't handle yet.

### 2.1.5

-	Fix stacktrace not showing up (#245)

### 2.1.4

-	Fixed a memory leak when using large document (10Mb document.xml) (#237)
-	Add fileTypeConfig options in setOptions to define your own fileType config (#235)

### 2.1.3

-	{@rawXml} has been fixed for pptx

### 2.1.2

-	Add possibility to close loopTag with {/} #192

### 2.1.1

-	Bug fix : Some times, docxtemplater could eat lots of memory due to the new "compilation" feature that was only experimental. As this feature is not yet used, it was completely removed from the codebase.
-	Performance : The code has been made a little bit faster.

### 2.1.0

-	**Speed Improvements** : docxtemplater had a regression causing it to be slow for loops. The regression would cause the code to run in O(n²) instead of O(n) where n is the length of the loops (with {#users}{name}{/users}. The bug is now fixed, and docxtemplater gained a lot of speed for users of lengthy loops.

### 2.0.0

-	**Breaking** : To choose between docx or pptx, you now have to pass docx.setOptions({fileType:'docx'}) where the fileTypes are one of 'pptx', 'docx' (default is 'docx')
-	Using es6 instead of coffeescript to code (code is still compiled to es5, to be usable with node v0.{10,12} or in the browser)
-	Add finalize step in render function to throw an error if a tag is unclosed
-	Module API has been updated, notably the tagXml property doesn't exist anymore, you should use the properties in `fileTypeConfig`
-	You should check if your modules have updated for the new module API, for instance, you should use version 1.0 of the docxtemplater image module

For example :

```javascript
var xmlTemplater = this.manager.getInstance("xmlTemplater");
var tagXml = xmlTemplater.fileTypeConfig.tagsXmlArray[0];
```

### 1.2.1

-	It is now possible to use tags inside of docx equations

### 1.2.0

-	This release adds error management, all errors that are thrown by docxtemplater are now typed and contain additional properties.

### 1.1.6

-	fix : When using loops with images inside, the modulemanager was not updated and would continue to return 'image' for the type of the tag even if the type changed

### 1.1.5

-	feature : it is now possible to set the nullgetter for simple tags and for raw xml tags.

### 1.1.4

-	bugfix for the modulemanager : it was not in sync in some cases

### 1.1.3

-	They now is a default value for rawtags {@rawXml}, which is '' (this will delete the paragraph)

### 1.1.2

-	bugfix (There was still '{' and '}' hardcoded)

### 1.1.1

-	It is now possible to output the delimiters in the output (for example output "Mark } Z" with the template {name}
-	scopeManager now doesn't return the string 'undefined' when the parser returns null. That behaviour is moved to the xmlTemplater class

### 1.1.0

-	docxtemplater is now much faster to process loops #131
-	docutils should not be used any more except for `DocUtils.defaults` (eg docutils is deprecated)
-	Module maintainers: please don't rely on docUtils anymore, except for docUtils.defaults
-	Some templates would output corrupt templates, this should not happen anymore (if it still does, please open an issue)

Upgrade guide :

-	If you use modules (image-module, chart-module, or others) its best to update those because they shouldn't use DocUtils anymore

### 1.0.8

-	Add ScopeManager.loopOverValue

### 1.0.7

-	{@rawXml} works in pptx
-	Created new docxtemplater.com website
-	Using mocha instead of jasmine-node
-	New FAQ section in docs

### 1.0.6

-	Corrupt documents when `<w:t>}{/body}</w:t>`

### 1.0.5

-	New events for moduleManager : `xmlRendering` and `xmlRendered`

### 1.0.4

-	pptx generation was repaired 2be10b69d47e8c4ba0f541e4d201b29ef6281505
-	header generation works with any amount of headers/footers
-	slide generation works with any amount of slides

### 1.0.3

-	docx.setOptions({delimiters:{start:”[“,end:”]”}}) now works e2d06dedd88860d2dac3d598b590bf81e2d113a6

### 1.0.2

-	allowing same tag as start and end delimiter (eg @user@ instead of {user}) 32b9a7645f659ae835fd695e4d8ea99cc6bbec94

### 1.0.1

-	made it possible to use objects to loop over (eg {#user} {name} {/user}) 97411cb3537be08f48ff707ac34d6aac8b008c50

### From 0.7.x to 1

-	docxtemplater doesn’t depend on fs anymore, for transparency and security reasons.
-	`loadFromFile` has been removed. You now just have to pass the content to Docxtemplater’s constructor.
-	`setTags` has been renamed to `setData`
-	`applyTags` has been renamed to `render`
-	the constructor has changed: eg `new Docxtemplater(content,options)` will now call `JSzip.load(content,options)`.
-	To pass options (such as the parser), you will have to call `setOptions`
-	The `output` function has been removed. You should now call `getZip().generate(options)` where the options are documented here: https://stuk.github.io/jszip/documentation/api_jszip/generate.html
-	the qrcode module has been removed, and will be developped in an other package that will be attached to docxtemplater

### From 0.6.0 to 0.7.0

**The QrCode Option had a security issue**. If you don’t upgrade according to this, the functionality should continue to work but the leak will still be there. If you are running in the browser, the vulnerability will not affect you (no access to the filesystem). If the users can’t change the qrCodes or their value, you’re safe too.

If you set qrCode:true, you are affected. The Command Line is not affected as of v0.7.0 (but was on 0.6.3 and less). However the command line as of v0.7.0 is not more able to load images over the filesystem.

You should set qrCode to a function now, according to https://docxtemplater.readthedocs.io/en/latest/configuration.html#image-replacing.
