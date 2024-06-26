### 3.48.0

Allow to configure the behavior of the "change delimiter syntax".

As documented here :

https://docxtemplater.com/docs/tag-types/#set-delimiter

You can for example use :

```
{=[[ ]]=}
[[name]]
```

It is possible to change the special behavior that will catch tags that start with a "=".

It is either possible to set the `syntax.changeDelimiterPrefix` to null so that it won't be possible to change the delimiters inside the template, or you can change the char that is used.

For example :

```js
const doc = new Docxtemplater(zip, {
  syntax: {
    changeDelimiterPrefix: null,
  },
});
```

or

```js
const doc = new Docxtemplater(zip, {
  syntax: {
    changeDelimiterPrefix: "$",
  },
});
```

### 3.47.4

Add correct typescript typings for `isIdentifierStart` and `isIdentifierContinue`.

### 3.47.3

Improve getStructuredTags and getTags of the inspectModule to allow to get tags present in image attributes.

(This is to work together with the image-module 3.28.0)

### 3.47.2

Bugfix internal api mechanism :

It internally allows to have multiple traits.expandToOne().

Fixes bugs with the subtemplate and subsection module.

Update moduleApiVersion to 3.40.0.

### 3.47.1

If zip file is not a docx file, show the following error message now :

`The filetype for this file could not be identified, is this file corrupted ? Zip file contains : world.txt,xxx.log`

In previous versions, the following message was shown :

`The filetype for this file could not be identified, is this file corrupted ?`

### 3.47.0

Make it possible to dynamically allow to use a given tag for a module.

For example, you can write :

```js
const doc = new Docxtemplater(zip, {
  modules: [
    {
      optionsTransformer(options, doc) {
        doc.modules.forEach(function (module) {
          if (module.name === "RawXmlModule") {
            module.prefix = function (placeholderContent) {
              if (placeholderContent === "raw") {
                return "raw";
              }
              if (placeholderContent[0] === "@") {
                return placeholderContent.substr(1);
              }
            };
          }
        });
        return options;
      },
    },
  ],
});
```

This code means that if you write : {raw} in your document (without the "@" prefix), that tag will be used as a rawxml tag.

### 3.46.2

Add "synced-zip" event that is run right after the zip is prepared.

Update moduleApiVersion to version 3.39.0, which is used by the latest subtemplate module.

### 3.46.1

Fix typescript issue with TxtTemplater

### 3.46.0

When using a loop inside a powerpoint table, if the result is an empty table, correctly drop the table from the presentation.

### 3.45.1

Add getObjectIdentifiers to expressionParser, which can be used like this :

```js
const expressionParser = require("docxtemplater/expressions.js");
expressionParser("a.b.c").getObjectIdentifiers();
// returns { a: { b: { c: {} } } }
```

### 3.45.0

Bugfix for proofstate module : Following error was thrown when using this module :

`Unnamed module`

Now the module should work correctly

### 3.44.0

Make it possible to configure the angular parser for just one docxtemplater instance.

(This needs angular-expressions version 1.2.0)

Use following code :

```js
const expressionParser = require("docxtemplater/expressions.js");
new Docxtemplater(zip, {
  parser: expressionParser.configure({
    csp: true, // this disables the use of "new Function", useful for Vercel, Deno, ...
    filters: {
      uppercase: (input) => {
        if (typeof input === "string") {
          return input.toUpperCase();
        }
        return input;
      },
    },
  }),
});
```

### 3.43.1

Improve Typescript support to use the NodeNext moduleResolution setting.

See [the explanation here](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/MissingExportEquals.md).

Fixed in [this pull request](https://github.com/open-xml-templating/docxtemplater/pull/742) thanks to @benasher44.

### 3.43.0

Add getResolvedId calculation in docxtemplater to all template parts so that
all modules can store a value for each templated part. This value is guaranteed
to be the same for a given {placeholder} and data attribute between `resolve`
and `render`.

### 3.42.7

Throw specific error if two modules with the same name are attached.

Bugfix issue on TxtTemplater when using `{paragraphLoop: true}`.

### 3.42.6

Bugfix of internal API change, which was published in v3.42.5

### 3.42.5

Bugfix for TxtTemplating :

```js
const TxtTemplater = require("docxtemplater/text.js");
```

The following template :

```
<p>Foobar</p>
```

Would be rendered as :

```
<p&gt;Foobar</p&gt;
```

Also, errors such as unclosed loops, like in :

```
{#users}Foo
```

would produce an internal stacktrace.

Now, a MultiError is thrown which contains the list of all errors inside `error.properties.errors`

### 3.42.4

Avoid issue `Cannot read properties of undefined (reading 'length')` when using `renderAsync`.

Now, the correct error message should be shown.

### 3.42.3

Bugfix to avoid following error when runnig `iModule.getStructuredTags()` :

```
TypeError: Cannot read properties of undefined (reading 'replace')
```

Now, the tags are correctly returned.

### 3.42.2

Bugfix to add clone method to the assertion module and to the inspect module

### 3.42.1

Bugfix for inspect module when used together with qrcode/xlsx or table module, in some specific cases, the getTags function would return values correctly, but also return a key named "undefined", like this :

```js
const tags = iModule.getAllTags();
console.log(tags); // would return : { name: {}, undefined: {}}
```

In order to apply the fix, you have to update the following modules (if you use them) :

- qrcode module to 3.4.7
- table module to 3.19.9
- xlsx module to 3.14.2

### 3.42.0

[Internal] Add filePath to each "inspect" call, which fixes a bug with the chart module when used together with the "getTags" feature of the inspect module.

If you update to this version, it is important that you also upgrade following modules if you use them :

- slides module to version 3.5.3
- pptx-sub module to version 3.1.4

### 3.41.0

Correctly show error in a multi error if the scope parser execution fails inside the render function

Previously, following error was thrown :

```error
Error: Scope parser execution failed
   at new XTScopeParserError (....)
```

with following template :

```txt
{#users | sortBy:'foo'}
Foo
{/}
```

```
expressionParser.filters.sortBy = function (input, ...fields) {
    if (!input) return input;
    return sortBy(input, fields);
};
```

(when sortBy is not imported correctly).

Now, the error will show a multierror with the list of errors that are happening + the tags that are causing the error.

Add support for angularExpressions.compile(), angularExpressions.Parser, and angularParser.Lexer

### 3.40.3

Fix issue when having {tag} inside title in pptx (or docx) and using the linebreak option.

### 3.40.2

Bugfix to not add "w:sdt" inside "w:sdtContent".

Fixes a corruption on a particular type of document.

### 3.40.1

Bugfix when using docxtemplater asynchronously, and having some module inside a loop.

The "contentType" and some other properties were not transfered correctly to the elements inside the loop.

This specifically caused an issue in the HTML module to return the correct pageHeight inside the `getSize` and `getImage` function.

This could also lead to some other bugs that were happening only when having some specific tag present in the loop.

### 3.40.0

- In previous versions the following code will throw an error:

  ```js
  new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: {
      start: "$(",
      end: ")",
    },
  });
  ```

  ```template
  $(last_name) $(first_name)

  Some text (Some text)  Some text

  $(last_name) $(first_name)

  ```

  ```js
  MultiError
  {
    name: "TemplateError",
    id: "unopened_tag",
    explanation: "The tag beginning with \") Some text\" is unopened"
  }
  ```

  The syntax can now be made more lenient to permit closing tags even when there are no corresponding opening tags. In your code, write :

  ```js
  new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,

    syntax: {
      allowUnopenedTag: true,
    },
  });
  ```

  For now, the only available property for `syntax` object is `allowUnopenedTag` (it makes it possible to use the end delimiter tag as a text and not to parse it as a closing tag and cause syntax error). Fixes https://github.com/open-xml-templating/docxtemplater/issues/726.

  The default behavior for the parser without setting the syntax option is the same as in 3.39.2, meaning without the `syntax.allowUnopenedTag: true` option, placeholders that are closed but not opened will throw an error.

- Internal: Refactor `getDelimiterErrors` function to be cleaner and more performant
- Internal: Add tests for new functionality

### 3.39.2

- Internal: Remove mergeObjects from doc-utils.js
- Internal: Small refactoring in regex
- Internal: Avoid calling dropUnsupportedFileTypesModules too many times

### 3.39.1

Always add {tag} in second argument to parser, like this :

```js
parser(tag, options) {
    console.log(options.tag.module); // for image tag, it will log "open-xml-templating/docxtemplater-image-module"
}
```

### 3.39.0

Add `preResolve` API for modules that allows to run some code before the calls to resolve.

Update moduleApiVersion to version 3.37.0

### 3.38.0

Add support for templating content which is in comments.

### 3.37.14

Bugfix following error, when calling `setOptions` and then `getFullText` :

```
Cannot read properties of null (reading 'tagsXmlTextArray')
    at XmlTemplater.getFullText (es6/xml-templater.js:53:56)
    at Docxtemplater.getFullText (es6/docxtemplater.js:484:5)
```

### 3.37.13

In powerpoint, the inspect module will now return correctly for the `getAllTags` and `getStructuredTags` methods :

For this to work, you need to install version 3.4.10 of slides module or above.

For following template with the slides module attached :

```
{:loop}
{$index}{name}
```

The output of `inspectModule.getAllTags()` will now be :

```js
{
    loop: {
        $index: {},
        name: {},
    },
}
```

### 3.37.12

For the following template

```template
Hi {#products}{# .  }-{ . }-{/}{/}
```

This did not work correctly with following data with expressions parser :

```js
doc.render({
  products: [
    [1, 2, 3, 4],
    [4, 5, 6, 7],
  ],
});
```

It rendered :

```
Hi -1,2,3,4--4,5,6,7-
```

(which is incorrect)

This is because the `docxtemplater/expressions.js` parser was returning an object instead of the array in this case.

### 3.37.11

Update handling of "." in angular parser.

Docxtemplater now supports the following expression :

```template
{ . | myFilter }
```

This is the same as :

```template
{ this | myFilter }
```

Also, the following will also work now to access the "user-name" property of the root object (synonym of `this["user-name"]` :

```template
{.["user-name"]}
```

### 3.37.10

Important bugfix for modules, if you are still using the legacy constructor (eg if you still have `attachModule` somewhere in your code.

For example, one issue that could happen is with the HTML module, you could have following stacktrace :

```txt
Cannot read property 'getElementsByTagName' of undefined` error
```

This would happen when adding lists, and only if you're using one of following methods : `attachModule`, `setOptions`, or `loadZip`.

### 3.37.9

Update to render parts of the documents in the most natural order :

First all header parts, than the main document body, than the footer part.

### 3.37.8

When using the following code :

```js
const expressionParser = require("docxtemplater/expressions.js");
const doc = new Docxtemplater(zip, { parser: expressionParser });
doc.render();
```

This would always fail (when the scope was not set), but this should be allowed.

This will now work correctly.

### 3.37.7

Correctly calculate the endLindex for loop module.

This fixes a bug of the Segmentmodule (part of the subtemplate module) where the segment would show wrongly an error of "Unclosed loop" when using the segment module with following template :

```template
{:segment s}
{#loop}{#loop}{value} {/}{/}
{:segment/}
{#loop}
{:includesegment s}
{/}
```

This fix also needs the latest subtemplate module : version 3.12.3

### 3.37.6

Template docProps/app.xml before word/document.xml.

This way, users can write assignments in the word/settings.xml, and
use the exposed variables in the word/document.xml

With 3.37.5, require("docxtemplater/text") would throw the following error :

```
Cannot find module './lexer.js' from 'node_modules/docxtemplater/text.js'
```

This is now fixed in version 3.37.6

### 3.37.5

The TxtTemplater feature is now available using `require("docxtemplater/text")`

```js
const TxtTemplater = require("docxtemplater/text.js");
const doc = new TxtTemplater("Hello {user}, how are you ?");
const result = doc.render({ user: "John" });
console.log(result); // Shows : "Hello John, how are you ?"
```

Previously this was only available at "docxtemplater/js/text.js", but now both are supported.

### 3.37.4

Add typings definitions for `docxtemplater/js/text.js` (Fixes #715)

### 3.37.3

Add better typings to expressions.js (including typings for filters).

### 3.37.2

Add support to get identifiers when using the `docxtemplater/expressions.js` package :

```js
const expressionParser = require("docxtemplater/expressions.js");
const identifiers = expressionParser("x+0+users").getIdentifiers();
// identifiers will be : ["x", "users"]
```

### 3.37.1

Add typescript typings to expressions.js

### 3.37.0

Improve the way {$index} is handled with the expressions parser.

Previously, if you wrote the following :

```template
{#todos}
{#important}{$index}.! {text}{/}
{^important}{$index}. ({text}){/}
{/}
```

The `$index` value would always be equal to `0`.

This was because the `$index` would use the closest condition or loop.

Now, the library will look whether the `{#important}` is using an array or a boolean. Only for arrays will it calculate the `{$index}`, it will ignore any section that is a condition.

This means that the output of the following will correctly be :

```output
0.! Do the dishes
1.! Invite XYZ 2. (Other thing)
```

Previously, the same template would show just 0 for the index.

### 3.36.1

Bugfix when using following in the template :

```txt
{this["first name"]}
```

With following file :

```js
doc.render({
  "first name": "John",
});
```

This was incorrectly rendering undefined.

The bug was present since version 3.32.0

Version 3.31.6 and before were not affected by this bug.

Now, the code will correctly render : "John" in this case

### 3.36.0

Bugfix issue #707 : Correctly handle usage of {#.}{.}{/} with angular parser

### 3.35.0

Update moduleApiVersion to version 3.36.0

- Now the modules that define their `supportedFileTypes` will correctly be removed if the filetype does'nt match even when using the `attachModule` API.

- Bugfix in FixDocPRCorruptionModule : when using the following code :

  ```js
  const fixDocPrCorruption = require("docxtemplater/js/modules/fix-doc-pr-corruption.js");
  const doc = new Docxtemplater(zip, { modules: [fixDocPrCorruption] });
  ```

  The issue was that if you attached the same module to multiple docxtemplater instances in parallel, because of badly handled state, the state for the fixDocPrCorruption was overwritten

  ```js
  const doc1 = new Docxtemplater(zip, { modules: [fixDocPrCorruption] });
  const doc2 = new Docxtemplater(zip, { modules: [fixDocPrCorruption] });
  doc1.render(); // In this situation, the fixDocPrCorruption would use data from the doc2, which is incorrect, and could result in a corrupt document
  ```

  Now, the fixDocPrCorruption can be used on multiple docxtemplater instances without causing any issue.

### 3.34.3

Fix typescript definition for constructor / zip instance.

Allows to correctly autocomplete after doing `doc.getZip().generate()`

Thanks to @oleksandr-danylchenko https://github.com/open-xml-templating/docxtemplater/pull/704

### 3.34.2

Fix typescript definition for `getAllStructuredTags` : remove file argument.

Fixed in #702 thanks to @oleksandr-danylchenko

### 3.34.1

Bugfix in `require("docxtemplater/expressions.js")` :

Avoid error const expressionParser = require("docxtemplater/expressions.js");

```
TypeError: 'set' on proxy: trap returned falsish for property 'x'
```

This will no more happen now, in the case where for example you wanted to set a property to any falsy value, like this :

{x=0}

### 3.34.0

Add support to reorder modules automatically using module.priority.

Fetch data from `_rels/.rels` and pass it to each module function using the `relType` attribute.

Fixes issue in HTML module for some particular input that contains some `tp/document-orig.xml` file.

### 3.33.0

Add support for templating text files (or simple strings).

Usage is like this :

```js
const TxtTemplater = require("docxtemplater/js/text.js");
const doc = new TxtTemplater("Hello {user}, how are you ?");
const result = doc.render({ user: "John" });
console.log(result); // Shows : "Hello John, how are you ?"
```

This also works with loops and options can be set (parser for angular expressions)

### 3.32.6

Automatically template footnotes

### 3.32.5

When having a comment inside a placeholder, the document could get corrupt.

This is now fixed.

### 3.32.4

Update resolveOffset algorithm to improve slides module compatibility.
Internal update of moduleApiVersion to 3.34.0

### 3.32.3

Bugfix of version 3.32.2, 3.32.1, 3.32.0

When using this document :

```txt
Hello {name}!
```

if the data is `{ name: "" }` with the "docxtemplater/expresssions.js" option, the tag will render the following :

```txt
Hello !
```

In version 3.32.2, this would have rendered `Hello undefined!` which is incorrect.

### 3.32.2

Bugfix of version 3.32.1 and 3.32.0.

Correctly expose `require("docxtemplater/expressions.js")`.

### 3.32.1

Add support to accented characters in tags when using the "docxtemplater/expressions.js" parser.

Tags such as {être} will not throw an error.

### 3.32.0

Expose "docxtemplater/expressions.js" to simplify the parser option for angular parser.

You now can replace your angularParser code with the following :

```js
const expressionParser = require("docxtemplater/expressions.js");
new Docxtemplater(zip, { parser: expressionParser });
```

For IE11 or other runtimes that do not support "Proxy", you can use instead :

```js
const expressionParser = require("docxtemplater/expressions.js");
new Docxtemplater(zip, { parser: expressionParser });
```

Both examples require the `angular-expressions` package which is an external dependency :

```bash
npm install --save angular-expressions
```

### 3.31.6

Add `replaceFirstSection` and `replaceLastSection` booleans types for typescript and the subsection module.

### 3.31.5

Bugfix for pptx files not keeping correct font properties (font-size) when using `{linebreak: true}` option.

### 3.31.4

Bugfix to correctly handle empty loops.

Fixes https://github.com/open-xml-templating/docxtemplater/issues/680

Previously the following stack trace would be shown :

```txt
TypeError: Cannot read properties of undefined (reading 'lIndex')
    at .../docxtemplater/js/modules/loop.js:331:42
    at Array.some (<anonymous>)
    at LoopModule.postparse (.../docxtemplater/js/modules/loop.js:322:15)
    at .../docxtemplater/js/parser.js:226:24
    at Array.reduce (<anonymous>)
    at _postparse (.../docxtemplater/js/parser.js:225:22)
    at postparse (.../docxtemplater/js/parser.js:228:20)
    at .../docxtemplater/js/modules/expand-pair-trait.js:268:30
    at Array.reduce (<anonymous>)
    at Object.postparse (.../docxtemplater/js/modules/expand-pair-trait.js:248:32)
```

Now the template is rendered correctly.

### 3.31.3

Bugfix for table module : merge-cells-col did not work correctly when placed inside a loop.

Fixes : https://github.com/open-xml-templating/docxtemplater/issues/671

### 3.31.2

Bugfix to avoid throwing following error :

```
New Delimiters cannot be parsed
```

When the template contains an equal sign right after a closing tag.

For example, the following template would throw that error in previous versions :

```
Hello {name}===
```

Now, no error is thrown.

### 3.31.1

Correctly handle case when having a manual section break of type "nextPage", that is within a loop.

Add "cp:contentStatus" to templated tags

### 3.31.0

When having a table, that after the generation, has no table rows (<w:tr> elements), the whole `<w:tbl>` element is dropped.

This automatically fixes a corruption that would happen when using a loop within table rows.

If you are using the subtemplate module, you have to update to subtemplate module 3.11.3

### 3.30.3

Throw an error when calling `doc.render()` twice on the same instance.

### 3.30.2

Bugfix in fix-doc-pr-corruption module to work with xmlDocuments too.

### 3.30.1

Bugfix to correctly add `xml:space="preserve"` for each type of placeholder, not just for the loop module.
This fixes spacing issues that happened rarely in many modules that have an "inline mode" (word-run, image, html, styling, paragraph-placeholder).

### 3.30.0

Make it possible to have a tag that contains multiple lines, like this :

```txt
Hello {
    name = "John";
	name;
}, how are you ?
```

And remove the paragraphs correctly.

Internal update of moduleApiVersion to 3.33.0

After upgrading this, you will need to upgrade :

- image-module to 3.14.2 or higher
- xlsx-module to 3.10.2 or higher
- styling-module to 3.6.14 or higher

### 3.29.5

Bugfix to make loop module work well even on dotx files.

Internal update of moduleApiVersion to 3.32.0

### 3.29.4

Improve corruption handling of adding `<w:p/>` after some tables, even when the table is added inside a loop.

### 3.29.3

Avoid corruption when having a table without a `<w:p/>`. This corruption only happens on very rare cases, for example when having a table containing a table that has no paragraph after it.

### 3.29.2

With the paragraphLoop option turned on, when using a loop that was containing a selfclosing paragraph : `<w:p/>`, the generated output could become corrupt.

Now the output is valid.

### 3.29.1

Handle following input when using loops with array :

```
{#users}
Hello {name}
{/users}
```

```js
doc.renderAsync({
  users: [
    new Promise((resolve, reject) => {
      resolve({ name: "John" });
    }),
    new Promise((resolve, reject) => {
      resolve({ name: "Mary" });
    }),
  ],
});
```

### 3.29.0

Log errors on multiple lines instead of on one line.

Previously, error messages were shown in one line only, making the output hard to read.

Now, error messages are shown on multiple lines, using normal JSON indentation.

You can use the previous behavior (one big JSON line) by writing the following :

```js
var doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
  errorLogging: "jsonl", // JSONL stands for JSON Line, one big JSON entry on a single line
  // Other options for errorLogging are false which means do not log anything, or "json" (which is now the default)
});
```

### 3.28.6

Template document properties that are set inside `<vt:lpwstr>` in docProps/custom.xml

### 3.28.5

Add slideLayout files to list of templated files

Internal update of moduleApiVersion to 3.31.0

### 3.28.4

Bugfix issue introduced in 3.28.3 when using expandOne trait

### 3.28.3

Update expandOne trait to work even when having nested `<w:p>` and `<w:txbxContent>` tags

Fixes issue in the styling module in particular.

This release might slow down documents having many rawxml tags

### 3.28.2

Throw specific error when using rawxml tag and the type of the output is not a string.

For example, if you do the following :

```txt
{@raw}
```

```js
doc.render({
  raw: 42,
});
```

This will throw the following error :

`Non string values are not allowed for rawXML tags`

### 3.28.1

Typing files : make them Typescript 3.x compatible (a change in 3.28.0 of docxtemplater made the typings only work with typescript 4+)

Add type for "errorLogging" parameter

### 3.28.0

Internal update of moduleApiVersion to 3.30.0

Add `matchers` API for modules, to replace the internal `parse` function.

This internal change fixes bugs that can be triggered between for example the SlidesModule and the TableGridPptxModule.

When two modules have two prefixes that contain each other, for example the SlidesModule has a prefix of `:` as in `{:users}`, and the TableGridPptxModule is `:#` as in `{:#1}`.

In versions before this version, the tag `{:#1}` would be Interpreted as a SlidesModule tag depending on the order of the modules.

Since this version, the `matchers` API makes it possible for docxtemplater to intelligently decide that the tag belongs to the TableGridPptxModule.
The algorithm used is to use a "priority" integer if present, or to use the tag that has the longest prefix.

This change requires updates in following modules :

- chart 3.4.0 or higher
- footnotes 3.3.0 or higher
- html-pptx 3.3.0 or higher
- html 3.29.0 or higher
- image 3.12.0 or higher
- paragraph-placeholder 3.3.0 or higher
- pptx-sub 3.1.0 or higher
- slides 3.4.0 or higher
- styling 3.5.0 or higher
- subsection 3.5.0 or higher
- subtemplate 3.9.0 or higher
- table 3.15.0 or higher
- word-run 3.2.0 or higher
- xlsx 3.8.0 or higher

### 3.27.2

Internal bugfix that would show a stacktrace instead of the real underlying RenderingError.

The stacktrace was "Cannot read property indexOf of undefined" in the `isStarting` function

Tag names containing "non-breaking-spaces" (Ascii code 160) will be converted to normal spaces.

### 3.27.1

Bugfix issue introduced in 3.27.0

When using the option `{linebreaks: true}`, documents could be made corrupt on version 3.27.0

This version fixes the corruption

### 3.27.0

Internal update of moduleApiVersion to 3.29.0

Add support to output docx files that are bigger than 500MB.

Please make sure to update the following modules if you use them :

- chart 3.3.0 or higher
- error-location 3.4.0 or higher
- html 3.28.0 or higher
- image 3.11.0 or higher
- subsection 3.4.0 or higher
- subtemplate 3.8.0 or higher
- table 3.14.0 or higher
- styling 3.4.0 or higher

Previously, after a certain limit (usually about 500MB), the error "Invalid String Length" would be thrown by Node, because that is the max string length allowed.

Fixes issue reported here : https://stackoverflow.com/questions/68578216/docxtemplater-rangeerror-invalid-string-length

A test has been created, which you can run with `npm run memorytest` if you clone this repository. It will create a file of about 550MB. This test need more memory than the default tests, and takes about 75 seconds on my computer.

### 3.26.4

Bugfix to template header and footers created by Office365.

Previously, only files matching header\d.xml would be templated.
Now, also header.xml (without any digit) will be templated.

### 3.26.3

Bugfix issue when having tab character in the document, that would, after rendering, appear as "&#9;" in the document.

When updating to this version, you also need to update

- the xlsx module to 3.7.2
- the error-location module to 3.3.1

Internal update of moduleApiVersion to 3.28.0

### 3.26.2

Bugfix issue "Cannot read property 'tag' of undefined" when having an empty condition, like :

```
Hello {#a}{/a}
```

Altough there is not really a good reason to create such an empty condition, it is better to not fail with an obscure error message.

### 3.26.1

Add code for fix-doc-pr-corruption accessible by doing :

```js
const fixDocPrCorruption = require("docxtemplater/js/modules/fix-doc-pr-corruption.js");
const doc = new Docxtemplater(zip, { modules: [fixDocPrCorruption] });
```

### 3.26.0

Add automatic error logging using console.log to make code samples easier.

You can replace the following code :

```js
// The error object contains additional information when logged
// with JSON.stringify (it contains a properties object containing all suberrors).
function replaceErrors(key, value) {
  if (value instanceof Error) {
    return Object.getOwnPropertyNames(value).reduce(function (error, key) {
      error[key] = value[key];
      return error;
    }, {});
  }
  return value;
}

function errorHandler(error) {
  console.log(JSON.stringify({ error: error }, replaceErrors));

  if (error.properties && error.properties.errors instanceof Array) {
    const errorMessages = error.properties.errors
      .map(function (error) {
        return error.properties.explanation;
      })
      .join("\n");
    console.log("errorMessages", errorMessages);
    // errorMessages is a humanly readable message looking like this:
    // 'The tag beginning with "foobar" is unopened'
  }
  throw error;
}

var zip = new PizZip(content);
var doc;
try {
  doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
} catch (error) {
  // Catch compilation errors
  // (errors caused by the compilation of the template: misplaced tags)
  errorHandler(error);
}

try {
  // render the document
  // (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
  doc.render({
    first_name: "John",
    last_name: "Doe",
    phone: "0652455478",
    description: "New Website",
  });
} catch (error) {
  // Catch rendering errors
  // (errors relating to the rendering of the template:
  // for example when the angularParser throws an error)
  errorHandler(error);
}
```

to this :

```js
var zip = new PizZip(content);
var doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
});

// render the document
// (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
doc.render({
  first_name: "John",
  last_name: "Doe",
  phone: "0652455478",
  description: "New Website",
});
```

To disable this automatic errorLogging, use :

```js
var doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
  errorLogging: false,
});
```

### 3.25.5

Add specific error message when using a module without instantiating it.

When doing :

```js
const HtmlModule = require("docxtemplater-html-module");
const doc = new Docxtemplater(zip, { modules: [HtmlModule] });
```

The error message shown will now be :

```
Cannot attach a class/function as a module. Most probably you forgot to call new on the module.
```

If you get this error, you should simply write :

```js
const HtmlModule = require("docxtemplater-html-module");
const doc = new Docxtemplater(zip, { modules: [new HtmlModule()] });
```

### 3.25.4

Bugfix when having loop containing hebrew, the text would be escaped once for each iteration

The regression was introduced in version 3.25.2 and is now fixed

### 3.25.3

Fix issue in rendering of tables generated with loop module for Powerpoint documents by deduplicating a16:rowId tags.

Previously, when having a loop, the following would be generated :

```
<a:tr>
<a:t>Content</a:t>
<a:extLst>
<a:ext>
	<a16:rowId val="1379104516"/>
</a:ext>
</a:extLst>
</a:tr>
<a:tr>
<a:t>Content</a:t>
<a:extLst>
<a:ext>
	<a16:rowId val="1379104516"/>
</a:ext>
</a:extLst>
</a:tr>
```

The duplicate `val` attribute for the a16:rowId caused rendering issues on office live.

Now, the values are incremented after each loop, like this :

```
<a:ext>
	<a16:rowId val="1379104516"/>
</a:ext>
<a:ext>
	<a16:rowId val="1379104517"/>
</a:ext>
```

### 3.25.2

When having a loop inside a pptx table, the height of the frame was not updated if a tag in the form of : `<a:ext uri="{11111111-1111-1111-1111-111111111111}">` was present in the document.

Now, those tags are ignored and the height of the table should be updated appropriately.

### 3.25.1

When having a loop inside a pptx table, the height of the frame will automatically be updated if some rows are added or removed.

In previous versions, the table would keep the previous height, meaning the added rows would not be shown, except after forcing a rerendering of the table by changing the fontsize.

### 3.25.0

Add support for "lambdas", eg if a value in the data is a function, that function will be called with the `scope` and the `scopeManager`.

You now can write :

```js
const doc = new Docxtemplater(zip);
doc.render({
  userGreeting: (scope) => {
    return "How is it going, " + scope.user + " ? ";
  },
  users: [
    {
      name: "John",
    },
    {
      name: "Mary",
    },
  ],
});
```

With the following template :

```txt
{#users}
{userGreeting}
{/}
```

### 3.24.0

Add support to remove the call to `setData` or `resolveData`.

(The setData function and resolveData will still work, but will be dropped in Docxtemplater v4)

You can now do :

```js
const doc = new Docxtemplater(zip, { linebreaks: true });
doc.render({
  user: "John",
});
```

or, in the async version :

```js
const doc = new Docxtemplater(zip, { linebreaks: true });
doc
  .renderAsync({
    user: new Promise(function (resolve, reject) {
      resolve("John");
    }),
  })
  .then(function () {
    const zip = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });
  });
```

### 3.23.2

Bugfix error : `Cannot read property 'type' of undefined` when having a loop inside a loop that has an empty content, such as :

```
{#a}
{#b}{/}{/}
```

### 3.23.1

Add typescript typings to InspectModule

### 3.23.0

Internal cleanup :

- Remove internal unused function `getNearestLeftIndex`, `getNearestRightIndex`, `getNearestLeftIndexWithCache`, `getNearestRightIndexWithCache` from doc-utils.

- Add explanation to all errors that have id

### 3.22.8

Use @xmldom/xmldom instead of xmldom

See : https://github.com/xmldom/xmldom/issues/271

### 3.22.7

Bugfix to avoid loosing an image that is contained inside a paragraph loop.

The image would disappear only when the image was followed directly by the end of the loop, like this :

```
{#loop}
[IMAGE]
{/loop}
```

### 3.22.6

Bugfix to avoid error message `Cannot read property 'offset' of undefined` on some rare templates.

The internal `mergesort` function had a bug.

### 3.22.5

Bugfix to avoid dropping section when having a loop right before a section break

### 3.22.4

When having a loop containing a page section break, the generated document had continuous section breaks in the output.

With this version, the page section break should be rendered as page section breaks, and create as many pages as there are items in the loop.

### 3.22.3

Update InspectModule to make getTags function work well with XLSXModule

### 3.22.2

Disallow calling loadZip if using v4 constructor

### 3.22.1

Correctly handle `<<tag>>` delimiters when saved in word as `&lt;&lt;tag>>` Fixes #606

### 3.22.0

- Add resolveOffset internal property on scope managers to be able to handle the slides loop case correctly.
- Update moduleApiVersion to 3.26.0.

### 3.21.2

Internal change to allow to match tags with non-breaking space.

When entering `Ctrl+Shift+Space`, a "non-breaking" space is created.

When using a non-breaking space in the tag `{:subtemplate doc}`, or `{:table data}, the tag would not be replaced correctly. You need to upgrade the PRO modules as well to their latest version in order to fix the bug.

### 3.21.1

Bugfix issue with spaces that would disappear after rendering :

Correctly add xml:space="preserve" to all relevant w:t tags, ie all `<w:t>` tags that contain a placeholder.

### 3.21.0

Update algorithm for loops to have more chance to show the underlying error.

For example, with the following template :

```
{#a}
	{#b}
		{#c}
		{/d}
		{/d}
		{/c}
	{/b}
{/a}
```

The algorithm will now show that the {/d} tags are involved in the issue.

### 3.20.1

Automatically add empty paragraph after table if the table is the last element in a document.

### 3.20.0

Change how the resolve algorithm works internally.

This fixes a bug in the slides module and image module, when used together, in async mode, where all image tags coming after a condition or loop would not be shown.

Because this induces an internal incompatible change, if you use the footnotes module, you have to upgrade the footnotes module to the version 3.2.0

Update moduleApiVersion to 3.25.0.

### 3.19.10

When having a document that has breaks to change the amount of columns, and loops surrounding the breaks, some pagebreaks could appear in the document.

Now, the section breaks should no more be transformed into page breaks.

### 3.19.9

When having a document containing a table like this :

```
================================
| {#users} abc                 |
--------------------------------
| {/users}{#cond} def {/cond}  |
================================
```

Docxtemplater will now throw an error : `id: "unbalanced_loop_tags"`,
and explanation: `Unbalanced loop tags {#users}{/users}{#cond}{/cond}`,

In previous versions, this would most likely lead to a corrupt document.

The reason is that when a loop tag is spanning across multiple cells of a table, it will automatically expand to "row-mode", eg it will create 2 rows for each user in the users iterable.

However, the {#cond} loop tag is in one single cell, hence it will not expand to "row-mode".

Instead, the template should be written like this if the cond loop should be part of the users loop :

```
================================
| {#users} abc                 |
--------------------------------
| {#cond} def {/cond}{/users}  |
================================
```

or like this if the loops are to be kept separate

```
===========================
| {#users} abc {/users}   |
---------------------------
| {#cond} def {/cond}     |
===========================
```

### 3.19.8

Don't override global configuration for docx/pptx when using a module, instead, a new fresh configuration is passed to a docxtemplater instance.

### 3.19.7

Fail with a clear error message when instantiating Docxtemplater with a null value, like this :

```
new Docxtemplater(null);
```

This will now throw :

```
The first argument of docxtemplater's constructor must be a valid zip file (jszip v2 or pizzip v3)
```

### 3.19.6

Fix speed regression when having big document with many rawxml tag.

This was caused by the fact that expandToOne was a recursive function.

Now that the function uses simple for loop, the rendering is way faster.

If you use the PRO word-run module, you should update the word-run-module to version 3.1.1

### 3.19.5

Bugfix when data contains double array, the scope parser would not do the right thing.

With the following template + data :

```
{#a}{.}{/a}
```

and the following data :

```
{ a: [[ "b", "c"]] }
```

This would render just the "c", but it should render the array `[ "b", "c" ]` which will render as `b,c`

### 3.19.4

Avoid corruption when having self closing `<w:sdtContent/>` in the document.

### 3.19.3

Throw an error when calling render on an invalid template.

Before this version, it was possible to do the following on an invalid template :

```
try {
    doc.compile();
}
catch (e) {
    doc.render();
}
```

And, this would produce, most of the times, a generated document that is corrupted.

Now, `doc.render()` will also throw in this case the error "You should not call .render on a document that had compilation errors"

### 3.19.2

Update typescript bindings to be able to write `doc.resolveData()`

### 3.19.1

[Internal Only, for tests] : Rewrite xml-prettify to handle canonicalization of `<w:t>Hello></w:t>`

### 3.19.0

When there are errors both in the header and the footer, all errors are shown up instead of seeing only the errors of the first parsed file. This helps to find errors more quickly.

Huge performance improvements when using resolveData with loops with many iterations or with huge content inside the loop. On a document with loops of 8000 iterations, a total of 130000 Promises were created, now only about 8000 are created, (This is a 16x improvement in this case). This will produce noticeable improvements in particular in browser environments, where creating many promises costs more than in Node JS.

Some other improvements to call the `parser()` function only when needed, and using some internal caching.

If you're using the PRO xlsx module, you should upgrade the module to version 3.3.4 or higher, or you might see some rendered values duplicated at multiple points in the generated spreadsheet.

### 3.18.0

- Throw error if calling `.resolveData(data)` before `.compile()`
- Add TypeScript typings

### 3.17.9

Bugfix corruption when having loops containing one section.

In that case, the generated file would be marked as corrupt by Word.

### 3.17.8

Do not mutate options when calling setOptions.

This means that if you do :

```
const options = { paragraphLoop: true };
doc.setOptions(options);
```

The options object will not be mutated at all anymore. Before this release, this could lead to fatal errors if using the options object across multiple Docxtemplater instances.

### 3.17.7

When using docxtemplater in async mode, inside loops, rejections would be ignored.

With this version, if one or more tags turn into a rejected Promise,
`doc.resolveData(data)` will also reject (with a multi error containing all
suberrors)

### 3.17.6

Add support for dotx and dotm file formats

### 3.17.5

- Make expandToOne recursive, to allow to have multiple tags expand to the same level. (for example, for multiple "paragraph-placeholder" tags in the same paragraph).
- Update moduleApiVersion to 3.24.0.
- Make sure all postparse (also recursive ones) get the options such as filePath and contentType

### 3.17.4

Make docxtemplater fail with following error messages when using the v4 constructor with either setOptions or attachModule :

- `setOptions() should not be called manually when using the v4 constructor`
- `attachModule() should not be called manually when using the v4 constructor`

You should not write :

```
const doc = new Docxtemplater(zip);
doc.setOptions({
    delimiters: {
      start: "<",
      end: ">",
    },
});
doc.attachModule(new ImageModule())
```

You should instead write :

```
const doc = new Docxtemplater(zip, {
    modules: [new ImageModule()],
    delimiters: {
      start: "<",
      end: ">",
    },
});
```

### 3.17.3

- Update moduleApiVersion to 3.23.0.
- Add `contentType` property in options passed to parse, postparse, render and postrender.
- Bugfix in apiversion check, the patch version was not taken into account at all previously

### 3.17.2

Add proofstate module to allow to remove the `<w:proofState w:grammar="clean" w:spelling="clean"/>` tag during `.render()`

### 3.17.1

- Add support for automatically detaching modules that do not support the current filetype when using constructor v4. In previous versions, you would do the following:

```
let doc = new Docxtemplater();
const zip = new PizZip(buffer)
doc.loadZip(zip);

if (doc.fileType === "pptx") {
    doc.attachModule(new SlidesModule());
}
```

Now it is possible to write the following, without needing the condition on filetype:

```
const zip = new PizZip(buffer)
const options = {
    modules: [new SlidesModule()],
}
try {
   const doc = new Docxtemplater(zip, options);
}
catch (e) {
    console.log(e);
    // error handler
}
```

- Update moduleApiVersion to 3.22.0.

### 3.17.0

- Add a constructor method that accepts zip and optionally modules and other options. This constructor will be the official constructor in docxtemplater v4 and the methods: `loadZip`, `attachModule`, `setOptions` and `compile` will no more be available.

You can migrate the following code:

```
const doc = new Docxtemplater();
doc.loadZip(zip)
doc.setOptions({
    delimiters: {
      start: "<",
      end: ">",
    },
});
doc.attachModule(new ImageModule())
doc.attachModule(new Htmlmodule())
doc.attachModule(new Pptxmodule())
try {
    doc.compile();
}
catch (e) {
     // error handler
}
```

to

```
const options = {
    modules: [new ImageModule(), new Htmlmodule(), new Pptxmodule()],
    delimiters: {
      start: "<",
      end: ">",
    },
}
try {
   const doc = new Docxtemplater(zip, options);
}
catch (e) {
     // error handler
}
```

- This change is backward compatible, meaning that you can continue to use the constructor with no arguments for the time being.

### 3.16.11

- Add specific error (`Duplicate open tag` and `Duplicate close tag`) when using `{{foobar}}` in a template when the delimiters are just one single `{` and `}`
- Avoid error `TypeError: Cannot set property 'file' of undefined` that hides the real error

### 3.16.10

- Properly decode `&amp;gt;` into `&gt;` in templates, in previous versions, the value was decoded to `>`

### 3.16.9

- Pass in `{match, getValue, getValues}` functions to second argument of module.parse
- Allow to have a promise at the root level in resolveData
- Update moduleApiVersion to 3.21.0

### 3.16.8

(Internal, for modules) Pass whole part instead of just part.value to explanation function

### 3.16.7

Bugfix with paragraphLoops containing pagebreaks + tables, the pagebreak got reordered

### 3.16.6

Bugfix corrupt document when using dashloop : `{-a:p loop}` inside table cell which renders false

### 3.16.5

Other bugfixes related to pagebreaks and loops

### 3.16.4

Bugfix issue with paragraphLoop and pagebreaks.

In some situations, the pagebreak got removed if the start of the loop is at the top of the page (right after the `w:br` element).

### 3.16.3

- Add options.lIndex and other information about the current token in the `module.parse` method.
- Update moduleApiVersion to 3.20.0

### 3.16.2

Since this version, modules using the expandToOne trait will be able to throw a specific error instead of the one related to the raw-xml module, ("Raw tag not in paragraph")

### 3.16.1

Bugfix for loop module contained inside grid slides module : Do not fail with error "Unopened loop"

### 3.16.0

Bugfix for loop module and raw module : when having an "execution" error in the parser (eg on render, after the compilation of the template, for example with the angular parser when a filter is called with bad arguments), if one `{#looptag}` or `{@rawtag}` had an execution error, the code would immediately stop collecting other errors. Now docxtemplater will collect all errors, for simple tags, for loop tags, and for rawxml tags.

This means that if your template was like this :

```
{#foobar|badfilter1}test{/}
{#foobar|badfilter2}test{/}
{@rawvalue|badfilter3}
```

Before version 3.16.0, calling `render` on this template would throw an error with just the first tag erroring.

Since version 3.16.0, a multi error is thrown with all three tags in error being in `.properties.errors`.

This is fixed in sync mode (when calling `doc.render` directly) and also in async mode (when calling `doc.resolveData` and then `doc.render`)

### 3.15.5

- Add scopePathLength to scopemanager to be able to write "\$isLast".
- Update moduleApiVersion to 3.19.0

### 3.15.4

Add offset property to following errors :

```
"No w:p was found at the left"
"No w:p was found at the right"
```

### 3.15.3

Bugfix when having dashloop inside normal loop, like this :

```
{#foo}test {-w:p loop}loop{/}{/}
```

we now throw a multi error instead of just the first error encountered.

### 3.15.2

- Update moduleApiVersion to 3.18.0
- (internal) Use array of string for shouldContain to fix corruptions
- Do not add `<w:p>` in `<w:sdtContent>` if it contains a `<w:r>`

### 3.15.1

- If you use the xlsx module, please update the xlsx module to 3.1.1 or you will get a stacktrace `Cannot set property 'parse' of undefined`
- Update moduleApiVersion to 3.17.0
- Add `options.parse` function in `parse(placeholder, options)` to allow "recursive" parsing
- Fill empty `<w:sdtContent>` with `<w:p>` to avoid corruption

### 3.15.0

- Update moduleApiVersion to 3.16.0
- Disallow to call attachModule twice on a given module
- Add options to `parse` and `postparse` such as filePath

### 3.14.10

Use `{}` (empty object) instead of "false" for the `fs` shim in the browser.

### 3.14.9

- Bugfix for joinUncorrupt method, which produced a corrupt document when having a paragraphLoop containing a table containing a `{-w:tr loop}` loop.

### 3.14.8

- Update moduleApiVersion to 3.15.0

- Add `joinUncorrupt` to `options` in `module.render` to be able to fix corruptions

- Fixes corruption when using `{#loops}` that contain tables with `{@rawXML}` evaluating to empty.

### 3.14.7

- Add p:txBody to pptx-lexed to handle corruption on pptx

### 3.14.6

- Update moduleApiVersion to 3.14.0

- Add `getNearestLeftIndex`, `getNearestRightIndex`, `getNearestLeftIndexWithCache`, `getNearestRightIndexWithCache` to doc-utils.

- Add `preparse` method to modules to be able to retrieve info about document before the parsing of the whole document by other modules.

- Add `tagShouldContain` to the filetype API to be able to make the documents valid, which would make it possible to remove the `part.emptyValue` trick.

### 3.14.5

Bugfix when using paragraphLoop section with a pagebreak : at the end of the paragraphLoop, the pagebreak was removed by mistake. This is no longer the case since this version

### 3.14.4

Bugfix speed issue when having many loop tags in the same paragraph (over 50 loop tags in one paragraph).

(internal) Update verify moduleAPI to 3.13.0 (addition of `getNearestLeftWithCache`, `getNearestRightWithCache`, `buildNearestCache`)

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

See https://docxtemplater.com/docs/configuration#custom-parser for full doc.

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

Eg : both the start of the loop and the end of the loop are in a paragraph, surrounded by no other content. In that particular case, we render the content of the loop (`{name}`) in this use case, in a new paragraph each time, so that there would be no additional whitespace added to the loop.

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

docxtemplater doesn't fail on the first error, but instead, will throw multiple errors at the time. See https://docxtemplater.com/docs/errors for a detailled explanation.

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

- **Breaking** : To choose between docx or pptx, you now have to pass doc.setOptions({fileType:'docx'}) where the fileTypes are one of 'pptx', 'docx' (default is 'docx')
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

- doc.setOptions({delimiters:{start:”[“,end:”]”}}) now works e2d06dedd88860d2dac3d598b590bf81e2d113a6

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
- the qrcode module has been removed, and will be migrated in an other package that will be attached to docxtemplater

### From 0.6.0 to 0.7.0

**The QrCode Option had a security issue**. If you don’t upgrade according to this, the functionality should continue to work but the leak will still be there. If you are running in the browser, the vulnerability will not affect you (no access to the filesystem). If the users can’t change the qrCodes or their value, you’re safe too.

If you set qrCode:true, you are affected. The Command Line is not affected as of v0.7.0 (but was on 0.6.3 and less). However the command line as of v0.7.0 is not more able to load images over the filesystem.

You should set qrCode to a function now, according to https://docxtemplater.com/docs/configuration#image-replacing.
