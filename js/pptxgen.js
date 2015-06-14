
/*
PptxGen.coffee
Created by @contextmatters, based on DocxGen by Edgar HIPP
 */
var DocUtils, DocxGen, JSZip, PptXTemplater, PptxGen,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

DocUtils = require('./docUtils');

DocxGen = require('./docxgen');

PptXTemplater = require('./pptxTemplater');

JSZip = require('jszip');

PptxGen = PptxGen = (function(_super) {
  __extends(PptxGen, _super);

  function PptxGen() {
    return PptxGen.__super__.constructor.apply(this, arguments);
  }

  PptxGen.prototype.getTemplateClass = function() {
    return PptXTemplater;
  };

  PptxGen.prototype.getTemplatedFiles = function() {
    var slideTemplates;
    slideTemplates = this.zip.file(/ppt\/(slides|slideMasters)\/(slide|slideMaster)\d+\.xml/).map(function(file) {
      return file.name;
    });
    return slideTemplates.concat(["ppt/presentation.xml"]);
  };

  PptxGen.prototype.getFullText = function(path) {
    if (path == null) {
      path = "ppt/slides/slide1.xml";
    }
    return PptxGen.__super__.getFullText.call(this, path);
  };

  return PptxGen;

})(DocxGen);

module.exports = PptxGen;
