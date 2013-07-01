# Docxgen.js #

**docxgen.js** is a small library to generate docx documents given a docx template. It can replace tags by their values and replace images with other images.

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

    vars={products:[{name:"Windows",price:100},{name:"Mac OSX",price:200},{name:"Ubuntu",price:0}]}

will result in :

    Windows, 100 €
    Mac OSX, 200 €
    Ubuntu, 0€

## Demo ##

A simple Demo can be found here: http://javascript-ninja.fr/docxgenjs/examples/simpleTagging.html#

A simple Demo for replacing images can be found here: http://javascript-ninja.fr/docxgenjs/examples/imageTagging.html#


## Dependencies ##

1. **docxgen.js** uses [jszip.js](http://stuk.github.io/jszip/) to zip and unzip the docx files. Jszip uses: 

- base64.js
- jszip.js
- jszip-load.js
- jszip-inflate.js

2. Optionally, if you want to be able to name the output files, you can use **Downloadify.js**, which is required to use method download. Be informed that it uses flash, this is why the method is not recommended.

3. Optionnaly, if you want to replace images by images situated at a particular URL, you can use QR codes. For example If you store an image at http://website.com/image.png , you should encode the URL in QR-Code format. ![Qr Code Sample](http://qrfree.kaywa.com/?l=1&s=8&d=http%3A%2F%2Fwebsite.com%2Fimage.png "Qrcode Sample to http://website.com/image.png"). You can even use bracket tags in images. http://website.com/image.png?color={color}. For this too work, you will need some other dependencies: jsqrcode/grid.js,jsqrcode/version.js,jsqrcode/detector.js,jsqrcode/formatinf.js,jsqrcode/errorlevel.js,jsqrcode/bitmat.js,jsqrcode/datablock.js,jsqrcode/bmparser.js,jsqrcode/datamask.js,jsqrcode/rsdecoder.js,jsqrcode/gf256poly.js,jsqrcode/gf256.js,jsqrcode/decoder.js,jsqrcode/qrcode.js,jsqrcode/findpat.js,jsqrcode/alignpat.js,jsqrcode/databr.js


## Browser support ##

docxgen.js works with

- Chrome
- Firefox 3+ 
- Safari
- Opera

Internet explorer is not supported (basically because xhr Requests can't be made on binary files)

You can test if everything works fine on your browser by using the test runner: http://javascript-ninja.fr/docxgenjs/test/SpecRunner.html

Firefox has an other implementation of the xml parser, that's why all tests don't pass now.

## Usage ##

### Creating a new Docxgen Object ###

    new DocxGen()

        This function returns a new DocxGen Object

    new DocxGen(content[,templateVars,intelligentTagging,qrCode])

        content: 
            Type: string
            The docx template you want to load as plain text

        templateVars:
            Type: Object {tag_name:tag_replacement} [{}]
            Object containing for each tag_name, the replacement for this tag. For example, if you want to replace firstName by David, your Object will be: {"firstName":"David"}

        intelligentTagging:
            Type: boolean [false]
            If intelligent Tagging is not set to true, when using recursive tags ({#tag} and {/tag}), the system will copy paste what is between the start tag and the endtag, this could basically corrupt the files if recursive tags are used inside tables.
            If intelligent Tagging is set to true, and when using recursive tags inside tables, the whole column will be copy pasted.

        qrCode:
            Type: boolean [false]
            If qrCode is set to true, DocxGen will look at all the images to find a Qr-Code. If the Qr-code matches to a URL, this URL will be loaded by ajax (Be aware that the server you want to access needs to allow your request, or it won't work. http://stackoverflow.com/questions/9310112/why-am-i-seeing-an-origin-is-not-allowed-by-access-control-allow-origin-error )

### Docxgen methods ###

    load(content)

        content:
            Type: string
            The docx template you want to load as plain text

    setTemplateVars(templateVars)

        templateVars:
            Type: Object {tag_name:tag_replacement}
            Object containing for each tag_name, the replacement for this tag. For example, if you want to replace firstName by David, your Object will be: {"firstName":"David"}

    applyTemplateVars()

        This function replaces all template variables by their values

    output([download=true])

        download
            Type:boolean
            If download is true, file will be downloaded automatically
            returns the output file.

        This function creates the docx file and downloads it on the user's computer. The name of the file is download.docx for Chrome, and some akward file names for Firefox: VEeTHCfS.docx.part.docx, and can't be changed because it is handled by the browser.
        For more informations about how to solve this problem, see the **Filename Problems** section on [http://stuk.github.io/jszip/](http://stuk.github.io/jszip/)

        Note: All browsers don't support the download of big files with Data URI, so you **should** use the `download` method for files bigger than 100kB [Details](http://stackoverflow.com/questions/695151/data-protocol-url-size-limitations)

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

        This requires to include Downloadify.js, that needs flash version 10. Have a look at the *output* function if you don't want to depend on it.

    getImageList()

        this gets all images that have one of the following extension: 'gif','jpeg','jpg','emf','png'
        Return format: Array of Object:
        [{path:string,files:ZipFile Object}]

    setImage(path,imgData)

        path
            Type:"String"
            Path of the image, given by getImageList()
        imgData
            Type:"String"
            imgData in txt/plain

    getFullText:([path])

        path
            Type:"String"
            Default:"word/document.xml"
            This argument determines from which document you want to get the text. The main document is called word/document.xml, but they are other documents: "word/header1.xml", "word/footer1.xml"


## Known issues ##

Todo:

- [x] QrCode Decoding
- [ ] QrCode Decoding with brackets image.png?color={color}
- [ ] QrCode Decoding callback problems (with {#forloops} :-) 
- [ ] Adapt tests to firefox for xml parsing problem
- [x] Refactoring of the inner tagging system
- [ ] DocXtemplater is now a child of xmlTemplater
- [x] Tag searching and replacement
- [x] Docx Output
- [x] Docx Input
- [x] Image searching and remplacement
- [x] Problems with accents -> No more issue with accents in outputFile
- [x] Problems with the filenames -> Fixed, using Downloadify.js and method **download**
- [ ] Incompatibility with IE: Error : SCRIPT5022: End of stream reached (stream length = 14578, asked index = 18431). Corrupted zip ?
jszip-load.js, Ligne 82 Caractère 13 -> Getting binary data with IE 7+ doesn't seem to work, two ways:
* [Using VBscript](http://emilsblog.lerch.org/2009/07/javascript-hacks-using-xhr-to-load.html)
* By not using an xhr call on raw data, but load xml files. Howewer, images would have to be given too by an other way
