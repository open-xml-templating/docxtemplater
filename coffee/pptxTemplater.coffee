XmlTemplater = require('./xmlTemplater')
xmlUtil = require('./xmlUtil')

PptXTemplater = class PptXTemplater extends XmlTemplater
	###*
	 * [constructor description]
	 * @param  {[type]} content=""   [description]
	 * @param  {[type]} options={} [description]
	 * @return {[type]}              [description]
	###
	constructor: (content="",options={}) ->
		super(content, options)
		@currentClass = PptXTemplater
		@tagXml = 'a:t'
		if typeof content == "string" then @load content else throw new Error("content must be string!")

	###*
	 * @todo: prog666: good idea to replace with options I guess
	 * [xmlToBeReplaced description]
	 * @param  {[type]} noStartTag    [description]
	 * @param  {[type]} spacePreserve [description]
	 * @param  {[type]} insideValue   [description]
	 * @param  {[type]} xmlTagNumber  [description]
	 * @param  {[type]} noEndTag      [description]
	 * @return {[type]}               [description]
	###
	xmlToBeReplaced: (noStartTag, spacePreserve, insideValue, xmlTagNumber, noEndTag) ->
		if noStartTag == true
			return insideValue
		else
			str = @templaterState.matches[xmlTagNumber][1] + insideValue
			if noEndTag == true then return str else return str + "</#{@tagXml}>"
	###*
	 * [calcIntellegentlyDashElement description]
	 * @return {[type]} [description]
	###
	calcIntellegentlyDashElement: () ->
		{content,start,end} = @templaterState.findOuterTagsContent(@content)
		scopeContent = xmlUtil.getListXmlElements(@content, start, end-start)
		for t in scopeContent
			if t.tag == '<a:tc>'
				return 'a:tr'
		return super()

module.exports = PptXTemplater
