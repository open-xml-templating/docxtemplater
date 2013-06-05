# Docxgen.js #

**docxgen.js** is a small library to generate docx documents given a docx template. It can replace tags by their values and replace images with other images.

## Demo ##

A simple Demo can be found here: http://javascript-ninja.fr/docxgenjs/examples/simpleTagging.html#

## Dependencies ##

1. **docxgen.js** uses [jszip.js](http://stuk.github.io/jszip/) to zip and unzip the docx files. Jszip uses: 

- base64.js
- jszip.js
- jszip-load.js
- jszip-inflate.js

2. Optionally, if you want to be able to name the output files, you can use **Downloadify.js**, which is required to use method download

## Browser support ##

docxgen.js works with

- Chrome
- Firefox 3+
- Safari
- Opera

Internet explorer is not yet supported

## Usage ##

### Creating a new Docxgen Object ###

    new DocxGen()

        This function returns a new DocxGen Object

    new DocxGen(content[,templateVars])

        content: 
            Type: string
            The docx template you want to load as plain text

        templateVars:
            Type: Object {tag_name:tag_replacement}
            Object containing for each tag_name, the replacement for this tag. For example, if you want to replace firstName by David, your Object will be: {"firstName":"David"}

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
            Default:"document.xml"
            This argument determines from which document you want to get the text. The main document is called document.xml, but they are other documents: "header1.xml", "footer1.xml"

## Known issues ##

Todo:

- [x] Tag searching and remplacement
- [x] Docx Output
- [x] Docx Input
- [x] Image searching and remplacement
- [x] Problems with accents -> No more issue with accents in outputFile
- [x] Problems with the filenames -> Fixed, using Downloadify.js and method **download**
- [ ] Incompatibility with IE: Error : SCRIPT5022: End of stream reached (stream length = 14578, asked index = 18431). Corrupted zip ?
jszip-load.js, Ligne 82 Caractère 13 -> Getting binary data with IE 7+ doesn't seem to work, two ways:
* [Using VBscript](http://emilsblog.lerch.org/2009/07/javascript-hacks-using-xhr-to-load.html)
* By not using an xhr call on raw data, but load xml files. Howewer, images would have to be given too by an other way