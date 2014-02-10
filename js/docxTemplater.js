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

  root.DocXTemplater = DocXTemplater;

}).call(this);
