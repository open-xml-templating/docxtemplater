//This class responsibility is to manage the scope
var DocUtils=require('./docUtils');
var Errors = require("./errors");

module.exports=class ScopeManager {
	constructor(options){
		this.tags = options.tags;
		this.scopePath = options.scopePath;
		this.usedTags = options.usedTags;
		this.scopeList = options.scopeList;
		this.parser = options.parser;
		this.moduleManager = options.moduleManager;
		this.nullGetter = options.nullGetter;
		this.delimiters = options.delimiters;
		this.moduleManager.scopeManager=this;
	}
	loopOver(tag,callback,inverted=false){
		var value = this.getValue(tag);
		return this.loopOverValue(value,callback,inverted);
	}
	loopOverValue(value,callback,inverted=false){
		var type = Object.prototype.toString.call(value);
		if (inverted) {
			if (!(typeof value !== "undefined" && value !== null)) { return callback(this.scopeList[this.num]); }
			if (!value) { return callback(this.scopeList[this.num]); }
			if (type==='[object Array]' && value.length === 0) {
				callback(this.scopeList[this.num]);
			}
			return;
		}

		if (!(typeof value !== "undefined" && value !== null)) { return; }
		if (type === '[object Array]') {
			for (var i = 0, scope; i < value.length; i++) {
				scope = value[i];
				callback(scope);
			}
		}
		if (type === '[object Object]') {
			callback(value);
		}
		if (value === true) {
			return callback(this.scopeList[this.num]);
		}
	}
	getValue(tag,num=this.scopeList.length-1){
		this.num = num;
		var scope=this.scopeList[this.num];
		try {
			var parser=this.parser(tag);
		} catch (error) {
			var err = new Errors.XTScopeParserError("Scope parser compilation failed");
			err.properties =
				{id: "scopeparser_compilation_failed",
				tag: tag,
				explanation: `The scope parser for the tag ${tag} failed to compile`
				};
			throw err;
		}
		try {
			var result=parser.get(scope);
		} catch (error) {
			err = new Errors.XTScopeParserError("Scope parser execution failed");
			err.properties =
				{id: "scopeparser_execution_failed",
				explanation: `The scope parser for the tag ${tag} failed to execute`,
				scope: scope,
				tag: tag
				};
			throw err;
		}
		if (!(typeof result !== "undefined" && result !== null) && this.num>0) { return this.getValue(tag,this.num-1); }
		return result;
	}
	getValueFromScope(tag) {
		// search in the scopes (in reverse order) and keep the first defined value
		var result = this.getValue(tag);
		if ((typeof result !== "undefined" && result !== null)) {
			if (typeof result==='string') {
				this.useTag(tag,true);
				var value= result;
			} else if (typeof result==="number") {
				value=String(result);
			} else { value= result;
			}
		} else {
			this.useTag(tag,false);
			return null;
		}
		return value;
	}
	//set the tag as used, so that DocxGen can return the list of all tags
	useTag(tag,val) {
		if (val) {
			var u = this.usedTags.def;
		} else {
			u = this.usedTags.undef;
		}
		var iterable = this.scopePath;
		for (var i = 0, s; i < iterable.length; i++) {
			s = iterable[i];
			if (!(u[s] != null)) { u[s]={}; }
			u = u[s];
		}
		if (tag!=="") {
			return u[tag]= true;
		}
	}
};
