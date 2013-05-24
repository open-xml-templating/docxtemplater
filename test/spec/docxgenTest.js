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
    var callbackLoadedDocxImage, xhrDoc, xhrImage;

    callbackLoadedDocxImage = jasmine.createSpy();
    xhrDoc = new XMLHttpRequest();
    xhrDoc.open('GET', '../examples/imageExample.docx', true);
    if (xhrDoc.overrideMimeType) {
      xhrDoc.overrideMimeType('text/plain; charset=x-user-defined');
    }
    xhrDoc.onreadystatechange = function(e) {
      if (this.readyState === 4 && this.status === 200) {
        window.docData = this.response;
        window.docx = new DocxGen(docData);
        return callbackLoadedDocxImage();
      }
    };
    xhrDoc.send();
    xhrImage = new XMLHttpRequest();
    xhrImage.open('GET', '../examples/image.png', true);
    if (xhrImage.overrideMimeType) {
      xhrImage.overrideMimeType('text/plain; charset=x-user-defined');
    }
    xhrImage.onreadystatechange = function(e) {
      if (this.readyState === 4 && this.status === 200) {
        window.imgData = this.response;
        return callbackLoadedDocxImage();
      }
    };
    xhrImage.send();
    waitsFor(function() {
      return callbackLoadedDocxImage.callCount >= 2;
    });
    describe("ajax done correctly", function() {
      it("doc and img Data should have the expected length", function() {
        expect(docData.length).toEqual(729580);
        return expect(imgData.length).toEqual(18062);
      });
      return it("should have the right number of files (the docx unzipped)", function() {
        return expect(Object.size(docx.files)).toEqual(22);
      });
    });
    describe("basic loading", function() {
      return it("should load file imageExample.docx", function() {
        return expect(typeof docx).toBe('object');
      });
    });
    describe("content_loading", function() {
      it("should load the right content for the footer", function() {
        var fullText;

        fullText = docx.getFullText("word/footer1.xml");
        expect(fullText.length).not.toBe(0);
        return expect(fullText).toBe('{last_name}{first_name}{phone}');
      });
      return it("should load the right content for the document", function() {
        var fullText;

        fullText = docx.getFullText();
        return expect(fullText).toBe("");
      });
    });
    return describe("image loading", function() {
      it("should find one image (and not more than 1)", function() {
        return expect(docx.getImageList().length).toEqual(1);
      });
      it("should find the image named with the good name", function() {
        return expect((docx.getImageList())[0].path).toEqual('word/media/image1.jpeg');
      });
      return it("should change the image with another one", function() {
        var newImageData, oldImageData;

        oldImageData = docx.files['word/media/image1.jpeg'].data;
        docx.setImage('word/media/image1.jpeg', imgData);
        newImageData = docx.files['word/media/image1.jpeg'].data;
        expect(oldImageData).not.toEqual(newImageData);
        return expect(imgData).toEqual(newImageData);
      });
    });
  });

  describe("DocxGenTemplating", function() {
    var callbackLoadedTaggedDocx, xhrDoc, xhrDocExpected;

    callbackLoadedTaggedDocx = jasmine.createSpy();
    xhrDoc = new XMLHttpRequest();
    xhrDoc.open('GET', '../examples/tagExample.docx', true);
    if (xhrDoc.overrideMimeType) {
      xhrDoc.overrideMimeType('text/plain; charset=x-user-defined');
    }
    xhrDoc.onreadystatechange = function(e) {
      var docData;

      if (this.readyState === 4 && this.status === 200) {
        docData = this.response;
        window.taggedDocx = new DocxGen(docData);
        return callbackLoadedTaggedDocx();
      }
    };
    xhrDoc.send();
    xhrDocExpected = new XMLHttpRequest();
    xhrDocExpected.open('GET', '../examples/tagExampleExpected.docx', true);
    if (xhrDocExpected.overrideMimeType) {
      xhrDocExpected.overrideMimeType('text/plain; charset=x-user-defined');
    }
    xhrDocExpected.onreadystatechange = function(e) {
      if (this.readyState === 4 && this.status === 200) {
        window.docDataExpected = this.response;
        return callbackLoadedTaggedDocx();
      }
    };
    xhrDocExpected.send();
    waitsFor(function() {
      return callbackLoadedTaggedDocx.callCount >= 2;
    });
    return describe("text templating", function() {
      it("should change values with template vars", function() {
        var templateVars;

        templateVars = {
          "first_name": "Hipp",
          "last_name": "Edgar",
          "phone": "0652455478"
        };
        taggedDocx.setTemplateVars(templateVars);
        taggedDocx.applyTemplateVars();
        expect(taggedDocx.getFullText()).toEqual('Edgar Hipp');
        expect(taggedDocx.getFullText("word/header1.xml")).toEqual('Edgar Hipp0652455478undefined');
        return expect(taggedDocx.getFullText("word/footer1.xml")).toEqual('EdgarHipp0652455478');
      });
      return it("should export the good file", function() {
        var i, outputExpected, _results;

        outputExpected = new DocxGen(docDataExpected);
        _results = [];
        for (i in taggedDocx.files) {
          expect(taggedDocx.files[i].data).toBe(outputExpected.files[i].data);
          expect(taggedDocx.files[i].name).toBe(outputExpected.files[i].name);
          expect(taggedDocx.files[i].options.base64).toBe(outputExpected.files[i].options.base64);
          expect(taggedDocx.files[i].options.binary).toBe(outputExpected.files[i].options.binary);
          expect(taggedDocx.files[i].options.compression).toBe(outputExpected.files[i].options.compression);
          expect(taggedDocx.files[i].options.dir).toBe(outputExpected.files[i].options.dir);
          _results.push(expect(taggedDocx.files[i].options.date).not.toBe(outputExpected.files[i].options.date));
        }
        return _results;
      });
    });
  });

  describe("DocxGenTemplatingForLoop", function() {
    var callbackLoadedTaggedDocx, xhrDoc;

    callbackLoadedTaggedDocx = jasmine.createSpy();
    xhrDoc = new XMLHttpRequest();
    xhrDoc.open('GET', '../examples/tagLoopExample.docx', true);
    if (xhrDoc.overrideMimeType) {
      xhrDoc.overrideMimeType('text/plain; charset=x-user-defined');
    }
    xhrDoc.onreadystatechange = function(e) {
      var docData;

      if (this.readyState === 4 && this.status === 200) {
        docData = this.response;
        window.taggedForDocx = new DocxGen(docData);
        return callbackLoadedTaggedDocx();
      }
    };
    xhrDoc.send();
    waitsFor(function() {
      return callbackLoadedTaggedDocx.callCount >= 1;
    });
    return describe("textLoop templating", function() {
      return it("should replace all the tags", function() {
        var templateVars;

        templateVars = {};
        console.log(taggedForDocx);
        taggedForDocx.setTemplateVars(templateVars);
        taggedForDocx.applyTemplateVars();
        expect(taggedForDocx.getFullText()).toEqual('Votre proposition commercialeundefinedMon titreTitre undefinedBonjourLe prix total est de undefined, et le nombre de semaines de undefinedLala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolorLes avantages sont:La rapiditÃ©La simplicitÃ©Lalasit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit amet Lala Lorem ispsum dolor sit ametundefinedundefinedundefined');
        return window.content = taggedForDocx.files["word/document.xml"].data;
      });
    });
  });

}).call(this);
