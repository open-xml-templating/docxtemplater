var DocXTemplater, XmlTemplater, xmlUtil,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

XmlTemplater = require('./xmlTemplater');

xmlUtil = require('./xmlUtil');

DocXTemplater = DocXTemplater = (function(_super) {
  __extends(DocXTemplater, _super);

  function DocXTemplater(content, options) {
    if (content == null) {
      content = "";
    }
    if (options == null) {
      options = {};
    }
    DocXTemplater.__super__.constructor.call(this, "", options);
    this.currentClass = DocXTemplater;
    this.tagXml = 'w:t';
    if (typeof content === "string") {
      this.load(content);
    } else {
      throw new Error("content must be string!");
    }
  }

  DocXTemplater.prototype.calcIntellegentlyDashElement = function() {
    var content, end, scopeContent, start, t, _i, _len, _ref;
    _ref = this.templaterState.findOuterTagsContent(this.content), content = _ref.content, start = _ref.start, end = _ref.end;
    scopeContent = xmlUtil.getListXmlElements(this.content, start, end - start);
    for (_i = 0, _len = scopeContent.length; _i < _len; _i++) {
      t = scopeContent[_i];
      if (t.tag === '<w:tc>') {
        return 'w:tr';
      }
    }
    return DocXTemplater.__super__.calcIntellegentlyDashElement.call(this);
  };

  return DocXTemplater;

})(XmlTemplater);

module.exports = DocXTemplater;
