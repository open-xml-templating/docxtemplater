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
          "phone": "0652455478",
          "description": "New Website"
        };
        taggedDocx.setTemplateVars(templateVars);
        taggedDocx.applyTemplateVars();
        expect(taggedDocx.getFullText()).toEqual('Edgar Hipp');
        expect(taggedDocx.getFullText("word/header1.xml")).toEqual('Edgar Hipp0652455478New Website');
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
    var callbackLoadedTaggedDocx, xhrDoc, xhrDocMultipleLoop;

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
    xhrDocMultipleLoop = new XMLHttpRequest();
    xhrDocMultipleLoop.open('GET', '../examples/tagProduitLoop.docx', true);
    if (xhrDocMultipleLoop.overrideMimeType) {
      xhrDocMultipleLoop.overrideMimeType('text/plain; charset=x-user-defined');
    }
    xhrDocMultipleLoop.onreadystatechange = function(e) {
      var docData;

      if (this.readyState === 4 && this.status === 200) {
        docData = this.response;
        window.MultipleTaggedDocx = new DocxGen(docData);
        console.log(MultipleTaggedDocx);
        return callbackLoadedTaggedDocx();
      }
    };
    xhrDocMultipleLoop.send();
    waitsFor(function() {
      console.log(callbackLoadedTaggedDocx.callCount);
      return callbackLoadedTaggedDocx.callCount >= 2;
    });
    return describe("textLoop templating", function() {
      it("should replace all the tags", function() {
        var templateVars;

        templateVars = {
          "nom": "Hipp",
          "prenom": "Edgar",
          "telephone": "0652455478",
          "description": "New Website",
          "offre": [
            {
              "titre": "titre1",
              "prix": "1250"
            }, {
              "titre": "titre2",
              "prix": "2000"
            }, {
              "titre": "titre3",
              "prix": "1400"
            }
          ]
        };
        taggedForDocx.setTemplateVars(templateVars);
        taggedForDocx.applyTemplateVars();
        expect(taggedForDocx.getFullText()).toEqual('Votre proposition commercialePrix: 1250Titre titre1Prix: 2000Titre titre2Prix: 1400Titre titre3HippEdgar');
        return window.content = taggedForDocx.files["word/document.xml"].data;
      });
      return it("should work with loops inside loops", function() {
        var expectedText, templateVars, text;

        console.log("test");
        templateVars = {
          "products": [
            {
              "title": "Microsoft",
              "name": "Windows",
              "reference": "Win7",
              "avantages": [
                {
                  "title": "Everyone uses it",
                  "proof": [
                    {
                      "reason": "it is quite cheap"
                    }, {
                      "reason": "it is quit simple"
                    }, {
                      "reason": "it works on a lot of different Hardware"
                    }
                  ]
                }
              ]
            }, {
              "title": "Linux",
              "name": "Ubuntu",
              "reference": "Ubuntu10",
              "avantages": [
                {
                  "title": "It's very powerful",
                  "proof": [
                    {
                      "reason": "the terminal is your friend"
                    }, {
                      "reason": "Hello world"
                    }, {
                      "reason": "it's free"
                    }
                  ]
                }
              ]
            }, {
              "title": "Apple",
              "name": "Mac",
              "reference": "OSX",
              "avantages": [
                {
                  "title": "It's very easy",
                  "proof": [
                    {
                      "reason": "you can do a lot just with the mouse"
                    }, {
                      "reason": "It's nicely designed"
                    }
                  ]
                }
              ]
            }
          ]
        };
        window.MultipleTaggedDocx.setTemplateVars(templateVars);
        window.MultipleTaggedDocx.applyTemplateVars();
        text = window.MultipleTaggedDocx.getFullText();
        expectedText = "MicrosoftProduct name : WindowsProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed";
        expect(text.length).toEqual(expectedText.length);
        return expect(text).toEqual(expectedText);
      });
    });
  });

}).call(this);
