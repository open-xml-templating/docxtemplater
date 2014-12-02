module.exports = class ModuleManager
	constructor:()->
		@modules = []
	attachModule:(module)->
		@modules.push module
		module.manager=this
		this
	sendEvent:(eventName,data)->
		@modules.forEach (m)->
			m.handleEvent(eventName,data)
	get:(value)->
		result=null
		@modules.forEach (m)->
			aux=m.get(value)
			result=if aux!=null then aux else result
		return result
	handle:(type,data)->
		result=null
		@modules.forEach (m)->
			if result!=null then return
			aux=m.handle(type,data)
			result=if aux!=null then aux else result
		return result
	getInstance:(obj)->
		return @[obj]
