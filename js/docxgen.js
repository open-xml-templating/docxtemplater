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
      var i, replacer,
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
      replacer = function() {
        var match, offset, pn, string, _i;

        match = arguments[0], pn = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), offset = arguments[_i++], string = arguments[_i++];
        pn.unshift(match);
        pn.offset = offset;
        _this.matches.unshift(pn);
        return _this.charactersAdded.unshift(0);
      };
      return this.content.replace(/^()([^<]+)/, replacer);
    };

    XmlTemplater.prototype.getValueFromTag = function(tag, scope) {
      if (scope[tag] != null) {
        return encode_utf8(scope[tag]);
      } else {
        return "undefined";
      }
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

      tags = preg_match_all("<(\/?[^/> ]+)([^>]*)>", text.substr(start, end));
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
      return decode_utf8(output.join(""));
    };

    XmlTemplater.prototype._getFullTextMatchesFromData = function() {
      return this.matches = preg_match_all("(<w:t[^>]*>)([^<>]*)?</w:t>", this.content);
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

    XmlTemplater.prototype.forLoop = function() {
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

      B = this.calcB().B;
      A = this.calcA().A;
      if (B[0] !== '{' || B.indexOf('{') === -1 || B.indexOf('/') === -1 || B.indexOf('}') === -1 || B.indexOf('#') === -1) {
        throw "no {,#,/ or } found in B: " + B;
      }
      if (this.currentScope[this.loopOpen.tag] != null) {
        if (typeof this.currentScope[this.loopOpen.tag] !== 'object') {
          throw '{#' + this.loopOpen.tag + ("}should be an object (it is a " + (typeof this.currentScope[this.loopOpen.tag]) + ")");
        }
        newContent = "";
        _ref = this.currentScope[this.loopOpen.tag];
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          scope = _ref[i];
          subfile = new XmlTemplater(A, scope, this.intelligentTagging);
          subfile.applyTemplateVars();
          newContent += subfile.content;
          if ((subfile.getFullText().indexOf('{')) !== -1) {
            throw "they shouln't be a { in replaced file: " + (subfile.getFullText()) + " (1)";
          }
        }
        this.content = this.content.replace(B, newContent);
      } else {
        this.content = this.content.replace(B, "");
      }
      nextFile = new XmlTemplater(this.content, this.currentScope, this.intelligentTagging);
      nextFile.applyTemplateVars();
      if ((nextFile.getFullText().indexOf('{')) !== -1) {
        throw "they shouln't be a { in replaced file: " + (nextFile.getFullText()) + " (3)";
      }
      this.content = nextFile.content;
      return this;
    };

    XmlTemplater.prototype.dashLoop = function(elementDashLoop) {
      var A, B, copyA, endB, i, newContent, nextFile, resultFullScope, scope, startB, subfile, t, _i, _j, _len, _ref, _ref1, _ref2;

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
      A = this.replaceTag("", A);
      if (copyA === A) {
        throw "A should have changed after deleting the opening tag";
      }
      copyA = A;
      this.bracketEnd = {
        "i": this.loopClose.end.i,
        "j": this.loopClose.end.j
      };
      this.bracketStart = {
        "i": this.loopClose.start.i,
        "j": this.loopClose.start.j
      };
      A = this.replaceTag("", A);
      if (copyA === A) {
        throw "A should have changed after deleting the opening tag";
      }
      if (this.currentScope[this.loopOpen.tag] != null) {
        if (typeof this.currentScope[this.loopOpen.tag] !== 'object') {
          throw '{#' + this.loopOpen.tag + ("}should be an object (it is a " + (typeof this.currentScope[this.loopOpen.tag]) + ")");
        }
        newContent = "";
        _ref2 = this.currentScope[this.loopOpen.tag];
        for (i = _j = 0, _len = _ref2.length; _j < _len; i = ++_j) {
          scope = _ref2[i];
          subfile = new XmlTemplater(A, scope, this.intelligentTagging);
          subfile.applyTemplateVars();
          newContent += subfile.content;
          if ((subfile.getFullText().indexOf('{')) !== -1) {
            throw "they shouln't be a { in replaced file: " + (subfile.getFullText()) + " (5)";
          }
        }
        this.content = this.content.replace(B, newContent);
      } else {
        this.content = this.content.replace(B, "");
      }
      nextFile = new XmlTemplater(this.content, this.currentScope, this.intelligentTagging);
      nextFile.applyTemplateVars();
      this.content = nextFile.content;
      if ((nextFile.getFullText().indexOf('{')) !== -1) {
        throw "they shouln't be a { in replaced file: " + (nextFile.getFullText()) + " (6)";
      }
      return this;
    };

    XmlTemplater.prototype.replaceTag = function(newValue, content) {
      var copyContent, j, k, match, regexLeft, regexRight, replacer, startB, startBracket, subMatches, _i, _j, _len, _ref, _ref1, _ref2;

      if (content == null) {
        content = this.content;
      }
      if ((this.matches[this.bracketEnd.i][2].indexOf('}')) === -1) {
        throw "no closing bracket at @bracketEnd.i " + this.matches[this.bracketEnd.i][2];
      }
      if ((this.matches[this.bracketStart.i][2].indexOf('{')) === -1) {
        throw "no opening bracket at @bracketStart.i " + this.matches[this.bracketStart.i][2];
      }
      if (this.bracketEnd.i === this.bracketStart.i) {
        this.matches[this.bracketStart.i][2] = this.matches[this.bracketStart.i][2].replace("{" + this.textInsideBracket + "}", newValue);
        replacer = '<w:t xml:space="preserve">' + this.matches[this.bracketStart.i][2] + "</w:t>";
        startBracket = this.matches[this.bracketStart.i].offset + this.charactersAdded[this.bracketStart.i];
        this.charactersAdded[this.bracketStart.i + 1] += replacer.length - this.matches[this.bracketStart.i][0].length;
        if (content.indexOf(this.matches[this.bracketStart.i][0]) === -1) {
          throw "content " + this.matches[this.bracketStart.i][0] + " not found in content";
        }
        copyContent = content;
        content = content.replaceFirstFrom(this.matches[this.bracketStart.i][0], replacer, startBracket);
        this.matches[this.bracketStart.i][0] = replacer;
        if (copyContent === content) {
          throw "offset problem0: didnt changed the value (should have changed from " + this.matches[this.bracketStart.i][0] + " to " + replacer;
        }
      } else if (this.bracketEnd.i > this.bracketStart.i) {
        /*replacement:-> <w:t>blabla12</w:t>   <w:t></w:t> <w:t> blabli</w:t>
        			1. for the first (@bracketStart.i): replace {.. by the value
        			2. for in between (@bracketStart.i+1...@bracketEnd.i) replace whole by ""
        			3. for the last (@bracketEnd.i) replace ..} by ""
        */

        regexRight = /^([^{]*){.*$/;
        subMatches = this.matches[this.bracketStart.i][2].match(regexRight);
        if (this.matches[this.bracketStart.i][1] === "") {
          this.matches[this.bracketStart.i][2] = newValue;
          replacer = this.matches[this.bracketStart.i][2];
        } else {
          this.matches[this.bracketStart.i][2] = subMatches[1] + newValue;
          replacer = '<w:t xml:space="preserve">' + this.matches[this.bracketStart.i][2] + "</w:t>";
        }
        copyContent = content;
        startB = this.matches[this.bracketStart.i].offset + this.charactersAdded[this.bracketStart.i];
        this.charactersAdded[this.bracketStart.i + 1] += replacer.length - this.matches[this.bracketStart.i][0].length;
        if (content.indexOf(this.matches[this.bracketStart.i][0]) === -1) {
          throw "content " + this.matches[this.bracketStart.i][0] + " not found in content";
        }
        content = content.replaceFirstFrom(this.matches[this.bracketStart.i][0], replacer, startB);
        this.matches[this.bracketStart.i][0] = replacer;
        if (copyContent === content) {
          throw "offset problem1: didnt changed the value (should have changed from " + this.matches[this.bracketStart.i][0] + " to " + replacer;
        }
        for (k = _i = _ref = this.bracketStart.i + 1, _ref1 = this.bracketEnd.i; _ref <= _ref1 ? _i < _ref1 : _i > _ref1; k = _ref <= _ref1 ? ++_i : --_i) {
          replacer = this.matches[k][1] + '</w:t>';
          startB = this.matches[k].offset + this.charactersAdded[k];
          this.charactersAdded[k + 1] = this.charactersAdded[k] + replacer.length - this.matches[k][0].length;
          if (content.indexOf(this.matches[k][0]) === -1) {
            throw "content " + this.matches[k][0] + " not found in content";
          }
          copyContent = content;
          content = content.replaceFirstFrom(this.matches[k][0], replacer, startB);
          this.matches[k][0] = replacer;
          if (copyContent === content) {
            throw "offset problem2: didnt changed the value (should have changed from " + this.matches[this.bracketStart.i][0] + " to " + replacer;
          }
        }
        regexLeft = /^[^}]*}(.*)$/;
        this.matches[this.bracketEnd.i][2] = this.matches[this.bracketEnd.i][2].replace(regexLeft, '$1');
        replacer = '<w:t xml:space="preserve">' + this.matches[this.bracketEnd.i][2] + "</w:t>";
        startB = this.matches[this.bracketEnd.i].offset + this.charactersAdded[this.bracketEnd.i];
        this.charactersAdded[this.bracketEnd.i + 1] = this.charactersAdded[this.bracketEnd.i] + replacer.length - this.matches[this.bracketEnd.i][0].length;
        if (content.indexOf(this.matches[this.bracketEnd.i][0]) === -1) {
          throw "content " + this.matches[this.bracketEnd.i][0] + " not found in content";
        }
        copyContent = content;
        content = content.replaceFirstFrom(this.matches[this.bracketEnd.i][0], replacer, startB);
        if (copyContent === content) {
          throw "offset problem3: didnt changed the value (should have changed from " + this.matches[this.bracketStart.i][0] + " to " + replacer;
        }
        this.matches[this.bracketEnd.i][0] = replacer;
      } else {
        throw "Bracket closed before opening";
      }
      _ref2 = this.matches;
      for (j = _j = 0, _len = _ref2.length; _j < _len; j = ++_j) {
        match = _ref2[j];
        if (j > this.bracketEnd.i) {
          this.charactersAdded[j + 1] = this.charactersAdded[j];
        }
      }
      return content;
    };

    /*
    	content is the whole content to be tagged
    	scope is the current scope
    	returns the new content of the tagged content
    */


    XmlTemplater.prototype.applyTemplateVars = function() {
      var character, closejEndLoop, closejStartLoop, dashLooping, elementDashLoop, i, innerText, j, m, match, openiEndLoop, openiStartLoop, openjEndLoop, openjStartLoop, regex, scopeContent, startiMatch, startjMatch, t, tagDashLoop, tagForLoop, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _ref, _ref1, _ref2;

      this.charactersAdded = this.charactersAdded;
      this.currentScope = this.currentScope;
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
                throw "no < at the beginning of " + glou[0] + " (2)";
              }
            }
          }
          if (character === '{') {
            if (this.inBracket === true) {
              throw "Bracket already open with text: " + this.textInsideBracket;
            }
            this.inBracket = true;
            this.textInsideBracket = "";
            startiMatch = i;
            startjMatch = j;
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
              tagForLoop = this.textInsideBracket.substr(1);
              this.inForLoop = true;
              openiStartLoop = startiMatch;
              openjStartLoop = startjMatch;
              openjEndLoop = j;
              openiEndLoop = i;
              this.loopOpen = {
                'start': this.bracketStart,
                'end': this.bracketEnd,
                'tag': this.textInsideBracket.substr(1)
              };
            }
            if (this.textInsideBracket[0] === '-' && this.inForLoop === false && this.inDashLoop === false) {
              this.inDashLoop = true;
              openiStartLoop = startiMatch;
              openjStartLoop = startjMatch;
              openjEndLoop = j;
              openiEndLoop = i;
              regex = /^-([a-zA-Z_:]+) ([a-zA-Z_:]+)$/;
              elementDashLoop = this.textInsideBracket.replace(regex, '$1');
              tagDashLoop = this.textInsideBracket.replace(regex, '$2');
              this.loopOpen = {
                'start': this.bracketStart,
                'end': this.bracketEnd,
                'tag': this.textInsideBracket.replace(regex, '$2'),
                'element': this.textInsideBracket.replace(regex, '$1')
              };
            }
            if (this.inBracket === false) {
              throw "Bracket already closed";
            }
            this.inBracket = false;
            if (this.inForLoop === false && this.inDashLoop === false) {
              this.content = this.replaceTag(this.getValueFromTag(this.textInsideBracket, this.currentScope));
            }
            if (this.textInsideBracket[0] === '/') {
              this.loopClose = {
                'start': this.bracketStart,
                'end': this.bracketEnd
              };
              closejStartLoop = startjMatch;
              closejEndLoop = j;
            }
            if (this.textInsideBracket[0] === '/' && ('/' + tagDashLoop === this.textInsideBracket) && this.inDashLoop === true) {
              return this.dashLoop(this.loopOpen.element);
            }
            if (this.textInsideBracket[0] === '/' && ('/' + tagForLoop === this.textInsideBracket) && this.inForLoop === true) {
              dashLooping = false;
              if (this.intelligentTagging === true) {
                scopeContent = this.calcScopeText(this.content, this.matches[openiStartLoop].offset + this.charactersAdded[openiStartLoop], this.matches[i].offset + this.charactersAdded[i] - (this.matches[openiStartLoop].offset + this.charactersAdded[openiStartLoop]));
                for (_m = 0, _len3 = scopeContent.length; _m < _len3; _m++) {
                  t = scopeContent[_m];
                  if (t.tag === '<w:tc>') {
                    dashLooping = true;
                    elementDashLoop = 'w:tr';
                  }
                }
              }
              if (dashLooping === false) {
                return this.forLoop(this.content, this.currentScope, this.loopOpen.tag, this.charactersAdded, this.loopClose.start.i, this.loopClose.end.i, this.matches, this.loopOpen.start.i, this.loopOpen.start.j, this.loopClose.end.j, this.loopOpen.end.i, this.loopOpen.end.j, this.loopClose.start.j);
              } else {
                return this.dashLoop(elementDashLoop);
              }
            }
          } else {
            if (this.inBracket === true) {
              this.textInsideBracket += character;
            }
          }
        }
      }
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
