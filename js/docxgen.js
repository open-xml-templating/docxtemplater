(function() {
  var TemplaterState, env, root;

  root = typeof global !== "undefined" && global !== null ? global : window;

  env = typeof global !== "undefined" && global !== null ? 'node' : 'browser';

  TemplaterState = TemplaterState = (function() {
    function TemplaterState() {}

    TemplaterState.prototype.initialize = function() {
      this.inForLoop = false;
      this.inBracket = false;
      this.inDashLoop = false;
      return this.textInsideBracket = "";
    };

    return TemplaterState;

  })();

  root.TemplaterState = TemplaterState;

}).call(this);

(function() {
  var ImgManager, env, root,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  root = typeof global !== "undefined" && global !== null ? global : window;

  env = typeof global !== "undefined" && global !== null ? 'node' : 'browser';

  ImgManager = ImgManager = (function() {
    var imageExtensions;

    imageExtensions = ['gif', 'jpeg', 'jpg', 'emf', 'png'];

    function ImgManager(zip) {
      this.zip = zip;
      this;
    }

    ImgManager.prototype.getImageList = function() {
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

    ImgManager.prototype.setImage = function(path, data) {
      return this.zip.files[path].data = data;
    };

    ImgManager.prototype.loadImageRels = function() {
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

    ImgManager.prototype.addExtensionRels = function(contentType, extension) {
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

    ImgManager.prototype.addImageRels = function(imageName, imageData) {
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

    ImgManager.prototype.getImageByRid = function(rId) {
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

    return ImgManager;

  })();

  root.ImgManager = ImgManager;

}).call(this);


/*
Docxgen.coffee
Created by Edgar HIPP
02/11/2014
 */

(function() {
  var DocxGen, env, root;

  root = typeof global !== "undefined" && global !== null ? global : window;

  env = typeof global !== "undefined" && global !== null ? 'node' : 'browser';

  root.DocxGen = DocxGen = (function() {
    var templatedFiles;

    templatedFiles = ["word/document.xml", "word/footer1.xml", "word/footer2.xml", "word/footer3.xml", "word/header1.xml", "word/header2.xml", "word/header3.xml"];

    function DocxGen(content, templateVars, intelligentTagging, qrCode) {
      this.templateVars = templateVars != null ? templateVars : {};
      this.intelligentTagging = intelligentTagging != null ? intelligentTagging : true;
      this.qrCode = qrCode != null ? qrCode : false;
      this.finishedCallback = (function() {
        return console.log('document ready!');
      });
      this.localImageCreator = function(arg, callback) {
        var result;
        result = JSZipBase64.decode("iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAIAAABvSEP3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACXSURBVDhPtY7BDYAwDAMZhCf7b8YMxeCoatOQJhWc/KGxT2zlCyaWcz8Y+X7Bs1TFVJSwIHIYyFkQufWIRVX9cNJyW1QpEo4rixaEe7JuQagAUctb7ZFYFh5MVJPBe84CVBnB42//YsZRgKjFDBVg3cI9WbRwXLktQJX8cNIiFhM1ZuTWk7PIYSBhkVcLzwIiCjCxhCjlAkBqYnqFoQQ2AAAAAElFTkSuQmCC");
        return callback(result);
      };
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
      if (this.qrCodeWaitingFor.length === 0 && this.filesProcessed === templatedFiles.length) {
        this.ready = true;
        return this.finishedCallback();
      }
    };

    DocxGen.prototype.logUndefined = function(tag, scope) {
      return console.log("undefinedTag:" + tag);
    };

    DocxGen.prototype.getImageList = function() {
      return this.imgManager.getImageList();
    };

    DocxGen.prototype.setImage = function(path, data) {
      return this.imgManager.setImage(path, data);
    };

    DocxGen.prototype.load = function(content) {
      this.zip = new JSZip(content);
      return this.imgManager = (new ImgManager(this.zip)).loadImageRels();
    };

    DocxGen.prototype.applyTemplateVars = function(templateVars, qrCodeCallback) {
      var currentFile, fileName, _i, _j, _len, _len1;
      this.templateVars = templateVars != null ? templateVars : this.templateVars;
      if (qrCodeCallback == null) {
        qrCodeCallback = null;
      }
      for (_i = 0, _len = templatedFiles.length; _i < _len; _i++) {
        fileName = templatedFiles[_i];
        if (this.zip.files[fileName] == null) {
          this.filesProcessed++;
        }
      }
      for (_j = 0, _len1 = templatedFiles.length; _j < _len1; _j++) {
        fileName = templatedFiles[_j];
        if (!(this.zip.files[fileName] != null)) {
          continue;
        }
        currentFile = new DocXTemplater(this.zip.files[fileName].data, {
          DocxGen: this,
          templateVars: this.templateVars,
          intelligentTagging: this.intelligentTagging,
          qrCodeCallback: qrCodeCallback,
          localImageCreator: this.localImageCreator
        }, this, this.templateVars, this.intelligentTagging, [], {}, 0, qrCodeCallback, this.localImageCreator);
        this.zip.files[fileName].data = currentFile.applyTemplateVars().content;
        this.filesProcessed++;
      }
      return this.testReady();
    };

    DocxGen.prototype.getTemplateVars = function() {
      var currentFile, fileName, usedTemplateV, usedTemplateVars, _i, _len;
      usedTemplateVars = [];
      for (_i = 0, _len = templatedFiles.length; _i < _len; _i++) {
        fileName = templatedFiles[_i];
        if (!(this.zip.files[fileName] != null)) {
          continue;
        }
        currentFile = new DocXTemplater(this.zip.files[fileName].data, {
          DocxGen: this,
          templateVars: this.templateVars,
          intelligentTagging: this.intelligentTagging
        });
        usedTemplateV = currentFile.applyTemplateVars().usedTemplateVars;
        if (DocUtils.sizeOfObject(usedTemplateV)) {
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
      var usedData;
      if (path == null) {
        path = "word/document.xml";
      }
      if (data == null) {
        data = "";
      }
      if (data === "") {
        usedData = this.zip.files[path].data;
        return this.getFullText(path, usedData);
      }
      return (new DocXTemplater(data, {
        DocxGen: this,
        templateVars: this.templateVars,
        intelligentTagging: this.intelligentTagging
      })).getFullText();
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

  DocUtils.loadDoc = function(path, options) {
    var async, basePath, callback, data, e, errorCallback, fileName, httpRegex, intelligentTagging, loadFile, noDocx, req, reqCallback, totalPath, urloptions, xhrDoc;
    if (options == null) {
      options = {};
    }
    noDocx = options.docx != null ? !options.docx : false;
    async = options.async != null ? options.async : false;
    intelligentTagging = options.intelligentTagging != null ? options.intelligentTagging : false;
    callback = options.callback != null ? options.callback : null;
    basePath = options.basePath != null ? options.basePath : null;
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

  DocUtils.sizeOfObject = function(obj) {
    var key, log, size;
    size = 0;
    log = 0;
    for (key in obj) {
      size++;
    }
    return size;
  };

  Array.prototype.max = function() {
    return Math.max.apply(null, this);
  };

  Array.prototype.min = function() {
    return Math.min.apply(null, this);
  };

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
            oldFile = this.xmlTemplater.DocxGen.imgManager.getImageByRid(rId);
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
                  newId = this.xmlTemplater.DocxGen.imgManager.addImageRels(imgName, "");
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
            newId = this.xmlTemplater.DocxGen.imgManager.addImageRels(imgName, imgData);
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
        testdoc = new _this.xmlTemplater.currentClass(this.result, _this.xmlTemplater.toJson());
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
          return DocUtils.loadDoc(this.result, {
            docx: false,
            callback: loadDocCallback,
            async: false
          });
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
      this.currentClass = XmlTemplater;
      if (creator instanceof DocxGen || (creator == null)) {
        this.DocxGen = creator;
      } else {
        options = creator;
        this.templateVars = options.templateVars ? options.templateVars : {};
        this.DocxGen = options.DocxGen ? options.DocxGen : null;
        this.intelligentTagging = options.intelligentTagging ? options.intelligentTagging : false;
        this.scopePath = options.scopePath ? options.scopePath : [];
        this.usedTemplateVars = options.usedTemplateVars ? options.usedTemplateVars : {};
        this.imageId = options.imageId ? options.imageId : 0;
      }
      if (typeof content === "string") {
        this.load(content);
      } else {
        throw "content must be string!";
      }
      this.numQrCode = 0;
      this.currentScope = this.templateVars;
      this.templaterState = new TemplaterState;
      this;
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
        throw "You can't enter { or  } inside the content of a variable";
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
            subfile = new this.currentClass(A, options);
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
          subfile = new this.currentClass(A, options);
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
        subfile = new this.currentClass(A, options);
        subfile.applyTemplateVars();
        this.imageId = subfile.imageId;
        this.content = this.content.replace(B, "");
      }
      options = this.toJson();
      nextFile = new this.currentClass(this.content, options);
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
        this.templaterState.textInsideBracket = "-" + this.loopOpen.element + " " + this.loopOpen.tag;
      }
      if (sharp === true) {
        this.templaterState.textInsideBracket = "#" + this.loopOpen.tag;
      }
      A = this.replaceCurly("", A);
      if (copyA === A) {
        throw "A should have changed after deleting the opening tag";
      }
      copyA = A;
      this.templaterState.textInsideBracket = "/" + this.loopOpen.tag;
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
          insideValue = this.matches[this.bracketStart.i][2].replace("{" + this.templaterState.textInsideBracket + "}", newValue);
          content = this.replaceXmlTag(content, this.bracketStart.i, insideValue, true, true);
        } else if ((this.matches[this.bracketStart.i].last != null)) {
          insideValue = this.matches[this.bracketStart.i][0].replace("{" + this.templaterState.textInsideBracket + "}", newValue);
          content = this.replaceXmlTag(content, this.bracketStart.i, insideValue, true, true);
        } else {
          insideValue = this.matches[this.bracketStart.i][2].replace("{" + this.templaterState.textInsideBracket + "}", newValue);
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
      this.templaterState.initialize();
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
            if (this.templaterState.inBracket === true) {
              throw "Bracket already open with text: " + this.templaterState.textInsideBracket;
            }
            this.templaterState.inBracket = true;
            this.templaterState.textInsideBracket = "";
            this.bracketStart = {
              "i": i,
              "j": j
            };
          } else if (character === '}') {
            this.bracketEnd = {
              "i": i,
              "j": j
            };
            if (this.templaterState.textInsideBracket[0] === '#' && this.templaterState.inForLoop === false && this.templaterState.inDashLoop === false) {
              this.templaterState.inForLoop = true;
              this.loopOpen = {
                'start': this.bracketStart,
                'end': this.bracketEnd,
                'tag': this.templaterState.textInsideBracket.substr(1)
              };
            }
            if (this.templaterState.textInsideBracket[0] === '-' && this.templaterState.inForLoop === false && this.templaterState.inDashLoop === false) {
              this.templaterState.inDashLoop = true;
              regex = /^-([a-zA-Z_:]+) ([a-zA-Z_:]+)$/;
              this.loopOpen = {
                'start': this.bracketStart,
                'end': this.bracketEnd,
                'tag': this.templaterState.textInsideBracket.replace(regex, '$2'),
                'element': this.templaterState.textInsideBracket.replace(regex, '$1')
              };
            }
            if (this.templaterState.inBracket === false) {
              throw "Bracket already closed " + this.content;
            }
            this.templaterState.inBracket = false;
            if (this.templaterState.inForLoop === false && this.templaterState.inDashLoop === false) {
              this.content = this.replaceCurly(this.getValueFromTag(this.templaterState.textInsideBracket, this.currentScope));
            }
            if (this.templaterState.textInsideBracket[0] === '/') {
              this.loopClose = {
                'start': this.bracketStart,
                'end': this.bracketEnd
              };
            }
            if (this.templaterState.textInsideBracket[0] === '/' && ('/' + this.loopOpen.tag === this.templaterState.textInsideBracket) && this.templaterState.inDashLoop === true) {
              return this.dashLoop(this.loopOpen.element);
            }
            if (this.templaterState.textInsideBracket[0] === '/' && ('/' + this.loopOpen.tag === this.templaterState.textInsideBracket) && this.templaterState.inForLoop === true) {
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
            if (this.templaterState.inBracket === true) {
              this.templaterState.textInsideBracket += character;
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
      this.currentClass = DocXTemplater;
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
