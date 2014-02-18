(function() {
  var env, root;

  root = typeof global !== "undefined" && global !== null ? global : window;

  env = typeof global !== "undefined" && global !== null ? 'node' : 'browser';

  root.docX = {};

  root.docXData = {};

  if (env === 'node') {
    global.http = require('http');
    global.https = require('https');
    global.fs = require('fs');
    global.vm = require('vm');
    global.DOMParser = require('xmldom').DOMParser;
    global.XMLSerializer = require('xmldom').XMLSerializer;
    global.PNG = require('../../libs/pngjs/png-node');
    global.url = require('url');
    ["grid.js", "version.js", "detector.js", "formatinf.js", "errorlevel.js", "bitmat.js", "datablock.js", "bmparser.js", "datamask.js", "rsdecoder.js", "gf256poly.js", "gf256.js", "decoder.js", "qrcode.js", "findpat.js", "alignpat.js", "databr.js"].forEach(function(file) {
      return vm.runInThisContext(global.fs.readFileSync(__dirname + '/../../libs/jsqrcode/' + file), file);
    });
    ['jszip.js', 'jszip-load.js', 'jszip-deflate.js', 'jszip-inflate.js'].forEach(function(file) {
      return vm.runInThisContext(global.fs.readFileSync(__dirname + '/../../libs/jszip/' + file), file);
    });
    root.DocxGen = require('../../js/docxgen.js');
  }

  DocUtils.loadDoc('imageExample.docx');

  DocUtils.loadDoc('tagExample.docx');

  DocUtils.loadDoc('tagExampleExpected.docx');

  DocUtils.loadDoc('tagLoopExample.docx');

  DocUtils.loadDoc('tagLoopExampleImageExpected.docx');

  DocUtils.loadDoc('tagProduitLoop.docx');

  DocUtils.loadDoc('tagDashLoop.docx');

  DocUtils.loadDoc('tagDashLoopList.docx');

  DocUtils.loadDoc('tagDashLoopTable.docx');

  DocUtils.loadDoc('tagIntelligentLoopTable.docx', {
    intelligentTagging: true
  });

  DocUtils.loadDoc('tagIntelligentLoopTableExpected.docx');

  DocUtils.loadDoc('tagDashLoop.docx');

  DocUtils.loadDoc('qrCodeExample.docx');

  DocUtils.loadDoc('qrCodeExampleExpected.docx');

  DocUtils.loadDoc('qrCodeTaggingExample.docx');

  DocUtils.loadDoc('qrCodeTaggingExampleExpected.docx');

  DocUtils.loadDoc('qrCodeTaggingLoopExample.docx');

  DocUtils.loadDoc('qrCodeTaggingLoopExampleExpected.docx');

  DocUtils.loadDoc('image.png', {
    docx: false
  });

  DocUtils.loadDoc('bootstrap_logo.png', {
    docx: false
  });

  DocUtils.loadDoc('BMW_logo.png', {
    docx: false
  });

  DocUtils.loadDoc('Firefox_logo.png', {
    docx: false
  });

  DocUtils.loadDoc('Volkswagen_logo.png', {
    docx: false
  });

  DocUtils.loadDoc('qrcodeTest.zip', {
    docx: false
  });

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
        return expect(DocUtils.sizeOfObject(docX['imageExample.docx'].zip.files)).toEqual(22);
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
    describe("image loading", function() {
      it("should find one image (and not more than 1)", function() {
        return expect(docX['imageExample.docx'].getImageList().length).toEqual(1);
      });
      it("should find the image named with the good name", function() {
        return expect((docX['imageExample.docx'].getImageList())[0].path).toEqual('word/media/image1.jpeg');
      });
      return it("should change the image with another one", function() {
        var newImageData, oldImageData;
        oldImageData = docX['imageExample.docx'].zip.files['word/media/image1.jpeg'].asText();
        docX['imageExample.docx'].setImage('word/media/image1.jpeg', docXData['image.png']);
        newImageData = docX['imageExample.docx'].zip.files['word/media/image1.jpeg'].asText();
        expect(oldImageData).not.toEqual(newImageData);
        return expect(docXData['image.png']).toEqual(newImageData);
      });
    });
    return describe("output and input", function() {
      return it("should be the same", function() {
        var doc, output;
        doc = new DocxGen(root.docXData['tagExample.docx']);
        output = doc.output(false);
        expect(output.length).toEqual(91348);
        return expect(output.substr(0, 50)).toEqual('UEsDBAoAAAAAAAAAIQAMTxYSlgcAAJYHAAATAAAAW0NvbnRlbn');
      });
    });
  });

  describe("DocxGenTemplating", function() {
    return describe("text templating", function() {
      it("should change values with template vars", function() {
        var Tags;
        Tags = {
          "first_name": "Hipp",
          "last_name": "Edgar",
          "phone": "0652455478",
          "description": "New Website"
        };
        docX['tagExample.docx'].setTags(Tags);
        docX['tagExample.docx'].applyTags();
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
          _results.push(expect(docX['tagExample.docx'].zip.files[i].asText()).toBe(docX['tagExampleExpected.docx'].zip.files[i].asText()));
        }
        return _results;
      });
    });
  });

  describe("DocxGenTemplatingForLoop", function() {
    return describe("textLoop templating", function() {
      it("should replace all the tags", function() {
        var Tags;
        Tags = {
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
        docX['tagLoopExample.docx'].setTags(Tags);
        docX['tagLoopExample.docx'].applyTags();
        return expect(docX['tagLoopExample.docx'].getFullText()).toEqual('Votre proposition commercialePrix: 1250Titre titre1Prix: 2000Titre titre2Prix: 1400Titre titre3HippEdgar');
      });
      return it("should work with loops inside loops", function() {
        var Tags, expectedText, text;
        Tags = {
          "products": [
            {
              "title": "Microsoft",
              "name": "DOS",
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
        docX['tagProduitLoop.docx'].setTags(Tags);
        docX['tagProduitLoop.docx'].applyTags();
        text = docX['tagProduitLoop.docx'].getFullText();
        expectedText = "MicrosoftProduct name : DOSProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed";
        expect(text.length).toEqual(expectedText.length);
        return expect(text).toEqual(expectedText);
      });
    });
  });

  describe("Xml Util", function() {
    var xmlUtil;
    xmlUtil = new XmlUtil();
    it("should compute the scope between 2 <w:t>", function() {
      var scope;
      scope = xmlUtil.getListXmlElements("undefined</w:t></w:r></w:p><w:p w:rsidP=\"008A4B3C\" w:rsidR=\"007929C1\" w:rsidRDefault=\"007929C1\" w:rsidRPr=\"008A4B3C\"><w:pPr><w:pStyle w:val=\"Sous-titre\"/></w:pPr><w:r w:rsidRPr=\"008A4B3C\"><w:t xml:space=\"preserve\">Audit réalisé le ");
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
      scope = xmlUtil.getListXmlElements("urs</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type=\"dxa\" w:w=\"4140\"/></w:tcPr><w:p w:rsidP=\"00CE524B\" w:rsidR=\"00CE524B\" w:rsidRDefault=\"00CE524B\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\"/><w:color w:val=\"auto\"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\"/><w:color w:val=\"auto\"/></w:rPr><w:t>Sur exté");
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
      scope = xmlUtil.getListXmlElements("defined </w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00137C91\" w:rsidRDefault=\"00137C91\"><w:r w:rsidRPr=\"00B12C70\"><w:rPr><w:bCs/></w:rPr><w:t>Coût ressources ");
      return expect(scope).toEqual([
        {
          tag: '</w:t>',
          offset: 8
        }, {
          tag: '</w:r>',
          offset: 14
        }, {
          tag: '</w:p>',
          offset: 20
        }, {
          tag: '</w:tc>',
          offset: 26
        }, {
          tag: '</w:tr>',
          offset: 33
        }, {
          tag: '</w:tbl>',
          offset: 40
        }, {
          tag: '<w:p>',
          offset: 188
        }, {
          tag: '<w:r>',
          offset: 257
        }, {
          tag: '<w:t>',
          offset: 306
        }
      ]);
    });
  });

  describe("scope diff calculation", function() {
    var xmlUtil;
    xmlUtil = new XmlUtil();
    it("should compute the scopeDiff between 2 <w:t>", function() {
      var scope;
      scope = xmlUtil.getListDifferenceXmlElements("undefined</w:t></w:r></w:p><w:p w:rsidP=\"008A4B3C\" w:rsidR=\"007929C1\" w:rsidRDefault=\"007929C1\" w:rsidRPr=\"008A4B3C\"><w:pPr><w:pStyle w:val=\"Sous-titre\"/></w:pPr><w:r w:rsidRPr=\"008A4B3C\"><w:t xml:space=\"preserve\">Audit réalisé le ");
      return expect(scope).toEqual([]);
    });
    it("should compute the scopeDiff between 2 <w:t> in an Array", function() {
      var scope;
      scope = xmlUtil.getListDifferenceXmlElements("urs</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type=\"dxa\" w:w=\"4140\"/></w:tcPr><w:p w:rsidP=\"00CE524B\" w:rsidR=\"00CE524B\" w:rsidRDefault=\"00CE524B\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\"/><w:color w:val=\"auto\"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\"/><w:color w:val=\"auto\"/></w:rPr><w:t>Sur exté");
      return expect(scope).toEqual([]);
    });
    return it('should compute the scopeDiff between a w:t in an array and the other outside', function() {
      var scope;
      scope = xmlUtil.getListDifferenceXmlElements("defined </w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00137C91\" w:rsidRDefault=\"00137C91\"><w:r w:rsidRPr=\"00B12C70\"><w:rPr><w:bCs/></w:rPr><w:t>Coût ressources ");
      return expect(scope).toEqual([
        {
          tag: '</w:tc>',
          offset: 26
        }, {
          tag: '</w:tr>',
          offset: 33
        }, {
          tag: '</w:tbl>',
          offset: 40
        }
      ]);
    });
  });

  describe("scope inner text", function() {
    return it("should find the scope", function() {
      var obj, scope, xmlTemplater;
      xmlTemplater = new DocXTemplater();
      docX['tagProduitLoop.docx'] = new DocxGen(docXData['tagProduitLoop.docx']);
      scope = xmlTemplater.calcOuterXml(docX['tagProduitLoop.docx'].zip.files["word/document.xml"].asText(), 1195, 1245, 'w:p');
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
      var Tags, expectedText, text;
      Tags = {
        "os": [
          {
            "type": "linux",
            "price": "0",
            "reference": "Ubuntu10"
          }, {
            "type": "DOS",
            "price": "500",
            "reference": "Win7"
          }, {
            "type": "apple",
            "price": "1200",
            "reference": "MACOSX"
          }
        ]
      };
      docX['tagDashLoop.docx'].setTags(Tags);
      docX['tagDashLoop.docx'].applyTags();
      expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
      text = docX['tagDashLoop.docx'].getFullText();
      return expect(text).toBe(expectedText);
    });
    it("dash loop ok on simple table -> w:table", function() {
      var Tags, expectedText, text;
      Tags = {
        "os": [
          {
            "type": "linux",
            "price": "0",
            "reference": "Ubuntu10"
          }, {
            "type": "DOS",
            "price": "500",
            "reference": "Win7"
          }, {
            "type": "apple",
            "price": "1200",
            "reference": "MACOSX"
          }
        ]
      };
      docX['tagDashLoopTable.docx'].setTags(Tags);
      docX['tagDashLoopTable.docx'].applyTags();
      expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
      text = docX['tagDashLoopTable.docx'].getFullText();
      return expect(text).toBe(expectedText);
    });
    return it("dash loop ok on simple list -> w:p", function() {
      var Tags, expectedText, text;
      Tags = {
        "os": [
          {
            "type": "linux",
            "price": "0",
            "reference": "Ubuntu10"
          }, {
            "type": "DOS",
            "price": "500",
            "reference": "Win7"
          }, {
            "type": "apple",
            "price": "1200",
            "reference": "MACOSX"
          }
        ]
      };
      docX['tagDashLoopList.docx'].setTags(Tags);
      docX['tagDashLoopList.docx'].applyTags();
      expectedText = 'linux 0 Ubuntu10 DOS 500 Win7 apple 1200 MACOSX ';
      text = docX['tagDashLoopList.docx'].getFullText();
      return expect(text).toBe(expectedText);
    });
  });

  describe("Intelligent Loop Tagging", function() {
    return it("should work with tables", function() {
      var Tags, expectedText, i, text, _results;
      Tags = {
        clients: [
          {
            first_name: "John",
            last_name: "Doe",
            phone: "+33647874513"
          }, {
            first_name: "Jane",
            last_name: "Doe",
            phone: "+33454540124"
          }, {
            first_name: "Phil",
            last_name: "Kiel",
            phone: "+44578451245"
          }, {
            first_name: "Dave",
            last_name: "Sto",
            phone: "+44548787984"
          }
        ]
      };
      docX['tagIntelligentLoopTable.docx'].setTags(Tags);
      docX['tagIntelligentLoopTable.docx'].applyTags();
      expectedText = 'JohnDoe+33647874513JaneDoe+33454540124PhilKiel+44578451245DaveSto+44548787984';
      text = docX['tagIntelligentLoopTableExpected.docx'].getFullText();
      expect(text).toBe(expectedText);
      _results = [];
      for (i in docX['tagIntelligentLoopTable.docx'].zip.files) {
        expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].asText()).toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].asText());
        expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].name).toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].name);
        expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].options.base64).toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].options.base64);
        expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].options.binary).toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].options.binary);
        expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].options.compression).toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].options.compression);
        expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].options.dir).toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].options.dir);
        _results.push(expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].options.date).not.toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].options.date));
      }
      return _results;
    });
  });

  describe("getTags", function() {
    it("should work with simple document", function() {
      var tempVars;
      docX['tagExample.docx'] = new DocxGen(docXData['tagExample.docx'], {}, false);
      tempVars = docX['tagExample.docx'].getTags();
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
    it("should work with loop document", function() {
      var tempVars;
      docX['tagLoopExample.docx'] = new DocxGen(docXData['tagLoopExample.docx'], {}, false);
      tempVars = docX['tagLoopExample.docx'].getTags();
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
    return it('should work if there are no Tags', function() {
      var tempVars;
      docX['qrCodeExample.docx'] = new DocxGen(docXData['qrCodeExample.docx'], {}, false);
      tempVars = docX['qrCodeExample.docx'].getTags();
      return expect(tempVars).toEqual([]);
    });
  });

  describe("xmlTemplater", function() {
    it("should work with simpleContent", function() {
      var content, scope, xmlTemplater;
      content = "<w:t>Hello {name}</w:t>";
      scope = {
        "name": "Edgar"
      };
      xmlTemplater = new DocXTemplater(content, {
        Tags: scope
      });
      xmlTemplater.applyTags();
      return expect(xmlTemplater.getFullText()).toBe('Hello Edgar');
    });
    it("should work with non w:t content", function() {
      var content, scope, xmlTemplater;
      content = "{image}.png";
      scope = {
        "image": "edgar"
      };
      xmlTemplater = new DocXTemplater(content, {
        Tags: scope
      });
      xmlTemplater.applyTags();
      return expect(xmlTemplater.content).toBe('edgar.png');
    });
    it("should work with tag in two elements", function() {
      var content, scope, xmlTemplater;
      content = "<w:t>Hello {</w:t><w:t>name}</w:t>";
      scope = {
        "name": "Edgar"
      };
      xmlTemplater = new DocXTemplater(content, {
        Tags: scope
      });
      xmlTemplater.applyTags();
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
      xmlTemplater = new DocXTemplater(content, {
        Tags: scope
      });
      xmlTemplater.applyTags();
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
      xmlTemplater = new DocXTemplater(content, {
        Tags: scope
      });
      xmlTemplater.applyTags();
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
      xmlTemplater = new DocXTemplater(content, {
        Tags: scope
      });
      xmlTemplater.applyTags();
      return expect(xmlTemplater.getFullText()).toBe('Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware');
    });
    it("should work with loop and innerContent (with last)", function() {
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
      xmlTemplater = new DocXTemplater(content, {
        Tags: scope
      });
      xmlTemplater.applyTags();
      return expect(xmlTemplater.getFullText()).toBe('Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware');
    });
    return it('should work with not w:t tag (if the for loop is like {#forloop} text {/forloop}) ', function() {
      var content, scope, xmlTemplater;
      content = "Hello {#names}{name},{/names}";
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
      xmlTemplater = new DocXTemplater(content, {
        Tags: scope
      });
      xmlTemplater.applyTags();
      return expect(xmlTemplater.content).toBe('Hello Edgar,Mary,John,');
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
        return obj = new DocXTemplater("", {
          DocxGen: docx,
          Tags: {
            Tag: "tagValue"
          }
        });
      });
      it("should work with Blablalalabioeajbiojbepbroji", function() {
        runs(function() {
          var base64, binaryData, dat, finished, png, qr;
          fCalled = false;
          f = {
            test: function() {
              return fCalled = true;
            }
          };
          spyOn(f, 'test').andCallThrough();
          if (env === 'browser') {
            qr = new DocxQrCode(qrcodezip.files['blabla.png'].asText(), obj, "custom.png", 6);
            return qr.decode(f.test);
          } else {
            base64 = JSZipBase64.encode(qrcodezip.files['blabla.png'].asText());
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
      it("should work with long texts", function() {
        runs(function() {
          var base64, binaryData, dat, finished, png, qr;
          fCalled = false;
          f = {
            test: function() {
              return fCalled = true;
            }
          };
          spyOn(f, 'test').andCallThrough();
          if (env === 'browser') {
            qr = new DocxQrCode(qrcodezip.files['custom.png'].asText(), obj, "custom.png", 6);
            return qr.decode(f.test);
          } else {
            base64 = JSZipBase64.encode(qrcodezip.files['custom.png'].asText());
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
          expect(f.test.mostRecentCall.args[0].result).toEqual("Some custom text");
          expect(f.test.mostRecentCall.args[1]).toEqual("custom.png");
          return expect(f.test.mostRecentCall.args[2]).toEqual(6);
        });
      });
      it("should work with basic image", function() {
        runs(function() {
          var base64, binaryData, dat, finished, png, qr;
          fCalled = false;
          f = {
            test: function() {
              return fCalled = true;
            }
          };
          spyOn(f, 'test').andCallThrough();
          if (env === 'browser') {
            qr = new DocxQrCode(qrcodezip.files['qrcodeTest.png'].asText(), obj, "qrcodeTest.png", 4);
            return qr.decode(f.test);
          } else {
            base64 = JSZipBase64.encode(qrcodezip.files['qrcodeTest.png'].asText());
            binaryData = new Buffer(base64, 'base64');
            png = new PNG(binaryData);
            finished = function(a) {
              png.decoded = a;
              qr = new DocxQrCode(png, obj, "qrcodeTest.png", 4);
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
          expect(f.test.mostRecentCall.args[0].result).toEqual("test");
          expect(f.test.mostRecentCall.args[1]).toEqual("qrcodeTest.png");
          return expect(f.test.mostRecentCall.args[2]).toEqual(4);
        });
      });
      return it("should work with image with {tags}", function() {
        runs(function() {
          var base64, binaryData, dat, finished, png, qr;
          fCalled = false;
          f = {
            test: function() {
              return fCalled = true;
            }
          };
          spyOn(f, 'test').andCallThrough();
          if (env === 'browser') {
            qr = new DocxQrCode(qrcodezip.files['qrcodetag.png'].asText(), obj, "tag.png", 2);
            return qr.decode(f.test);
          } else {
            base64 = JSZipBase64.encode(qrcodezip.files['qrcodetag.png'].asText());
            binaryData = new Buffer(base64, 'base64');
            png = new PNG(binaryData);
            finished = function(a) {
              png.decoded = a;
              qr = new DocxQrCode(png, obj, "tag.png", 2);
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
          expect(f.test.mostRecentCall.args[0].result).toEqual("tagValue");
          expect(f.test.mostRecentCall.args[1]).toEqual("tag.png");
          return expect(f.test.mostRecentCall.args[2]).toEqual(2);
        });
      });
    });
  });

  describe("image Loop Replacing", function() {
    return describe('rels', function() {
      it('should load', function() {
        expect(docX['imageExample.docx'].imgManager.loadImageRels().imageRels).toEqual([]);
        return expect(docX['imageExample.docx'].imgManager.maxRid).toEqual(10);
      });
      return it('should add', function() {
        var contentTypeData, contentTypeXml, contentTypes, oldData, relationships, relsData, relsXml;
        oldData = docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].asText();
        expect(docX['imageExample.docx'].imgManager.addImageRels('image1.png', docXData['bootstrap_logo.png'])).toBe(11);
        expect(docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].asText()).not.toBe(oldData);
        relsData = docX['imageExample.docx'].zip.files['word/_rels/document.xml.rels'].asText();
        contentTypeData = docX['imageExample.docx'].zip.files['[Content_Types].xml'].asText();
        relsXml = DocUtils.Str2xml(relsData);
        contentTypeXml = DocUtils.Str2xml(contentTypeData);
        relationships = relsXml.getElementsByTagName('Relationship');
        contentTypes = contentTypeXml.getElementsByTagName('Default');
        expect(relationships.length).toEqual(11);
        return expect(contentTypes.length).toBe(4);
      });
    });
  });

  describe("loop forTagging images", function() {
    return it('should work with a simple loop file', function() {
      var contentTypeData, contentTypeXml, contentTypes, i, relationships, relsData, relsXml, tempVars, _base;
      docX['tagLoopExample.docx'] = new DocxGen(docXData['tagLoopExample.docx']);
      tempVars = {
        "nom": "Hipp",
        "prenom": "Edgar",
        "telephone": "0652455478",
        "description": "New Website",
        "offre": [
          {
            "titre": "titre1",
            "prix": "1250",
            "img": [
              {
                data: docXData['Volkswagen_logo.png'],
                name: "vw_logo.png"
              }
            ]
          }, {
            "titre": "titre2",
            "prix": "2000",
            "img": [
              {
                data: docXData['BMW_logo.png'],
                name: "bmw_logo.png"
              }
            ]
          }, {
            "titre": "titre3",
            "prix": "1400",
            "img": [
              {
                data: docXData['Firefox_logo.png'],
                name: "firefox_logo.png"
              }
            ]
          }
        ]
      };
      docX['tagLoopExample.docx'].setTags(tempVars);
      docX['tagLoopExample.docx'].applyTags();
      for (i in docX['tagLoopExample.docx'].zip.files) {
        expect(docX['tagLoopExample.docx'].zip.files[i].options.date).not.toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.date);
        expect(docX['tagLoopExample.docx'].zip.files[i].name).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].name);
        expect(docX['tagLoopExample.docx'].zip.files[i].options.base64).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.base64);
        expect(docX['tagLoopExample.docx'].zip.files[i].options.binary).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.binary);
        expect(docX['tagLoopExample.docx'].zip.files[i].options.compression).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.compression);
        expect(docX['tagLoopExample.docx'].zip.files[i].options.dir).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.dir);
        if (i !== 'word/_rels/document.xml.rels' && i !== '[Content_Types].xml') {
          if (env === 'browser' || i !== "word/document.xml") {
            if (typeof (_base = docX['tagLoopExample.docx'].zip.files[i].asText()) === "function" ? _base(0) : void 0) {
              expect(docX['tagLoopExample.docx'].zip.files[i].asText().length).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].asText().length);
            }
            expect(docX['tagLoopExample.docx'].zip.files[i].asText()).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].asText());
          }
        }
      }
      relsData = docX['tagLoopExample.docx'].zip.files['word/_rels/document.xml.rels'].asText();
      contentTypeData = docX['tagLoopExample.docx'].zip.files['[Content_Types].xml'].asText();
      relsXml = DocUtils.Str2xml(relsData);
      contentTypeXml = DocUtils.Str2xml(contentTypeData);
      relationships = relsXml.getElementsByTagName('Relationship');
      contentTypes = contentTypeXml.getElementsByTagName('Default');
      expect(relationships.length).toEqual(16);
      return expect(contentTypes.length).toBe(3);
    });
  });

  describe('qr code testing', function() {
    it('should work with local QRCODE without tags', function() {
      var endcallback;
      docX['qrCodeExample.docx'] = new DocxGen(docXData['qrCodeExample.docx'], {}, false, true);
      endcallback = function() {
        return 1;
      };
      docX['qrCodeExample.docx'].applyTags({}, endcallback);
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
    it('should work with local QRCODE with {tags}', function() {
      var endcallback;
      docX['qrCodeTaggingExample.docx'] = new DocxGen(docXData['qrCodeTaggingExample.docx'], {
        'image': 'Firefox_logo'
      }, false, true);
      endcallback = function() {
        return 1;
      };
      docX['qrCodeTaggingExample.docx'].applyTags({
        'image': 'Firefox_logo'
      }, endcallback);
      waitsFor(function() {
        return docX['qrCodeTaggingExample.docx'].ready != null;
      });
      return runs(function() {
        var i, _results;
        expect(docX['qrCodeTaggingExample.docx'].zip.files['word/media/Copie_0.png'] != null).toBeTruthy();
        _results = [];
        for (i in docX['qrCodeTaggingExample.docx'].zip.files) {
          expect(docX['qrCodeTaggingExample.docx'].zip.files[i].options.date).not.toBe(docX['qrCodeTaggingExampleExpected.docx'].zip.files[i].options.date);
          expect(docX['qrCodeTaggingExample.docx'].zip.files[i].name).toBe(docX['qrCodeTaggingExampleExpected.docx'].zip.files[i].name);
          expect(docX['qrCodeTaggingExample.docx'].zip.files[i].options.base64).toBe(docX['qrCodeTaggingExampleExpected.docx'].zip.files[i].options.base64);
          expect(docX['qrCodeTaggingExample.docx'].zip.files[i].options.binary).toBe(docX['qrCodeTaggingExampleExpected.docx'].zip.files[i].options.binary);
          expect(docX['qrCodeTaggingExample.docx'].zip.files[i].options.compression).toBe(docX['qrCodeTaggingExampleExpected.docx'].zip.files[i].options.compression);
          _results.push(expect(docX['qrCodeTaggingExample.docx'].zip.files[i].options.dir).toBe(docX['qrCodeTaggingExampleExpected.docx'].zip.files[i].options.dir));
        }
        return _results;
      });
    });
    return it('should work with loop QRCODE with {tags}', function() {
      var endcallback;
      docX['qrCodeTaggingLoopExample.docx'] = new DocxGen(docXData['qrCodeTaggingLoopExample.docx'], {}, false, true);
      endcallback = function() {
        return 1;
      };
      docX['qrCodeTaggingLoopExample.docx'].applyTags({
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
