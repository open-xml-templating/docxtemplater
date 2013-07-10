//@ sourceMappingURL=docxgenTest.spec.map
(function() {
  Object.size = function(obj) {
    var key, log, size;

    size = 0;
    log = 0;
    for (key in obj) {
      size++;
    }
    return size;
  };

  if (typeof window !== "undefined" && window !== null) {
    window.docX = [];
    window.docXData = [];
  } else {
    global.docX = [];
    global.docXData = [];
    global.fs = require('fs');
    global.vm = require('vm');
    global.DOMParser = require('xmldom').DOMParser;
    global.XMLSerializer = require('xmldom').XMLSerializer;
    global.PNG = require('../../libs/pngjs/png-node');
    ["grid.js", "version.js", "detector.js", "formatinf.js", "errorlevel.js", "bitmat.js", "datablock.js", "bmparser.js", "datamask.js", "rsdecoder.js", "gf256poly.js", "gf256.js", "decoder.js", "qrcode.js", "findpat.js", "alignpat.js", "databr.js"].forEach(function(file) {
      return vm.runInThisContext(global.fs.readFileSync(__dirname + '/../../libs/jsqrcode/' + file), file);
    });
    ['jszip.js', 'jszip-load.js', 'jszip-deflate.js', 'jszip-inflate.js'].forEach(function(file) {
      return vm.runInThisContext(global.fs.readFileSync(__dirname + '/../../libs/jszip/' + file), file);
    });
    ['docxgen.js'].forEach(function(file) {
      return vm.runInThisContext(global.fs.readFileSync(__dirname + '/../../js/' + file), file);
    });
  }

  DocUtils.loadDoc('imageExample.docx');

  DocUtils.loadDoc('image.png', true);

  DocUtils.loadDoc('bootstrap_logo.png', true);

  DocUtils.loadDoc('BMW_logo.png', true);

  DocUtils.loadDoc('Firefox_logo.png', true);

  DocUtils.loadDoc('Volkswagen_logo.png', true);

  DocUtils.loadDoc('tagExample.docx');

  DocUtils.loadDoc('tagExampleExpected.docx');

  DocUtils.loadDoc('tagLoopExample.docx');

  DocUtils.loadDoc('tagLoopExampleImageExpected.docx');

  DocUtils.loadDoc('tagProduitLoop.docx');

  DocUtils.loadDoc('tagDashLoop.docx');

  DocUtils.loadDoc('tagDashLoopList.docx');

  DocUtils.loadDoc('tagDashLoopTable.docx');

  DocUtils.loadDoc('tagIntelligentLoopTable.docx', false, true);

  DocUtils.loadDoc('tagIntelligentLoopTableExpected.docx');

  DocUtils.loadDoc('tagDashLoop.docx');

  DocUtils.loadDoc('qrCodeExample.docx');

  DocUtils.loadDoc('qrCodeExampleExpected.docx');

  DocUtils.loadDoc('qrCodeTaggingExample.docx');

  DocUtils.loadDoc('qrCodeTaggingExampleExpected.docx');

  DocUtils.loadDoc('qrCodeTaggingLoopExample.docx');

  DocUtils.loadDoc('qrCodeTaggingLoopExampleExpected.docx');

  DocUtils.loadDoc('qrcodeTest.zip', true);

  describe('qr code testing', function() {
    return it('should work with loop QRCODE with {tags}', function() {
      var endcallback;

      docX['qrCodeTaggingLoopExample.docx'] = new DocxGen(docXData['qrCodeTaggingLoopExample.docx'], {}, false, true);
      endcallback = function() {
        return 1;
      };
      docX['qrCodeTaggingLoopExample.docx'].applyTemplateVars({
        'images': [
          {
            image: 'Firefox_logo'
          }, {
            image: 'image'
          }
        ]
      }, endcallback);
      docX['qrCodeTaggingLoopExample.docx'];
      waitsFor(function() {
        return docX['qrCodeTaggingLoopExample.docx'].ready != null;
      });
      return runs(function() {
        var i, _results;

        expect(docX['qrCodeTaggingLoopExample.docx'].zip.files['word/media/Copie_0.png'] != null).toBeTruthy();
        expect(docX['qrCodeTaggingLoopExample.docx'].zip.files['word/media/Copie_1.png'] != null).toBeTruthy();
        expect(docX['qrCodeTaggingLoopExample.docx'].zip.files['word/media/Copie_2.png'] != null).toBeFalsy();
        _results = [];
        for (i in docX['qrCodeTaggingLoopExample.docx'].zip.files) {
          expect(docX['qrCodeTaggingLoopExample.docx'].zip.files[i].options.date).not.toBe(docX['qrCodeTaggingLoopExampleExpected.docx'].zip.files[i].options.date);
          expect(docX['qrCodeTaggingLoopExample.docx'].zip.files[i].name).toBe(docX['qrCodeTaggingLoopExampleExpected.docx'].zip.files[i].name);
          expect(docX['qrCodeTaggingLoopExample.docx'].zip.files[i].options.base64).toBe(docX['qrCodeTaggingLoopExampleExpected.docx'].zip.files[i].options.base64);
          expect(docX['qrCodeTaggingLoopExample.docx'].zip.files[i].options.binary).toBe(docX['qrCodeTaggingLoopExampleExpected.docx'].zip.files[i].options.binary);
          expect(docX['qrCodeTaggingLoopExample.docx'].zip.files[i].options.compression).toBe(docX['qrCodeTaggingLoopExampleExpected.docx'].zip.files[i].options.compression);
          _results.push(expect(docX['qrCodeTaggingLoopExample.docx'].zip.files[i].options.dir).toBe(docX['qrCodeTaggingLoopExampleExpected.docx'].zip.files[i].options.dir));
        }
        return _results;
      });
    });
  });

}).call(this);
