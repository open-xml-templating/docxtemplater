"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("./errors"),
    XTScopeParserError = _require.XTScopeParserError;

// This class responsibility is to manage the scope


var ScopeManager = function () {
	function ScopeManager(options) {
		_classCallCheck(this, ScopeManager);

		this.scopePath = options.scopePath;
		this.scopeList = options.scopeList;
		this.parser = options.parser;
	}

	_createClass(ScopeManager, [{
		key: "loopOver",
		value: function loopOver(tag, callback, inverted) {
			inverted = inverted || false;
			return this.loopOverValue(this.getValue(tag), callback, inverted, tag);
		}
	}, {
		key: "functorIfInverted",
		value: function functorIfInverted(inverted, functor, value) {
			if (inverted) {
				functor(value);
			}
		}
	}, {
		key: "isValueFalsy",
		value: function isValueFalsy(value, type, tag, scope) {
			var parser = this.parser(tag, { scopePath: this.scopePath });

			return parser.isFalsy(value, type, tag, scope);
			// return (
			// 	value == null ||
			// 	!value ||
			// 	(type === "[object Array]" && value.length === 0)
			// );

		}
	}, {
		key: "loopOverValue",
		value: function loopOverValue(value, functor, inverted, tag) {
			var type = Object.prototype.toString.call(value);
			var currentValue = this.scopeList[this.num];
			if (this.isValueFalsy(value, type, tag, currentValue)) {
				return this.functorIfInverted(inverted, functor, currentValue);
			}
			if (type === "[object Array]") {
				for (var i = 0, scope; i < value.length; i++) {
					scope = value[i];
					this.functorIfInverted(!inverted, functor, scope);
				}
				return;
			}
			if (type === "[object Object]") {
				return this.functorIfInverted(!inverted, functor, value);
			}
			return this.functorIfInverted(!inverted, functor, currentValue);
		}
	}, {
		key: "getValue",
		value: function getValue(tag, num) {
			// search in the scopes (in reverse order) and keep the first defined value
			this.num = num == null ? this.scopeList.length - 1 : num;
			var err = void 0;
			var result = void 0;
			var scope = this.scopeList[this.num];
			var parser = this.parser(tag, { scopePath: this.scopePath });
			try {
				result = parser.get(scope, { num: this.num, scopeList: this.scopeList });
			} catch (error) {
				err = new XTScopeParserError("Scope parser execution failed");
				err.properties = {
					id: "scopeparser_execution_failed",
					explanation: "The scope parser for the tag " + tag + " failed to execute",
					scope: scope,
					tag: tag,
					rootError: error
				};
				throw err;
			}
			if (result == null && this.num > 0) {
				return this.getValue(tag, this.num - 1);
			}
			return result;
		}
	}, {
		key: "createSubScopeManager",
		value: function createSubScopeManager(scope, tag) {
			return new ScopeManager({
				parser: this.parser,
				scopeList: this.scopeList.concat(scope),
				scopePath: this.scopePath.concat(tag)
			});
		}
	}]);

	return ScopeManager;
}();

module.exports = function (options) {
	options.scopePath = [];
	options.scopeList = [options.tags];
	return new ScopeManager(options);
};