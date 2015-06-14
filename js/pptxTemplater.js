var PptXTemplater, XmlTemplater, xmlUtil,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

XmlTemplater = require('./xmlTemplater');

xmlUtil = require('./xmlUtil');

PptXTemplater = PptXTemplater = (function(_super) {
  __extends(PptXTemplater, _super);

  function PptXTemplater(content, options) {
    if (content == null) {
      content = "";
    }
    if (options == null) {
      options = {};
    }
    PptXTemplater.__super__.constructor.call(this, content, options);
    this.currentClass = PptXTemplater;
    this.tagXml = 'a:t';
    if (typeof content === "string") {
      this.load(content);
    } else {
      throw new Error("content must be string!");
    }
  }

  PptXTemplater.prototype.xmlToBeReplaced = function(noStartTag, spacePreserve, insideValue, xmlTagNumber, noEndTag) {
    var str;
    if (noStartTag === true) {
      return insideValue;
    } else {
      str = this.templaterState.matches[xmlTagNumber][1] + insideValue;
      if (noEndTag === true) {
        return str;
      } else {
        return str + ("</" + this.tagXml + ">");
      }
    }
  };

  PptXTemplater.prototype.calcIntellegentlyDashElement = function() {
    var content, end, scopeContent, start, t, _i, _len, _ref;
    _ref = this.templaterState.findOuterTagsContent(this.content), content = _ref.content, start = _ref.start, end = _ref.end;
    scopeContent = xmlUtil.getListXmlElements(this.content, start, end - start);
    for (_i = 0, _len = scopeContent.length; _i < _len; _i++) {
      t = scopeContent[_i];
      if (t.tag === '<a:tc>') {
        return 'a:tr';
      }
    }
    return PptXTemplater.__super__.calcIntellegentlyDashElement.call(this);
  };

  return PptXTemplater;

})(XmlTemplater);

module.exports = PptXTemplater;
