var SubContent;

module.exports = SubContent = (function() {
  function SubContent(fullText) {
    this.fullText = fullText != null ? fullText : "";
    this.text = "";
    this.start = 0;
    this.end = 0;
  }

  SubContent.prototype.getInnerTag = function(templaterState) {
    this.start = templaterState.calcPosition(templaterState.tagStart);
    this.end = templaterState.calcPosition(templaterState.tagEnd) + 1;
    return this.refreshText();
  };

  SubContent.prototype.refreshText = function() {
    this.text = this.fullText.substr(this.start, this.end - this.start);
    return this;
  };

  SubContent.prototype.getOuterXml = function(xmlTag) {
    this.end = this.fullText.indexOf('</' + xmlTag + '>', this.end);
    if (this.end === -1) {
      throw new Error("can't find endTag " + this.end);
    }
    this.end += ('</' + xmlTag + '>').length;
    this.start = Math.max(this.fullText.lastIndexOf('<' + xmlTag + '>', this.start), this.fullText.lastIndexOf('<' + xmlTag + ' ', this.start));
    if (this.start === -1) {
      throw new Error("can't find startTag");
    }
    return this.refreshText();
  };

  SubContent.prototype.replace = function(newText) {
    this.fullText = this.fullText.substr(0, this.start) + newText + this.fullText.substr(this.end);
    this.end = this.start + newText.length;
    return this.refreshText();
  };

  return SubContent;

})();
