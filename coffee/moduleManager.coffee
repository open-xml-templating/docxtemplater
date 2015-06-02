module.exports = class ModuleManager
	constructor:-> @modules = []
	attachModule:(module)->
		@modules.push module
		module.manager=this
		this
	sendEvent:(eventName,data)->
		for m in @modules
			m.handleEvent(eventName,data)
	get:(value)->
		result=null
		for m in @modules
			aux=m.get(value)
			result=if aux!=null then aux else result
		result
	handle:(type,data)->
		result=null
		for m in @modules
			if result!=null then return
			aux=m.handle(type,data)
			result=if aux!=null then aux else result
		result
	getInstance:(obj)-> @[obj]
