module.exports = class ModuleManager
	###*
	 * [constructor description]
	 * @return {[type]} [description]
	###
	constructor: -> @modules = []

	###*
	 * [attachModule description]
	 * @param  {[type]} module [description]
	 * @return {[type]}        [description]
	###
	attachModule: (module) ->
		@modules.push module
		module.manager = this
		return this

	###*
	 * [sendEvent description]
	 * @param  {[type]} eventName [description]
	 * @param  {[type]} data      [description]
	 * @return {[type]}           [description]
	###
	sendEvent: (eventName, data) ->
		for m in @modules
			m.handleEvent(eventName,data)

	###*
	 * [get description]
	 * @param  {[type]} value [description]
	 * @return {[type]}       [description]
	###
	get: (value) ->
		result = null
		for m in @modules
			aux = m.get(value)
			result = if aux != null then aux else result
		result

	###*
	 * [handle description]
	 * @param  {[type]} type [description]
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	###
	handle:(type,data)->
		result=null
		for m in @modules
			if result!=null then return
			aux=m.handle(type,data)
			result=if aux!=null then aux else result
		result

	###*
	 * [getInstance description]
	 * @param  {[type]} obj [description]
	 * @return {[type]}     [description]
	###
	getInstance:(obj)-> @[obj]
