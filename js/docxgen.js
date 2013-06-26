//@ sourceMappingURL=docxgen.map
(function() {
  var DocXTemplater, DocxGen, DocxQrCode, XmlTemplater,
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  window.DocUtils = {};

  window.docX = [];

  window.docXData = [];

  DocUtils.nl2br = function(str, is_xhtml) {
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
  };

  DocUtils.loadDoc = function(path, noDocx, intelligentTagging, async) {
    var fileName, totalPath, xhrDoc;

    if (noDocx == null) {
      noDocx = false;
    }
    if (intelligentTagging == null) {
      intelligentTagging = false;
    }
    if (async == null) {
      async = false;
    }
    xhrDoc = new XMLHttpRequest();
    if (path.indexOf('/') !== -1) {
      totalPath = path;
      fileName = totalPath;
    } else {
      fileName = path;
      totalPath = "../examples/" + path;
    }
    xhrDoc.open('GET', totalPath, async);
    if (xhrDoc.overrideMimeType) {
      xhrDoc.overrideMimeType('text/plain; charset=x-user-defined');
    }
    xhrDoc.onreadystatechange = function(e) {
      if (this.readyState === 4 && this.status === 200) {
        window.docXData[fileName] = this.response;
        if (noDocx === false) {
          window.docX[fileName] = new DocxGen(this.response, {}, intelligentTagging);
        }
        if (async === false) {
          return window.docXData[fileName];
        }
      }
    };
    xhrDoc.send();
    if (async === false) {
      return window.docXData[fileName];
    }
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
    var content, e;

    try {
      content = (new XMLSerializer()).serializeToString(xmlNode);
    } catch (_error) {
      e = _error;
      try {
        content = xmlNode.xml;
      } catch (_error) {
        e = _error;
        alert('Xmlserializer not supported');
      }
    }
    content = content.replace(/\x20xmlns=""/g, '');
    return content;
  };

  DocUtils.Str2xml = function(str) {
    var parser, xmlDoc;

    if (window.DOMParser) {
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

  /*
  Docxgen.coffee
  Created by Edgar HIPP
  03/06/2013
  */


  window.DocxGen = DocxGen = (function() {
    var imageExtensions;

    imageExtensions = ['gif', 'jpeg', 'jpg', 'emf', 'png'];

    function DocxGen(content, templateVars, intelligentTagging, qrCode) {
      this.templateVars = templateVars != null ? templateVars : {};
      this.intelligentTagging = intelligentTagging != null ? intelligentTagging : false;
      this.qrCode = qrCode != null ? qrCode : false;
      this.templatedFiles = ["word/document.xml", "word/footer1.xml", "word/footer2.xml", "word/footer3.xml", "word/header1.xml", "word/header2.xml", "word/header3.xml"];
      if (typeof content === "string") {
        this.load(content);
      }
    }

    DocxGen.prototype.load = function(content) {
      this.zip = new JSZip(content);
      this.zip.files = this.zip.files;
      return this.loadImageRels();
    };

    DocxGen.prototype.loadImageRels = function() {
      var content, tag, _i, _len, _ref;

      content = DocUtils.decode_utf8(this.zip.files["word/_rels/document.xml.rels"].data);
      this.xmlDoc = DocUtils.Str2xml(content);
      this.maxRid = 0;
      _ref = this.xmlDoc.getElementsByTagName('Relationship');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tag = _ref[_i];
        this.maxRid = Math.max(parseInt(tag.getAttribute("Id").substr(3)), this.maxRid);
      }
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
          return this.zip.files["word/" + path];
        }
      }
      return 'not found';
    };

    DocxGen.prototype.saveImageRels = function() {
      return this.zip.files["word/_rels/document.xml.rels"].data;
    };

    DocxGen.prototype.getImageList = function() {
      var extension, imageList, index, regex;

      regex = /[^.]*\.([^.]*)/;
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

    DocxGen.prototype.applyTemplateVars = function(templateVars) {
      var currentFile, fileName, _i, _len, _ref, _results;

      this.templateVars = templateVars != null ? templateVars : this.templateVars;
      _ref = this.templatedFiles;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        fileName = _ref[_i];
        if (!(this.zip.files[fileName] != null)) {
          continue;
        }
        currentFile = new DocXTemplater(this.zip.files[fileName].data, this, this.templateVars, this.intelligentTagging);
        _results.push(this.zip.files[fileName].data = currentFile.applyTemplateVars().content);
      }
      return _results;
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
      var currentFile, fileName, usedTemplateVars, _i, _len, _ref;

      usedTemplateVars = [];
      _ref = this.templatedFiles;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        fileName = _ref[_i];
        if (!(this.zip.files[fileName] != null)) {
          continue;
        }
        currentFile = new DocXTemplater(this.zip.files[fileName].data, this, this.templateVars, this.intelligentTagging);
        usedTemplateVars.push({
          fileName: fileName,
          vars: currentFile.applyTemplateVars().usedTemplateVars
        });
      }
      return usedTemplateVars;
    };

    DocxGen.prototype.setTemplateVars = function(templateVars) {
      this.templateVars = templateVars;
    };

    DocxGen.prototype.output = function(download) {
      if (download == null) {
        download = true;
      }
      this.calcZip();
      return document.location.href = "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64," + (this.zip.generate());
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

  window.XmlTemplater = XmlTemplater = (function() {
    function XmlTemplater(content, creator, templateVars, intelligentTagging, scopePath, usedTemplateVars, imageId) {
      var options;

      if (content == null) {
        content = "";
      }
      this.templateVars = templateVars != null ? templateVars : {};
      this.intelligentTagging = intelligentTagging != null ? intelligentTagging : false;
      this.scopePath = scopePath != null ? scopePath : [];
      this.usedTemplateVars = usedTemplateVars != null ? usedTemplateVars : {};
      this.imageId = imageId != null ? imageId : 0;
      this.tagX = '';
      this["class"] = window.XmlTemplater;
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
      this.currentScope = this.templateVars;
    }

    XmlTemplater.prototype.load = function(content) {
      var i, regex, replacerPush, replacerUnshift,
        _this = this;

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
      replacerUnshift = function() {
        var match, offset, pn, string, _i;

        match = arguments[0], pn = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), offset = arguments[_i++], string = arguments[_i++];
        pn.unshift(match);
        pn.offset = offset;
        pn.first = true;
        _this.matches.unshift(pn);
        return _this.charactersAdded.unshift(0);
      };
      this.content.replace(/^()([^<]+)/, replacerUnshift);
      replacerPush = function() {
        var match, offset, pn, string, _i;

        match = arguments[0], pn = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), offset = arguments[_i++], string = arguments[_i++];
        pn.unshift(match);
        pn.offset = offset;
        pn.last = true;
        _this.matches.push(pn);
        return _this.charactersAdded.push(0);
      };
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

    XmlTemplater.prototype.replaceImages = function() {
      var imageTag, imgData, imgName, match, newId, oldFile, rId, tag, tagrId, u, xmlImg, _i, _len, _ref, _results;

      _ref = this.imgMatches;
      _results = [];
      for (u = _i = 0, _len = _ref.length; _i < _len; u = ++_i) {
        match = _ref[u];
        xmlImg = DocUtils.Str2xml('<?xml version="1.0" ?><w:document mc:Ignorable="w14 wp14" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">' + match[0] + '</w:document>');
        if (this.DocxGen.qrCode) {
          tagrId = xmlImg.getElementsByTagNameNS('*', 'blip')[0];
          rId = tagrId.getAttribute('r:embed');
          oldFile = this.DocxGen.getImageByRid(rId);
          console.log(oldFile);
          newId = this.DocxGen.addImageRels(imgName, imgData);
          tag = xmlImg.getElementsByTagNameNS('*', 'docPr')[0];
          this.imageId++;
          tag.setAttribute('id', this.imageId);
          tag.setAttribute('name', "" + imgName);
          tagrId.setAttribute('r:embed', "rId" + newId);
          imageTag = xmlImg.getElementsByTagNameNS('*', 'drawing')[0];
          this.content = this.content.replace(match[0], DocUtils.xml2Str(imageTag));
        }
        if (this.currentScope["img"] != null) {
          if (this.currentScope["img"][u] != null) {
            imgName = this.currentScope["img"][u].name;
            imgData = this.currentScope["img"][u].data;
            if (this.DocxGen == null) {
              throw 'DocxGen not defined';
            }
            console.log(this.DocxGen);
            newId = this.DocxGen.addImageRels(imgName, imgData);
            tag = xmlImg.getElementsByTagNameNS('*', 'docPr')[0];
            this.imageId++;
            tag.setAttribute('id', this.imageId);
            tag.setAttribute('name', "" + imgName);
            tagrId = xmlImg.getElementsByTagNameNS('*', 'blip')[0];
            tagrId.setAttribute('r:embed', "rId" + newId);
            imageTag = xmlImg.getElementsByTagNameNS('*', 'drawing')[0];
            _results.push(this.content = this.content.replace(match[0], DocUtils.xml2Str(imageTag)));
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    XmlTemplater.prototype.findImages = function() {
      this.imgMatches = DocUtils.preg_match_all(/<w:drawing>.*<\/w:drawing>/, this.content);
      return console.log(this.imgMatches);
    };

    /*
    	content is the whole content to be tagged
    	scope is the current scope
    	returns the new content of the tagged content
    */


    XmlTemplater.prototype.applyTemplateVars = function() {
      var B, character, dashLooping, elementDashLoop, endB, i, innerText, j, m, match, regex, scopeContent, startB, t, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _ref, _ref1, _ref2, _ref3;

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
      this.findImages();
      this.replaceImages();
      return this;
    };

    return XmlTemplater;

  })();

  window.DocXTemplater = DocXTemplater = (function(_super) {
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

  window.DocxQrCode = DocxQrCode = (function() {
    function DocxQrCode(imageData) {
      this.data = imageData;
      this.base64Data = JSZipBase64.encode(this.data);
      this.ready = false;
      this.result = null;
    }

    DocxQrCode.prototype.decode = function() {
      var _this;

      _this = this;
      qrcode.callback = function() {
        console.log(1);
        _this.ready = true;
        _this.result = this.result;
        return _this.searchImage();
      };
      return qrcode.decode("data:image/png;base64," + this.base64Data);
    };

    DocxQrCode.prototype.searchImage = function() {
      if (this.result !== null) {
        DocUtils.loadDoc(this.result, true, false, true);
        console.log(docXData[this.result]);
        return this.data = docXData[this.result];
      }
    };

    return DocxQrCode;

  })();

}).call(this);
