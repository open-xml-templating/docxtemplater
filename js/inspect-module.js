"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("lodash"),
    merge = _require.merge;

function _getTags(postParsed) {
	return postParsed.filter(function (part) {
		return part.type === "placeholder";
	}).reduce(function (tags, part) {
		tags[part.value] = tags[part.value] || {};
		if (part.subparsed) {
			tags[part.value] = merge(tags[part.value], _getTags(part.subparsed));
		}
		return tags;
	}, {});
}

var InspectModule = function () {
	function InspectModule() {
		_classCallCheck(this, InspectModule);

		this.inspect = {};
		this.fullInspected = {};
		this.filePath = null;
	}

	_createClass(InspectModule, [{
		key: "optionsTransformer",
		value: function optionsTransformer(options, docxtemplater) {
			this.fileTypeConfig = docxtemplater.fileTypeConfig;
			this.zip = docxtemplater.zip;
			return options;
		}
	}, {
		key: "set",
		value: function set(obj) {
			if (obj.inspect) {
				if (obj.inspect.filePath) {
					this.filePath = obj.inspect.filePath;
				}
				this.inspect = merge({}, this.inspect, obj.inspect);
				this.fullInspected[this.filePath] = this.inspect;
			}
		}
	}, {
		key: "getTags",
		value: function getTags(file) {
			file = file || this.fileTypeConfig.textPath(this.zip);
			return _getTags(this.fullInspected[file].postparsed);
		}
	}, {
		key: "getAllTags",
		value: function getAllTags() {
			var _this = this;

			return Object.keys(this.fullInspected).reduce(function (result, file) {
				return merge(result, _this.getTags(file));
			}, {});
		}
	}]);

	return InspectModule;
}();

module.exports = function () {
	return new InspectModule();
};