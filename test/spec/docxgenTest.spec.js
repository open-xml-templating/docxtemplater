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

  describe("DocxGenBasis", function() {
    it("should be defined", function() {
      return expect(DocxGen).not.toBe(void 0);
    });
    return it("should construct", function() {
      var a;

      a = new DocxGen();
      return expect(a).not.toBe(void 0);
    });
  });

  describe("DocxGenLoading", function() {
    describe("ajax done correctly", function() {
      it("doc and img Data should have the expected length", function() {
        expect(docXData['imageExample.docx'].length).toEqual(729580);
        return expect(docXData['image.png'].length).toEqual(18062);
      });
      return it("should have the right number of files (the docx unzipped)", function() {
        docX['imageExample.docx'] = new DocxGen(docXData['imageExample.docx']);
        return expect(Object.size(docX['imageExample.docx'].zip.files)).toEqual(22);
      });
    });
    describe("basic loading", function() {
      return it("should load file imageExample.docx", function() {
        return expect(typeof docX['imageExample.docx']).toBe('object');
      });
    });
    describe("content_loading", function() {
      it("should load the right content for the footer", function() {
        var fullText;

        fullText = docX['imageExample.docx'].getFullText("word/footer1.xml");
        expect(fullText.length).not.toBe(0);
        return expect(fullText).toBe('{last_name}{first_name}{phone}');
      });
      return it("should load the right content for the document", function() {
        var fullText;

        fullText = docX['imageExample.docx'].getFullText();
        return expect(fullText).toBe("");
      });
    });
    return describe("image loading", function() {
      it("should find one image (and not more than 1)", function() {
        return expect(docX['imageExample.docx'].getImageList().length).toEqual(1);
      });
      it("should find the image named with the good name", function() {
        return expect((docX['imageExample.docx'].getImageList())[0].path).toEqual('word/media/image1.jpeg');
      });
      return it("should change the image with another one", function() {
        var newImageData, oldImageData;

        oldImageData = docX['imageExample.docx'].zip.files['word/media/image1.jpeg'].data;
        docX['imageExample.docx'].setImage('word/media/image1.jpeg', docXData['image.png']);
        newImageData = docX['imageExample.docx'].zip.files['word/media/image1.jpeg'].data;
        expect(oldImageData).not.toEqual(newImageData);
        return expect(docXData['image.png']).toEqual(newImageData);
      });
    });
  });

  describe("DocxGenTemplating", function() {
    return describe("text templating", function() {
      it("should change values with template vars", function() {
        var templateVars;

        templateVars = {
          "first_name": "Hipp",
          "last_name": "Edgar",
          "phone": "0652455478",
          "description": "New Website"
        };
        docX['tagExample.docx'].setTemplateVars(templateVars);
        docX['tagExample.docx'].applyTemplateVars();
        expect(docX['tagExample.docx'].getFullText()).toEqual('Edgar Hipp');
        expect(docX['tagExample.docx'].getFullText("word/header1.xml")).toEqual('Edgar Hipp0652455478New Website');
        return expect(docX['tagExample.docx'].getFullText("word/footer1.xml")).toEqual('EdgarHipp0652455478');
      });
      return it("should export the good file", function() {
        var i, _results;

        _results = [];
        for (i in docX['tagExample.docx'].zip.files) {
          expect(docX['tagExample.docx'].zip.files[i].options.date).not.toBe(docX['tagExampleExpected.docx'].zip.files[i].options.date);
          expect(docX['tagExample.docx'].zip.files[i].name).toBe(docX['tagExampleExpected.docx'].zip.files[i].name);
          expect(docX['tagExample.docx'].zip.files[i].options.base64).toBe(docX['tagExampleExpected.docx'].zip.files[i].options.base64);
          expect(docX['tagExample.docx'].zip.files[i].options.binary).toBe(docX['tagExampleExpected.docx'].zip.files[i].options.binary);
          expect(docX['tagExample.docx'].zip.files[i].options.compression).toBe(docX['tagExampleExpected.docx'].zip.files[i].options.compression);
          expect(docX['tagExample.docx'].zip.files[i].options.dir).toBe(docX['tagExampleExpected.docx'].zip.files[i].options.dir);
          _results.push(expect(docX['tagExample.docx'].zip.files[i].data).toBe(docX['tagExampleExpected.docx'].zip.files[i].data));
        }
        return _results;
      });
    });
  });

  describe('DocxQrCode module', function() {
    return describe("Calculate simple Docx", function() {
      var f, fCalled, obj, qrcodezip;

      f = null;
      fCalled = null;
      qrcodezip = null;
      obj = null;
      beforeEach(function() {
        var docx;

        qrcodezip = new JSZip(docXData['qrcodeTest.zip']);
        docx = new DocxGen();
        return obj = new DocXTemplater("", docx, {
          Tag: "tagValue"
        });
      });
      return it("should work with Blablalalabioeajbiojbepbroji", function() {
        runs(function() {
          var base64, binaryData, dat, finished, png, qr;

          fCalled = false;
          f = {
            test: function() {
              return fCalled = true;
            }
          };
          spyOn(f, 'test').andCallThrough();
          if (typeof window !== "undefined" && window !== null) {
            qr = new DocxQrCode(qrcodezip.files['blabla.png'].data, obj, "custom.png", 6);
            return qr.decode(f.test);
          } else {
            base64 = JSZipBase64.encode(qrcodezip.files['blabla.png'].data);
            binaryData = new Buffer(base64, 'base64');
            png = new PNG(binaryData);
            finished = function(a) {
              png.decoded = a;
              qr = new DocxQrCode(png, obj, "custom.png", 6);
              return qr.decode(f.test);
            };
            return dat = png.decode(finished);
          }
        });
        waitsFor(function() {
          return fCalled;
        });
        return runs(function() {
          expect(f.test).toHaveBeenCalled();
          expect(f.test.calls.length).toEqual(1);
          expect(f.test.mostRecentCall.args[0].result).toEqual("Blablalalabioeajbiojbepbroji");
          expect(f.test.mostRecentCall.args[1]).toEqual("custom.png");
          return expect(f.test.mostRecentCall.args[2]).toEqual(6);
        });
      });
    });
  });

}).call(this);
