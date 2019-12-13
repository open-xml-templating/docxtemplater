.. index::
   single: Async

..  _async:

Asynchronous generation
=======================

You can have promises in your data.

.. code-block:: javascript

    var doc = new Docxtemplater();
    doc.loadZip(zip);
    doc.setOptions(options);

    try {
        doc.compile(); // You need to compile your document first.
    }
    catch (error) {
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a properties object).
        var e = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties,
        }
        console.log(JSON.stringify({error: e}));
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
            // The error thrown here contains additional information when logged with JSON.stringify (it contains a properties object).
            var e = {
                message: error.message,
                name: error.name,
                stack: error.stack,
                properties: error.properties,
            }
            console.log(JSON.stringify({error: e}));
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
