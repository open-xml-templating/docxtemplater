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
        var e = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties,
        }
        console.log(JSON.stringify({error: e}));
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
        throw error;
    }

    doc.resolveData({user: new Promise(resolve) { setTimeout(()=> resolve('John'), 1000)}})
       .then(function() {
           doc.render();
           var buf = doc.getZip()
               .generate({type: 'nodebuffer'});
           fs.writeFileSync(path.resolve(__dirname, 'output.docx'), buf);
       }).catch(function(error) {
           var e = {
               message: error.message,
               name: error.name,
               stack: error.stack,
               properties: error.properties,
           }
           console.log(JSON.stringify({error: e}));
           // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
           throw error;
       });
