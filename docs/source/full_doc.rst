..  _full_doc

.. index::
   single: Full_doc

Full Documentation per method
=============================

Creating a new Docxgen Object
-----------------------------

.. code-block:: javascript

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


Docxgen methods
---------------

.. code-block:: javascript

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

            name:
                Type:string["output.docx"]
                The name of the file that will be outputed (doesnt work in the browser because of dataUri download)

            callback:
               Type:function
               Function that is called without arguments when the output is done. Is used only in Node (because in the browser, the operation is synchronous)

            download:
                Type:boolean[true]
                If download is true, file will be downloaded automatically with data URI.
                returns the output file.
            
            type:
                Type:string["base64"]
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
