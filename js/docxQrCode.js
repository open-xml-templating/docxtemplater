(function() {
  var DocxQrCode, env, root;

  root = typeof global !== "undefined" && global !== null ? global : window;

  env = typeof global !== "undefined" && global !== null ? 'node' : 'browser';

  DocxQrCode = DocxQrCode = (function() {
    function DocxQrCode(imageData, xmlTemplater, imgName, num, callback) {
      this.xmlTemplater = xmlTemplater;
      this.imgName = imgName != null ? imgName : "";
      this.num = num;
      this.callback = callback;
      this.data = imageData;
      this.base64Data = JSZipBase64.encode(this.data);
      this.ready = false;
      this.result = null;
    }

    DocxQrCode.prototype.decode = function(callback) {
      var _this;
      this.callback = callback;
      _this = this;
      console.log('qrcode');
      this.qr = new QrCode();
      this.qr.callback = function() {
        var testdoc;
        _this.ready = true;
        _this.result = this.result;
        console.log('result:' + _this.result);
        testdoc = new _this.xmlTemplater["class"](this.result, _this.xmlTemplater.toJson());
        testdoc.applyTemplateVars();
        _this.result = testdoc.content;
        return _this.searchImage();
      };
      if (env === 'browser') {
        return this.qr.decode("data:image/png;base64," + this.base64Data);
      } else {
        return this.qr.decode(this.data, this.data.decoded);
      }
    };

    DocxQrCode.prototype.searchImage = function() {
      var callback, error, loadDocCallback;
      if (this.result.substr(0, 4) === 'gen:') {
        return callback = (function(_this) {
          return function(data) {
            _this.data = data;
            _this.callback(_this, _this.imgName, _this.num);
            return _this.xmlTemplater.DocxGen.localImageCreator(_this.result, callback);
          };
        })(this);
      } else if (this.result !== null && this.result !== void 0 && this.result.substr(0, 22) !== 'error decoding QR Code') {
        loadDocCallback = (function(_this) {
          return function(fail) {
            if (fail == null) {
              fail = false;
            }
            if (!fail) {
              _this.data = docXData[_this.result];
              return _this.callback(_this, _this.imgName, _this.num);
            } else {
              console.log('file image loading failed!');
              return _this.callback(_this, _this.imgName, _this.num);
            }
          };
        })(this);
        try {
          return DocUtils.loadDoc(this.result, true, false, false, loadDocCallback);
        } catch (_error) {
          error = _error;
          return console.log(error);
        }
      } else {
        return this.callback(this, this.imgName, this.num);
      }
    };

    return DocxQrCode;

  })();

  root.DocxQrCode = DocxQrCode;

}).call(this);
