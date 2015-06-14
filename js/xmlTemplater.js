var DocUtils, ModuleManager, ScopeManager, SubContent, TemplaterState, XmlMatcher, XmlTemplater;

DocUtils = require('./docUtils');

ScopeManager = require('./scopeManager');

SubContent = require('./subContent');

TemplaterState = require('./templaterState');

XmlMatcher = require('./xmlMatcher');

ModuleManager = require('./moduleManager');

module.exports = XmlTemplater = (function() {
  function XmlTemplater(content, options) {
    if (content == null) {
      content = "";
    }
    if (options == null) {
      options = {};
    }
    this.tagXml = '';
    this.currentClass = XmlTemplater;
    this.fromJson(options);
    this.templaterState = new TemplaterState(this.moduleManager);
    this.moduleManager.xmlTemplater = this;
  }

  XmlTemplater.prototype.load = function(content) {
    var xmlMatcher;
    this.content = content;
    xmlMatcher = new XmlMatcher(this.content).parse(this.tagXml);
    this.templaterState.matches = xmlMatcher.matches;
    return this.templaterState.charactersAdded = xmlMatcher.charactersAdded;
  };

  XmlTemplater.prototype.fromJson = function(options) {
    if (options == null) {
      options = {};
    }
    this.Tags = options.Tags != null ? options.Tags : {};
    this.intelligentTagging = options.intelligentTagging != null ? options.intelligentTagging : false;
    this.scopePath = options.scopePath != null ? options.scopePath : [];
    this.scopeList = options.scopeList != null ? options.scopeList : [this.Tags];
    this.usedTags = options.usedTags != null ? options.usedTags : {
      def: {},
      undef: {}
    };
    this.parser = options.parser != null ? options.parser : DocUtils.defaultParser;
    this.moduleManager = options.moduleManager != null ? options.moduleManager : new ModuleManager();
    return this.scopeManager = new ScopeManager(this.Tags, this.scopePath, this.usedTags, this.scopeList, this.parser, this.moduleManager);
  };

  XmlTemplater.prototype.toJson = function() {
    return {
      Tags: DocUtils.clone(this.scopeManager.tags),
      intelligentTagging: DocUtils.clone(this.intelligentTagging),
      scopePath: DocUtils.clone(this.scopeManager.scopePath),
      scopeList: DocUtils.clone(this.scopeManager.scopeList),
      usedTags: this.scopeManager.usedTags,
      parser: this.parser,
      moduleManager: this.moduleManager
    };
  };

  XmlTemplater.prototype.calcIntellegentlyDashElement = function() {
    return false;
  };

  XmlTemplater.prototype.getFullText = function(tagXml) {
    var match, matcher, output;
    this.tagXml = tagXml != null ? tagXml : this.tagXml;
    matcher = new XmlMatcher(this.content).parse(this.tagXml);
    output = (function() {
      var _i, _len, _ref, _results;
      _ref = matcher.matches;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        match = _ref[_i];
        _results.push(match[2]);
      }
      return _results;
    })();
    return DocUtils.wordToUtf8(DocUtils.convert_spaces(output.join("")));
  };

  XmlTemplater.prototype.handleModuleManager = function(type, data) {
    this.moduleManager.xmlTemplater = this;
    this.moduleManager.templaterState = this.templaterState;
    this.moduleManager.scopeManager = this.scopeManager;
    return this.moduleManager.handle(type, data);
  };


  /*
  	content is the whole content to be tagged
  	scope is the current scope
  	returns the new content of the tagged content
   */

  XmlTemplater.prototype.render = function() {
    var character, innerText, length, loopType, m, match, numCharacter, numXmlTag, t, trail, trailSteps, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
    this.templaterState.initialize();
    trail = "";
    trailSteps = [];
    this.templaterState.offset = [];
    this.handleModuleManager('xmlRendering');
    _ref = this.templaterState.matches;
    for (numXmlTag = _i = 0, _len = _ref.length; _i < _len; numXmlTag = ++_i) {
      match = _ref[numXmlTag];
      innerText = match[2];
      this.templaterState.offset[numXmlTag] = 0;
      for (numCharacter = _j = 0, _len1 = innerText.length; _j < _len1; numCharacter = ++_j) {
        character = innerText[numCharacter];
        trail += character;
        length = !this.templaterState.inTag ? DocUtils.tags.start.length : DocUtils.tags.end.length;
        trail = trail.substr(-length, length);
        this.templaterState.currentStep = {
          'numXmlTag': numXmlTag,
          'numCharacter': numCharacter
        };
        trailSteps.push({
          'numXmlTag': numXmlTag,
          'numCharacter': numCharacter
        });
        trailSteps = trailSteps.splice(-DocUtils.tags.start.length, DocUtils.tags.start.length);
        if (numCharacter + this.templaterState.offset[numXmlTag] < 0) {
          throw new Error("Shouldn't be less than 0");
        }
        this.templaterState.context += character;
        _ref1 = this.templaterState.matches;
        for (t = _k = 0, _len2 = _ref1.length; _k < _len2; t = ++_k) {
          m = _ref1[t];
          if (t === numXmlTag) {
            if (this.content[m.offset + this.templaterState.charactersAdded[t]] !== m[0][0]) {
              console.error(this.content[m.offset + this.templaterState.charactersAdded[t]]);
              console.error(this.content);
              console.error(m[0]);
              throw new Error("no < at the beginning of " + m[0][0] + " (2)");
            }
          }
        }
        this.sameTags = DocUtils.tags.start === DocUtils.tags.end;
        if ((this.sameTags === true && this.templaterState.inTag === false && trail === DocUtils.tags.start) || (this.sameTags === false && trail === DocUtils.tags.start)) {
          this.templaterState.currentStep = trailSteps[0];
          this.templaterState.startTag();
        } else if ((this.sameTags === true && this.templaterState.inTag === true && trail === DocUtils.tags.end) || (this.sameTags === false && trail === DocUtils.tags.end)) {
          this.templaterState.endTag();
          loopType = this.templaterState.loopType();
          if (loopType === 'simple') {
            this.replaceSimpleTag();
          }
          if (loopType === 'xml') {
            this.replaceSimpleTagRawXml();
          }
          if (loopType === 'dash' || loopType === 'for') {
            if (this.templaterState.isLoopClosingTag()) {
              return this.replaceLoopTag();
            }
          }
          if (['simple', 'dash', 'for', 'xml'].indexOf(loopType) === -1) {
            this.handleModuleManager('replaceTag', loopType);
          }
        } else {
          if (this.templaterState.inTag === true) {
            this.templaterState.textInsideTag += character;
          }
        }
      }
    }
    this.handleModuleManager('xmlRendered');
    return this;
  };

  XmlTemplater.prototype.replaceSimpleTag = function() {
    var newValue;
    newValue = this.scopeManager.getValueFromScope(this.templaterState.textInsideTag);
    return this.content = this.replaceTagByValue(DocUtils.utf8ToWord(newValue), this.content);
  };

  XmlTemplater.prototype.replaceSimpleTagRawXml = function() {
    var newText, subContent;
    newText = this.scopeManager.getValueFromScope(this.templaterState.tag);
    subContent = new SubContent(this.content).getInnerTag(this.templaterState).getOuterXml('w:p');
    return this.replaceXml(subContent, newText);
  };

  XmlTemplater.prototype.replaceXml = function(subContent, newText) {
    this.templaterState.moveCharacters(this.templaterState.tagStart.numXmlTag, newText.length, subContent.text.length);
    return this.content = subContent.replace(newText).fullText;
  };

  XmlTemplater.prototype.deleteTag = function(xml, tag) {
    var xmlText;
    this.templaterState.tagStart = tag.start;
    this.templaterState.tagEnd = tag.end;
    this.templaterState.textInsideTag = tag.raw;
    return xmlText = this.replaceTagByValue("", xml);
  };

  XmlTemplater.prototype.deleteOuterTags = function(outerXmlText) {
    return this.deleteTag(this.deleteTag(outerXmlText, this.templaterState.loopOpen), this.templaterState.loopClose);
  };

  XmlTemplater.prototype.dashLoop = function(elementDashLoop, sharp) {
    var end, innerXmlText, outerXml, outerXmlText, start, _, _ref;
    if (sharp == null) {
      sharp = false;
    }
    _ref = this.templaterState.findOuterTagsContent(this.content), _ = _ref._, start = _ref.start, end = _ref.end;
    outerXml = DocUtils.getOuterXml(this.content, start, end, elementDashLoop);
    this.templaterState.moveCharacters(0, 0, outerXml.startTag);
    outerXmlText = outerXml.text;
    innerXmlText = this.deleteOuterTags(outerXmlText, sharp);
    return this.forLoop(innerXmlText, outerXmlText);
  };

  XmlTemplater.prototype.xmlToBeReplaced = function(noStartTag, spacePreserve, insideValue, xmlTagNumber, noEndTag) {
    var str;
    if (noStartTag) {
      return insideValue;
    }
    if (spacePreserve) {
      str = "<" + this.tagXml + " xml:space=\"preserve\">" + insideValue;
    } else {
      str = this.templaterState.matches[xmlTagNumber][1] + insideValue;
    }
    if (noEndTag) {
      return str;
    } else {
      return str + ("</" + this.tagXml + ">");
    }
  };

  XmlTemplater.prototype.replaceXmlTag = function(content, options) {
    var insideValue, noEndTag, noStartTag, replacer, spacePreserve, startTag, xmlTagNumber;
    xmlTagNumber = options.xmlTagNumber;
    insideValue = options.insideValue;
    this.templaterState.offset[xmlTagNumber] += options.insideValue.length - this.templaterState.matches[xmlTagNumber][2].length;
    spacePreserve = options.spacePreserve != null ? options.spacePreserve : true;
    noStartTag = options.noStartTag != null ? options.noStartTag : false;
    noEndTag = options.noEndTag != null ? options.noEndTag : false;
    replacer = this.xmlToBeReplaced(noStartTag, spacePreserve, insideValue, xmlTagNumber, noEndTag);
    this.templaterState.matches[xmlTagNumber][2] = insideValue;
    startTag = this.templaterState.calcXmlTagPosition(xmlTagNumber);
    this.templaterState.moveCharacters(xmlTagNumber + 1, replacer.length, this.templaterState.matches[xmlTagNumber][0].length);
    if (content.indexOf(this.templaterState.matches[xmlTagNumber][0]) === -1) {
      throw new Error("content " + this.templaterState.matches[xmlTagNumber][0] + " not found in content");
    }
    content = DocUtils.replaceFirstFrom(content, this.templaterState.matches[xmlTagNumber][0], replacer, startTag);
    this.templaterState.matches[xmlTagNumber][0] = replacer;
    return content;
  };

  XmlTemplater.prototype.replaceTagByValue = function(newValue, content) {
    var k, options, _i, _ref, _ref1;
    options = {
      xmlTagNumber: this.templaterState.tagStart.numXmlTag,
      noStartTag: this.templaterState.matches[this.templaterState.tagStart.numXmlTag].first != null,
      noEndTag: this.templaterState.matches[this.templaterState.tagStart.numXmlTag].last != null
    };
    if (this.templaterState.tagEnd.numXmlTag === this.templaterState.tagStart.numXmlTag) {
      options.insideValue = this.templaterState.getLeftValue() + newValue + this.templaterState.getRightValue();
      return this.replaceXmlTag(content, options);
    } else if (this.templaterState.tagEnd.numXmlTag > this.templaterState.tagStart.numXmlTag) {
      options.insideValue = newValue;
      if ((this.templaterState.matches[this.templaterState.tagStart.numXmlTag].first == null) && (this.templaterState.matches[this.templaterState.tagStart.numXmlTag].last == null)) {
        options.insideValue = this.templaterState.getLeftValue() + newValue;
      }
      content = this.replaceXmlTag(content, options);
      options = {
        insideValue: "",
        spacePreserve: false
      };
      for (k = _i = _ref = this.templaterState.tagStart.numXmlTag + 1, _ref1 = this.templaterState.tagEnd.numXmlTag; _ref <= _ref1 ? _i < _ref1 : _i > _ref1; k = _ref <= _ref1 ? ++_i : --_i) {
        options.xmlTagNumber = k;
        content = this.replaceXmlTag(content, options);
      }
      options = {
        insideValue: this.templaterState.getRightValue(),
        spacePreserve: true,
        xmlTagNumber: this.templaterState.tagEnd.numXmlTag,
        noEndTag: this.templaterState.matches[this.templaterState.tagEnd.numXmlTag].last != null
      };
      return this.replaceXmlTag(content, options);
    }
  };

  XmlTemplater.prototype.replaceLoopTag = function() {
    var dashElement;
    if (this.templaterState.loopType() === 'dash') {
      return this.dashLoop(this.templaterState.loopOpen.element);
    }
    if (this.intelligentTagging === true) {
      dashElement = this.calcIntellegentlyDashElement();
      if (dashElement !== false) {
        return this.dashLoop(dashElement, true);
      }
    }
    return this.forLoop();
  };

  XmlTemplater.prototype.calcSubXmlTemplater = function(innerTagsContent, argOptions) {
    var options;
    options = this.toJson();
    if (argOptions != null) {
      if (argOptions.Tags != null) {
        options.Tags = argOptions.Tags;
        options.scopeList = options.scopeList.concat(argOptions.Tags);
        options.scopePath = options.scopePath.concat(this.templaterState.loopOpen.tag);
      }
    }
    return (new this.currentClass(innerTagsContent, options)).render();
  };

  XmlTemplater.prototype.forLoop = function(innerTagsContent, outerTagsContent) {
    var newContent, tag;
    if (innerTagsContent == null) {
      innerTagsContent = this.templaterState.findInnerTagsContent(this.content).content;
    }
    if (outerTagsContent == null) {
      outerTagsContent = this.templaterState.findOuterTagsContent(this.content).content;
    }

    /*
    			<w:t>{#forTag} blabla</w:t>
    			Blabla1
    			Blabla2
    			<w:t>{/forTag}</w:t>
    
    			Let innerTagsContent be what is in between the first closing tag and the second opening tag | blabla....Blabla2<w:t>|
    			Let outerTagsContent what is in between the first opening tag  and the last closing tag     |{#forTag} blabla....Blabla2<w:t>{/forTag}|
    			We replace outerTagsContent by n*innerTagsContent, n is equal to the length of the array in scope forTag
    			<w:t>subContent subContent subContent</w:t>
     */
    tag = this.templaterState.loopOpen.tag;
    newContent = "";
    this.scopeManager.loopOver(tag, (function(_this) {
      return function(subTags) {
        var subfile;
        subfile = _this.calcSubXmlTemplater(innerTagsContent, {
          Tags: subTags
        });
        return newContent += subfile.content;
      };
    })(this), this.templaterState.loopIsInverted);
    if (this.scopeManager.getValue(tag) == null) {
      this.calcSubXmlTemplater(innerTagsContent, {
        Tags: {}
      });
    }
    this.content = this.content.replace(outerTagsContent, newContent);
    return this.calcSubXmlTemplater(this.content);
  };

  return XmlTemplater;

})();
