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

  describe("image Loop Replacing", function() {
    return describe('rels', function() {
      it('should load', function() {
        expect(docX['imageExample.docx'].loadImageRels().imageRels).toEqual([]);
        return expect(docX['imageExample.docx'].maxRid).toEqual(10);
      });
      return it('should add', function() {
        var contentTypeData, contentTypeXml, contentTypes, oldData, relationships, relsData, relsXml;

        oldData = docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].data;
        expect(docX['imageExample.docx'].addImageRels('image1.png', docXData['bootstrap_logo.png'])).toBe(11);
        expect(docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].data).not.toBe(oldData);
        relsData = docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].data;
        contentTypeData = docX['imageExample.docx'].zip.files['[Content_Types].xml'].data;
        relsXml = DocUtils.Str2xml(relsData);
        contentTypeXml = DocUtils.Str2xml(contentTypeData);
        relationships = relsXml.getElementsByTagName('Relationship');
        contentTypes = contentTypeXml.getElementsByTagName('Default');
        expect(relationships.length).toEqual(11);
        return expect(contentTypes.length).toBe(4);
      });
    });
  });

  describe('qr code testing', function() {
    return it('should work with local QRCODE without tags', function() {
      var endcallback;

      docX['qrCodeExample.docx'] = new DocxGen(docXData['qrCodeExample.docx'], {}, false, true);
      endcallback = function() {
        return 1;
      };
      docX['qrCodeExample.docx'].applyTemplateVars({}, endcallback);
      docX['qrCodeExample.docx'];
      waitsFor(function() {
        return docX['qrCodeExample.docx'].ready != null;
      });
      return runs(function() {
        var i, _results;

        expect(docX['qrCodeExample.docx'].zip.files['word/media/Copie_0.png'] != null).toBeTruthy();
        _results = [];
        for (i in docX['qrCodeExample.docx'].zip.files) {
          expect(docX['qrCodeExample.docx'].zip.files[i].options.date).not.toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].options.date);
          expect(docX['qrCodeExample.docx'].zip.files[i].name).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].name);
          expect(docX['qrCodeExample.docx'].zip.files[i].options.base64).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].options.base64);
          expect(docX['qrCodeExample.docx'].zip.files[i].options.binary).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].options.binary);
          expect(docX['qrCodeExample.docx'].zip.files[i].options.compression).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].options.compression);
          _results.push(expect(docX['qrCodeExample.docx'].zip.files[i].options.dir).toBe(docX['qrCodeExampleExpected.docx'].zip.files[i].options.dir));
        }
        return _results;
      });
    });
  });

}).call(this);
