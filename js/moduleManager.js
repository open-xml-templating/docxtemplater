var ModuleManager;

module.exports = ModuleManager = (function() {
  function ModuleManager() {
    this.modules = [];
  }

  ModuleManager.prototype.attachModule = function(module) {
    this.modules.push(module);
    module.manager = this;
    return this;
  };

  ModuleManager.prototype.sendEvent = function(eventName, data) {
    var m, _i, _len, _ref, _results;
    _ref = this.modules;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      m = _ref[_i];
      _results.push(m.handleEvent(eventName, data));
    }
    return _results;
  };

  ModuleManager.prototype.get = function(value) {
    var aux, m, result, _i, _len, _ref;
    result = null;
    _ref = this.modules;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      m = _ref[_i];
      aux = m.get(value);
      result = aux !== null ? aux : result;
    }
    return result;
  };

  ModuleManager.prototype.handle = function(type, data) {
    var aux, m, result, _i, _len, _ref;
    result = null;
    _ref = this.modules;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      m = _ref[_i];
      if (result !== null) {
        return;
      }
      aux = m.handle(type, data);
      result = aux !== null ? aux : result;
    }
    return result;
  };

  ModuleManager.prototype.getInstance = function(obj) {
    return this[obj];
  };

  return ModuleManager;

})();
