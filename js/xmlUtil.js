var DocUtils, XmlUtil;

DocUtils = require('./docUtils');

XmlUtil = {};

XmlUtil.getListXmlElements = function(text, start, end) {
  var i, innerCurrentTag, innerLastTag, justOpened, lastTag, result, tag, tags, _i, _len;
  if (start == null) {
    start = 0;
  }
  if (end == null) {
    end = text.length - 1;
  }

  /*
  	get the different closing and opening tags between two texts (doesn't take into account tags that are opened then closed (those that are closed then opened are returned)):
  	returns:[{"tag":"</w:r>","offset":13},{"tag":"</w:p>","offset":265},{"tag":"</w:tc>","offset":271},{"tag":"<w:tc>","offset":828},{"tag":"<w:p>","offset":883},{"tag":"<w:r>","offset":1483}]
   */
  tags = DocUtils.preg_match_all("<(\/?[^/> ]+)([^>]*)>", text.substr(start, end));
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

XmlUtil.getListDifferenceXmlElements = function(text, start, end) {
  var scope;
  if (start == null) {
    start = 0;
  }
  if (end == null) {
    end = text.length - 1;
  }
  scope = this.getListXmlElements(text, start, end);
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

module.exports = XmlUtil;
