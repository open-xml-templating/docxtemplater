//@ sourceMappingURL=docxgen.map
(function() {
  var DocxGen, XmlTemplater, decode_utf8, encode_utf8, preg_match_all,
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  encode_utf8 = function(s) {
    return unescape(encodeURIComponent(s));
  };

  decode_utf8 = function(s) {
    return decodeURIComponent(escape(s)).replace(new RegExp(String.fromCharCode(160), "g"), " ");
  };

  String.prototype.replaceFirstFrom = function(search, replace, from) {
    return this.substr(0, from) + this.substr(from).replace(search, replace);
  };

  preg_match_all = function(regex, content) {
    /*regex is a string, content is the content. It returns an array of all matches with their offset, for example: 
    	regex=la
    	content=lolalolilala
    	returns: [{0:'la',offset:2},{0:'la',offset:8},{0:'la',offset:10}]
    */

    var matchArray, replacer;

    matchArray = [];
    replacer = function() {
      var match, offset, pn, string, _i;

      match = arguments[0], pn = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), offset = arguments[_i++], string = arguments[_i++];
      pn.unshift(match);
      pn.offset = offset;
      return matchArray.push(pn);
    };
    content.replace(new RegExp(regex, 'g'), replacer);
    return matchArray;
  };

  window.XmlTemplater = XmlTemplater = (function() {
    function XmlTemplater(content, templateVars, intelligentTagging) {
      if (content == null) {
        content = "";
      }
      this.templateVars = templateVars != null ? templateVars : {};
      this.intelligentTagging = intelligentTagging != null ? intelligentTagging : false;
      if (typeof content === "string") {
        this.load(content);
      } else {
        throw "content must be string!";
      }
      this.currentScope = this.templateVars;
    }

    XmlTemplater.prototype.load = function(content) {
      this.content = content;
    };

    XmlTemplater.prototype.getValueFromTag = function(tag, scope) {
      if (scope[tag] != null) {
        return encode_utf8(scope[tag]);
      } else {
        return "undefined";
      }
    };

    XmlTemplater.prototype.calcScopeContent = function(content, start, end) {
      var i, innerCurrentTag, innerLastTag, justOpened, lastTag, result, tag, tags, _i, _len;

      if (start == null) {
        start = 0;
      }
      if (end == null) {
        end = content.length - 1;
      }
      /*get the different closing and opening tags between two texts (doesn't take into account tags that are opened then closed (those that are closed then opened are returned)): 
      		returns:[{"tag":"</w:r>","offset":13},{"tag":"</w:p>","offset":265},{"tag":"</w:tc>","offset":271},{"tag":"<w:tc>","offset":828},{"tag":"<w:p>","offset":883},{"tag":"<w:r>","offset":1483}]
      */

      tags = preg_match_all("<(\/?[^/> ]+)([^>]*)>", content.substr(start, end));
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

    XmlTemplater.prototype.calcScopeDifference = function(content, start, end) {
      var scope;

      if (start == null) {
        start = 0;
      }
      if (end == null) {
        end = content.length - 1;
      }
      scope = this.calcScopeContent(content, start, end);
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
      var match, matches, output;

      matches = this._getFullTextMatchesFromData();
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

    XmlTemplater.prototype._getFullTextMatchesFromData = function() {
      var data, matches, regex;

      data = this.content;
      regex = "(<w:t[^>]*>)([^<>]*)?</w:t>";
      return matches = preg_match_all(regex, data);
    };

    XmlTemplater.prototype.calcInnerTextScope = function(content, start, end, tag) {
      var endTag, startTag;

      endTag = content.indexOf('</' + tag + '>', end);
      if (endTag === -1) {
        throw "can't find endTag " + endTag;
      }
      endTag += ('</' + tag + '>').length;
      startTag = Math.max(content.lastIndexOf('<' + tag + '>', start), content.lastIndexOf('<' + tag + ' ', start));
      if (startTag === -1) {
        throw "can't find startTag";
      }
      return {
        "text": content.substr(startTag, endTag - startTag),
        startTag: startTag,
        endTag: endTag
      };
    };

    XmlTemplater.prototype.calcB = function(matches, content, openiStartLoop, openjStartLoop, closeiEndLoop, closejEndLoop, charactersAdded) {
      var endB, startB;

      startB = matches[openiStartLoop].offset + matches[openiStartLoop][1].length + charactersAdded[openiStartLoop] + openjStartLoop;
      endB = matches[closeiEndLoop].offset + matches[closeiEndLoop][1].length + charactersAdded[closeiEndLoop] + closejEndLoop + 1;
      return {
        B: content.substr(startB, endB - startB),
        start: startB,
        end: endB
      };
    };

    XmlTemplater.prototype.calcA = function(matches, content, openiEndLoop, openjEndLoop, closeiStartLoop, closejStartLoop, charactersAdded) {
      var endA, startA;

      startA = matches[openiEndLoop].offset + matches[openiEndLoop][1].length + charactersAdded[openiEndLoop] + openjEndLoop + 1;
      endA = matches[closeiStartLoop].offset + matches[closeiStartLoop][1].length + charactersAdded[closeiStartLoop] + closejStartLoop;
      return {
        A: content.substr(startA, endA - startA),
        start: startA,
        end: endA
      };
    };

    XmlTemplater.prototype.forLoop = function(content, currentScope, tagForLoop, charactersAdded, closeiStartLoop, closeiEndLoop, matches, openiStartLoop, openjStartLoop, closejEndLoop, openiEndLoop, openjEndLoop, closejStartLoop) {
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

      var A, B, i, newContent, nextFile, scope, subfile, _i, _len, _ref;

      B = (this.calcB(matches, content, openiStartLoop, openjStartLoop, closeiEndLoop, closejEndLoop, charactersAdded)).B;
      A = (this.calcA(matches, content, openiEndLoop, openjEndLoop, closeiStartLoop, closejStartLoop, charactersAdded)).A;
      if (B[0] !== '{' || B.indexOf('{') === -1 || B.indexOf('/') === -1 || B.indexOf('}') === -1 || B.indexOf('#') === -1) {
        throw "no {,#,/ or } found in B: " + B;
      }
      if (currentScope[tagForLoop] != null) {
        if (typeof currentScope[tagForLoop] !== 'object') {
          throw '{#' + tagForLoop + ("}should be an object (it is a " + (typeof currentScope[tagForLoop]) + ")");
        }
        newContent = "";
        _ref = currentScope[tagForLoop];
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          scope = _ref[i];
          subfile = new XmlTemplater(A, scope, this.intelligentTagging);
          subfile.applyTemplateVars();
          newContent += subfile.content;
          if ((subfile.getFullText().indexOf('{')) !== -1) {
            throw "they shouln't be a { in replaced file: " + (subfile.getFullText()) + " (1)";
          }
        }
        content = content.replace(B, newContent);
      } else {
        content = content.replace(B, "");
      }
      nextFile = new XmlTemplater(content, currentScope, this.intelligentTagging);
      nextFile.applyTemplateVars();
      if ((nextFile.getFullText().indexOf('{')) !== -1) {
        throw "they shouln't be a { in replaced file: " + (nextFile.getFullText()) + " (3)";
      }
      this.content = nextFile.content;
      return nextFile;
    };

    XmlTemplater.prototype.dashLoop = function(textInsideBracket, tagDashLoop, startiMatch, i, openiStartLoop, openjStartLoop, openiEndLoop, closejEndLoop, content, charactersAdded, matches, currentScope, elementDashLoop) {
      var A, B, closeiEndLoop, closeiStartLoop, copyA, endB, newContent, nextFile, resultFullScope, scope, startB, subfile, t, _i, _j, _len, _ref, _ref1, _ref2, _ref3;

      console.log("tagdashLoop:" + tagDashLoop);
      closeiStartLoop = startiMatch;
      closeiEndLoop = i;
      startB = matches[openiStartLoop].offset + matches[openiStartLoop][1].length + charactersAdded[openiStartLoop] + openjStartLoop;
      endB = matches[closeiEndLoop].offset + matches[closeiEndLoop][1].length + charactersAdded[closeiEndLoop] + closejEndLoop + 1;
      resultFullScope = this.calcInnerTextScope(content, startB, endB, elementDashLoop);
      for (t = _i = 0, _ref = matches.length; 0 <= _ref ? _i <= _ref : _i >= _ref; t = 0 <= _ref ? ++_i : --_i) {
        charactersAdded[t] -= resultFullScope.startTag;
      }
      B = resultFullScope.text;
      if ((content.indexOf(B)) === -1) {
        throw "couln't find B in content";
      }
      A = B;
      copyA = A;
      _ref1 = this.replaceTag(A, openiEndLoop, openiStartLoop, matches, "" + textInsideBracket, "", charactersAdded), A = _ref1[0], charactersAdded = _ref1[1], matches = _ref1[2];
      if (copyA === A) {
        throw "A should have changed after deleting the opening tag";
      }
      copyA = A;
      _ref2 = this.replaceTag(A, closeiEndLoop, closeiStartLoop, matches, '/' + tagDashLoop, "", charactersAdded), A = _ref2[0], charactersAdded = _ref2[1], matches = _ref2[2];
      if (copyA === A) {
        throw "A should have changed after deleting the opening tag";
      }
      if (currentScope[tagDashLoop] != null) {
        if (typeof currentScope[tagDashLoop] !== 'object') {
          throw '{#' + tagDashLoop + ("}should be an object (it is a " + (typeof currentScope[tagDashLoop]) + ")");
        }
        newContent = "";
        _ref3 = currentScope[tagDashLoop];
        for (i = _j = 0, _len = _ref3.length; _j < _len; i = ++_j) {
          scope = _ref3[i];
          subfile = new XmlTemplater(A, scope, this.intelligentTagging);
          subfile.applyTemplateVars();
          newContent += subfile.content;
          if ((subfile.getFullText().indexOf('{')) !== -1) {
            throw "they shouln't be a { in replaced file: " + (subfile.getFullText()) + " (5)";
          }
        }
        content = content.replace(B, newContent);
      } else {
        content = content.replace(B, "");
      }
      nextFile = new XmlTemplater(content, currentScope, this.intelligentTagging);
      nextFile.applyTemplateVars();
      this.content = nextFile.content;
      if ((nextFile.getFullText().indexOf('{')) !== -1) {
        throw "they shouln't be a { in replaced file: " + (nextFile.getFullText()) + " (6)";
      }
      return nextFile;
    };

    XmlTemplater.prototype.replaceTag = function(content, endiMatch, startiMatch, matches, textInsideBracket, newValue, charactersAdded) {
      var copyContent, j, k, match, regexLeft, regexRight, replacer, startB, subMatches, _i, _j, _len, _ref;

      if ((matches[endiMatch][2].indexOf('}')) === -1) {
        throw "no closing bracket at endiMatch " + matches[endiMatch][2];
      }
      if ((matches[startiMatch][2].indexOf('{')) === -1) {
        throw "no opening bracket at startiMatch " + matches[startiMatch][2];
      }
      if (endiMatch === startiMatch) {
        matches[startiMatch][2] = matches[startiMatch][2].replace("{" + textInsideBracket + "}", newValue);
        replacer = '<w:t xml:space="preserve">' + matches[startiMatch][2] + "</w:t>";
        startB = matches[startiMatch].offset + charactersAdded[startiMatch];
        charactersAdded[startiMatch + 1] += replacer.length - matches[startiMatch][0].length;
        if (content.indexOf(matches[startiMatch][0]) === -1) {
          throw "content " + matches[startiMatch][0] + " not found in content";
        }
        copyContent = content;
        content = content.replaceFirstFrom(matches[startiMatch][0], replacer, startB);
        matches[startiMatch][0] = replacer;
        if (copyContent === content) {
          throw "offset problem0: didnt changed the value (should have changed from " + matches[startiMatch][0] + " to " + replacer;
        }
      } else if (endiMatch > startiMatch) {
        /*replacement:-> <w:t>blabla12</w:t>   <w:t></w:t> <w:t> blabli</w:t>
        			1. for the first (startiMatch): replace {.. by the value
        			2. for in between (startiMatch+1...endiMatch) replace whole by ""
        			3. for the last (endiMatch) replace ..} by ""
        */

        regexRight = /^([^{]*){.*$/;
        subMatches = matches[startiMatch][2].match(regexRight);
        if (matches[startiMatch][1] === "") {
          matches[startiMatch][2] = newValue;
          replacer = matches[startiMatch][2];
        } else {
          matches[startiMatch][2] = subMatches[1] + newValue;
          replacer = '<w:t xml:space="preserve">' + matches[startiMatch][2] + "</w:t>";
        }
        copyContent = content;
        startB = matches[startiMatch].offset + charactersAdded[startiMatch];
        charactersAdded[startiMatch + 1] += replacer.length - matches[startiMatch][0].length;
        if (content.indexOf(matches[startiMatch][0]) === -1) {
          throw "content " + matches[startiMatch][0] + " not found in content";
        }
        content = content.replaceFirstFrom(matches[startiMatch][0], replacer, startB);
        matches[startiMatch][0] = replacer;
        if (copyContent === content) {
          throw "offset problem1: didnt changed the value (should have changed from " + matches[startiMatch][0] + " to " + replacer;
        }
        for (k = _i = _ref = startiMatch + 1; _ref <= endiMatch ? _i < endiMatch : _i > endiMatch; k = _ref <= endiMatch ? ++_i : --_i) {
          replacer = matches[k][1] + '</w:t>';
          startB = matches[k].offset + charactersAdded[k];
          charactersAdded[k + 1] = charactersAdded[k] + replacer.length - matches[k][0].length;
          if (content.indexOf(matches[k][0]) === -1) {
            throw "content " + matches[k][0] + " not found in content";
          }
          copyContent = content;
          content = content.replaceFirstFrom(matches[k][0], replacer, startB);
          matches[k][0] = replacer;
          if (copyContent === content) {
            throw "offset problem2: didnt changed the value (should have changed from " + matches[startiMatch][0] + " to " + replacer;
          }
        }
        regexLeft = /^[^}]*}(.*)$/;
        matches[endiMatch][2] = matches[endiMatch][2].replace(regexLeft, '$1');
        replacer = '<w:t xml:space="preserve">' + matches[endiMatch][2] + "</w:t>";
        startB = matches[endiMatch].offset + charactersAdded[endiMatch];
        charactersAdded[endiMatch + 1] = charactersAdded[endiMatch] + replacer.length - matches[endiMatch][0].length;
        if (content.indexOf(matches[endiMatch][0]) === -1) {
          throw "content " + matches[endiMatch][0] + " not found in content";
        }
        copyContent = content;
        content = content.replaceFirstFrom(matches[endiMatch][0], replacer, startB);
        if (copyContent === content) {
          throw "offset problem3: didnt changed the value (should have changed from " + matches[startiMatch][0] + " to " + replacer;
        }
        matches[endiMatch][0] = replacer;
      } else {
        throw "Bracket closed before opening";
      }
      for (j = _j = 0, _len = matches.length; _j < _len; j = ++_j) {
        match = matches[j];
        if (j > endiMatch) {
          charactersAdded[j + 1] = charactersAdded[j];
        }
      }
      return [content, charactersAdded, matches];
    };

    /*
    	content is the whole content to be tagged
    	scope is the current scope
    	returns the new content of the tagged content
    */


    XmlTemplater.prototype.applyTemplateVars = function(content, currentScope) {
      var character, charactersAdded, closejEndLoop, closejStartLoop, dashLooping, elementDashLoop, endiMatch, glou, i, inBracket, inDashLoop, inForLoop, innerText, j, match, matches, openiEndLoop, openiStartLoop, openjEndLoop, openjStartLoop, regex, replacer, scopeContent, startiMatch, startjMatch, t, tagDashLoop, tagForLoop, textInsideBracket, u, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _ref, _ref1;

      content = this.content;
      currentScope = this.currentScope;
      matches = this._getFullTextMatchesFromData(content);
      charactersAdded = (function() {
        var _i, _ref, _results;

        _results = [];
        for (i = _i = 0, _ref = matches.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push(0);
        }
        return _results;
      })();
      replacer = function() {
        var match, offset, pn, string, _i;

        match = arguments[0], pn = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), offset = arguments[_i++], string = arguments[_i++];
        pn.unshift(match);
        pn.offset = offset;
        matches.unshift(pn);
        return charactersAdded.unshift(0);
      };
      content.replace(/^()([^<]+)/, replacer);
      this.matches = matches;
      inForLoop = false;
      inBracket = false;
      inDashLoop = false;
      textInsideBracket = "";
      for (i = _i = 0, _len = matches.length; _i < _len; i = ++_i) {
        match = matches[i];
        innerText = match[2] || "";
        for (t = _j = i, _ref = matches.length; i <= _ref ? _j < _ref : _j > _ref; t = i <= _ref ? ++_j : --_j) {
          charactersAdded[t + 1] = charactersAdded[t];
        }
        for (j = _k = 0, _len1 = innerText.length; _k < _len1; j = ++_k) {
          character = innerText[j];
          for (u = _l = 0, _len2 = matches.length; _l < _len2; u = ++_l) {
            glou = matches[u];
            if (u <= i) {
              if (content[glou.offset + charactersAdded[u]] !== glou[0][0]) {
                throw "no < at the beginning of " + glou[0] + " (2)";
              }
            }
          }
          if (character === '{') {
            if (inBracket === true) {
              throw "Bracket already open with text: " + textInsideBracket;
            }
            inBracket = true;
            textInsideBracket = "";
            startiMatch = i;
            startjMatch = j;
          } else if (character === '}') {
            if (textInsideBracket[0] === '#' && inForLoop === false && inDashLoop === false) {
              tagForLoop = textInsideBracket.substr(1);
              inForLoop = true;
              openiStartLoop = startiMatch;
              openjStartLoop = startjMatch;
              openjEndLoop = j;
              openiEndLoop = i;
            }
            if (textInsideBracket[0] === '-' && inForLoop === false && inDashLoop === false) {
              tagDashLoop = textInsideBracket.substr(1);
              inDashLoop = true;
              openiStartLoop = startiMatch;
              openjStartLoop = startjMatch;
              openjEndLoop = j;
              openiEndLoop = i;
              regex = /^-([a-zA-Z_:]+) ([a-zA-Z_:]+)$/;
              elementDashLoop = textInsideBracket.replace(regex, '$1');
              tagDashLoop = textInsideBracket.replace(regex, '$2');
            }
            if (inBracket === false) {
              throw "Bracket already closed";
            }
            inBracket = false;
            endiMatch = i;
            closejStartLoop = startjMatch;
            closejEndLoop = j;
            if (inForLoop === false && inDashLoop === false) {
              _ref1 = this.replaceTag(content, endiMatch, startiMatch, matches, textInsideBracket, this.getValueFromTag(textInsideBracket, currentScope), charactersAdded), content = _ref1[0], charactersAdded = _ref1[1], matches = _ref1[2];
            }
            if (textInsideBracket[0] === '/' && ('/' + tagDashLoop === textInsideBracket) && inDashLoop === true) {
              return this.dashLoop(textInsideBracket, tagDashLoop, startiMatch, i, openiStartLoop, openjStartLoop, openiEndLoop, closejEndLoop, content, charactersAdded, matches, currentScope, elementDashLoop);
            }
            if (textInsideBracket[0] === '/' && ('/' + tagForLoop === textInsideBracket) && inForLoop === true) {
              dashLooping = false;
              if (this.intelligentTagging === true) {
                scopeContent = this.calcScopeContent(content, matches[openiStartLoop].offset + charactersAdded[openiStartLoop], matches[i].offset + charactersAdded[i] - (matches[openiStartLoop].offset + charactersAdded[openiStartLoop]));
                for (_m = 0, _len3 = scopeContent.length; _m < _len3; _m++) {
                  t = scopeContent[_m];
                  if (t.tag === '<w:tc>') {
                    dashLooping = true;
                    elementDashLoop = 'w:tr';
                  }
                }
              }
              if (dashLooping === false) {
                return this.forLoop(content, currentScope, tagForLoop, charactersAdded, startiMatch, i, matches, openiStartLoop, openjStartLoop, closejEndLoop, openiEndLoop, openjEndLoop, closejStartLoop);
              } else {
                return this.dashLoop(textInsideBracket, textInsideBracket.substr(1), startiMatch, i, openiStartLoop, openjStartLoop, openiEndLoop, closejEndLoop, content, charactersAdded, matches, currentScope, elementDashLoop);
              }
            }
          } else {
            if (inBracket === true) {
              textInsideBracket += character;
            }
          }
        }
      }
      this.content = content;
      if ((this.getFullText().indexOf('{')) !== -1) {
        throw "they shouln't be a { in replaced file: " + (this.getFullText()) + " (2)";
      }
      return this;
    };

    return XmlTemplater;

  })();

  /*
  Docxgen.coffee
  Created by Edgar HIPP
  03/06/2013
  */


  window.DocxGen = DocxGen = (function() {
    var imageExtensions;

    imageExtensions = ['gif', 'jpeg', 'jpg', 'emf', 'png'];

    function DocxGen(content, templateVars, intelligentTagging) {
      this.templateVars = templateVars != null ? templateVars : {};
      this.intelligentTagging = intelligentTagging != null ? intelligentTagging : false;
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

    DocxGen.prototype.applyTemplateVars = function() {
      var currentFile, fileName, _i, _len, _ref, _results;

      _ref = this.templatedFiles;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        fileName = _ref[_i];
        if (!(this.files[fileName] != null)) {
          continue;
        }
        currentFile = new XmlTemplater(this.files[fileName].data, this.templateVars, this.intelligentTagging);
        _results.push(this.files[fileName].data = currentFile.applyTemplateVars().content);
      }
      return _results;
    };

    DocxGen.prototype.setTemplateVars = function(templateVars) {
      this.templateVars = templateVars;
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

    DocxGen.prototype.getFullText = function(path, data) {
      var currentFile;

      if (path == null) {
        path = "word/document.xml";
      }
      if (data == null) {
        data = "";
      }
      currentFile = new XmlTemplater(this.files[path].data, this.templateVars, this.intelligentTagging);
      return currentFile.getFullText();
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
