### 3.14.3

Throw Error with offsets when having loop start tag inside table and loop end tag outside table

### 3.14.2

Update xmlprettify and test it

Update dependencies

### 3.14.1

Add support for `.docm` format

### 3.14.0

Document the usage of PizZip instead of JSZip

### 3.13.6

Improved fix for 3.13.5, to still create a scope but that is the same as the parent scope (without deep copy)

### 3.13.5

Bugfix condition when value is truthy, the subscope was incorrect

(This is a fix on top of 3.13.3, which fixed a bug for the value `true` but not for other truthy values such as integers, strings).

### 3.13.4

Fix support for Node 6 (also for Nashorn): Rebuild js after upgrade to latest babel version

### 3.13.3

Bugfix condition when value is === true, the subscope was incorrect

### 3.13.2

Auto verify moduleAPI version on attachModule

### 3.13.1

Fix undefined is not a function evaluating 'object.getOwnPropertyDescriptors', by downgrading to babel 7.4

### 3.13.0

- Throw multi Error with offsets when having rendering error (makes it possible to use the error location module on rendering errors).

- Avoid false positive error "The filetype for this file could not be identified" when the document uses `<Default>` in the `[Content_Types].xml` file

- Add getFileType module API to add potential support for other filetypes

### 3.12.0

Add support for setting the same delimiter on the start and beginning, for example :

`%user%`, by doing doc.setOptions({delimiters: {start: "%", end: "%"}});

Remove (internal) scopeManager.clone, which is no more used

### 3.11.4

Add offset property to unopened/unclosed loop error

### 3.11.3

Parse selfclosing tag correctly, such as in `<w:rPr><w:noProof/></w:rPr>`

### 3.11.2

- Bugfix issue with conditions in async mode conflicting sometimes

For example with the template :

```
{#loop}
	{#cond2}
		{label}
	{/cond2}
	{#cond3}
		{label}
	{/cond3}
{/loop}
```

and the data :

```
{
	label: "outer",
	loop: [
		{
			cond2: true,
			label: "inner",
		},
	],
}
```

The label would render as `outer` even though it should render as `inner`.

### 3.11.1

- Bugfix speed issue introduced in 3.10.0 for rawXmlModule

### 3.11.0

- Bugfix corruption when using paragraphLoop with a template containing `<w:p>` as direct childs of other `<w:p>`.

- Update getLeft, getRight, getNearestLeft, getNearestRight, getLeftOrNull, getRightOrNull to take into account the nesting of tags.

- Ensure that the `f` functor is always called when using chunkBy (like the native `.map` function)

- In expandOne trait, call `getLeft` before `getRight`

### 3.10.1

- Improve detection of filetype to read information directly from `[Content_Types].xml` instead of from zip files.

### 3.10.0

- WIPED - Published by mistake.

### 3.9.9

- Add support for multiple elements in getRightOrNull and getLeftOrNull (to be able to specify array of elements in traits.expandToOne

- Add postparse to expandToOne

### 3.9.8

- Add `index` and `prefix` property to `render` method in the second argument ( `options.prefix` and `options.render` )

- Make sure that postrender returns an array of the same length as it gets

- Update moduleApiVersion to 3.9.0

### 3.9.7

- Update moduleApiVersion to 3.8.0

### 3.9.6

When using a paragraphLoop inside a table like this :

{#loop} Content {/loop}

When loop was falsey, the table cell caused a corruption in the resulting document.

This now fixes the issue, an empty "<w:p>/w:p" is insereted.

### 3.9.5

Performance fix in inspectModule. This performance fix concerns you only if you do `doc.attachModule(inspectModule)`.

On some templates, and when reusing the same inspectModule instance, the rendering could be very slow (20 minutes in some cases). On a simple test case, the rendering time has decreased from 6 seconds to 90ms.

### 3.9.4

Render all spaces when using linebreak option

### 3.9.3

Remove .babelrc from published module

### 3.9.2

Expose `Lexer` to modules (API Version 3-7-0)

### 3.9.1

Fix issue with nested loops with `paragraphLoop` :

```
{#user}{#pets}
{name}
{/}{/}
```

would produce `No tag "w:p" was found at the left`

It now renders the same way as without paragraphLoop

### 3.9.0

- Add possibility to change the prefix of the rawxmlmodule and of the loopmodule

- In parsed output, also add raw containing the full tag, for example {#loop} will be parsed to : {value: "loop", raw: "#loop"}

### 3.8.4

Fix bug with {linebreaks: true} throwing `a.split is not a function`

### 3.8.3

Add templating of more meta data of the document, including :

Author, Title, Topic, marks, Categories, Comments, Company

### 3.8.2

Fix bug with resolveData algorithm, which raised the error : "Cannot read property value of undefined" in the render call.

### 3.8.1

Fix bug wrong styling when using linebreaks.

### 3.8.0

- Add linebreaks option for pptx and docx

### 3.7.1

Revert : Add back lIndex to parsed in addition to endLindex : Fixes issue with async rendering of multiple tags (images, qrcode, ...)

### 3.7.0

- Add nullGetter module API

- Update inspectModule to have :

  - Unused variables (nullValues)
  - filetype
  - data from setData()
  - templatedFiles
  - list of tags

### 3.6.8

In firefox, fix : `Argument 1 of DOMParser.constructor does not implement interface Principal`

### 3.6.7

Fix issue of remaining `xmlns=""` in some docx files

### 3.6.6

Fix issue with loopmodule eating up whitespace characters

### 3.6.5

Allow to set delimiters to `{start: '<', end: '>'}` #403

### 3.6.4

Add meta context argument to custom parser with information about the tag for each types of tags

### 3.6.3

Fix infinite loop when XML is invalid (throw an explicit error instead)

Fixes https://github.com/open-xml-templating/docxtemplater/issues/398

### 3.6.2

Fix https://github.com/open-xml-templating/docxtemplater/issues/397 : Add more information to `context` in the parser to be able to write `{#users}{$index} - {name}`.

See https://docxtemplater.readthedocs.io/en/latest/configuration.html#custom-parser for full doc.

### 3.6.1

Add `scopeManager` argument to nullGetter to know what variable is undefined.

### 3.6.0

- Move cli out of main repository : https://github.com/open-xml-templating/docxtemplater-cli

- Get meta attributes with raw-xml tag.

### 3.5.2

- Fix #226 when using {@rawXml} tag inside table column, the document is no longer corrupted

### 3.5.1

- Use JSZipUtils in tests

### 3.5.0

- Add resolveData function for async data resolving

- Fix bugs with spacing : Now space="preserve" is applied in the first and last `<w:t>` of each placeholder

### 3.4.3

- Update getAllTags to work with multiple loops by merging fields.

### 3.4.2

- Add getAllTags to inspectModule

- Add base-modules after `loadZip` instead of on `compile`

### 3.4.1

**Breaking change** : The syntax of change delimiter has been changed from :

```
{=<% %>}
```

to:

```
{=<% %>=}
```

To change to `<%` and `%>` delimiters.

The reason is that this allows to parse the delimiters without any assumption.

For example `{={{ }}}` was not possible to parse at version 3.4.0, but by adding the ending equal sign : `{={{ }}=}`, the ambiguity is removed.

### 3.4.0

Add change delimiter syntax from inside template :

For example :

```
* {default_tags}
{=<% %>}
* <% erb_style_tags %>
<%={ }%>
* { default_tags_again }
```

- Add `getTags` to `InspectModule`.

### 3.3.1

- Automatically strip empty namespaces in xml files

- Do not throw postparsed errors for tags that are unclosed/unopened

### 3.3.0

Throw error if the output contains invalid XML characters

### 3.2.5

Take into account paragraphLoop for PPTX documents

### 3.2.4

Correctly replace titles of PPTX documents

### 3.2.3

Add support for Office365 generated documents (with `word/document2.xml` file)

### 3.2.2

- Fix rendering issues with `paragraphLoop`

When setting `paragraphLoop`, the intention is to have a special case for loops when you write :

```
{#users}
{name}
{/users}
```

Eg : both the start of the loop and the end of the loop are in a paragraph, surrounded by no other content. In that particular case, we render the content of the loop (`{name}`) in this use case, in a new paragraph each time, so that they would be no additional whitespace added to the loop.

On version 3.2.1, the paragraphLoop would change the rendering for most of the loops, for example, if you wrote :

```
My paragraph {#users}
{name}
{/users}
```

the paragraphLoop code was triggered, and if users was [], even the text "My paragraph" would be removed, which was a bug.

This release fixes that bug.

### 3.2.1

- Fix bug with tr loop inside `paragraphLoop`

If doing

```
{#par}
======================
| {#row} |  {/row}   |
======================
{/par}
```

An unexpected error 'No "w:tr" found at the left' would be raised.

### 3.2.0

Add `paragraphLoop` option, that permits to have better rendering for spaces (Fixes #272)

It is recommended to turn that option on, because the templates are more readable. However since it breaks backwards-compatibility, it is turned off by default.

### 3.1.12

Inspect postparsed in compile() method instead of render()

### 3.1.11

- Add support for self-closing tag in xmlMatcher -
- Add tag information in parsed/postparsed

### 3.1.10

- Review testing code to always use "real" docx

### 3.1.9

- Add support for setting the prefix when attaching a module.
- Bugfix when looping over selfclosing tag

### 3.1.8

Add error `loop_position_invalid` when the position of the loop would produce invalid xml (for example, when putting the start of a loop in a table and the end outside the loop

### 3.1.7

Use createFolders JSZip option to avoid docx corruption

### 3.1.6

Show clear error if file is ODT, escape " as `&quot;`

### 3.1.5

Template values in docProps/core.xml and docProps/app.xml

### 3.1.4

Add possibility to have RenderingErrors (if data is incorrect)

### 3.1.3

Fix `RangeError: Maximum call stack size exceeded` with very big document

### 3.1.2

Handle unclosed tag <a:t /> and <w:t />

### 3.1.1

Bugfix loop over string value (fixes https://github.com/open-xml-templating/docxtemplater/issues/309\)

### 3.1.0

Add support for multi errors :

docxtemplater doesn't fail on the first error, but instead, will throw multiple errors at the time. See https://docxtemplater.readthedocs.io/en/latest/errors.html for a detailled explanation.

### 3.0.12

Add js/tests to npm package (for modules)

### 3.0.11

Reduce size of the package

### 3.0.10

Reduce size of the package

### 3.0.9

Reduce size of the package (718.9 MB to 1.0 MB), and add prepublish script to ensure the size will never exceed 1.5MB

### 3.0.8

Add expanded property when using expandTo

### 3.0.7

Bugfix : Do not decode utf8 in xmlDocuments

### 3.0.6

- When using getRenderedMap in the modules, we now pass the filepath of the file that will be generated instead of the path of the template.

### 3.0.5

- Remove cycle between traits and docutils
- Make sure fileTypeConfig is uptodate

### 3.0.4

- Autodetection of filetype : if you use pptx, you don't have to write doc.setOptions({fileType: "pptx"}) anymore.

- Intelligent tagging for pptx (Fixes issue #284)

### 3.0.3

- Update documentation
- Completely remove intelligentTagging (which is on for everyone)
- Performance improvements for arrays: prefer push over concat
- Add automatic module wrapping
- Add mecanism to change which files to template with modules

### 3.0.2

- The modules are now ordered in the following order : baseModules, and then attachedModules. Before version 3.0.2, the attachedModules came before baseModules. This fixes : https://github.com/open-xml-templating/docxtemplater-image-module/issues/76

### 3.0.1 [YANKED]

This release was published by error, and should not be used at all.

### 3.0.0

- The rendering of the templates has now multiple steps : Lexing, Parsing, and Rendering. This makes the code much more robust, they might be bugs at the beginning, but in the long run, the code is much easier to understand/debug/change.
- The module system was completely changed, no compatibility is kept between version 2 and version 3, please make sure to update your modules if needed.
- You can't have the same startTag and endTag (for example `$foo$`), because this would make the code more complex and the errorHandling quite impossible.
- All extended features (loop, rawxml, invertedloops), are written as v3 modules. We dogfood our own module system, and will hopefully improve it that way.

- The constructor arguments have been removed, and you are responsible to load the JSZip.

  Instead of :

  ```
  var doc = new Docxtemplater(content);
  ```

  You now should do :

  ```
  var zip = new JSZip(content);
  var doc=new Docxtemplater().loadZip(zip)
  ```

- getTags() has been removed. It is now not easily possible to get the tags. See https://github.com/open-xml-templating/docxtemplater/issues/258 for a alternate solution

The **JSZip version that you use should be 2.x**, the 3.x is now exclusively async, which Docxtemplater doesn't handle yet.

### 2.1.5

- Fix stacktrace not showing up (#245)

### 2.1.4

- Fixed a memory leak when using large document (10Mb document.xml) (#237)
- Add fileTypeConfig options in setOptions to define your own fileType config (#235)

### 2.1.3

- {@rawXml} has been fixed for pptx

### 2.1.2

- Add possibility to close loopTag with {/} #192

### 2.1.1

- Bug fix : Some times, docxtemplater could eat lots of memory due to the new "compilation" feature that was only experimental. As this feature is not yet used, it was completely removed from the codebase.
- Performance : The code has been made a little bit faster.

### 2.1.0

- **Speed Improvements** : docxtemplater had a regression causing it to be slow for loops. The regression would cause the code to run in O(n²) instead of O(n) where n is the length of the loops (with {#users}{name}{/users}. The bug is now fixed, and docxtemplater gained a lot of speed for users of lengthy loops.

### 2.0.0

- **Breaking** : To choose between docx or pptx, you now have to pass docx.setOptions({fileType:'docx'}) where the fileTypes are one of 'pptx', 'docx' (default is 'docx')
- Using es6 instead of coffeescript to code (code is still compiled to es5, to be usable with node v0.{10,12} or in the browser)
- Add finalize step in render function to throw an error if a tag is unclosed
- Module API has been updated, notably the tagXml property doesn't exist anymore, you should use the properties in `fileTypeConfig`
- You should check if your modules have updated for the new module API, for instance, you should use version 1.0 of the docxtemplater image module

For example :

```javascript
var xmlTemplater = this.manager.getInstance("xmlTemplater");
var tagXml = xmlTemplater.fileTypeConfig.tagsXmlArray[0];
```

### 1.2.1

- It is now possible to use tags inside of docx equations

### 1.2.0

- This release adds error management, all errors that are thrown by docxtemplater are now typed and contain additional properties.

### 1.1.6

- fix : When using loops with images inside, the modulemanager was not updated and would continue to return 'image' for the type of the tag even if the type changed

### 1.1.5

- feature : it is now possible to set the nullgetter for simple tags and for raw xml tags.

### 1.1.4

- bugfix for the modulemanager : it was not in sync in some cases

### 1.1.3

- They now is a default value for rawtags {@rawXml}, which is '' (this will delete the paragraph)

### 1.1.2

- bugfix (There was still '{' and '}' hardcoded)

### 1.1.1

- It is now possible to output the delimiters in the output (for example output "Mark } Z" with the template {name}
- scopeManager now doesn't return the string 'undefined' when the parser returns null. That behaviour is moved to the xmlTemplater class

### 1.1.0

- docxtemplater is now much faster to process loops #131
- docutils should not be used any more except for `DocUtils.defaults` (eg docutils is deprecated)
- Module maintainers: please don't rely on docUtils anymore, except for docUtils.defaults
- Some templates would output corrupt templates, this should not happen anymore (if it still does, please open an issue)

Upgrade guide :

- If you use modules (image-module, chart-module, or others) its best to update those because they shouldn't use DocUtils anymore

### 1.0.8

- Add ScopeManager.loopOverValue

### 1.0.7

- {@rawXml} works in pptx
- Created new docxtemplater.com website
- Using mocha instead of jasmine-node
- New FAQ section in docs

### 1.0.6

- Corrupt documents when `<w:t>}{/body}</w:t>`

### 1.0.5

- New events for moduleManager : `xmlRendering` and `xmlRendered`

### 1.0.4

- pptx generation was repaired 2be10b69d47e8c4ba0f541e4d201b29ef6281505
- header generation works with any amount of headers/footers
- slide generation works with any amount of slides

### 1.0.3

- docx.setOptions({delimiters:{start:”[“,end:”]”}}) now works e2d06dedd88860d2dac3d598b590bf81e2d113a6

### 1.0.2

- allowing same tag as start and end delimiter (eg @user@ instead of {user}) 32b9a7645f659ae835fd695e4d8ea99cc6bbec94

### 1.0.1

- made it possible to use objects to loop over (eg {#user} {name} {/user}) 97411cb3537be08f48ff707ac34d6aac8b008c50

### From 0.7.x to 1

- docxtemplater doesn’t depend on fs anymore, for transparency and security reasons.
- `loadFromFile` has been removed. You now just have to pass the content to Docxtemplater’s constructor.
- `setTags` has been renamed to `setData`
- `applyTags` has been renamed to `render`
- the constructor has changed: eg `new Docxtemplater(content,options)` will now call `JSzip.load(content,options)`.
- To pass options (such as the parser), you will have to call `setOptions`
- The `output` function has been removed. You should now call `getZip().generate(options)` where the options are documented here: https://stuk.github.io/jszip/documentation/api_jszip/generate.html
- the qrcode module has been removed, and will be developped in an other package that will be attached to docxtemplater

### From 0.6.0 to 0.7.0

**The QrCode Option had a security issue**. If you don’t upgrade according to this, the functionality should continue to work but the leak will still be there. If you are running in the browser, the vulnerability will not affect you (no access to the filesystem). If the users can’t change the qrCodes or their value, you’re safe too.

If you set qrCode:true, you are affected. The Command Line is not affected as of v0.7.0 (but was on 0.6.3 and less). However the command line as of v0.7.0 is not more able to load images over the filesystem.

You should set qrCode to a function now, according to https://docxtemplater.readthedocs.io/en/latest/configuration.html#image-replacing.
