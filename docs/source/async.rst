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
    doc.compile(); // You need to compile your document first.
    doc.resolveData({user: new Promise(resolve) { setTimeout(()=> resolve('John'), 1000)}})
       .then(function() {
           doc.render();
           var buf = doc.getZip()
               .generate({type: 'nodebuffer'});
           fs.writeFileSync(path.resolve(__dirname, 'output.docx'), buf);
       });
