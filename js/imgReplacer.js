(function() {
  var ImgReplacer, env, root;

  root = typeof global !== "undefined" && global !== null ? global : window;

  env = typeof global !== "undefined" && global !== null ? 'node' : 'browser';

  ImgReplacer = ImgReplacer = (function() {
    function ImgReplacer(xmlTemplater) {
      this.xmlTemplater = xmlTemplater;
      this.imgMatches = [];
    }

    ImgReplacer.prototype.findImages = function() {
      return this.imgMatches = DocUtils.preg_match_all(/<w:drawing[^>]*>.*?<\/w:drawing>/g, this.xmlTemplater.content);
    };

    ImgReplacer.prototype.replaceImages = function() {
      var callback, imageTag, imgData, imgName, match, newId, oldFile, qr, rId, replacement, tag, tagrId, u, xmlImg, _i, _len, _ref, _results;
      console.log('replacing Images ...');
      qr = [];
      callback = function(docxqrCode) {
        console.log('removing qrcode');
        console.log('setting image:' + ("word/media/" + docxqrCode.imgName));
        docxqrCode.xmlTemplater.numQrCode--;
        docxqrCode.xmlTemplater.DocxGen.setImage("word/media/" + docxqrCode.imgName, docxqrCode.data);
        return docxqrCode.xmlTemplater.DocxGen.qrCodeCallBack(docxqrCode.num, false);
      };
      _ref = this.imgMatches;
      _results = [];
      for (u = _i = 0, _len = _ref.length; _i < _len; u = ++_i) {
        match = _ref[u];
        xmlImg = DocUtils.Str2xml('<?xml version="1.0" ?><w:document mc:Ignorable="w14 wp14" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">' + match[0] + '</w:document>');
        if (this.xmlTemplater.DocxGen.qrCode) {
          tagrId = xmlImg.getElementsByTagNameNS('*', 'blip')[0];
          if (tagrId === void 0) {
            console.log('tagRid not defined, trying alternate method');
            tagrId = xmlImg.getElementsByTagName("a:blip")[0];
          }
          if (tagrId !== void 0) {
            rId = tagrId.getAttribute('r:embed');
            oldFile = this.xmlTemplater.DocxGen.getImageByRid(rId);
            if (oldFile !== null) {
              tag = xmlImg.getElementsByTagNameNS('*', 'docPr')[0];
              if (tag === void 0) {
                console.log('tag not defined, trying alternate method');
                tag = xmlImg.getElementsByTagName('wp:docPr')[0];
              }
              if (tag !== void 0) {
                if (tag.getAttribute("name").substr(0, 6) !== "Copie_") {
                  imgName = ("Copie_" + this.xmlTemplater.imageId + ".png").replace(/\x20/, "");
                  this.xmlTemplater.DocxGen.qrCodeNumCallBack++;
                  this.xmlTemplater.DocxGen.qrCodeCallBack(this.xmlTemplater.DocxGen.qrCodeNumCallBack, true);
                  newId = this.xmlTemplater.DocxGen.addImageRels(imgName, "");
                  this.xmlTemplater.imageId++;
                  this.xmlTemplater.DocxGen.setImage("word/media/" + imgName, oldFile.data);
                  if (env === 'browser') {
                    qr[u] = new DocxQrCode(oldFile.data, this.xmlTemplater, imgName, this.xmlTemplater.DocxGen.qrCodeNumCallBack);
                  }
                  tag.setAttribute('name', "" + imgName);
                  tagrId.setAttribute('r:embed', "rId" + newId);
                  console.log("tagrId:" + tagrId.getAttribute('r:embed'));
                  imageTag = xmlImg.getElementsByTagNameNS('*', 'drawing')[0];
                  if (imageTag === void 0) {
                    console.log('imagetag not defined, trying alternate method');
                    imageTag = xmlImg.getElementsByTagName('w:drawing')[0];
                  }
                  replacement = DocUtils.xml2Str(imageTag);
                  this.xmlTemplater.content = this.xmlTemplater.content.replace(match[0], replacement);
                  this.xmlTemplater.numQrCode++;
                  if (env === 'browser') {
                    _results.push(qr[u].decode(callback));
                  } else {
                    if (/\.png$/.test(oldFile.name)) {
                      _results.push((function(_this) {
                        return function(imgName) {
                          var base64, binaryData, dat, finished, png;
                          console.log(oldFile.name);
                          base64 = JSZipBase64.encode(oldFile.data);
                          binaryData = new Buffer(base64, 'base64');
                          png = new PNG(binaryData);
                          finished = function(a) {
                            var e;
                            try {
                              png.decoded = a;
                              qr[u] = new DocxQrCode(png, _this.xmlTemplater, imgName, _this.xmlTemplater.DocxGen.qrCodeNumCallBack);
                              return qr[u].decode(callback);
                            } catch (_error) {
                              e = _error;
                              console.log(e);
                              return _this.xmlTemplater.DocxGen.qrCodeCallBack(_this.xmlTemplater.DocxGen.qrCodeNumCallBack, false);
                            }
                          };
                          return dat = png.decode(finished);
                        };
                      })(this)(imgName));
                    } else {
                      _results.push(this.xmlTemplater.DocxGen.qrCodeCallBack(this.xmlTemplater.DocxGen.qrCodeNumCallBack, false));
                    }
                  }
                } else {
                  _results.push(void 0);
                }
              } else {
                _results.push(void 0);
              }
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(void 0);
          }
        } else if (this.xmlTemplater.currentScope["img"] != null) {
          if (this.xmlTemplater.currentScope["img"][u] != null) {
            imgName = this.xmlTemplater.currentScope["img"][u].name;
            imgData = this.xmlTemplater.currentScope["img"][u].data;
            if (this.xmlTemplater.DocxGen == null) {
              throw 'DocxGen not defined';
            }
            newId = this.xmlTemplater.DocxGen.addImageRels(imgName, imgData);
            tag = xmlImg.getElementsByTagNameNS('*', 'docPr')[0];
            if (tag === void 0) {
              console.log('tag not defined, trying alternate method');
              tag = xmlImg.getElementsByTagName('wp:docPr')[0];
            }
            if (tag !== void 0) {
              this.xmlTemplater.imageId++;
              tag.setAttribute('id', this.xmlTemplater.imageId);
              tag.setAttribute('name', "" + imgName);
              tagrId = xmlImg.getElementsByTagNameNS('*', 'blip')[0];
              if (tagrId === void 0) {
                console.log('tagRid not defined, trying alternate method');
                tagrId = xmlImg.getElementsByTagName("a:blip")[0];
              }
              if (tagrId !== void 0) {
                tagrId.setAttribute('r:embed', "rId" + newId);
                imageTag = xmlImg.getElementsByTagNameNS('*', 'drawing')[0];
                if (imageTag === void 0) {
                  console.log('imagetag not defined, trying alternate method');
                  imageTag = xmlImg.getElementsByTagName('w:drawing')[0];
                }
                _results.push(this.xmlTemplater.content = this.xmlTemplater.content.replace(match[0], DocUtils.xml2Str(imageTag)));
              } else {
                _results.push(void 0);
              }
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return ImgReplacer;

  })();

  root.ImgReplacer = ImgReplacer;

}).call(this);
