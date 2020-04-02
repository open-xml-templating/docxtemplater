.. index::
   single: Async

..  _async:

Asynchronous Data Resolving
===========================

You can have promises in your data. Note that the only step running asynchronously is the resolving of your data, the compilation (parsing of your template to parse position of each tags), and the rendering (using the compiled version + the resolved data) will still be fully synchronous

.. code-block:: javascript

    var doc;
    try {
        // Compile your document
        doc = new Docxtemplater(zip, options);
    }
    catch (error) {
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a properties object containing all suberrors).
        function replaceErrors(key, value) {
            if (value instanceof Error) {
                return Object.getOwnPropertyNames(value).reduce(function(error, key) {
                    error[key] = value[key];
                    return error;
                }, {});
            }
            return value;
        }
        console.log(JSON.stringify({error: error}, replaceErrors));

        if (error.properties && error.properties.errors instanceof Array) {
            const errorMessages = error.properties.errors.map(function (error) {
                return error.properties.explanation;
            }).join("\n");
            console.log('errorMessages', errorMessages);
            // errorMessages is a humanly readable message looking like this : 
            // 'The tag beginning with "foobar" is unopened'
        }
        throw error;
    }

    doc.resolveData({user: new Promise(resolve) { setTimeout(()=> resolve('John'), 1000)}})
       .then(function() {
           doc.render();
           var buf = doc.getZip()
               .generate({type: 'nodebuffer'});
           fs.writeFileSync(path.resolve(__dirname, 'output.docx'), buf);
       }).catch(function(error) {
           // The error thrown here contains additional information when logged with JSON.stringify (it contains a properties object containing all suberrors).
           function replaceErrors(key, value) {
               if (value instanceof Error) {
                   return Object.getOwnPropertyNames(value).reduce(function(error, key) {
                       error[key] = value[key];
                       return error;
                   }, {});
               }
               return value;
           }
           console.log(JSON.stringify({error: error}, replaceErrors));

           if (error.properties && error.properties.errors instanceof Array) {
               const errorMessages = error.properties.errors.map(function (error) {
                   return error.properties.explanation;
               }).join("\n");
               console.log('errorMessages', errorMessages);
               // errorMessages is a humanly readable message looking like this : 
               // 'The tag beginning with "foobar" is unopened'
           }
           throw error;
       });
