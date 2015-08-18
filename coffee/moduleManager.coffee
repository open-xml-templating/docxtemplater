module.exports = class ModuleManager
	###*
	 * initiate modules with empty array
	###
	constructor: () -> 
		@modules = []

	###*
	 * [attachModule description]
	 * @param  {[type]} module [description]
	 * @return {Object}         this for chaining
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
		for module in @modules
			module.handleEvent(eventName, data)

	###*
	 * [get description]
	 * @param  {[type]} value [description]
	 * @return {[type]}       [description]
	###
	get: (value) ->
		result = null
		for module in @modules
			aux = module.get(value)
			result = if aux != null then aux else result
		return result

	###*
	 * [handle description]
	 * @param  {[type]} type [description]
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	###
	handle: (type, data) ->
		result = null
		for m in @modules
			if result != null then return
			aux = module.handle(type, data)
			result = if aux != null then aux else result
		return result

	###*
	 * @param  {[type]} name name of the manager property to return
	 * @return {[type]}      object property
	###
	getInstance: (name) -> 
		return @[name]
