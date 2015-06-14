
/*
Docxgen.coffee
Created by Edgar HIPP
 */
var DocxGen;

DocxGen = DocxGen = (function() {
  function DocxGen(content, options) {
    this.moduleManager = new DocxGen.ModuleManager();
    this.moduleManager.gen = this;
    this.templateClass = this.getTemplateClass();
    this.setOptions({});
    if (content != null) {
      this.load(content, options);
    }
  }

  DocxGen.prototype.attachModule = function(module) {
    this.moduleManager.attachModule(module);
    return this;
  };

  DocxGen.prototype.setOptions = function(options) {
    this.options = options != null ? options : {};
    this.intelligentTagging = this.options.intelligentTagging != null ? this.options.intelligentTagging : true;
    if (this.options.parser != null) {
      this.parser = this.options.parser;
    }
    if (this.options.delimiters != null) {
      DocxGen.DocUtils.tags = this.options.delimiters;
    }
    return this;
  };

  DocxGen.prototype.getTemplateClass = function() {
    return DocxGen.DocXTemplater;
  };

  DocxGen.prototype.getTemplatedFiles = function() {
    var slideTemplates;
    slideTemplates = this.zip.file(/word\/(header|footer)\d+\.xml/).map(function(file) {
      return file.name;
    });
    return slideTemplates.concat(["word/document.xml"]);
  };

  DocxGen.prototype.load = function(content, options) {
    this.moduleManager.sendEvent('loading');
    if (content.file != null) {
      this.zip = content;
    } else {
      this.zip = new DocxGen.JSZip(content, options);
    }
    this.moduleManager.sendEvent('loaded');
    this.templatedFiles = this.getTemplatedFiles();
    return this;
  };

  DocxGen.prototype.renderFile = function(fileName) {
    var currentFile;
    this.moduleManager.sendEvent('rendering-file', fileName);
    currentFile = this.createTemplateClass(fileName);
    this.zip.file(fileName, currentFile.render().content);
    return this.moduleManager.sendEvent('rendered-file', fileName);
  };

  DocxGen.prototype.render = function() {
    var fileName, _i, _len, _ref;
    this.moduleManager.sendEvent('rendering');
    _ref = this.templatedFiles;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      fileName = _ref[_i];
      if (this.zip.files[fileName] != null) {
        this.renderFile(fileName);
      }
    }
    this.moduleManager.sendEvent('rendered');
    return this;
  };

  DocxGen.prototype.getTags = function() {
    var currentFile, fileName, usedTags, usedTemplateV, _i, _len, _ref;
    usedTags = [];
    _ref = this.templatedFiles;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      fileName = _ref[_i];
      if (!(this.zip.files[fileName] != null)) {
        continue;
      }
      currentFile = this.createTemplateClass(fileName);
      usedTemplateV = currentFile.render().usedTags;
      if (DocxGen.DocUtils.sizeOfObject(usedTemplateV)) {
        usedTags.push({
          fileName: fileName,
          vars: usedTemplateV
        });
      }
    }
    return usedTags;
  };

  DocxGen.prototype.setData = function(Tags) {
    this.Tags = Tags;
    return this;
  };

  DocxGen.prototype.getZip = function() {
    return this.zip;
  };

  DocxGen.prototype.createTemplateClass = function(path) {
    var usedData;
    usedData = this.zip.files[path].asText();
    return new this.templateClass(usedData, {
      Tags: this.Tags,
      intelligentTagging: this.intelligentTagging,
      parser: this.parser,
      moduleManager: this.moduleManager
    });
  };

  DocxGen.prototype.getFullText = function(path) {
    if (path == null) {
      path = "word/document.xml";
    }
    return this.createTemplateClass(path).getFullText();
  };

  return DocxGen;

})();

DocxGen.DocUtils = require('./docUtils');

DocxGen.DocXTemplater = require('./docxTemplater');

DocxGen.JSZip = require('jszip');

DocxGen.ModuleManager = require('./moduleManager');

DocxGen.XmlTemplater = require('./xmlTemplater');

DocxGen.XmlMatcher = require('./xmlMatcher');

DocxGen.XmlUtil = require('./xmlUtil');

DocxGen.SubContent = require('./subContent');

module.exports = DocxGen;
