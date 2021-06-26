.. index::
   single: Async

..  _async:

Asynchronous Data Resolving
===========================

You can have promises in your data. Note that the only step running asynchronously is the resolving of your data. The compilation (parsing of your template to parse position of each tags), and the rendering (using the compiled version + the resolved data) will still be fully synchronous

.. code-block:: javascript

    // The error object contains additional information when logged with JSON.stringify (it contains a properties object containing all suberrors).
    function replaceErrors(key, value) {
        if (value instanceof Error) {
            return Object.getOwnPropertyNames(value).reduce(function(error, key) {
                error[key] = value[key];
                return error;
            }, {});
        }
        return value;
    }

    function errorHandler(error) {
        console.log(JSON.stringify({error: error}, replaceErrors));

        if (error.properties && error.properties.errors instanceof Array) {
            const errorMessages = error.properties.errors.map(function (error) {
                return error.properties.explanation;
            }).join("\n");
            console.log('errorMessages', errorMessages);
            // errorMessages is a humanly readable message looking like this:
            // 'The tag beginning with "foobar" is unopened'
        }
        throw error;
    }

    var doc;
    try {
        // Compile your document
        doc = new Docxtemplater(zip, options);
    }
    catch (error) {
        // Catch compilation errors (errors caused by the compilation of the template: misplaced tags)
        errorHandler(error);
    }

    doc.resolveData({user: new Promise(resolve) { setTimeout(()=> resolve('John'), 1000)}})
       .then(function() {
           try {
               doc.render();
           }
           catch (error) {
               errorHandler(err);
           }
           var buf = doc.getZip()
               .generate({type: 'nodebuffer'});
           fs.writeFileSync(path.resolve(__dirname, 'output.docx'), buf);
       });
