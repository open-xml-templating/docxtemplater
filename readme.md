# DocxTemplater (also called docxgen.js) #

[![Build Status](https://travis-ci.org/edi9999/docxtemplater.svg?branch=master)](https://travis-ci.org/edi9999/docxtemplater)

**docxtemplater** is a small library to generate docx documents given a docx template. It can replace tags by their values and replace images with other images. It is very user oriented as users can without a lot of programming knowledge create their first template and automatically change variables in it.

## Demo ##

[All demos can be found here](http://javascript-ninja.fr/docxgenjs/examples/demo.html)

Including:

- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#variables">Replace Variables</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#formating">Formating</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#parsing">Angular Parsing</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#loops">Loops</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#tables">Loops and tables</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#lists">Lists</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#images">Replacing images</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#naming">Naming the output</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#qrcode">Using QrCodes</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#qrcodeloop">Replacing many images with QrCode</a><br>
- <a href="http://javascript-ninja.fr/docxgenjs/examples/demo.html#rawxml">Raw Xml Insertion</a><br>


## Why use a library for this ? ##

docx is a zipped format that contains some xml. If you want to build a simple replace {tag} by value system, it can already become complicated, because the {tag} is internally separated into `<w:t>{</w:t><w:t>tag</w:t><w:t>}</w:t>`.  If you want to embed loops to iterate over an array, it becomes a real hassle.

## Syntax ##

The *syntax* is highly inspired by [Mustache](http://mustache.github.io/). The template is created in Microsoft Word or an equivalent docx saver.

It uses single brackets {} for variables.

    Hello {name} !

    vars={name:'Edgar'}

will result in:

    Hello Edgar !

Like Mustache, it has the loopopening {#} and loopclosing {/} brackets

    {#products}{name}, {price} €
    {/products}

    vars={
    		products:
    			[
    			 {name:"Windows",price:100},
    			 {name:"Mac OSX",price:200},
    			 {name:"Ubuntu",price:0}
    			]
    	}

will result in :

    Windows, 100 €
    Mac OSX, 200 €
    Ubuntu, 0€

## Angular.js like parsing

	This year is {person.age+person.birthyear}

	vars={person:{age:50,birthyear:1964}}

will result in:

	This year is 2014

To enable this, you need to specify a custom parser. See [Angular Parsing](http://javascript-ninja.fr/docxgenjs/examples/demo.html#parsing)
You need to create a parser function:

docxgen comes shipped with this parser:

	parser=function(expression)
	{
		return {get:function(scope){return scope[expression]}}
	}

the angular-parser is the following:
	
	expressions= require('angular-expressions')
	angularParser= (tag) ->
		expr=expressions.compile(tag)
		{get:expr}

The require() works in the browser if you include vendor/angular-parser-browser.js

you can set the parser in the constructor of DocxGen, or in the loadFromFile method.


## Browser support ##

docxgen.js works with

- Chrome **tested** on version 26
- Firefox 3+ (**tested** on version 21, but should work with 3+)
- Safari **not tested**

Internet explorer is not supported -even IE10- (basically because xhr Requests can't be made on binary files)

You can test if everything works fine on your browser by using the test runner: http://javascript-ninja.fr/docxgenjs/test/SpecRunner.html

Firefox has an other implementation of the xml parser, that's why all tests don't pass now.


## Tests

They is a full test suite covering a lot of the functions of DocxGen (48 tests)
 - in a Browser: It can be launched by opening specRunner.html in the test/ folder 
 - in node: It can be launched using jasmine-node: `jasmine-node docxgenTest.spec.js` in the test\spec folder

## Node Installation and usage:

They are two ways to install docxtemplater:

- With the global flag, it will release a command line interface that you can use by using `docxtemplater` and that is explained later on.
- With no global flag, you can require('docxtemplater') and do your own thing

### Node Local example

Installation: `npm install docxtemplater`

	var DocXTemplater= require('docxtemplater');

	//loading the file
	docxtemplater=new DocXTemplater().loadFromFile("input.docx");

	//setting the tags
	docxtemplater.setTags({"name":"Edgar"});

	//when finished
	docxtemplater.finishedCallback=function () {
  	  docxtemplater.output(true,"output.docx");
	}

	//apply the tags
	docxtemplater.applyTags();

You can download [input.docx](https://github.com/edi9999/docxtemplater/blob/master/input.docx?raw=true) and put it in the same folder than your script.

### Node Global Installation

The node package can be installed globally, so that the docxgen command becomes available to the path and is accessible from the terminal.

`npm install docxtemplater -g`

You're finished.

### Node Global Usage

	`docxtemplater <configFile>`

configFile Structure: json Structure

required Properties:
	"config.docxFile":"tagExample.docx",
	"config.outputFile":"output.docx",
	"config.baseNodePath":"../examples/",
	"config.qrcode":false,

	config.docxFile: The input file in docx format
	config.outputFile: The outputfile of the document
	config.qrcode:true if the images should be scanned to be replaced, false otherwise

The rest of the json is used for the scope variables (eg, those not starting with config.)

## Dependencies

1. **docxgen.js** uses [jszip.js](http://stuk.github.io/jszip/) to zip and unzip the docx files

2. Optionally, if you want to be able to name the output files, you can use **Downloadify.js**, which is required to use method download. Be informed that it uses flash, this is why the method is not recommended. This method is howewer useful because a lot of browsers are limited for the download size with the Data-URI method. **Update**: I will probably implement in the future a way to use the FileSaver API, with [FileSaverJS](http://eligrey.com/demos/FileSaver.js/)

3. Optionnaly, if you want to replace images by images situated at a particular URL, you can use QR codes. For example If you store an image at http://website.com/image.png , you should encode the URL in QR-Code format. ![Qr Code Sample](http://qrfree.kaywa.com/?l=1&s=8&d=http%3A%2F%2Fwebsite.com%2Fimage.png "Qrcode Sample to http://website.com/image.png"). You can even use bracket tags in images. http://website.com/image.png?color={color} will take the *Tags[color]* variable to make a dynamic URL. For this too work, you will need [jsqrcode](http://github.com/edi9999/jsqrcode "jsqrcode repositoty forked") and include the following files, in this order (only for browser support, node support already comes out of the box):

    <script type="text/javascript" src="grid.js"></script>
    <script type="text/javascript" src="version.js"></script>
    <script type="text/javascript" src="detector.js"></script>
    <script type="text/javascript" src="formatinf.js"></script>
    <script type="text/javascript" src="errorlevel.js"></script>
    <script type="text/javascript" src="bitmat.js"></script>
    <script type="text/javascript" src="datablock.js"></script>
    <script type="text/javascript" src="bmparser.js"></script>
    <script type="text/javascript" src="datamask.js"></script>
    <script type="text/javascript" src="rsdecoder.js"></script>
    <script type="text/javascript" src="gf256poly.js"></script>
    <script type="text/javascript" src="gf256.js"></script>
    <script type="text/javascript" src="decoder.js"></script>
    <script type="text/javascript" src="qrcode.js"></script>
    <script type="text/javascript" src="findpat.js"></script>
    <script type="text/javascript" src="alignpat.js"></script>
    <script type="text/javascript" src="databr.js"></script>

## Usage ##

### Creating a new Docxgen Object ###

    new DocxGen()

        This function returns a new DocxGen Object

    new DocxGen(content[,Tags,options])

        content: 
            Type: string
            The docx template you want to load as plain text

        Tags:
            Type: Object {tag_name:tag_replacement} [{}]
            Object containing for each tag_name, the replacement for this tag. For example, if you want to replace firstName by David, your Object will be: {"firstName":"David"}

        options: object

			parser:
				Type: function
				A custom parser to use. See angular.js like parsing

        	intelligentTagging:
            	Type: boolean [false]
            	If intelligent Tagging is not set to true, when using recursive tags ({#tag} and {/tag}), the system will copy paste what is between the start tag and the endtag, this could basically corrupt the files if recursive tags are used inside tables.
            	If intelligent Tagging is set to true, and when using recursive tags inside tables, the whole column will be copy pasted.

        	qrCode:
            	Type: boolean [false]
            	If qrCode is set to true, DocxGen will look at all the images to find a Qr-Code. If the Qr-code matches to a URL, this URL will be loaded by ajax (Be aware that the server you want to access needs to allow your request, or it won't work. http://stackoverflow.com/questions/9310112/why-am-i-seeing-an-origin-is-not-allowed-by-access-control-allow-origin-error )
            	**Important**: the qrCode functionality only works for PNG, I don't think I will enable this for other fileformats in the near future.

        localImageCreator
            Type: function(arg,callback) [function that returns an arrow]
            The function has to be customized only if you want to use the qrCode options (**qrCode=true**). When the qrcode text starts with **gen:**, the image is not going to be loaded by url but DocxGen calls localImageCreator with **arg**=full Text decoded. The callback needs to be called with the image Data:**callback(result)**, in plain/txt format (if you want to create it from a Data-URI, you can use JSZipBase64.decode(data) to decode a Data-URI to plain/txt)

            The default localImageCreator returns a red arrow, no matter what the arguments are:         

            @localImageCreator= (arg,callback) ->
            result=JSZipBase64.decode("iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAIAAABvSEP3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACXSURBVDhPtY7BDYAwDAMZhCf7b8YMxeCoatOQJhWc/KGxT2zlCyaWcz8Y+X7Bs1TFVJSwIHIYyFkQufWIRVX9cNJyW1QpEo4rixaEe7JuQagAUctb7ZFYFh5MVJPBe84CVBnB42//YsZRgKjFDBVg3cI9WbRwXLktQJX8cNIiFhM1ZuTWk7PIYSBhkVcLzwIiCjCxhCjlAkBqYnqFoQQ2AAAAAElFTkSuQmCC")
            
            [Default Image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAIAAABvSEP3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACXSURBVDhPtY7BDYAwDAMZhCf7b8YMxeCoatOQJhWc/KGxT2zlCyaWcz8Y+X7Bs1TFVJSwIHIYyFkQufWIRVX9cNJyW1QpEo4rixaEe7JuQagAUctb7ZFYFh5MVJPBe84CVBnB42//YsZRgKjFDBVg3cI9WbRwXLktQJX8cNIiFhM1ZuTWk7PIYSBhkVcLzwIiCjCxhCjlAkBqYnqFoQQ2AAAAAElFTkSuQmCC)

        qrFinishedCallBack:
            Type: function () [function that console.log(ready)]
                This function is called if you specify qrCode argument to true in this constructor, and will be called when all qrCodes have been replaced (because the qrCode replacing functions are **async**)

### Docxgen methods ###

    load(content)

        content:
            Type: string
            The docx template you want to load as plain text

    loadFromFile(path)
    	path
    		Type: string
    		Loads a docx from a file path
    setTags(Tags)

        Tags:
            Type: Object {tag_name:tag_replacement}
            Object containing for each tag_name, the replacement for this tag. For example, if you want to replace firstName by David, your Object will be: {"firstName":"David"}


    applyTags([Tags])
        Tags:
            Type: Object {tag_name:tag_replacement}
            same as setTags
            Default:this.Tags

        This function replaces all template variables by their values

    output([options])

        options: object[{}]

            download:
                Type:boolean[true]
                If download is true, file will be downloaded automatically with data URI.
                returns the output file.
            
            type:
                Type;string["base64"]
                The type of zip to return. The possible values are : (same as in http://stuk.github.io/jszip/ @generate)
                base64 (default) : the result will be a string, the binary in a base64 form.
                string : the result will be a string in "binary" form, 1 byte per char.
                uint8array : the result will be a Uint8Array containing the zip. This requires a compatible browser.
                arraybuffer : the result will be a ArrayBuffer containing the zip. This requires a compatible browser.
                blob : the result will be a Blob containing the zip. This requires a compatible browser.
                nodebuffer : the result will be a nodejs Buffer containing the zip. This requires nodejs.


        This function creates the docx file and downloads it on the user's computer. The name of the file is download.docx for Chrome, and some akward file names for Firefox: VEeTHCfS.docx.part.docx, and can't be changed because it is handled by the browser.
        For more informations about how to solve this problem, see the **Filename Problems** section on [http://stuk.github.io/jszip/](http://stuk.github.io/jszip/)

        Note: All browsers don't support the download of big files with Data URI, so you **should** use the `download` method for files bigger than 100kB data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAIAAABvSEP3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACXSURBVDhPtY7BDYAwDAMZhCf7b8YMxeCoatOQJhWc/KGxT2zlCyaWcz8Y+X7Bs1TFVJSwIHIYyFkQufWIRVX9cNJyW1QpEo4rixaEe7JuQagAUctb7ZFYFh5MVJPBe84CVBnB42//YsZRgKjFDBVg3cI9WbRwXLktQJX8cNIiFhM1ZuTWk7PIYSBhkVcLzwIiCjCxhCjlAkBqYnqFoQQ2AAAAAElFTkSuQmCC

    download(swfpath,imgpath[,fileName])

        swfpath
            Type:string
            Path to the swfobject.js in downloadify

        imgpath
            Type:string
            Path to the image of the download button

        [fileName]
            Type:string
            Default:"default.docx"
            Name of the file you would like the user to download.

        This requires to include Downloadify.js, that needs flash version 10. Have a look at the *output* function if you don't want to depend on it. This function has the advantage that it works regardless of the file size

    getImageList()

        this gets all images that have one of the following extension: 'gif','jpeg','jpg','emf','png'
        Return format: Array of Object:
        [{path:string,files:ZipFile Object}]

        You should'nt call this method before calling **applyTags()**, because applyTags can modify the images or their path when replacing images with other (particularly when qrCode is set to true, which is not the default case). You can call this method after **applyTags()** without any problems

    setImage(path,imgData)

        path
            Type:"String"
            Path of the image, given by getImageList()
        imgData
            Type:"String"
            imgData in txt/plain

        This sets the image given by a path and an imgData in txt/plain.
        You should'nt call this method before calling **applyTags()**, because applyTags can modify the images or their path when replacing images with other (particularly when qrCode is set to true, which is not the default case). You can call this method after **applyTags()** without any problems

    getFullText:([path])

        path
            Type:"String"
            Default:"word/document.xml"
            This argument determines from which document you want to get the text. The main document is called word/document.xml, but they are other documents: "word/header1.xml", "word/footer1.xml"

        @returns
            Type:"String"
            The string containing all the text from the document

        This method gets only the text of a given document (not the formatting)

    getTags()

        This function returns the template variables contained in the opened document. For example if the content of the document.xml is the following:

            {name}
            {first_name}
            {phone}

        The function will return:
            [{
                filename:"document.xml",
                vars:
                {
                    name:true,
                    first_name:true,
                    phone:true
                }
            }]

        If the content contains tagLoops:

            {title}
            {#customer}
            {name}
            {phone}
            {/customer}


        The function will return:

            [{
                filename:"document.xml",
                vars:
                {
                    title:true,
                    customer:
                    {
                        name:true,
                        phone:true
                    }
                }
            }]


**Important**: the qrCode functionality only works for PNG, I don't think I will enable this for other fileformats in the near future.

## Known issues

Todo:

 - [x] QrCode Decoding
 - [x] QrCode Decoding with brackets image.png?color={color}
 - [x] QrCode Decoding callback problems (with {#forloops} :-) 
 - [x] Adapt tests to firefox for xml parsing problem
 - [x] Refactoring of the inner tagging system
 - [x] DocXtemplater is now a child of xmlTemplater
 - [x] Tag searching and replacement
 - [x] Docx Output
 - [x] Docx Input
 - [x] Image searching and remplacement
 - [x] Problems with accents -> No more issue with accents in outputFile
 - [x] Problems with the filenames -> Fixed, using Downloadify.js and method **download**
 - [ ] Incompatibility with IE: Error : SCRIPT5022: End of stream reached (stream length = 14578, asked index = 18431). Corrupted zip ?
 - [x] Refactor: create an `ImgManager class`. Responsibility: retrieve images, changing images, on a file based view
 - [x] Refactor: create a `templaterState class`, which will be a subclass used by XmlTemplater
 - [x] create a nodejs api
 - [ ] Use FileSaver API for output http://eligrey.com/blog/post/saving-generated-files-on-the-client-side
 - [x] solve problem with special symbols (cyrillic characters)
 - [x] let the api user insert they own XML
 - [ ] stop overflooding the global scope:
 - DocUtils
 - XmlTemplater
 - jsQrCode
 - jsZip
 - DocXTemplater
 - ScopeManager
 - XmlMatcher
 - [ ] output with FileSaver.js to name your file
 -  Decouple responsabilities:
   - [ ] ScopeManager
   - [ ] XmlTemplaterInterface and XmlTemplater ??
 - [ ] Remove the node/browser specific code when possible
 - [ ] When not possible, create a NodeSpecific File or BrowserSpecific File
- [x] Change signature of loadDoc function


jszip-load.js, Ligne 82 Caractère 13 -> Getting binary data with IE 7+ doesn't seem to work, two ways:
* [Using VBscript](http://emilsblog.lerch.org/2009/07/javascript-hacks-using-xhr-to-load.html)
