/*
Docxgen.coffee
Created by Edgar HIPP
*/


(function() {
  var DocxGen, preg_match_all,
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  window.encode_utf8 = function(s) {
    return unescape(encodeURIComponent(s));
  };

  window.decode_utf8 = function(s) {
    return decodeURIComponent(escape(s)).replace(new RegExp(String.fromCharCode(160), "g"), " ");
  };

  preg_match_all = function(regex, haystack) {
    var matchArray, replacer, testRegex;

    testRegex = new RegExp(regex, 'g');
    matchArray = [];
    replacer = function() {
      var match, offset, pn, string, _i;

      match = arguments[0], pn = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), offset = arguments[_i++], string = arguments[_i++];
      pn.unshift(match);
      pn.offset = offset;
      return matchArray.push(pn);
    };
    haystack.replace(testRegex, replacer);
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

    DocxGen.prototype.getValueFromTag = function(tag, scope) {
      if (scope[tag] != null) {
        return scope[tag];
      } else {
        return "undefined";
      }
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
    	returns the new content of the tagged content
    */


    DocxGen.prototype._applyTemplateVars = function(content, currentScope) {
      var A, B, character, charactersAdded, closeiEndLoop, closeiStartLoop, closejEndLoop, closejStartLoop, copyContent, endA, endB, endLoop, endSubContent, endiMatch, extendedA, extendedB, i, inBracket, inForLoop, innerText, j, k, match, matches, newContent, openiEndLoop, openiStartLoop, openjEndLoop, openjStartLoop, regexLeft, regexRight, replacer, scope, startA, startB, startSubContent, startiMatch, startjMatch, subMatches, tagForLoop, textInsideBracket, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1;

      matches = this._getFullTextMatchesFromData(content);
      charactersAdded = 0;
      replacer = function() {
        var match, offset, pn, string, _i;

        match = arguments[0], pn = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), offset = arguments[_i++], string = arguments[_i++];
        pn.unshift(match);
        pn.offset = offset;
        return matches.push(pn);
      };
      content.replace(/^()([^<]+)/, replacer);
      inForLoop = false;
      inBracket = false;
      textInsideBracket = "";
      for (i = _i = 0, _len = matches.length; _i < _len; i = ++_i) {
        match = matches[i];
        innerText = match[2] || "";
        for (j = _j = 0, _len1 = innerText.length; _j < _len1; j = ++_j) {
          character = innerText[j];
          if (character === '{') {
            if (inBracket === true) {
              throw "Bracket already open";
            }
            inBracket = true;
            textInsideBracket = "";
            startiMatch = i;
            startjMatch = j;
          } else if (character === '}') {
            if (textInsideBracket[0] === '#' && inForLoop === false) {
              tagForLoop = textInsideBracket.substr(1);
              inForLoop = true;
              openiStartLoop = startiMatch;
              openjStartLoop = startjMatch;
              openjEndLoop = j;
              openiEndLoop = i;
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

            if (inBracket === false) {
              throw "Bracket already closed";
            }
            inBracket = false;
            endiMatch = i;
            closejStartLoop = startjMatch;
            closejEndLoop = j;
            if (inForLoop === false) {
              if (endiMatch === startiMatch) {
                match[2] = match[2].replace("{" + textInsideBracket + "}", this.getValueFromTag(textInsideBracket, currentScope));
                replacer = '<w:t xml:space="preserve">' + match[2] + "</w:t>";
                charactersAdded += replacer.length - match[0].length;
                if (content.indexOf(match[0]) === -1) {
                  throw "content " + match[0] + " not found in content";
                }
                content = content.replace(match[0], replacer);
                match[0] = replacer;
              } else if (endiMatch > startiMatch) {
                /*replacement:-> <w:t>blabla12</w:t>   <w:t></w:t> <w:t> blabli</w:t>
                							1. for the first (startiMatch): replace {.. by the value
                							2. for in between (startiMatch+1...endiMatch) replace whole by ""
                							3. for the last (endiMatch) replace ..} by ""
                */

                regexRight = /^([^{]*){.*$/;
                subMatches = matches[startiMatch][2].match(regexRight);
                if (matches[startiMatch][1] === "") {
                  matches[startiMatch][2] = this.getValueFromTag(textInsideBracket, currentScope);
                  replacer = matches[startiMatch][2];
                } else {
                  matches[startiMatch][2] = subMatches[1] + this.getValueFromTag(textInsideBracket, currentScope);
                  replacer = '<w:t xml:space="preserve">' + matches[startiMatch][2] + "</w:t>";
                }
                copyContent = content;
                charactersAdded += replacer.length - matches[startiMatch][0].length;
                if (content.indexOf(matches[startiMatch][0]) === -1) {
                  throw "content " + matches[startiMatch][0] + " not found in content";
                }
                content = content.replace(matches[startiMatch][0], replacer);
                if (copyContent === content) {
                  throw 'didnt changed the value';
                }
                for (k = _k = _ref = startiMatch + 1; _ref <= endiMatch ? _k < endiMatch : _k > endiMatch; k = _ref <= endiMatch ? ++_k : --_k) {
                  replacer = matches[k][1] + '</w:t>';
                  charactersAdded += replacer.length - matches[k][0].length;
                  if (content.indexOf(matches[k][0]) === -1) {
                    throw "content " + matches[k][0] + " not found in content";
                  }
                  content = content.replace(matches[k][0], replacer);
                }
                regexLeft = /^[^}]*}(.*)$/;
                matches[endiMatch][2] = matches[endiMatch][2].replace(regexLeft, '$1');
                replacer = '<w:t xml:space="preserve">' + matches[endiMatch][2] + "</w:t>";
                charactersAdded += replacer.length - matches[endiMatch][0].length;
                if (content.indexOf(matches[endiMatch][0]) === -1) {
                  throw "content " + matches[endiMatch][0] + " not found in content";
                }
                content = content.replace(matches[endiMatch][0], replacer);
                matches[endiMatch][0] = replacer;
              } else {
                throw "Bracket closed before opening";
              }
            }
            if (textInsideBracket[0] === '/' && ('/' + tagForLoop === textInsideBracket)) {
              closeiStartLoop = startiMatch;
              closeiEndLoop = i;
              if (inForLoop === false) {
                throw "For loop not opened";
              }
              endLoop = i;
              startB = matches[openiStartLoop].offset + matches[openiStartLoop][1].length + charactersAdded + openjStartLoop;
              endB = matches[closeiEndLoop].offset + matches[closeiEndLoop][1].length + charactersAdded + closejEndLoop + 1;
              B = content.substr(startB, endB - startB);
              startA = matches[openiEndLoop].offset + matches[openiEndLoop][1].length + charactersAdded + openjEndLoop + 1;
              endA = matches[closeiStartLoop].offset + matches[closeiStartLoop][1].length + charactersAdded + closejStartLoop;
              A = content.substr(startA, endA - startA);
              extendedA = content.substr(startA - 100, endA - startA + 200);
              extendedB = content.substr(startB - 100, endB - startB + 200);
              if (B.indexOf('{') === -1 || B.indexOf('/') === -1 || B.indexOf('}') === -1 || B.indexOf('#') === -1) {
                throw "no {,#,/ or } found in B: " + B + " --------------- Context: " + extendedB;
              }
              startSubContent = matches[openiStartLoop].offset;
              endSubContent = matches[closeiEndLoop].offset;
              console.log("AAAAAAA--" + startA + "--" + endA + "--" + A);
              console.log("BBBBBBB--" + startB + "--" + endB + "--" + B);
              inForLoop = false;
              if (currentScope[tagForLoop] != null) {
                if (typeof currentScope[tagForLoop] !== 'object') {
                  throw '{#' + tagForLoop + ("}should be an object (it is a " + (typeof currentScope[tagForLoop]) + ")");
                }
                newContent = "";
                _ref1 = currentScope[tagForLoop];
                for (i = _l = 0, _len2 = _ref1.length; _l < _len2; i = ++_l) {
                  scope = _ref1[i];
                  newContent += this._applyTemplateVars(A, scope);
                }
                content = content.replace(B, newContent);
              } else {
                content = content.replace(B, "");
              }
              return this._applyTemplateVars(content, currentScope);
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
      return decode_utf8(output.join(""));
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
