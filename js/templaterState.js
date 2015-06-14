var DocUtils, TemplaterState;

DocUtils = require('./docUtils');

module.exports = TemplaterState = (function() {
  function TemplaterState(moduleManager) {
    this.moduleManager = moduleManager;
    this.moduleManager.templaterState = this;
  }

  TemplaterState.prototype.moveCharacters = function(numXmlTag, newTextLength, oldTextLength) {
    var k, _i, _ref, _results;
    _results = [];
    for (k = _i = numXmlTag, _ref = this.matches.length; numXmlTag <= _ref ? _i <= _ref : _i >= _ref; k = numXmlTag <= _ref ? ++_i : --_i) {
      _results.push(this.charactersAdded[k] += newTextLength - oldTextLength);
    }
    return _results;
  };

  TemplaterState.prototype.calcStartTag = function(tag) {
    return this.calcPosition(tag.start);
  };

  TemplaterState.prototype.calcXmlTagPosition = function(xmlTagNumber) {
    return this.matches[xmlTagNumber].offset + this.charactersAdded[xmlTagNumber];
  };

  TemplaterState.prototype.calcEndTag = function(tag) {
    return this.calcPosition(tag.end) + 1;
  };

  TemplaterState.prototype.calcPosition = function(bracket) {
    return this.matches[bracket.numXmlTag].offset + this.matches[bracket.numXmlTag][1].length + this.charactersAdded[bracket.numXmlTag] + bracket.numCharacter;
  };

  TemplaterState.prototype.findOuterTagsContent = function(content) {
    var end, start;
    start = this.calcStartTag(this.loopOpen);
    end = this.calcEndTag(this.loopClose);
    return {
      content: content.substr(start, end - start),
      start: start,
      end: end
    };
  };

  TemplaterState.prototype.innerContent = function(type) {
    return this.matches[this[type].numXmlTag][2];
  };

  TemplaterState.prototype.findInnerTagsContent = function(content) {
    var end, start;
    start = this.calcEndTag(this.loopOpen);
    end = this.calcStartTag(this.loopClose);
    return {
      content: content.substr(start, end - start),
      start: start,
      end: end
    };
  };

  TemplaterState.prototype.initialize = function() {
    this.context = "";
    this.inForLoop = false;
    this.loopIsInverted = false;
    this.inTag = false;
    this.inDashLoop = false;
    this.rawXmlTag = false;
    return this.textInsideTag = "";
  };

  TemplaterState.prototype.startTag = function() {
    if (this.inTag === true) {
      throw new Error("Unclosed tag : '" + this.textInsideTag + "'");
    }
    this.inTag = true;
    this.rawXmlTag = false;
    this.textInsideTag = "";
    return this.tagStart = this.currentStep;
  };

  TemplaterState.prototype.loopType = function() {
    var getFromModule;
    if (this.inDashLoop) {
      return 'dash';
    }
    if (this.inForLoop) {
      return 'for';
    }
    if (this.rawXmlTag) {
      return 'xml';
    }
    getFromModule = this.moduleManager.get('loopType');
    if (getFromModule !== null) {
      return getFromModule;
    }
    return 'simple';
  };

  TemplaterState.prototype.isLoopClosingTag = function() {
    return this.textInsideTag[0] === '/' && ('/' + this.loopOpen.tag === this.textInsideTag);
  };

  TemplaterState.prototype.getLeftValue = function() {
    return this.innerContent('tagStart').substr(0, this.tagStart.numCharacter + this.offset[this.tagStart.numXmlTag]);
  };

  TemplaterState.prototype.getRightValue = function() {
    return this.innerContent('tagEnd').substr(this.tagEnd.numCharacter + 1 + this.offset[this.tagEnd.numXmlTag]);
  };

  TemplaterState.prototype.endTag = function() {
    var dashInnerRegex;
    if (this.inTag === false) {
      throw new Error("Unopened tag near : '" + (this.context.substr(this.context.length - 10, 10)) + "'");
    }
    this.inTag = false;
    this.tagEnd = this.currentStep;
    this.textInsideTag = this.textInsideTag.substr(0, this.textInsideTag.length + 1 - DocUtils.tags.end.length);
    if (this.loopType() === 'simple') {
      if (this.textInsideTag[0] === '@') {
        this.rawXmlTag = true;
        this.tag = this.textInsideTag.substr(1);
      }
      if (this.textInsideTag[0] === '#' || this.textInsideTag[0] === '^') {
        this.inForLoop = true;
        this.loopOpen = {
          'start': this.tagStart,
          'end': this.tagEnd,
          'tag': this.textInsideTag.substr(1),
          'raw': this.textInsideTag
        };
      }
      if (this.textInsideTag[0] === '^') {
        this.loopIsInverted = true;
      }
      if (this.textInsideTag[0] === '-' && this.loopType() === 'simple') {
        this.inDashLoop = true;
        dashInnerRegex = /^-([^\s]+)\s(.+)$/;
        this.loopOpen = {
          'start': this.tagStart,
          'end': this.tagEnd,
          'tag': this.textInsideTag.replace(dashInnerRegex, '$2'),
          'element': this.textInsideTag.replace(dashInnerRegex, '$1'),
          'raw': this.textInsideTag
        };
      }
    }
    if (this.textInsideTag[0] === '/') {
      return this.loopClose = {
        'start': this.tagStart,
        'end': this.tagEnd,
        'raw': this.textInsideTag
      };
    }
  };

  return TemplaterState;

})();
