window["PizZipUtils"] =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./es6/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./es6/index.js":
/*!**********************!*\
  !*** ./es6/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar PizZipUtils = {}; // just use the responseText with xhr1, response with xhr2.\n// The transformation doesn't throw away high-order byte (with responseText)\n// because PizZip handles that case. If not used with PizZip, you may need to\n// do it, see https://developer.mozilla.org/En/Using_XMLHttpRequest#Handling_binary_data\n\nPizZipUtils._getBinaryFromXHR = function (xhr) {\n  // for xhr.responseText, the 0xFF mask is applied by PizZip\n  return xhr.response || xhr.responseText;\n}; // taken from jQuery\n\n\nfunction createStandardXHR() {\n  try {\n    return new window.XMLHttpRequest();\n  } catch (e) {}\n}\n\nfunction createActiveXHR() {\n  try {\n    return new window.ActiveXObject(\"Microsoft.XMLHTTP\");\n  } catch (e) {}\n} // Create the request object\n\n\nvar createXHR = window.ActiveXObject ?\n/* Microsoft failed to properly\n * implement the XMLHttpRequest in IE7 (can't request local files),\n * so we use the ActiveXObject when it is available\n * Additionally XMLHttpRequest can be disabled in IE7/IE8 so\n * we need a fallback.\n */\nfunction () {\n  return createStandardXHR() || createActiveXHR();\n} : // For all other browsers, use the standard XMLHttpRequest object\ncreateStandardXHR;\n\nPizZipUtils.getBinaryContent = function (path, callback) {\n  /*\n   * Here is the tricky part : getting the data.\n   * In firefox/chrome/opera/... setting the mimeType to 'text/plain; charset=x-user-defined'\n   * is enough, the result is in the standard xhr.responseText.\n   * cf https://developer.mozilla.org/En/XMLHttpRequest/Using_XMLHttpRequest#Receiving_binary_data_in_older_browsers\n   * In IE <= 9, we must use (the IE only) attribute responseBody\n   * (for binary data, its content is different from responseText).\n   * In IE 10, the 'charset=x-user-defined' trick doesn't work, only the\n   * responseType will work :\n   * http://msdn.microsoft.com/en-us/library/ie/hh673569%28v=vs.85%29.aspx#Binary_Object_upload_and_download\n   *\n   * I'd like to use jQuery to avoid this XHR madness, but it doesn't support\n   * the responseType attribute : http://bugs.jquery.com/ticket/11461\n   */\n  try {\n    var xhr = createXHR();\n    xhr.open(\"GET\", path, true); // recent browsers\n\n    if (\"responseType\" in xhr) {\n      xhr.responseType = \"arraybuffer\";\n    } // older browser\n\n\n    if (xhr.overrideMimeType) {\n      xhr.overrideMimeType(\"text/plain; charset=x-user-defined\");\n    }\n\n    xhr.onreadystatechange = function (evt) {\n      var file, err; // use `xhr` and not `this`... thanks IE\n\n      if (xhr.readyState === 4) {\n        if (xhr.status === 200 || xhr.status === 0) {\n          file = null;\n          err = null;\n\n          try {\n            file = PizZipUtils._getBinaryFromXHR(xhr);\n          } catch (e) {\n            err = new Error(e);\n          }\n\n          callback(err, file);\n        } else {\n          callback(new Error(\"Ajax error for \" + path + \" : \" + this.status + \" \" + this.statusText), null);\n        }\n      }\n    };\n\n    xhr.send();\n  } catch (e) {\n    callback(new Error(e), null);\n  }\n};\n\nmodule.exports = PizZipUtils;\n\n//# sourceURL=webpack://PizZipUtils/./es6/index.js?");

/***/ })

/******/ });