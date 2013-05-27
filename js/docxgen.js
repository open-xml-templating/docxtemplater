/*
Docxgen.coffee
Created by Edgar HIPP
*/


(function() {
  var DocxGen, preg_match_all,
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  preg_match_all = function(regex, haystack) {
    var matchArray, replacer, testRegex, unused;

    testRegex = new RegExp(regex, 'g');
    matchArray = [];
    replacer = function() {
      var match, offset, pn, string, _i;

      match = arguments[0], pn = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), offset = arguments[_i++], string = arguments[_i++];
      pn.unshift(match);
      pn.offset = offset;
      return matchArray.push(pn);
    };
    unused = haystack.replace(testRegex, replacer);
    return matchArray;
  };

  window.DocxGen = DocxGen = (function() {
    var imageExtensions;

    imageExtensions = ['gif', 'jpeg', 'jpg', 'emf', 'png'];

    function DocxGen(content, templateVars) {
      this.templateVars = templateVars != null ? templateVars : {};
      this.files = {};
      this.templatedFiles = ["word/document.xml", "word/footer1.xml", "word/footer2.xml", "word/footer3.xml", "word/header1.xml", "word/header2.xml", "word/header3.xml"];
      if (typeof content === "string") {
        this.load(content);
      }
    }

    DocxGen.prototype.load = function(content) {
      var zip;

      zip = new JSZip(content);
      return this.files = zip.files;
    };

    DocxGen.prototype.getImageList = function() {
      var extension, imageList, index, regex;

      regex = /[^.]*\.([^.]*)/;
      imageList = [];
      for (index in this.files) {
        extension = index.replace(regex, '$1');
        if (__indexOf.call(imageExtensions, extension) >= 0) {
          imageList.push({
            "path": index,
            files: this.files[index]
          });
        }
      }
      return imageList;
    };

    DocxGen.prototype.setImage = function(path, data) {
      return this.files[path].data = data;
    };

    DocxGen.prototype.setTemplateVars = function(templateVars) {
      return this.templateVars = templateVars;
    };

    /*
    	content is the whole content to be tagged
    	scope is the current scope
    	returns the new content of the
    */


    DocxGen.prototype._applyTemplateVars = function(content, currentScope) {
      var B, Bend, Bstart, character, copyContent, endLoop, endMatch, endSubContent, i, inBracket, inForLoop, innerText, j, k, match, matches, newContent, regexLeft, regexRight, replacer, scope, startLoop, startMatch, startSubContent, subContent, subMatches, tagForLoop, textInsideBracket, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1;

      inForLoop = false;
      inBracket = false;
      matches = this._getFullTextMatchesFromData(content);
      textInsideBracket = "";
      console.log(matches);
      for (i = _i = 0, _len = matches.length; _i < _len; i = ++_i) {
        match = matches[i];
        innerText = match[2] || "";
        console.log(match);
        console.log(innerText);
        for (j = _j = 0, _len1 = innerText.length; _j < _len1; j = ++_j) {
          character = innerText[j];
          if (character === '{') {
            if (inBracket === true) {
              throw "Bracket already open";
            }
            inBracket = true;
            textInsideBracket = "";
            startMatch = i;
          } else if (character === '}') {
            console.log("innerText" + textInsideBracket);
            if (textInsideBracket[0] === '#' && inForLoop === false) {
              tagForLoop = textInsideBracket.substr(1);
              inForLoop = true;
              startLoop = i;
            }
            /*
            						<w:t>{#forTag}</w:t>
            						.....
            						.....
            						<w:t>{/forTag}</w:t>
            						Let subContent be what is in between the first closing bracket and the second opening bracket
            						We replace the data by:
            						<w:t>subContent subContent subContent</w:t>
            */

            if (inBracket === false) {
              throw "Bracket already closed";
            }
            inBracket = false;
            if (inForLoop === false) {
              endMatch = i;
              if (endMatch === startMatch) {
                match[2] = match[2].replace("{" + textInsideBracket + "}", currentScope[textInsideBracket]);
                replacer = '<w:t xml:space="preserve">' + match[2] + "</w:t>";
                content = content.replace(match[0], replacer);
                match[0] = replacer;
              } else if (endMatch > startMatch) {
                /*replacement:-> <w:t>blabla12</w:t>   <w:t></w:t> <w:t> blabli</w:t>
                							1. for the first (startMatch): replace {.. by the value
                							2. for in between (startMatch+1...endMatch) replace whole by ""
                							3. for the last (endMatch) replace ..} by ""
                */

                regexRight = /^([^{]*){.*$/;
                subMatches = matches[startMatch][2].match(regexRight);
                matches[startMatch][2] = subMatches[1] + currentScope[textInsideBracket];
                replacer = '<w:t xml:space="preserve">' + matches[startMatch][2] + "</w:t>";
                copyContent = content;
                content = content.replace(matches[startMatch][0], replacer);
                if (copyContent === content) {
                  throw 'didnt changed the value';
                }
                for (k = _k = _ref = startMatch + 1; _ref <= endMatch ? _k < endMatch : _k > endMatch; k = _ref <= endMatch ? ++_k : --_k) {
                  replacer = matches[k][1] + '</w:t>';
                  content = content.replace(matches[k][0], replacer);
                }
                regexLeft = /^[^}]*}(.*)$/;
                matches[endMatch][2] = matches[endMatch][2].replace(regexLeft, '$1');
                replacer = '<w:t xml:space="preserve">' + matches[endMatch][2] + "</w:t>";
                content = content.replace(matches[endMatch][0], replacer);
                matches[endMatch][0] = replacer;
              } else {
                throw "Bracket closed before opening";
              }
            }
            if (textInsideBracket[0] === '/' && inForLoop) {
              endLoop = i;
              console.log("startloop:" + startLoop + "-endLoop:" + endLoop);
              startSubContent = matches[startLoop].offset;
              endSubContent = matches[endLoop].offset;
              subContent = content.substr(startSubContent, endSubContent - startSubContent);
              console.log(subContent);
              subContent = subContent.substr(subContent.indexOf('}') + 1);
              console.log(subContent);
              subContent = subContent.substr(0, subContent.lastIndexOf('{'));
              console.log(subContent);
              Bstart = content.lastIndexOf('{', startSubContent);
              Bend = content.indexOf('}', endSubContent);
              B = content.substr(Bstart, Bend - Bstart + 1);
              console.log("BBBBBBB------" + B);
              inForLoop = false;
              if (typeof currentScope[tagForLoop] !== 'object') {
                throw '{#' + tagForLoop + ("}should be an object (it is a " + (typeof currentScope[tagForLoop]) + ")");
              }
              newContent = "";
              _ref1 = currentScope[tagForLoop];
              for (i = _l = 0, _len2 = _ref1.length; _l < _len2; i = ++_l) {
                scope = _ref1[i];
                console.log(scope);
                newContent += this._applyTemplateVars(subContent, scope);
              }
              console.log(content.length);
              content = content.replace(B, newContent);
              console.log(content.length);
              console.log("nextStep");
              this._applyTemplateVars(content, currentScope);
              break;
            }
          } else {
            if (inBracket === true) {
              textInsideBracket += character;
            }
          }
        }
      }
      return content;
    };

    DocxGen.prototype.applyTemplateVars = function() {
      var fileData, fileName, scope, _i, _len, _ref, _results;

      _ref = this.templatedFiles;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        fileName = _ref[_i];
        if (!(this.files[fileName] != null)) {
          continue;
        }
        fileData = this.files[fileName].data;
        scope = this.templateVars;
        _results.push(this.files[fileName].data = this._applyTemplateVars(fileData, scope));
      }
      return _results;
    };

    DocxGen.prototype.output = function(download) {
      var doOutput, file, index, outputFile, zip;

      if (download == null) {
        download = true;
      }
      zip = new JSZip();
      doOutput = function() {
        return document.location.href = "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64," + outputFile;
      };
      for (index in this.files) {
        file = this.files[index];
        zip.file(file.name, file.data, file.options);
      }
      outputFile = zip.generate();
      if (download === true) {
        doOutput();
      }
      return outputFile;
    };

    DocxGen.prototype.getFullText = function(path) {
      var match, matches, output;

      if (path == null) {
        path = "word/document.xml";
      }
      matches = this.getFullTextMatches(path);
      output = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = matches.length; _i < _len; _i++) {
          match = matches[_i];
          _results.push(match[2]);
        }
        return _results;
      })();
      return output.join("");
    };

    DocxGen.prototype.getFullTextMatches = function(path) {
      var file;

      if (path == null) {
        path = "word/document.xml";
      }
      file = this.files[path];
      return this._getFullTextMatchesFromData(file.data);
    };

    DocxGen.prototype._getFullTextMatchesFromData = function(data) {
      var matches, regex;

      regex = "(<w:t[^>]*>)([^<>]*)?</w:t>";
      return matches = preg_match_all(regex, data);
    };

    DocxGen.prototype.download = function(swfpath, imgpath, filename) {
      var outputFile;

      if (filename == null) {
        filename = "default.docx";
      }
      outputFile = this.output(false);
      return Downloadify.create('downloadify', {
        filename: function() {
          return filename;
        },
        data: function() {
          return outputFile;
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
