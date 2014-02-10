(function() {
  var env, root,
    __slice = [].slice;

  root = typeof global !== "undefined" && global !== null ? global : window;

  env = typeof global !== "undefined" && global !== null ? 'node' : 'browser';

  root.DocUtils = {};

  root.docX = [];

  root.docXData = [];

  DocUtils.nl2br = function(str, is_xhtml) {
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
  };

  DocUtils.config = {
    "baseNodePath": '../../examples/',
    "baseClientPath": '../examples/'
  };

  DocUtils.loadDoc = function(path, noDocx, intelligentTagging, async, callback, basePath) {
    var data, e, errorCallback, fileName, httpRegex, loadFile, options, req, reqCallback, totalPath, urloptions, xhrDoc;
    if (noDocx == null) {
      noDocx = false;
    }
    if (intelligentTagging == null) {
      intelligentTagging = false;
    }
    if (async == null) {
      async = false;
    }
    if (callback == null) {
      callback = null;
    }
    if (basePath == null) {
      basePath = null;
    }
    console.log('loading Doc:' + path);
    if (path == null) {
      throw 'path not defined';
    }
    if (path.indexOf('/') !== -1) {
      totalPath = path;
      fileName = totalPath;
    } else {
      fileName = path;
      if (basePath === null) {
        if (env === 'browser') {
          basePath = DocUtils.config.baseClientPath;
        } else {
          basePath = DocUtils.config.baseNodePath;
        }
      }
      totalPath = basePath + path;
    }
    loadFile = function(data) {
      root.docXData[fileName] = data;
      if (noDocx === false) {
        root.docX[fileName] = new DocxGen(data, {}, intelligentTagging);
      }
      if (callback != null) {
        callback(false);
      }
      if (async === false) {
        return root.docXData[fileName];
      }
    };
    if (env === 'browser') {
      xhrDoc = new XMLHttpRequest();
      xhrDoc.open('GET', totalPath, async);
      if (xhrDoc.overrideMimeType) {
        xhrDoc.overrideMimeType('text/plain; charset=x-user-defined');
      }
      xhrDoc.onreadystatechange = function(e) {
        if (this.readyState === 4) {
          if (this.status === 200) {
            return loadFile(this.response);
          } else {
            console.log('error loading doc');
            if (callback != null) {
              return callback(true);
            }
          }
        }
      };
      xhrDoc.send();
    } else {
      httpRegex = new RegExp("(https?)", "i");
      if (httpRegex.test(path)) {
        console.log('http(s) url matched:' + path);
        urloptions = url.parse(path);
        options = {
          hostname: urloptions.hostname,
          path: urloptions.path,
          method: 'GET',
          rejectUnauthorized: false
        };
        errorCallback = function(e) {
          console.log("Error: \n" + e.message);
          return console.log(e.stack);
        };
        reqCallback = function(res) {
          var data;
          res.setEncoding('binary');
          data = "";
          res.on('data', function(chunk) {
            console.log("Status Code " + res.statusCode);
            console.log('received');
            return data += chunk;
          });
          res.on('end', function() {
            console.log('receivedTotally');
            return loadFile(data);
          });
          return res.on('error', function(err) {
            console.log("Error during HTTP request");
            console.log(err.message);
            return console.log(err.stack);
          });
        };
        switch (urloptions.protocol) {
          case "https:":
            req = https.request(options, reqCallback).on('error', errorCallback);
            break;
          case 'http:':
            req = http.request(options, reqCallback).on('error', errorCallback);
        }
        req.end();
      } else {
        if (async === true) {
          fs.readFile(totalPath, "binary", function(err, data) {
            if (err) {
              if (callback != null) {
                return callback(true);
              }
            } else {
              loadFile(data);
              if (callback != null) {
                return callback(false);
              }
            }
          });
        } else {
          console.log('loading async:' + totalPath);
          try {
            data = fs.readFileSync(totalPath, "binary");
            loadFile(data);
            if (callback != null) {
              callback(false);
            }
          } catch (_error) {
            e = _error;
            if (callback != null) {
              callback(true);
            }
          }
        }
      }
    }
    return fileName;
  };

  DocUtils.clone = function(obj) {
    var flags, key, newInstance;
    if ((obj == null) || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    if (obj instanceof RegExp) {
      flags = '';
      if (obj.global != null) {
        flags += 'g';
      }
      if (obj.ignoreCase != null) {
        flags += 'i';
      }
      if (obj.multiline != null) {
        flags += 'm';
      }
      if (obj.sticky != null) {
        flags += 'y';
      }
      return new RegExp(obj.source, flags);
    }
    newInstance = new obj.constructor();
    for (key in obj) {
      newInstance[key] = DocUtils.clone(obj[key]);
    }
    return newInstance;
  };

  DocUtils.xml2Str = function(xmlNode) {
    var a, content, e;
    if (xmlNode === void 0) {
      throw "xmlNode undefined!";
    }
    try {
      if (typeof global !== "undefined" && global !== null) {
        a = new XMLSerializer();
        content = a.serializeToString(xmlNode);
      } else {
        content = (new XMLSerializer()).serializeToString(xmlNode);
      }
    } catch (_error) {
      e = _error;
      try {
        content = xmlNode.xml;
      } catch (_error) {
        e = _error;
        console.log('Xmlserializer not supported');
      }
    }
    return content = content.replace(/\x20xmlns=""/g, '');
  };

  DocUtils.Str2xml = function(str) {
    var parser, xmlDoc;
    if (root.DOMParser) {
      parser = new DOMParser();
      xmlDoc = parser.parseFromString(str, "text/xml");
    } else {
      xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
      xmlDoc.async = false;
      xmlDoc.loadXML(str);
    }
    return xmlDoc;
  };

  DocUtils.replaceFirstFrom = function(string, search, replace, from) {
    return string.substr(0, from) + string.substr(from).replace(search, replace);
  };

  DocUtils.encode_utf8 = function(s) {
    return unescape(encodeURIComponent(s));
  };

  DocUtils.decode_utf8 = function(s) {
    return decodeURIComponent(escape(s)).replace(new RegExp(String.fromCharCode(160), "g"), " ");
  };

  DocUtils.base64encode = function(b) {
    return btoa(unescape(encodeURIComponent(b)));
  };

  DocUtils.preg_match_all = function(regex, content) {

    /*regex is a string, content is the content. It returns an array of all matches with their offset, for example:
    	regex=la
    	content=lolalolilala
    	returns: [{0:'la',offset:2},{0:'la',offset:8},{0:'la',offset:10}]
     */
    var matchArray, replacer;
    if (!(typeof regex === 'object')) {
      regex = new RegExp(regex, 'g');
    }
    matchArray = [];
    replacer = function() {
      var match, offset, pn, string, _i;
      match = arguments[0], pn = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), offset = arguments[_i++], string = arguments[_i++];
      pn.unshift(match);
      pn.offset = offset;
      return matchArray.push(pn);
    };
    content.replace(regex, replacer);
    return matchArray;
  };

  Array.prototype.max = function() {
    return Math.max.apply(null, this);
  };

  Array.prototype.min = function() {
    return Math.min.apply(null, this);
  };

}).call(this);
