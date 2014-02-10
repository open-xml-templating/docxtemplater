(function() {
  var env, root,
    __slice = [].slice;

  root = typeof global !== "undefined" && global !== null ? global : window;

  env = typeof global !== "undefined" && global !== null ? 'node' : 'browser';

  root.DocUtils = {};

  root.docX = [];

  root.docXData = [];

  DocUtils.nl2br = function(str, is_xhtml) {
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
  };

  DocUtils.config = {
    "baseNodePath": '../../examples/',
    "baseClientPath": '../examples/'
  };

  DocUtils.loadDoc = function(path, noDocx, intelligentTagging, async, callback, basePath) {
    var data, e, errorCallback, fileName, httpRegex, loadFile, options, req, reqCallback, totalPath, urloptions, xhrDoc;
    if (noDocx == null) {
      noDocx = false;
    }
    if (intelligentTagging == null) {
      intelligentTagging = false;
    }
    if (async == null) {
      async = false;
    }
    if (callback == null) {
      callback = null;
    }
    if (basePath == null) {
      basePath = null;
    }
    console.log('loading Doc:' + path);
    if (path == null) {
      throw 'path not defined';
    }
    if (path.indexOf('/') !== -1) {
      totalPath = path;
      fileName = totalPath;
    } else {
      fileName = path;
      if (basePath === null) {
        if (env === 'browser') {
          basePath = DocUtils.config.baseClientPath;
        } else {
          basePath = DocUtils.config.baseNodePath;
        }
      }
      totalPath = basePath + path;
    }
    loadFile = function(data) {
      root.docXData[fileName] = data;
      if (noDocx === false) {
        root.docX[fileName] = new DocxGen(data, {}, intelligentTagging);
      }
      if (callback != null) {
        callback(false);
      }
      if (async === false) {
        return root.docXData[fileName];
      }
    };
    if (env === 'browser') {
      xhrDoc = new XMLHttpRequest();
      xhrDoc.open('GET', totalPath, async);
      if (xhrDoc.overrideMimeType) {
        xhrDoc.overrideMimeType('text/plain; charset=x-user-defined');
      }
      xhrDoc.onreadystatechange = function(e) {
        if (this.readyState === 4) {
          if (this.status === 200) {
            return loadFile(this.response);
          } else {
            console.log('error loading doc');
            if (callback != null) {
              return callback(true);
            }
          }
        }
      };
      xhrDoc.send();
    } else {
      httpRegex = new RegExp("(https?)", "i");
      if (httpRegex.test(path)) {
        console.log('http(s) url matched:' + path);
        urloptions = url.parse(path);
        options = {
          hostname: urloptions.hostname,
          path: urloptions.path,
          method: 'GET',
          rejectUnauthorized: false
        };
        errorCallback = function(e) {
          console.log("Error: \n" + e.message);
          return console.log(e.stack);
        };
        reqCallback = function(res) {
          var data;
          res.setEncoding('binary');
          data = "";
          res.on('data', function(chunk) {
            console.log("Status Code " + res.statusCode);
            console.log('received');
            return data += chunk;
          });
          res.on('end', function() {
            console.log('receivedTotally');
            return loadFile(data);
          });
          return res.on('error', function(err) {
            console.log("Error during HTTP request");
            console.log(err.message);
            return console.log(err.stack);
          });
        };
        switch (urloptions.protocol) {
          case "https:":
            req = https.request(options, reqCallback).on('error', errorCallback);
            break;
          case 'http:':
            req = http.request(options, reqCallback).on('error', errorCallback);
        }
        req.end();
      } else {
        if (async === true) {
          fs.readFile(totalPath, "binary", function(err, data) {
            if (err) {
              if (callback != null) {
                return callback(true);
              }
            } else {
              loadFile(data);
              if (callback != null) {
                return callback(false);
              }
            }
          });
        } else {
          console.log('loading async:' + totalPath);
          try {
            data = fs.readFileSync(totalPath, "binary");
            loadFile(data);
            if (callback != null) {
              callback(false);
            }
          } catch (_error) {
            e = _error;
            if (callback != null) {
              callback(true);
            }
          }
        }
      }
    }
    return fileName;
  };

  DocUtils.clone = function(obj) {
    var flags, key, newInstance;
    if ((obj == null) || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    if (obj instanceof RegExp) {
      flags = '';
      if (obj.global != null) {
        flags += 'g';
      }
      if (obj.ignoreCase != null) {
        flags += 'i';
      }
      if (obj.multiline != null) {
        flags += 'm';
      }
      if (obj.sticky != null) {
        flags += 'y';
      }
      return new RegExp(obj.source, flags);
    }
    newInstance = new obj.constructor();
    for (key in obj) {
      newInstance[key] = DocUtils.clone(obj[key]);
    }
    return newInstance;
  };

  DocUtils.xml2Str = function(xmlNode) {
    var a, content, e;
    if (xmlNode === void 0) {
      throw "xmlNode undefined!";
    }
    try {
      if (typeof global !== "undefined" && global !== null) {
        a = new XMLSerializer();
        content = a.serializeToString(xmlNode);
      } else {
        content = (new XMLSerializer()).serializeToString(xmlNode);
      }
    } catch (_error) {
      e = _error;
      try {
        content = xmlNode.xml;
      } catch (_error) {
        e = _error;
        console.log('Xmlserializer not supported');
      }
    }
    return content = content.replace(/\x20xmlns=""/g, '');
  };

  DocUtils.Str2xml = function(str) {
    var parser, xmlDoc;
    if (root.DOMParser) {
      parser = new DOMParser();
      xmlDoc = parser.parseFromString(str, "text/xml");
    } else {
      xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
      xmlDoc.async = false;
      xmlDoc.loadXML(str);
    }
    return xmlDoc;
  };

  DocUtils.replaceFirstFrom = function(string, search, replace, from) {
    return string.substr(0, from) + string.substr(from).replace(search, replace);
  };

  DocUtils.encode_utf8 = function(s) {
    return unescape(encodeURIComponent(s));
  };

  DocUtils.decode_utf8 = function(s) {
    return decodeURIComponent(escape(s)).replace(new RegExp(String.fromCharCode(160), "g"), " ");
  };

  DocUtils.base64encode = function(b) {
    return btoa(unescape(encodeURIComponent(b)));
  };

  DocUtils.preg_match_all = function(regex, content) {

    /*regex is a string, content is the content. It returns an array of all matches with their offset, for example:
    	regex=la
    	content=lolalolilala
    	returns: [{0:'la',offset:2},{0:'la',offset:8},{0:'la',offset:10}]
     */
    var matchArray, replacer;
    if (!(typeof regex === 'object')) {
      regex = new RegExp(regex, 'g');
    }
    matchArray = [];
    replacer = function() {
      var match, offset, pn, string, _i;
      match = arguments[0], pn = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), offset = arguments[_i++], string = arguments[_i++];
      pn.unshift(match);
      pn.offset = offset;
      return matchArray.push(pn);
    };
    content.replace(regex, replacer);
    return matchArray;
  };

  Array.prototype.max = function() {
    return Math.max.apply(null, this);
  };

  Array.prototype.min = function() {
    return Math.min.apply(null, this);
  };

}).call(this);


/*
Docxgen.coffee
Created by Edgar HIPP
26/07/2013
 */

(function() {
  var DocxGen, env, root,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  root = typeof global !== "undefined" && global !== null ? global : window;

  env = typeof global !== "undefined" && global !== null ? 'node' : 'browser';

  root.DocxGen = DocxGen = (function() {
    var imageExtensions;

    imageExtensions = ['gif', 'jpeg', 'jpg', 'emf', 'png'];

    function DocxGen(content, templateVars, intelligentTagging, qrCode, localImageCreator, finishedCallback) {
      this.templateVars = templateVars != null ? templateVars : {};
      this.intelligentTagging = intelligentTagging != null ? intelligentTagging : true;
      this.qrCode = qrCode != null ? qrCode : false;
      this.localImageCreator = localImageCreator;
      this.finishedCallback = finishedCallback;
      if (this.finishedCallback == null) {
        this.finishedCallback = (function() {
          return console.log('document ready!');
        });
      }
      if (this.localImageCreator == null) {
        this.localImageCreator = function(arg, callback) {
          var result;
          result = JSZipBase64.decode("iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAIAAABvSEP3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACXSURBVDhPtY7BDYAwDAMZhCf7b8YMxeCoatOQJhWc/KGxT2zlCyaWcz8Y+X7Bs1TFVJSwIHIYyFkQufWIRVX9cNJyW1QpEo4rixaEe7JuQagAUctb7ZFYFh5MVJPBe84CVBnB42//YsZRgKjFDBVg3cI9WbRwXLktQJX8cNIiFhM1ZuTWk7PIYSBhkVcLzwIiCjCxhCjlAkBqYnqFoQQ2AAAAAElFTkSuQmCC");
          return callback(result);
        };
      }
      this.templatedFiles = ["word/document.xml", "word/footer1.xml", "word/footer2.xml", "word/footer3.xml", "word/header1.xml", "word/header2.xml", "word/header3.xml"];
      this.filesProcessed = 0;
      this.qrCodeNumCallBack = 0;
      this.qrCodeWaitingFor = [];
      if (content != null) {
        this.load(content);
      }
      this;
    }

    DocxGen.prototype.qrCodeCallBack = function(num, add) {
      var index;
      if (add == null) {
        add = true;
      }
      if (add === true) {
        this.qrCodeWaitingFor.push(num);
      } else if (add === false) {
        index = this.qrCodeWaitingFor.indexOf(num);
        this.qrCodeWaitingFor.splice(index, 1);
      }
      return this.testReady();
    };

    DocxGen.prototype.testReady = function() {
      if (this.qrCodeWaitingFor.length === 0 && this.filesProcessed === this.templatedFiles.length) {
        this.ready = true;
        return this.finishedCallback();
      }
    };

    DocxGen.prototype.logUndefined = function(tag, scope) {
      return console.log("undefinedTag:" + tag);
    };

    DocxGen.prototype.load = function(content) {
      this.zip = new JSZip(content);
      return this.loadImageRels();
    };

    DocxGen.prototype.loadImageRels = function() {
      var RidArray, content, tag;
      content = DocUtils.decode_utf8(this.zip.files["word/_rels/document.xml.rels"].data);
      this.xmlDoc = DocUtils.Str2xml(content);
      RidArray = (function() {
        var _i, _len, _ref, _results;
        _ref = this.xmlDoc.getElementsByTagName('Relationship');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          tag = _ref[_i];
          _results.push(parseInt(tag.getAttribute("Id").substr(3)));
        }
        return _results;
      }).call(this);
      this.maxRid = RidArray.max();
      this.imageRels = [];
      return this;
    };

    DocxGen.prototype.addExtensionRels = function(contentType, extension) {
      var addTag, content, defaultTags, newTag, tag, types, xmlDoc, _i, _len;
      content = DocUtils.decode_utf8(this.zip.files["[Content_Types].xml"].data);
      xmlDoc = DocUtils.Str2xml(content);
      addTag = true;
      defaultTags = xmlDoc.getElementsByTagName('Default');
      for (_i = 0, _len = defaultTags.length; _i < _len; _i++) {
        tag = defaultTags[_i];
        if (tag.getAttribute('Extension') === extension) {
          addTag = false;
        }
      }
      if (addTag) {
        types = xmlDoc.getElementsByTagName("Types")[0];
        newTag = xmlDoc.createElement('Default');
        newTag.namespaceURI = null;
        newTag.setAttribute('ContentType', contentType);
        newTag.setAttribute('Extension', extension);
        types.appendChild(newTag);
        return this.zip.files["[Content_Types].xml"].data = DocUtils.encode_utf8(DocUtils.xml2Str(xmlDoc));
      }
    };

    DocxGen.prototype.addImageRels = function(imageName, imageData) {
      var extension, file, newTag, relationships;
      if (this.zip.files["word/media/" + imageName] != null) {
        throw 'file already exists';
        return false;
      }
      this.maxRid++;
      file = {
        'name': "word/media/" + imageName,
        'data': imageData,
        'options': {
          base64: false,
          binary: true,
          compression: null,
          date: new Date(),
          dir: false
        }
      };
      this.zip.file(file.name, file.data, file.options);
      extension = imageName.replace(/[^.]+\.([^.]+)/, '$1');
      this.addExtensionRels("image/" + extension, extension);
      relationships = this.xmlDoc.getElementsByTagName("Relationships")[0];
      newTag = this.xmlDoc.createElement('Relationship');
      newTag.namespaceURI = null;
      newTag.setAttribute('Id', "rId" + this.maxRid);
      newTag.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image');
      newTag.setAttribute('Target', "media/" + imageName);
      relationships.appendChild(newTag);
      this.zip.files["word/_rels/document.xml.rels"].data = DocUtils.encode_utf8(DocUtils.xml2Str(this.xmlDoc));
      return this.maxRid;
    };

    DocxGen.prototype.getImageByRid = function(rId) {
      var cRId, path, relationship, relationships, _i, _len;
      relationships = this.xmlDoc.getElementsByTagName('Relationship');
      for (_i = 0, _len = relationships.length; _i < _len; _i++) {
        relationship = relationships[_i];
        cRId = relationship.getAttribute('Id');
        if (rId === cRId) {
          path = relationship.getAttribute('Target');
          if (path.substr(0, 6) === 'media/') {
            return this.zip.files["word/" + path];
          }
        }
      }
      return null;
    };

    DocxGen.prototype.getImageList = function() {
      var extension, imageList, index, regex;
      regex = /[^.]+\.([^.]+)/;
      imageList = [];
      for (index in this.zip.files) {
        extension = index.replace(regex, '$1');
        if (__indexOf.call(imageExtensions, extension) >= 0) {
          imageList.push({
            "path": index,
            files: this.zip.files[index]
          });
        }
      }
      return imageList;
    };

    DocxGen.prototype.setImage = function(path, data) {
      return this.zip.files[path].data = data;
    };

    DocxGen.prototype.applyTemplateVars = function(templateVars, qrCodeCallback) {
      var currentFile, fileName, _i, _j, _len, _len1, _ref, _ref1;
      this.templateVars = templateVars != null ? templateVars : this.templateVars;
      if (qrCodeCallback == null) {
        qrCodeCallback = null;
      }
      _ref = this.templatedFiles;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        fileName = _ref[_i];
        if (this.zip.files[fileName] == null) {
          this.filesProcessed++;
        }
      }
      _ref1 = this.templatedFiles;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        fileName = _ref1[_j];
        if (!(this.zip.files[fileName] != null)) {
          continue;
        }
        currentFile = new DocXTemplater(this.zip.files[fileName].data, this, this.templateVars, this.intelligentTagging, [], {}, 0, qrCodeCallback, this.localImageCreator);
        this.zip.files[fileName].data = currentFile.applyTemplateVars().content;
        this.filesProcessed++;
      }
      return this.testReady();
    };

    DocxGen.prototype.getCsvVars = function() {
      var csvVars, csvcontent, i, j, obj, temp, _i, _len;
      obj = this.getTemplateVars();
      csvcontent = "";
      csvVars = {};
      for (i = _i = 0, _len = obj.length; _i < _len; i = ++_i) {
        temp = obj[i];
        for (j in temp.vars) {
          if (csvVars[j] == null) {
            csvcontent += j + ";";
          }
          csvVars[j] = {};
        }
      }
      return csvcontent;
    };

    DocxGen.prototype.getCsvFile = function() {
      var file;
      file = btoa(this.getCsvVars());
      return document.location.href = "data:application/vnd.ms-excel;base64," + file;
    };

    DocxGen.prototype.getTemplateVars = function() {
      var currentFile, fileName, h, n, usedTemplateV, usedTemplateVars, _i, _len, _ref;
      usedTemplateVars = [];
      _ref = this.templatedFiles;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        fileName = _ref[_i];
        if (!(this.zip.files[fileName] != null)) {
          continue;
        }
        currentFile = new DocXTemplater(this.zip.files[fileName].data, this, this.templateVars, this.intelligentTagging);
        usedTemplateV = currentFile.applyTemplateVars().usedTemplateVars;
        n = 0;
        for (h in usedTemplateV) {
          n++;
        }
        if (n > 0) {
          usedTemplateVars.push({
            fileName: fileName,
            vars: usedTemplateV
          });
        }
      }
      return usedTemplateVars;
    };

    DocxGen.prototype.setTemplateVars = function(templateVars) {
      this.templateVars = templateVars;
      return this;
    };

    DocxGen.prototype.output = function(download, name) {
      var result;
      if (download == null) {
        download = true;
      }
      if (name == null) {
        name = "output.docx";
      }
      this.calcZip();
      result = this.zip.generate();
      if (download) {
        if (env === 'node') {
          fs.writeFile(process.cwd() + '/' + name, result, 'base64', function(err) {
            if (err) {
              throw err;
            }
            return console.log('file Saved');
          });
        } else {
          document.location.href = "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64," + result;
        }
      }
      return result;
    };

    DocxGen.prototype.calcZip = function() {
      var file, index, zip;
      zip = new JSZip();
      for (index in this.zip.files) {
        file = this.zip.files[index];
        zip.file(file.name, file.data, file.options);
      }
      return this.zip = zip;
    };

    DocxGen.prototype.getFullText = function(path, data) {
      var currentFile;
      if (path == null) {
        path = "word/document.xml";
      }
      if (data == null) {
        data = "";
      }
      if (data === "") {
        currentFile = new DocXTemplater(this.zip.files[path].data, this, this.templateVars, this.intelligentTagging);
      } else {
        currentFile = new DocXTemplater(data, this, this.templateVars, this.intelligentTagging);
      }
      return currentFile.getFullText();
    };

    DocxGen.prototype.download = function(swfpath, imgpath, filename) {
      var output;
      if (filename == null) {
        filename = "default.docx";
      }
      this.calcZip();
      output = this.zip.generate();
      return Downloadify.create('downloadify', {
        filename: function() {
          return filename;
        },
        data: function() {
          return output;
        },
        onCancel: function() {
          return alert('You have cancelled the saving of this file.');
        },
        onError: function() {
          return alert('You must put something in the File Contents or there will be nothing to save!');
        },
        swf: swfpath,
        downloadImage: imgpath,
        width: 100,
        height: 30,
        transparent: true,
        append: false,
        dataType: 'base64'
      });
    };

    return DocxGen;

  })();

}).call(this);

(function() {
  var env, root;

  Object.size = function(obj) {
    var key, log, size;
    size = 0;
    log = 0;
    for (key in obj) {
      size++;
    }
    return size;
  };

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
        return expect(docX['tagLoopExample.docx'].getFullText()).toEqual('Votre proposition commercialePrix: 1250Titre titre1Prix: 2000Titre titre2Prix: 1400Titre titre3HippEdgar');
      });
      return it("should work with loops inside loops", function() {
        var expectedText, templateVars, text;
        templateVars = {
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
        docX['tagProduitLoop.docx'].setTemplateVars(templateVars);
        docX['tagProduitLoop.docx'].applyTemplateVars();
        text = docX['tagProduitLoop.docx'].getFullText();
        expectedText = "MicrosoftProduct name : DOSProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed";
        expect(text.length).toEqual(expectedText.length);
        return expect(text).toEqual(expectedText);
      });
    });
  });

  describe("scope calculation", function() {
    var xmlTemplater;
    xmlTemplater = new DocXTemplater();
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
      scope = xmlTemplater.calcScopeText("defined </w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00137C91\" w:rsidRDefault=\"00137C91\"><w:r w:rsidRPr=\"00B12C70\"><w:rPr><w:bCs/></w:rPr><w:t>Coût ressources ");
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
    var xmlTemplater;
    xmlTemplater = new DocXTemplater();
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
      scope = xmlTemplater.calcScopeDifference("defined </w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00137C91\" w:rsidRDefault=\"00137C91\"><w:r w:rsidRPr=\"00B12C70\"><w:rPr><w:bCs/></w:rPr><w:t>Coût ressources ");
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
      scope = xmlTemplater.calcInnerTextScope(docX['tagProduitLoop.docx'].zip.files["word/document.xml"].data, 1195, 1245, 'w:p');
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
      docX['tagDashLoop.docx'].setTemplateVars(templateVars);
      docX['tagDashLoop.docx'].applyTemplateVars();
      expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
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
      docX['tagDashLoopTable.docx'].setTemplateVars(templateVars);
      docX['tagDashLoopTable.docx'].applyTemplateVars();
      expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
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
      docX['tagDashLoopList.docx'].setTemplateVars(templateVars);
      docX['tagDashLoopList.docx'].applyTemplateVars();
      expectedText = 'linux 0 Ubuntu10 DOS 500 Win7 apple 1200 MACOSX ';
      text = docX['tagDashLoopList.docx'].getFullText();
      return expect(text).toBe(expectedText);
    });
  });

  describe("Intelligent Loop Tagging", function() {
    return it("should work with tables", function() {
      var expectedText, i, templateVars, text, _results;
      templateVars = {
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
      docX['tagIntelligentLoopTable.docx'].setTemplateVars(templateVars);
      docX['tagIntelligentLoopTable.docx'].applyTemplateVars();
      expectedText = 'JohnDoe+33647874513JaneDoe+33454540124PhilKiel+44578451245DaveSto+44548787984';
      text = docX['tagIntelligentLoopTableExpected.docx'].getFullText();
      expect(text).toBe(expectedText);
      _results = [];
      for (i in docX['tagIntelligentLoopTable.docx'].zip.files) {
        expect(docX['tagIntelligentLoopTable.docx'].zip.files[i].data).toBe(docX['tagIntelligentLoopTableExpected.docx'].zip.files[i].data);
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
    it("should work with loop document", function() {
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
    return it('should work if there are no templateVars', function() {
      var tempVars;
      docX['qrCodeExample.docx'] = new DocxGen(docXData['qrCodeExample.docx'], {}, false);
      tempVars = docX['qrCodeExample.docx'].getTemplateVars();
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
      xmlTemplater = new DocXTemplater(content, null, scope);
      xmlTemplater.applyTemplateVars();
      return expect(xmlTemplater.getFullText()).toBe('Hello Edgar');
    });
    it("should work with non w:t content", function() {
      var content, scope, xmlTemplater;
      content = "{image}.png";
      scope = {
        "image": "edgar"
      };
      xmlTemplater = new DocXTemplater(content, null, scope);
      xmlTemplater.applyTemplateVars();
      return expect(xmlTemplater.content).toBe('edgar.png');
    });
    it("should work with tag in two elements", function() {
      var content, scope, xmlTemplater;
      content = "<w:t>Hello {</w:t><w:t>name}</w:t>";
      scope = {
        "name": "Edgar"
      };
      xmlTemplater = new DocXTemplater(content, null, scope);
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
      xmlTemplater = new DocXTemplater(content, null, scope);
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
      xmlTemplater = new DocXTemplater(content, null, scope);
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
      xmlTemplater = new DocXTemplater(content, null, scope);
      xmlTemplater.applyTemplateVars();
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
      xmlTemplater = new DocXTemplater(content, null, scope);
      xmlTemplater.applyTemplateVars();
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
      xmlTemplater = new DocXTemplater(content, null, scope);
      xmlTemplater.applyTemplateVars();
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
        return obj = new DocXTemplater("", docx, {
          Tag: "tagValue"
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
            qr = new DocxQrCode(qrcodezip.files['custom.png'].data, obj, "custom.png", 6);
            return qr.decode(f.test);
          } else {
            base64 = JSZipBase64.encode(qrcodezip.files['custom.png'].data);
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
            qr = new DocxQrCode(qrcodezip.files['qrcodeTest.png'].data, obj, "qrcodeTest.png", 4);
            return qr.decode(f.test);
          } else {
            base64 = JSZipBase64.encode(qrcodezip.files['qrcodeTest.png'].data);
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
            qr = new DocxQrCode(qrcodezip.files['qrcodetag.png'].data, obj, "tag.png", 2);
            return qr.decode(f.test);
          } else {
            base64 = JSZipBase64.encode(qrcodezip.files['qrcodetag.png'].data);
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
      docX['tagLoopExample.docx'].setTemplateVars(tempVars);
      docX['tagLoopExample.docx'].applyTemplateVars();
      for (i in docX['tagLoopExample.docx'].zip.files) {
        expect(docX['tagLoopExample.docx'].zip.files[i].options.date).not.toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.date);
        expect(docX['tagLoopExample.docx'].zip.files[i].name).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].name);
        expect(docX['tagLoopExample.docx'].zip.files[i].options.base64).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.base64);
        expect(docX['tagLoopExample.docx'].zip.files[i].options.binary).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.binary);
        expect(docX['tagLoopExample.docx'].zip.files[i].options.compression).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.compression);
        expect(docX['tagLoopExample.docx'].zip.files[i].options.dir).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].options.dir);
        if (i !== 'word/_rels/document.xml.rels' && i !== '[Content_Types].xml') {
          if (env === 'browser' || i !== "word/document.xml") {
            if (typeof (_base = docX['tagLoopExample.docx'].zip.files[i]).data === "function" ? _base.data(0) : void 0) {
              expect(docX['tagLoopExample.docx'].zip.files[i].data.length).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].data.length);
            }
            expect(docX['tagLoopExample.docx'].zip.files[i].data).toBe(docX['tagLoopExampleImageExpected.docx'].zip.files[i].data);
          }
        }
      }
      relsData = docX['tagLoopExample.docx'].zip.files['word/_rels/document.xml.rels'].data;
      contentTypeData = docX['tagLoopExample.docx'].zip.files['[Content_Types].xml'].data;
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
      docX['qrCodeExample.docx'].applyTemplateVars({}, endcallback);
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
      docX['qrCodeTaggingExample.docx'].applyTemplateVars({
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

(function() {
  var DocxQrCode, env, root;

  root = typeof global !== "undefined" && global !== null ? global : window;

  env = typeof global !== "undefined" && global !== null ? 'node' : 'browser';

  DocxQrCode = DocxQrCode = (function() {
    function DocxQrCode(imageData, xmlTemplater, imgName, num, callback) {
      this.xmlTemplater = xmlTemplater;
      this.imgName = imgName != null ? imgName : "";
      this.num = num;
      this.callback = callback;
      this.data = imageData;
      this.base64Data = JSZipBase64.encode(this.data);
      this.ready = false;
      this.result = null;
    }

    DocxQrCode.prototype.decode = function(callback) {
      var _this;
      this.callback = callback;
      _this = this;
      console.log('qrcode');
      this.qr = new QrCode();
      this.qr.callback = function() {
        var testdoc;
        _this.ready = true;
        _this.result = this.result;
        console.log('result:' + _this.result);
        testdoc = new _this.xmlTemplater["class"](this.result, _this.xmlTemplater.toJson());
        testdoc.applyTemplateVars();
        _this.result = testdoc.content;
        return _this.searchImage();
      };
      if (env === 'browser') {
        return this.qr.decode("data:image/png;base64," + this.base64Data);
      } else {
        return this.qr.decode(this.data, this.data.decoded);
      }
    };

    DocxQrCode.prototype.searchImage = function() {
      var callback, error, loadDocCallback;
      if (this.result.substr(0, 4) === 'gen:') {
        return callback = (function(_this) {
          return function(data) {
            _this.data = data;
            _this.callback(_this, _this.imgName, _this.num);
            return _this.xmlTemplater.DocxGen.localImageCreator(_this.result, callback);
          };
        })(this);
      } else if (this.result !== null && this.result !== void 0 && this.result.substr(0, 22) !== 'error decoding QR Code') {
        loadDocCallback = (function(_this) {
          return function(fail) {
            if (fail == null) {
              fail = false;
            }
            if (!fail) {
              _this.data = docXData[_this.result];
              return _this.callback(_this, _this.imgName, _this.num);
            } else {
              console.log('file image loading failed!');
              return _this.callback(_this, _this.imgName, _this.num);
            }
          };
        })(this);
        try {
          return DocUtils.loadDoc(this.result, true, false, false, loadDocCallback);
        } catch (_error) {
          error = _error;
          return console.log(error);
        }
      } else {
        return this.callback(this, this.imgName, this.num);
      }
    };

    return DocxQrCode;

  })();

  root.DocxQrCode = DocxQrCode;

}).call(this);

(function() {
  var DocXTemplater, env, root,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  root = typeof global !== "undefined" && global !== null ? global : window;

  env = typeof global !== "undefined" && global !== null ? 'node' : 'browser';

  DocXTemplater = DocXTemplater = (function(_super) {
    __extends(DocXTemplater, _super);

    function DocXTemplater(content, creator, templateVars, intelligentTagging, scopePath, usedTemplateVars, imageId) {
      if (content == null) {
        content = "";
      }
      this.templateVars = templateVars != null ? templateVars : {};
      this.intelligentTagging = intelligentTagging != null ? intelligentTagging : false;
      this.scopePath = scopePath != null ? scopePath : [];
      this.usedTemplateVars = usedTemplateVars != null ? usedTemplateVars : {};
      this.imageId = imageId != null ? imageId : 0;
      DocXTemplater.__super__.constructor.call(this, null, creator, this.templateVars, this.intelligentTagging, this.scopePath, this.usedTemplateVars, this.imageId);
      this["class"] = DocXTemplater;
      this.tagX = 'w:t';
      if (typeof content === "string") {
        this.load(content);
      } else {
        throw "content must be string!";
      }
    }

    return DocXTemplater;

  })(XmlTemplater);

  root.DocXTemplater = DocXTemplater;

}).call(this);

(function() {
  var ImgReplacer, env, root;

  root = typeof global !== "undefined" && global !== null ? global : window;

  env = typeof global !== "undefined" && global !== null ? 'node' : 'browser';

  ImgReplacer = ImgReplacer = (function() {
    function ImgReplacer(xmlTemplater) {
      this.xmlTemplater = xmlTemplater;
      this.imgMatches = [];
    }

    ImgReplacer.prototype.findImages = function() {
      return this.imgMatches = DocUtils.preg_match_all(/<w:drawing[^>]*>.*?<\/w:drawing>/g, this.xmlTemplater.content);
    };

    ImgReplacer.prototype.replaceImages = function() {
      var callback, imageTag, imgData, imgName, match, newId, oldFile, qr, rId, replacement, tag, tagrId, u, xmlImg, _i, _len, _ref, _results;
      console.log('replacing Images ...');
      qr = [];
      callback = function(docxqrCode) {
        console.log('removing qrcode');
        console.log('setting image:' + ("word/media/" + docxqrCode.imgName));
        docxqrCode.xmlTemplater.numQrCode--;
        docxqrCode.xmlTemplater.DocxGen.setImage("word/media/" + docxqrCode.imgName, docxqrCode.data);
        return docxqrCode.xmlTemplater.DocxGen.qrCodeCallBack(docxqrCode.num, false);
      };
      _ref = this.imgMatches;
      _results = [];
      for (u = _i = 0, _len = _ref.length; _i < _len; u = ++_i) {
        match = _ref[u];
        xmlImg = DocUtils.Str2xml('<?xml version="1.0" ?><w:document mc:Ignorable="w14 wp14" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">' + match[0] + '</w:document>');
        if (this.xmlTemplater.DocxGen.qrCode) {
          tagrId = xmlImg.getElementsByTagNameNS('*', 'blip')[0];
          if (tagrId === void 0) {
            console.log('tagRid not defined, trying alternate method');
            tagrId = xmlImg.getElementsByTagName("a:blip")[0];
          }
          if (tagrId !== void 0) {
            rId = tagrId.getAttribute('r:embed');
            oldFile = this.xmlTemplater.DocxGen.getImageByRid(rId);
            if (oldFile !== null) {
              tag = xmlImg.getElementsByTagNameNS('*', 'docPr')[0];
              if (tag === void 0) {
                console.log('tag not defined, trying alternate method');
                tag = xmlImg.getElementsByTagName('wp:docPr')[0];
              }
              if (tag !== void 0) {
                if (tag.getAttribute("name").substr(0, 6) !== "Copie_") {
                  imgName = ("Copie_" + this.xmlTemplater.imageId + ".png").replace(/\x20/, "");
                  this.xmlTemplater.DocxGen.qrCodeNumCallBack++;
                  this.xmlTemplater.DocxGen.qrCodeCallBack(this.xmlTemplater.DocxGen.qrCodeNumCallBack, true);
                  newId = this.xmlTemplater.DocxGen.addImageRels(imgName, "");
                  this.xmlTemplater.imageId++;
                  this.xmlTemplater.DocxGen.setImage("word/media/" + imgName, oldFile.data);
                  if (env === 'browser') {
                    qr[u] = new DocxQrCode(oldFile.data, this.xmlTemplater, imgName, this.xmlTemplater.DocxGen.qrCodeNumCallBack);
                  }
                  tag.setAttribute('name', "" + imgName);
                  tagrId.setAttribute('r:embed', "rId" + newId);
                  console.log("tagrId:" + tagrId.getAttribute('r:embed'));
                  imageTag = xmlImg.getElementsByTagNameNS('*', 'drawing')[0];
                  if (imageTag === void 0) {
                    console.log('imagetag not defined, trying alternate method');
                    imageTag = xmlImg.getElementsByTagName('w:drawing')[0];
                  }
                  replacement = DocUtils.xml2Str(imageTag);
                  this.xmlTemplater.content = this.xmlTemplater.content.replace(match[0], replacement);
                  this.xmlTemplater.numQrCode++;
                  if (env === 'browser') {
                    _results.push(qr[u].decode(callback));
                  } else {
                    if (/\.png$/.test(oldFile.name)) {
                      _results.push((function(_this) {
                        return function(imgName) {
                          var base64, binaryData, dat, finished, png;
                          console.log(oldFile.name);
                          base64 = JSZipBase64.encode(oldFile.data);
                          binaryData = new Buffer(base64, 'base64');
                          png = new PNG(binaryData);
                          finished = function(a) {
                            var e;
                            try {
                              png.decoded = a;
                              qr[u] = new DocxQrCode(png, _this.xmlTemplater, imgName, _this.xmlTemplater.DocxGen.qrCodeNumCallBack);
                              return qr[u].decode(callback);
                            } catch (_error) {
                              e = _error;
                              console.log(e);
                              return _this.xmlTemplater.DocxGen.qrCodeCallBack(_this.xmlTemplater.DocxGen.qrCodeNumCallBack, false);
                            }
                          };
                          return dat = png.decode(finished);
                        };
                      })(this)(imgName));
                    } else {
                      _results.push(this.xmlTemplater.DocxGen.qrCodeCallBack(this.xmlTemplater.DocxGen.qrCodeNumCallBack, false));
                    }
                  }
                } else {
                  _results.push(void 0);
                }
              } else {
                _results.push(void 0);
              }
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(void 0);
          }
        } else if (this.xmlTemplater.currentScope["img"] != null) {
          if (this.xmlTemplater.currentScope["img"][u] != null) {
            imgName = this.xmlTemplater.currentScope["img"][u].name;
            imgData = this.xmlTemplater.currentScope["img"][u].data;
            if (this.xmlTemplater.DocxGen == null) {
              throw 'DocxGen not defined';
            }
            newId = this.xmlTemplater.DocxGen.addImageRels(imgName, imgData);
            tag = xmlImg.getElementsByTagNameNS('*', 'docPr')[0];
            if (tag === void 0) {
              console.log('tag not defined, trying alternate method');
              tag = xmlImg.getElementsByTagName('wp:docPr')[0];
            }
            if (tag !== void 0) {
              this.xmlTemplater.imageId++;
              tag.setAttribute('id', this.xmlTemplater.imageId);
              tag.setAttribute('name', "" + imgName);
              tagrId = xmlImg.getElementsByTagNameNS('*', 'blip')[0];
              if (tagrId === void 0) {
                console.log('tagRid not defined, trying alternate method');
                tagrId = xmlImg.getElementsByTagName("a:blip")[0];
              }
              if (tagrId !== void 0) {
                tagrId.setAttribute('r:embed', "rId" + newId);
                imageTag = xmlImg.getElementsByTagNameNS('*', 'drawing')[0];
                if (imageTag === void 0) {
                  console.log('imagetag not defined, trying alternate method');
                  imageTag = xmlImg.getElementsByTagName('w:drawing')[0];
                }
                _results.push(this.xmlTemplater.content = this.xmlTemplater.content.replace(match[0], DocUtils.xml2Str(imageTag)));
              } else {
                _results.push(void 0);
              }
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return ImgReplacer;

  })();

  root.ImgReplacer = ImgReplacer;

}).call(this);

(function() {
  var XmlTemplater, env, root,
    __slice = [].slice;

  root = typeof global !== "undefined" && global !== null ? global : window;

  env = typeof global !== "undefined" && global !== null ? 'node' : 'browser';

  XmlTemplater = XmlTemplater = (function() {
    function XmlTemplater(content, creator, templateVars, intelligentTagging, scopePath, usedTemplateVars, imageId, qrcodeCallback, localImageCreator) {
      var options;
      if (content == null) {
        content = "";
      }
      this.templateVars = templateVars != null ? templateVars : {};
      this.intelligentTagging = intelligentTagging != null ? intelligentTagging : false;
      this.scopePath = scopePath != null ? scopePath : [];
      this.usedTemplateVars = usedTemplateVars != null ? usedTemplateVars : {};
      this.imageId = imageId != null ? imageId : 0;
      this.qrcodeCallback = qrcodeCallback != null ? qrcodeCallback : null;
      this.localImageCreator = localImageCreator;
      if (this.qrcodeCallback === null) {
        this.qrcodeCallback = function() {
          return this.DocxGen.ready = true;
        };
      }
      this.tagX = '';
      this["class"] = XmlTemplater;

      /*They are two ways to instantiate a XmlTemplater object:
      		1: new XmlTemplater(content,creator,@templateVars, ...)
      			content:string
      			creator:DocxGen object
      			...
      		2: new XmlTemplater(content, options)
      			content is the content
      			options contains all the arguments:
      			options=
      				{
      				"templateVars":...,
      				"DocxGen":...,
      				"intelligentTagging":...,
      				"scopePath":...,
      				"usedTemplateVars":...,
      				"imageId":...
      				}
       */
      if (creator instanceof DocxGen || (creator == null)) {
        this.DocxGen = creator;
      } else {
        options = creator;
        this.templateVars = options.templateVars;
        this.DocxGen = options.DocxGen;
        this.intelligentTagging = options.intelligentTagging;
        this.scopePath = options.scopePath;
        this.usedTemplateVars = options.usedTemplateVars;
        this.imageId = options.imageId;
      }
      if (typeof content === "string") {
        this.load(content);
      } else {
        throw "content must be string!";
      }
      this.numQrCode = 0;
      this.currentScope = this.templateVars;
    }

    XmlTemplater.prototype.load = function(content) {
      var i, regex, replacerPush, replacerUnshift;
      this.content = content;
      this.matches = this._getFullTextMatchesFromData();
      this.charactersAdded = (function() {
        var _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = this.matches.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push(0);
        }
        return _results;
      }).call(this);
      replacerUnshift = (function(_this) {
        return function() {
          var match, offset, pn, string, _i;
          match = arguments[0], pn = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), offset = arguments[_i++], string = arguments[_i++];
          pn.unshift(match);
          pn.offset = offset;
          pn.first = true;
          _this.matches.unshift(pn);
          return _this.charactersAdded.unshift(0);
        };
      })(this);
      this.content.replace(/^()([^<]+)/, replacerUnshift);
      replacerPush = (function(_this) {
        return function() {
          var match, offset, pn, string, _i;
          match = arguments[0], pn = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), offset = arguments[_i++], string = arguments[_i++];
          pn.unshift(match);
          pn.offset = offset;
          pn.last = true;
          _this.matches.push(pn);
          return _this.charactersAdded.push(0);
        };
      })(this);
      regex = "(<" + this.tagX + "[^>]*>)([^>]+)$";
      return this.content.replace(new RegExp(regex), replacerPush);
    };

    XmlTemplater.prototype.setUsedTemplateVars = function(tag) {
      var i, s, u, _i, _len, _ref;
      u = this.usedTemplateVars;
      _ref = this.scopePath;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        s = _ref[i];
        if (u[s] == null) {
          u[s] = {};
        }
        u = u[s];
      }
      if (tag !== "") {
        return u[tag] = true;
      }
    };

    XmlTemplater.prototype.getValueFromTag = function(tag, scope) {
      var content;
      this.setUsedTemplateVars(tag);
      content = "";
      if (scope[tag] != null) {
        content = DocUtils.encode_utf8(scope[tag]);
      } else {
        content = "undefined";
        this.DocxGen.logUndefined(tag, scope);
      }
      if (content.indexOf('{') !== -1 || content.indexOf('}') !== -1) {
        alert('On ne peut mettre de { ou de } dans le contenu d\'une variable');
        throw 'On ne peut mettre de { ou de } dans le contenu d\'une variable';
      }
      return content;
    };

    XmlTemplater.prototype.calcScopeText = function(text, start, end) {
      var i, innerCurrentTag, innerLastTag, justOpened, lastTag, result, tag, tags, _i, _len;
      if (start == null) {
        start = 0;
      }
      if (end == null) {
        end = text.length - 1;
      }

      /*get the different closing and opening tags between two texts (doesn't take into account tags that are opened then closed (those that are closed then opened are returned)):
      		returns:[{"tag":"</w:r>","offset":13},{"tag":"</w:p>","offset":265},{"tag":"</w:tc>","offset":271},{"tag":"<w:tc>","offset":828},{"tag":"<w:p>","offset":883},{"tag":"<w:r>","offset":1483}]
       */
      tags = DocUtils.preg_match_all("<(\/?[^/> ]+)([^>]*)>", text.substr(start, end));
      result = [];
      for (i = _i = 0, _len = tags.length; _i < _len; i = ++_i) {
        tag = tags[i];
        if (tag[1][0] === '/') {
          justOpened = false;
          if (result.length > 0) {
            lastTag = result[result.length - 1];
            innerLastTag = lastTag.tag.substr(1, lastTag.tag.length - 2);
            innerCurrentTag = tag[1].substr(1);
            if (innerLastTag === innerCurrentTag) {
              justOpened = true;
            }
          }
          if (justOpened) {
            result.pop();
          } else {
            result.push({
              tag: '<' + tag[1] + '>',
              offset: tag.offset
            });
          }
        } else if (tag[2][tag[2].length - 1] === '/') {

        } else {
          result.push({
            tag: '<' + tag[1] + '>',
            offset: tag.offset
          });
        }
      }
      return result;
    };

    XmlTemplater.prototype.calcScopeDifference = function(text, start, end) {
      var scope;
      if (start == null) {
        start = 0;
      }
      if (end == null) {
        end = text.length - 1;
      }
      scope = this.calcScopeText(text, start, end);
      while (1.) {
        if (scope.length <= 1) {
          break;
        }
        if (scope[0].tag.substr(2) === scope[scope.length - 1].tag.substr(1)) {
          scope.pop();
          scope.shift();
        } else {
          break;
        }
      }
      return scope;
    };

    XmlTemplater.prototype.getFullText = function() {
      var match, output;
      this.matches = this._getFullTextMatchesFromData();
      output = (function() {
        var _i, _len, _ref, _results;
        _ref = this.matches;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          match = _ref[_i];
          _results.push(match[2]);
        }
        return _results;
      }).call(this);
      return DocUtils.decode_utf8(output.join(""));
    };

    XmlTemplater.prototype._getFullTextMatchesFromData = function() {
      return this.matches = DocUtils.preg_match_all("(<" + this.tagX + "[^>]*>)([^<>]*)?</" + this.tagX + ">", this.content);
    };

    XmlTemplater.prototype.calcInnerTextScope = function(text, start, end, tag) {
      var endTag, startTag;
      endTag = text.indexOf('</' + tag + '>', end);
      if (endTag === -1) {
        throw "can't find endTag " + endTag;
      }
      endTag += ('</' + tag + '>').length;
      startTag = Math.max(text.lastIndexOf('<' + tag + '>', start), text.lastIndexOf('<' + tag + ' ', start));
      if (startTag === -1) {
        throw "can't find startTag";
      }
      return {
        "text": text.substr(startTag, endTag - startTag),
        startTag: startTag,
        endTag: endTag
      };
    };

    XmlTemplater.prototype.calcB = function() {
      var endB, startB;
      startB = this.calcStartBracket(this.loopOpen);
      endB = this.calcEndBracket(this.loopClose);
      return {
        B: this.content.substr(startB, endB - startB),
        startB: startB,
        endB: endB
      };
    };

    XmlTemplater.prototype.calcA = function() {
      var endA, startA;
      startA = this.calcEndBracket(this.loopOpen);
      endA = this.calcStartBracket(this.loopClose);
      return {
        A: this.content.substr(startA, endA - startA),
        startA: startA,
        endA: endA
      };
    };

    XmlTemplater.prototype.calcStartBracket = function(bracket) {
      return this.matches[bracket.start.i].offset + this.matches[bracket.start.i][1].length + this.charactersAdded[bracket.start.i] + bracket.start.j;
    };

    XmlTemplater.prototype.calcEndBracket = function(bracket) {
      return this.matches[bracket.end.i].offset + this.matches[bracket.end.i][1].length + this.charactersAdded[bracket.end.i] + bracket.end.j + 1;
    };

    XmlTemplater.prototype.toJson = function() {
      return {
        templateVars: DocUtils.clone(this.templateVars),
        DocxGen: this.DocxGen,
        intelligentTagging: DocUtils.clone(this.intelligentTagging),
        scopePath: DocUtils.clone(this.scopePath),
        usedTemplateVars: this.usedTemplateVars,
        localImageCreator: this.localImageCreator,
        imageId: this.imageId
      };
    };

    XmlTemplater.prototype.forLoop = function(A, B) {
      var i, newContent, nextFile, options, scope, subScope, subfile, _i, _len, _ref;
      if (A == null) {
        A = "";
      }
      if (B == null) {
        B = "";
      }

      /*
      			<w:t>{#forTag} blabla</w:t>
      			Blabla1
      			Blabla2
      			<w:t>{/forTag}</w:t>
      
      			Let A be what is in between the first closing bracket and the second opening bracket
      			Let B what is in between the first opening tag {# and the last closing tag
      
      			A=</w:t>
      			Blabla1
      			Blabla2
      			<w:t>
      
      			B={#forTag}</w:t>
      			Blabla1
      			Blabla2
      			<w:t>{/forTag}
      
      			We replace B by nA, n is equal to the length of the array in scope forTag
      			<w:t>subContent subContent subContent</w:t>
       */
      if (A === "" && B === "") {
        B = this.calcB().B;
        A = this.calcA().A;
        if (B[0] !== '{' || B.indexOf('{') === -1 || B.indexOf('/') === -1 || B.indexOf('}') === -1 || B.indexOf('#') === -1) {
          throw "no {,#,/ or } found in B: " + B;
        }
      }
      if (this.currentScope[this.loopOpen.tag] != null) {
        if (typeof this.currentScope[this.loopOpen.tag] === 'object') {
          subScope = this.currentScope[this.loopOpen.tag];
        }
        if (this.currentScope[this.loopOpen.tag] === 'true') {
          subScope = true;
        }
        if (this.currentScope[this.loopOpen.tag] === 'false') {
          subScope = false;
        }
        newContent = "";
        if (typeof subScope === 'object') {
          _ref = this.currentScope[this.loopOpen.tag];
          for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
            scope = _ref[i];
            options = this.toJson();
            options.templateVars = scope;
            options.scopePath = options.scopePath.concat(this.loopOpen.tag);
            subfile = new this["class"](A, options);
            subfile.applyTemplateVars();
            this.imageId = subfile.imageId;
            newContent += subfile.content;
            if ((subfile.getFullText().indexOf('{')) !== -1) {
              throw "they shouln't be a { in replaced file: " + (subfile.getFullText()) + " (1)";
            }
          }
        }
        if (subScope === true) {
          options = this.toJson();
          options.templateVars = this.currentScope;
          options.scopePath = options.scopePath.concat(this.loopOpen.tag);
          subfile = new this["class"](A, options);
          subfile.applyTemplateVars();
          this.imageId = subfile.imageId;
          newContent += subfile.content;
          if ((subfile.getFullText().indexOf('{')) !== -1) {
            throw "they shouln't be a { in replaced file: " + (subfile.getFullText()) + " (1)";
          }
        }
        this.content = this.content.replace(B, newContent);
      } else {
        options = this.toJson();
        options.templateVars = {};
        options.scopePath = options.scopePath.concat(this.loopOpen.tag);
        subfile = new this["class"](A, options);
        subfile.applyTemplateVars();
        this.imageId = subfile.imageId;
        this.content = this.content.replace(B, "");
      }
      options = this.toJson();
      nextFile = new this["class"](this.content, options);
      nextFile.applyTemplateVars();
      this.imageId = nextFile.imageId;
      if ((nextFile.getFullText().indexOf('{')) !== -1) {
        throw "they shouln't be a { in replaced file: " + (nextFile.getFullText()) + " (3)";
      }
      this.content = nextFile.content;
      return this;
    };

    XmlTemplater.prototype.dashLoop = function(elementDashLoop, sharp) {
      var A, B, copyA, endB, resultFullScope, startB, t, _i, _ref, _ref1;
      if (sharp == null) {
        sharp = false;
      }
      _ref = this.calcB(), B = _ref.B, startB = _ref.startB, endB = _ref.endB;
      resultFullScope = this.calcInnerTextScope(this.content, startB, endB, elementDashLoop);
      for (t = _i = 0, _ref1 = this.matches.length; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; t = 0 <= _ref1 ? ++_i : --_i) {
        this.charactersAdded[t] -= resultFullScope.startTag;
      }
      B = resultFullScope.text;
      if ((this.content.indexOf(B)) === -1) {
        throw "couln't find B in @content";
      }
      A = B;
      copyA = A;
      this.bracketEnd = {
        "i": this.loopOpen.end.i,
        "j": this.loopOpen.end.j
      };
      this.bracketStart = {
        "i": this.loopOpen.start.i,
        "j": this.loopOpen.start.j
      };
      if (sharp === false) {
        this.textInsideBracket = "-" + this.loopOpen.element + " " + this.loopOpen.tag;
      }
      if (sharp === true) {
        this.textInsideBracket = "#" + this.loopOpen.tag;
      }
      A = this.replaceCurly("", A);
      if (copyA === A) {
        throw "A should have changed after deleting the opening tag";
      }
      copyA = A;
      this.textInsideBracket = "/" + this.loopOpen.tag;
      this.bracketEnd = {
        "i": this.loopClose.end.i,
        "j": this.loopClose.end.j
      };
      this.bracketStart = {
        "i": this.loopClose.start.i,
        "j": this.loopClose.start.j
      };
      A = this.replaceCurly("", A);
      if (copyA === A) {
        throw "A should have changed after deleting the opening tag";
      }
      return this.forLoop(A, B);
    };

    XmlTemplater.prototype.replaceXmlTag = function(content, tagNumber, insideValue, spacePreserve, noStartTag) {
      var copyContent, replacer, startTag;
      if (spacePreserve == null) {
        spacePreserve = false;
      }
      if (noStartTag == null) {
        noStartTag = false;
      }
      this.matches[tagNumber][2] = insideValue;
      startTag = this.matches[tagNumber].offset + this.charactersAdded[tagNumber];
      if (noStartTag === true) {
        replacer = insideValue;
      } else {
        if (spacePreserve === true) {
          replacer = "<" + this.tagX + " xml:space=\"preserve\">" + insideValue + "</" + this.tagX + ">";
        } else {
          replacer = this.matches[tagNumber][1] + insideValue + ("</" + this.tagX + ">");
        }
      }
      this.charactersAdded[tagNumber + 1] += replacer.length - this.matches[tagNumber][0].length;
      if (content.indexOf(this.matches[tagNumber][0]) === -1) {
        throw "content " + this.matches[tagNumber][0] + " not found in content";
      }
      copyContent = content;
      content = DocUtils.replaceFirstFrom(content, this.matches[tagNumber][0], replacer, startTag);
      this.matches[tagNumber][0] = replacer;
      if (copyContent === content) {
        throw "offset problem0: didnt changed the value (should have changed from " + this.matches[this.bracketStart.i][0] + " to " + replacer;
      }
      return content;
    };

    XmlTemplater.prototype.replaceCurly = function(newValue, content) {
      var copyContent, insideValue, j, k, match, regexLeft, regexRight, subMatches, _i, _j, _len, _ref, _ref1, _ref2;
      if (content == null) {
        content = this.content;
      }
      if ((this.matches[this.bracketEnd.i][2].indexOf('}')) === -1) {
        throw "no closing bracket at @bracketEnd.i " + this.matches[this.bracketEnd.i][2];
      }
      if ((this.matches[this.bracketStart.i][2].indexOf('{')) === -1) {
        throw "no opening bracket at @bracketStart.i " + this.matches[this.bracketStart.i][2];
      }
      copyContent = content;
      if (this.bracketEnd.i === this.bracketStart.i) {
        if ((this.matches[this.bracketStart.i].first != null)) {
          insideValue = this.matches[this.bracketStart.i][2].replace("{" + this.textInsideBracket + "}", newValue);
          content = this.replaceXmlTag(content, this.bracketStart.i, insideValue, true, true);
        } else if ((this.matches[this.bracketStart.i].last != null)) {
          insideValue = this.matches[this.bracketStart.i][0].replace("{" + this.textInsideBracket + "}", newValue);
          content = this.replaceXmlTag(content, this.bracketStart.i, insideValue, true, true);
        } else {
          insideValue = this.matches[this.bracketStart.i][2].replace("{" + this.textInsideBracket + "}", newValue);
          content = this.replaceXmlTag(content, this.bracketStart.i, insideValue, true);
        }
      } else if (this.bracketEnd.i > this.bracketStart.i) {
        regexRight = /^([^{]*){.*$/;
        subMatches = this.matches[this.bracketStart.i][2].match(regexRight);
        if (this.matches[this.bracketStart.i].first != null) {
          content = this.replaceXmlTag(content, this.bracketStart.i, newValue, true, true);
        } else if (this.matches[this.bracketStart.i].last != null) {
          content = this.replaceXmlTag(content, this.bracketStart.i, newValue, true, true);
        } else {
          insideValue = subMatches[1] + newValue;
          content = this.replaceXmlTag(content, this.bracketStart.i, insideValue, true);
        }
        for (k = _i = _ref = this.bracketStart.i + 1, _ref1 = this.bracketEnd.i; _ref <= _ref1 ? _i < _ref1 : _i > _ref1; k = _ref <= _ref1 ? ++_i : --_i) {
          this.charactersAdded[k + 1] = this.charactersAdded[k];
          content = this.replaceXmlTag(content, k, "");
        }
        regexLeft = /^[^}]*}(.*)$/;
        insideValue = this.matches[this.bracketEnd.i][2].replace(regexLeft, '$1');
        this.charactersAdded[this.bracketEnd.i + 1] = this.charactersAdded[this.bracketEnd.i];
        content = this.replaceXmlTag(content, k, insideValue, true);
      }
      _ref2 = this.matches;
      for (j = _j = 0, _len = _ref2.length; _j < _len; j = ++_j) {
        match = _ref2[j];
        if (j > this.bracketEnd.i) {
          this.charactersAdded[j + 1] = this.charactersAdded[j];
        }
      }
      if (copyContent === content) {
        throw "copycontent=content !!";
      }
      return content;
    };


    /*
    	content is the whole content to be tagged
    	scope is the current scope
    	returns the new content of the tagged content
     */

    XmlTemplater.prototype.applyTemplateVars = function() {
      var B, character, dashLooping, elementDashLoop, endB, i, imgReplacer, innerText, j, m, match, regex, scopeContent, startB, t, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _ref, _ref1, _ref2, _ref3;
      this.setUsedTemplateVars("");
      this.inForLoop = false;
      this.inBracket = false;
      this.inDashLoop = false;
      this.textInsideBracket = "";
      _ref = this.matches;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        match = _ref[i];
        innerText = match[2] || "";
        for (t = _j = i, _ref1 = this.matches.length; i <= _ref1 ? _j < _ref1 : _j > _ref1; t = i <= _ref1 ? ++_j : --_j) {
          this.charactersAdded[t + 1] = this.charactersAdded[t];
        }
        for (j = _k = 0, _len1 = innerText.length; _k < _len1; j = ++_k) {
          character = innerText[j];
          _ref2 = this.matches;
          for (t = _l = 0, _len2 = _ref2.length; _l < _len2; t = ++_l) {
            m = _ref2[t];
            if (t <= i) {
              if (this.content[m.offset + this.charactersAdded[t]] !== m[0][0]) {
                throw "no < at the beginning of " + m[0][0] + " (2)";
              }
            }
          }
          if (character === '{') {
            if (this.inBracket === true) {
              throw "Bracket already open with text: " + this.textInsideBracket;
            }
            this.inBracket = true;
            this.textInsideBracket = "";
            this.bracketStart = {
              "i": i,
              "j": j
            };
          } else if (character === '}') {
            this.bracketEnd = {
              "i": i,
              "j": j
            };
            if (this.textInsideBracket[0] === '#' && this.inForLoop === false && this.inDashLoop === false) {
              this.inForLoop = true;
              this.loopOpen = {
                'start': this.bracketStart,
                'end': this.bracketEnd,
                'tag': this.textInsideBracket.substr(1)
              };
            }
            if (this.textInsideBracket[0] === '-' && this.inForLoop === false && this.inDashLoop === false) {
              this.inDashLoop = true;
              regex = /^-([a-zA-Z_:]+) ([a-zA-Z_:]+)$/;
              this.loopOpen = {
                'start': this.bracketStart,
                'end': this.bracketEnd,
                'tag': this.textInsideBracket.replace(regex, '$2'),
                'element': this.textInsideBracket.replace(regex, '$1')
              };
            }
            if (this.inBracket === false) {
              throw "Bracket already closed " + this.content;
            }
            this.inBracket = false;
            if (this.inForLoop === false && this.inDashLoop === false) {
              this.content = this.replaceCurly(this.getValueFromTag(this.textInsideBracket, this.currentScope));
            }
            if (this.textInsideBracket[0] === '/') {
              this.loopClose = {
                'start': this.bracketStart,
                'end': this.bracketEnd
              };
            }
            if (this.textInsideBracket[0] === '/' && ('/' + this.loopOpen.tag === this.textInsideBracket) && this.inDashLoop === true) {
              return this.dashLoop(this.loopOpen.element);
            }
            if (this.textInsideBracket[0] === '/' && ('/' + this.loopOpen.tag === this.textInsideBracket) && this.inForLoop === true) {
              dashLooping = false;
              if (this.intelligentTagging === true) {
                _ref3 = this.calcB(), B = _ref3.B, startB = _ref3.startB, endB = _ref3.endB;
                scopeContent = this.calcScopeText(this.content, startB, endB - startB);
                for (_m = 0, _len3 = scopeContent.length; _m < _len3; _m++) {
                  t = scopeContent[_m];
                  if (t.tag === '<w:tc>') {
                    dashLooping = true;
                    elementDashLoop = 'w:tr';
                  }
                }
              }
              if (dashLooping === false) {
                return this.forLoop();
              } else {
                return this.dashLoop(elementDashLoop, true);
              }
            }
          } else {
            if (this.inBracket === true) {
              this.textInsideBracket += character;
            }
          }
        }
      }
      imgReplacer = new ImgReplacer(this);
      imgReplacer.findImages();
      imgReplacer.replaceImages();
      return this;
    };

    return XmlTemplater;

  })();

  root.XmlTemplater = XmlTemplater;

}).call(this);
