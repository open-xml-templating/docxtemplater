//@ sourceMappingURL=docxgenTest.map
(function() {
  var loadDoc;

  Object.size = function(obj) {
    var key, log, size;

    size = 0;
    log = 0;
    for (key in obj) {
      size++;
    }
    return size;
  };

  window.docX = [];

  window.docXData = [];

  loadDoc = function(path, noDocx, intelligentTagging) {
    var xhrDoc;

    if (noDocx == null) {
      noDocx = false;
    }
    if (intelligentTagging == null) {
      intelligentTagging = false;
    }
    xhrDoc = new XMLHttpRequest();
    xhrDoc.open('GET', "../examples/" + path, false);
    if (xhrDoc.overrideMimeType) {
      xhrDoc.overrideMimeType('text/plain; charset=x-user-defined');
    }
    xhrDoc.onreadystatechange = function(e) {
      if (this.readyState === 4 && this.status === 200) {
        window.docXData[path] = this.response;
        if (noDocx === false) {
          return window.docX[path] = new DocxGen(this.response, {}, intelligentTagging);
        }
      }
    };
    return xhrDoc.send();
  };

  loadDoc('imageExample.docx');

  loadDoc('image.png', true);

  loadDoc('tagExample.docx');

  loadDoc('tagExampleExpected.docx');

  loadDoc('tagLoopExample.docx');

  loadDoc('tagProduitLoop.docx');

  loadDoc('tagDashLoop.docx');

  loadDoc('tagDashLoopList.docx');

  loadDoc('tagDashLoopTable.docx');

  loadDoc('tagIntelligentLoopTable.docx', false, true);

  loadDoc('tagIntelligentLoopTableExpected.docx');

  loadDoc('tagDashLoop.docx');

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
        return expect(Object.size(docX['imageExample.docx'].files)).toEqual(22);
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

        oldImageData = docX['imageExample.docx'].files['word/media/image1.jpeg'].data;
        docX['imageExample.docx'].setImage('word/media/image1.jpeg', docXData['image.png']);
        newImageData = docX['imageExample.docx'].files['word/media/image1.jpeg'].data;
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
        var i, outputExpected, _results;

        outputExpected = new DocxGen(docXData['tagExampleExpected.docx']);
        _results = [];
        for (i in docX['tagExample.docx'].files) {
          expect(docX['tagExample.docx'].files[i].options.date).not.toBe(docX['tagExampleExpected.docx'].files[i].options.date);
          expect(docX['tagExample.docx'].files[i].name).toBe(docX['tagExampleExpected.docx'].files[i].name);
          expect(docX['tagExample.docx'].files[i].options.base64).toBe(docX['tagExampleExpected.docx'].files[i].options.base64);
          expect(docX['tagExample.docx'].files[i].options.binary).toBe(docX['tagExampleExpected.docx'].files[i].options.binary);
          expect(docX['tagExample.docx'].files[i].options.compression).toBe(docX['tagExampleExpected.docx'].files[i].options.compression);
          expect(docX['tagExample.docx'].files[i].options.dir).toBe(docX['tagExampleExpected.docx'].files[i].options.dir);
          _results.push(expect(docX['tagExample.docx'].files[i].data).toBe(docX['tagExampleExpected.docx'].files[i].data));
        }
        return _results;
      });
    });
  });

  describe("DocxGenTemplatingForLoop", function() {
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
        docX['tagLoopExample.docx'].setTemplateVars(templateVars);
        docX['tagLoopExample.docx'].applyTemplateVars();
        expect(docX['tagLoopExample.docx'].getFullText()).toEqual('Votre proposition commercialePrix: 1250Titre titre1Prix: 2000Titre titre2Prix: 1400Titre titre3HippEdgar');
        return window.content = docX['tagLoopExample.docx'].files["word/document.xml"].data;
      });
      return it("should work with loops inside loops", function() {
        var expectedText, templateVars, text;

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
        window.docX['tagProduitLoop.docx'].setTemplateVars(templateVars);
        window.docX['tagProduitLoop.docx'].applyTemplateVars();
        text = window.docX['tagProduitLoop.docx'].getFullText();
        expectedText = "MicrosoftProduct name : WindowsProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed";
        expect(text.length).toEqual(expectedText.length);
        return expect(text).toEqual(expectedText);
      });
    });
  });

  describe("scope calculation", function() {
    var xmlTemplater;

    xmlTemplater = new XmlTemplater();
    it("should compute the scope between 2 <w:t>", function() {
      var scope;

      scope = xmlTemplater.calcScopeText("undefined</w:t></w:r></w:p><w:p w:rsidP=\"008A4B3C\" w:rsidR=\"007929C1\" w:rsidRDefault=\"007929C1\" w:rsidRPr=\"008A4B3C\"><w:pPr><w:pStyle w:val=\"Sous-titre\"/></w:pPr><w:r w:rsidRPr=\"008A4B3C\"><w:t xml:space=\"preserve\">Audit réalisé le ");
      return expect(scope).toEqual([
        {
          tag: '</w:t>',
          offset: 9
        }, {
          tag: '</w:r>',
          offset: 15
        }, {
          tag: '</w:p>',
          offset: 21
        }, {
          tag: '<w:p>',
          offset: 27
        }, {
          tag: '<w:r>',
          offset: 162
        }, {
          tag: '<w:t>',
          offset: 188
        }
      ]);
    });
    it("should compute the scope between 2 <w:t> in an Array", function() {
      var scope;

      scope = xmlTemplater.calcScopeText("urs</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type=\"dxa\" w:w=\"4140\"/></w:tcPr><w:p w:rsidP=\"00CE524B\" w:rsidR=\"00CE524B\" w:rsidRDefault=\"00CE524B\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\"/><w:color w:val=\"auto\"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\"/><w:color w:val=\"auto\"/></w:rPr><w:t>Sur exté");
      return expect(scope).toEqual([
        {
          tag: '</w:t>',
          offset: 3
        }, {
          tag: '</w:r>',
          offset: 9
        }, {
          tag: '</w:p>',
          offset: 15
        }, {
          tag: '</w:tc>',
          offset: 21
        }, {
          tag: '<w:tc>',
          offset: 28
        }, {
          tag: '<w:p>',
          offset: 83
        }, {
          tag: '<w:r>',
          offset: 268
        }, {
          tag: '<w:t>',
          offset: 374
        }
      ]);
    });
    return it('should compute the scope between a w:t in an array and the other outside', function() {
      var scope;

      scope = xmlTemplater.calcScopeText("defined €</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00137C91\" w:rsidRDefault=\"00137C91\"><w:r w:rsidRPr=\"00B12C70\"><w:rPr><w:bCs/></w:rPr><w:t>Coût ressources ");
      return expect(scope).toEqual([
        {
          tag: '</w:t>',
          offset: 11
        }, {
          tag: '</w:r>',
          offset: 17
        }, {
          tag: '</w:p>',
          offset: 23
        }, {
          tag: '</w:tc>',
          offset: 29
        }, {
          tag: '</w:tr>',
          offset: 36
        }, {
          tag: '</w:tbl>',
          offset: 43
        }, {
          tag: '<w:p>',
          offset: 191
        }, {
          tag: '<w:r>',
          offset: 260
        }, {
          tag: '<w:t>',
          offset: 309
        }
      ]);
    });
  });

  describe("scope diff calculation", function() {
    var xmlTemplater;

    xmlTemplater = new XmlTemplater();
    it("should compute the scopeDiff between 2 <w:t>", function() {
      var scope;

      scope = xmlTemplater.calcScopeDifference("undefined</w:t></w:r></w:p><w:p w:rsidP=\"008A4B3C\" w:rsidR=\"007929C1\" w:rsidRDefault=\"007929C1\" w:rsidRPr=\"008A4B3C\"><w:pPr><w:pStyle w:val=\"Sous-titre\"/></w:pPr><w:r w:rsidRPr=\"008A4B3C\"><w:t xml:space=\"preserve\">Audit réalisé le ");
      return expect(scope).toEqual([]);
    });
    it("should compute the scopeDiff between 2 <w:t> in an Array", function() {
      var scope;

      scope = xmlTemplater.calcScopeDifference("urs</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type=\"dxa\" w:w=\"4140\"/></w:tcPr><w:p w:rsidP=\"00CE524B\" w:rsidR=\"00CE524B\" w:rsidRDefault=\"00CE524B\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\"/><w:color w:val=\"auto\"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\"/><w:color w:val=\"auto\"/></w:rPr><w:t>Sur exté");
      return expect(scope).toEqual([]);
    });
    return it('should compute the scopeDiff between a w:t in an array and the other outside', function() {
      var scope;

      scope = xmlTemplater.calcScopeDifference("defined €</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00137C91\" w:rsidRDefault=\"00137C91\"><w:r w:rsidRPr=\"00B12C70\"><w:rPr><w:bCs/></w:rPr><w:t>Coût ressources ");
      return expect(scope).toEqual([
        {
          tag: '</w:tc>',
          offset: 29
        }, {
          tag: '</w:tr>',
          offset: 36
        }, {
          tag: '</w:tbl>',
          offset: 43
        }
      ]);
    });
  });

  describe("scope inner text", function() {
    return it("should find the scope", function() {
      var obj, scope, xmlTemplater;

      xmlTemplater = new XmlTemplater();
      docX['tagProduitLoop.docx'] = new DocxGen(docXData['tagProduitLoop.docx']);
      scope = xmlTemplater.calcInnerTextScope(docX['tagProduitLoop.docx'].files["word/document.xml"].data, 1195, 1245, 'w:p');
      obj = {
        text: "<w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00923B77\"><w:r><w:t>{#</w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>products</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p>",
        startTag: 1134,
        endTag: 1286
      };
      expect(scope.endTag).toEqual(obj.endTag);
      expect(scope.startTag).toEqual(obj.startTag);
      expect(scope.text.length).toEqual(obj.text.length);
      return expect(scope.text).toEqual(obj.text);
    });
  });

  describe("Dash Loop Testing", function() {
    it("dash loop ok on simple table -> w:tr", function() {
      var expectedText, templateVars, text;

      templateVars = {
        "os": [
          {
            "type": "linux",
            "price": "0",
            "reference": "Ubuntu10"
          }, {
            "type": "windows",
            "price": "500",
            "reference": "Win7"
          }, {
            "type": "apple",
            "price": "1200",
            "reference": "MACOSX"
          }
        ]
      };
      docX['tagDashLoop.docx'].setTemplateVars(templateVars);
      docX['tagDashLoop.docx'].applyTemplateVars();
      expectedText = "linux0Ubuntu10windows500Win7apple1200MACOSX";
      text = docX['tagDashLoop.docx'].getFullText();
      return expect(text).toBe(expectedText);
    });
    it("dash loop ok on simple table -> w:table", function() {
      var expectedText, templateVars, text;

      templateVars = {
        "os": [
          {
            "type": "linux",
            "price": "0",
            "reference": "Ubuntu10"
          }, {
            "type": "windows",
            "price": "500",
            "reference": "Win7"
          }, {
            "type": "apple",
            "price": "1200",
            "reference": "MACOSX"
          }
        ]
      };
      docX['tagDashLoopTable.docx'].setTemplateVars(templateVars);
      docX['tagDashLoopTable.docx'].applyTemplateVars();
      expectedText = "linux0Ubuntu10windows500Win7apple1200MACOSX";
      text = docX['tagDashLoopTable.docx'].getFullText();
      return expect(text).toBe(expectedText);
    });
    return it("dash loop ok on simple list -> w:p", function() {
      var expectedText, templateVars, text;

      templateVars = {
        "os": [
          {
            "type": "linux",
            "price": "0",
            "reference": "Ubuntu10"
          }, {
            "type": "windows",
            "price": "500",
            "reference": "Win7"
          }, {
            "type": "apple",
            "price": "1200",
            "reference": "MACOSX"
          }
        ]
      };
      docX['tagDashLoopList.docx'].setTemplateVars(templateVars);
      docX['tagDashLoopList.docx'].applyTemplateVars();
      expectedText = 'linux 0 Ubuntu10 windows 500 Win7 apple 1200 MACOSX ';
      text = docX['tagDashLoopList.docx'].getFullText();
      return expect(text).toBe(expectedText);
    });
  });

  describe("Intelligent Loop Tagging", function() {
    return it("should work with tables", function() {
      var expectedText, i, templateVars, text, _results;

      templateVars = {
        "os": [
          {
            "type": "linux",
            "price": "0",
            "reference": "Ubuntu10"
          }, {
            "type": "windows",
            "price": "500",
            "reference": "Win7"
          }, {
            "type": "apple",
            "price": "1200",
            "reference": "MACOSX"
          }
        ]
      };
      docX['tagIntelligentLoopTable.docx'].setTemplateVars(templateVars);
      docX['tagIntelligentLoopTable.docx'].applyTemplateVars();
      expectedText = 'linux0Ubuntu10windows500Win7apple1200MACOSX';
      text = docX['tagIntelligentLoopTableExpected.docx'].getFullText();
      expect(text).toBe(expectedText);
      _results = [];
      for (i in docX['tagIntelligentLoopTable.docx'].files) {
        expect(docX['tagIntelligentLoopTable.docx'].files[i].data).toBe(docX['tagIntelligentLoopTableExpected.docx'].files[i].data);
        expect(docX['tagIntelligentLoopTable.docx'].files[i].name).toBe(docX['tagIntelligentLoopTableExpected.docx'].files[i].name);
        expect(docX['tagIntelligentLoopTable.docx'].files[i].options.base64).toBe(docX['tagIntelligentLoopTableExpected.docx'].files[i].options.base64);
        expect(docX['tagIntelligentLoopTable.docx'].files[i].options.binary).toBe(docX['tagIntelligentLoopTableExpected.docx'].files[i].options.binary);
        expect(docX['tagIntelligentLoopTable.docx'].files[i].options.compression).toBe(docX['tagIntelligentLoopTableExpected.docx'].files[i].options.compression);
        expect(docX['tagIntelligentLoopTable.docx'].files[i].options.dir).toBe(docX['tagIntelligentLoopTableExpected.docx'].files[i].options.dir);
        _results.push(expect(docX['tagIntelligentLoopTable.docx'].files[i].options.date).not.toBe(docX['tagIntelligentLoopTableExpected.docx'].files[i].options.date));
      }
      return _results;
    });
  });

  describe("getTemplateVars", function() {
    it("should work with simple document", function() {
      var tempVars;

      docX['tagExample.docx'] = new DocxGen(docXData['tagExample.docx'], {}, false);
      tempVars = docX['tagExample.docx'].getTemplateVars();
      return expect(tempVars).toEqual([
        {
          fileName: 'word/document.xml',
          vars: {
            last_name: true,
            first_name: true
          }
        }, {
          fileName: 'word/footer1.xml',
          vars: {
            last_name: true,
            first_name: true,
            phone: true
          }
        }, {
          fileName: 'word/header1.xml',
          vars: {
            last_name: true,
            first_name: true,
            phone: true,
            description: true
          }
        }
      ]);
    });
    return it("should work with loop document", function() {
      var tempVars;

      docX['tagLoopExample.docx'] = new DocxGen(docXData['tagLoopExample.docx'], {}, false);
      tempVars = docX['tagLoopExample.docx'].getTemplateVars();
      return expect(tempVars).toEqual([
        {
          fileName: 'word/document.xml',
          vars: {
            offre: {
              prix: true,
              titre: true
            },
            nom: true,
            prenom: true
          }
        }, {
          fileName: 'word/footer1.xml',
          vars: {
            nom: true,
            prenom: true,
            telephone: true
          }
        }, {
          fileName: 'word/header1.xml',
          vars: {
            nom: true,
            prenom: true
          }
        }
      ]);
    });
  });

  describe("xmlTemplater", function() {
    it("should work with simpleContent", function() {
      var content, scope, xmlTemplater;

      content = "<w:t>Hello {name}</w:t>";
      scope = {
        "name": "Edgar"
      };
      xmlTemplater = new XmlTemplater(content, scope);
      xmlTemplater.applyTemplateVars();
      return expect(xmlTemplater.getFullText()).toBe('Hello Edgar');
    });
    it("should work with tag in two elements", function() {
      var content, scope, xmlTemplater;

      content = "<w:t>Hello {</w:t><w:t>name}</w:t>";
      scope = {
        "name": "Edgar"
      };
      xmlTemplater = new XmlTemplater(content, scope);
      xmlTemplater.applyTemplateVars();
      return expect(xmlTemplater.getFullText()).toBe('Hello Edgar');
    });
    it("should work with simple Loop", function() {
      var content, scope, xmlTemplater;

      content = "<w:t>Hello {#names}{name},{/names}</w:t>";
      scope = {
        "names": [
          {
            "name": "Edgar"
          }, {
            "name": "Mary"
          }, {
            "name": "John"
          }
        ]
      };
      xmlTemplater = new XmlTemplater(content, scope);
      xmlTemplater.applyTemplateVars();
      return expect(xmlTemplater.getFullText()).toBe('Hello Edgar,Mary,John,');
    });
    it("should work with dash Loop", function() {
      var content, scope, xmlTemplater;

      content = "<w:p><w:t>Hello {-w:p names}{name},{/names}</w:t></w:p>";
      scope = {
        "names": [
          {
            "name": "Edgar"
          }, {
            "name": "Mary"
          }, {
            "name": "John"
          }
        ]
      };
      xmlTemplater = new XmlTemplater(content, scope);
      xmlTemplater.applyTemplateVars();
      return expect(xmlTemplater.getFullText()).toBe('Hello Edgar,Hello Mary,Hello John,');
    });
    it("should work with loop and innerContent", function() {
      var content, scope, xmlTemplater;

      content = "</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:pStyle w:val=\"Titre1\"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRPr=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00923B77\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>oof</w:t></w:r><w:r><w:t xml:space=\"preserve\">} </w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>It works because</w:t></w:r><w:r><w:t xml:space=\"preserve\"> {</w:t></w:r><w:r w:rsidR=\"006F26AC\"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00FD04E9\" w:rsidRDefault=\"00923B77\"><w:r><w:t>";
      scope = {
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
      };
      xmlTemplater = new XmlTemplater(content, scope);
      xmlTemplater.applyTemplateVars();
      return expect(xmlTemplater.getFullText()).toBe('Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware');
    });
    return it("should work with loop and innerContent (with last)", function() {
      var content, scope, xmlTemplater;

      content = "</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:pStyle w:val=\"Titre1\"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRPr=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00923B77\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>oof</w:t></w:r><w:r><w:t xml:space=\"preserve\">} </w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>It works because</w:t></w:r><w:r><w:t xml:space=\"preserve\"> {</w:t></w:r><w:r w:rsidR=\"006F26AC\"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00FD04E9\" w:rsidRDefault=\"00923B77\"><w:r><w:t> ";
      scope = {
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
      };
      xmlTemplater = new XmlTemplater(content, scope);
      xmlTemplater.applyTemplateVars();
      return expect(xmlTemplater.getFullText()).toBe('Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware');
    });
  });

}).call(this);
