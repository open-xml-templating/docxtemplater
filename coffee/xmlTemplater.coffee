DocUtils=require('./docUtils')
ScopeManager=require('./scopeManager')
SubContent=require('./subContent')
TemplaterState=require('./templaterState')
XmlMatcher=require('./xmlMatcher')
ModuleManager=require('./moduleManager')
CompiledTemplate = require('./compiledTemplate')
CompiledXmlTag = require('./compiledXmlTag')
#This is an abstract class, DocXTemplater is an example of inherited class

module.exports=class XmlTemplater #abstract class !!
	constructor: (content="",options={}) ->
		@tagXml='' #tagXml represents the name of the tag that contains text. For example, in docx, @tagXml='w:t'
		@tagRawXml='' #tagRawXml represents the name of the tag that needs to be replaced when embedding raw XML using `{@rawXml}`.
		@currentClass=XmlTemplater #This is used because tags are recursive, so the class needs to be able to instanciate an object of the same class. I created a variable so you don't have to Override all functions relative to recursivity
		@fromJson(options)
		@templaterState= new TemplaterState @moduleManager,@delimiters
	load: (@content) ->
		xmlMatcher=new XmlMatcher(@content).parse(@tagXml)
		@templaterState.matches = xmlMatcher.matches
		@templaterState.charactersAdded= xmlMatcher.charactersAdded
	fromJson:(options={})->
		@tags= if options.tags? then options.tags else {}
		@scopePath=if options.scopePath? then options.scopePath else []
		@scopeList= if options.scopeList? then options.scopeList else [@tags]
		@usedTags=if options.usedTags? then options.usedTags else {def:{},undef:{}}
		for key,defaultValue of DocUtils.defaults
			this[key]=if options[key]? then options[key] else defaultValue
		@moduleManager=if options.moduleManager? then options.moduleManager else new ModuleManager()
		@scopeManager=new ScopeManager({tags:@tags,scopePath:@scopePath,usedTags:@usedTags,scopeList:@scopeList,parser:@parser,moduleManager:@moduleManager,nullGetter:@nullGetter,delimiters:@delimiters})
	toJson: () ->
		obj =
			tags:DocUtils.clone @scopeManager.tags
			scopePath:DocUtils.clone @scopeManager.scopePath
			scopeList: DocUtils.clone @scopeManager.scopeList
			usedTags:@scopeManager.usedTags
			moduleManager:@moduleManager
		for key,defaultValue of DocUtils.defaults
			obj[key]=this[key]
		obj
	calcIntellegentlyDashElement:()->return false #to be implemented by classes that inherit xmlTemplater, eg DocxTemplater
	getFullText:(@tagXml=@tagXml) ->
		matcher=new XmlMatcher(@content).parse(@tagXml)
		output= (match[2] for match in matcher.matches) #get only the text
		DocUtils.wordToUtf8(DocUtils.convertSpaces(output.join(""))) #join it
	handleModuleManager:(type,data)->
		@moduleManager.xmlTemplater=this
		@moduleManager.templaterState=@templaterState
		@moduleManager.scopeManager=@scopeManager
		@moduleManager.handle(type,data)
	###
	content is the whole content to be tagged
	scope is the current scope
	returns the new content of the tagged content###
	render:()->
		@compile()
	compile:()->
		@sameTags = @delimiters.start == @delimiters.end
		@compiled = new CompiledTemplate()
		@lastStart = 0
		@templaterState.initialize()
		@handleModuleManager('xmlRendering')
		for match,numXmlTag in @templaterState.matches
			innerText= match[2] #text inside the <w:t>
			@templaterState.offset[numXmlTag]=0
			if @templaterState.trail.length==0 && !@templaterState.inTag && innerText.indexOf(@delimiters.start[0])==-1 && innerText.indexOf(@delimiters.end[0])==-1
				continue
			for character,numCharacter in innerText
				@templaterState.trail+=character
				length=if !@templaterState.inTag then @delimiters.start.length else @delimiters.end.length
				@templaterState.trail=@templaterState.trail.substr(-length,length)
				@templaterState.currentStep={'numXmlTag':numXmlTag,'numCharacter':numCharacter}
				@templaterState.trailSteps.push({'numXmlTag':numXmlTag,'numCharacter':numCharacter})
				@templaterState.trailSteps=@templaterState.trailSteps.splice(-@delimiters.start.length,@delimiters.start.length)
				@templaterState.context+=character
				if (@sameTags is true and @templaterState.inTag is false and @templaterState.trail == @delimiters.start) or (@sameTags is false and @templaterState.trail == @delimiters.start)
					@templaterState.startTag()
				else if (@sameTags is true and @templaterState.inTag is true and @templaterState.trail == @delimiters.end) or (@sameTags is false and @templaterState.trail == @delimiters.end)
					@templaterState.endTag()
					loopType=@templaterState.loopType()
					if loopType=='simple'
						@replaceSimpleTag()
					if loopType=='xml'
						@replaceSimpleTagRawXml()
					if loopType=='dash' or loopType=='for'
						if @templaterState.isLoopClosingTag()
							@replaceLoopTag()
							@templaterState.finishLoop()
					if ['simple','dash','for','xml'].indexOf(loopType)==-1
						@handleModuleManager('replaceTag',loopType)
				else
					if @templaterState.inTag is true then @templaterState.textInsideTag+=character
		@handleModuleManager('xmlRendered')
		preContent = @content.substr(@lastStart)
		@compiled.appendText(preContent)
		this
	replaceSimpleTag:()->
		newValue=@scopeManager.getValueFromScope(@templaterState.textInsideTag)
		@content=@replaceTagByValue(DocUtils.utf8ToWord(newValue),@content)
	replaceSimpleTagRawXml:()->
		newText=@scopeManager.getValueFromScope(@templaterState.tag)
		subContent=new SubContent(@content).getInnerTag(@templaterState).getOuterXml(@tagRawXml)
		startTag = subContent.start
		preContent = @content.substr(@lastStart,startTag-@lastStart)
		@compiled.appendText(preContent)
		@lastStart=startTag
		@compiled.appendRaw(@templaterState.tag)
		@replaceXml(subContent,newText)
	replaceXml:(subContent,newText)->
		@templaterState.moveCharacters(@templaterState.tagStart.numXmlTag,newText.length,subContent.text.length)
		@content= subContent.replace(newText).fullText
	deleteTag:(xml,tag)->
		@templaterState.tagStart=tag.start
		@templaterState.tagEnd=tag.end
		@templaterState.textInsideTag=tag.raw
		xmlText=@replaceTagByValue("",xml)
	deleteOuterTags:(outerXmlText)->
		@deleteTag(@deleteTag(outerXmlText,@templaterState.loopOpen),@templaterState.loopClose)
	dashLoop: (elementDashLoop,sharp=false) ->
		outerXml = new SubContent(@content)
			.getInnerLoop(@templaterState)
			.getOuterXml(elementDashLoop)
		@templaterState.moveCharacters(0,0,outerXml.start)
		outerXmlText= outerXml.text
		innerXmlText=@deleteOuterTags(outerXmlText,sharp)
		@templaterState.moveCharacters(0,outerXml.start,0)
		@templaterState.moveCharacters(@templaterState.tagStart.numXmlTag,outerXmlText.length,innerXmlText.length)
		@forLoop(outerXml,innerXmlText)
	xmlToBeReplaced:(options)->
		before=""
		after=""
		if options.noStartTag
			return options.insideValue
		if options.spacePreserve
			before="<#{@tagXml} xml:space=\"preserve\">"
		else
			before=@templaterState.matches[options.xmlTagNumber][1]
		if !options.noEndTag
			after="</#{@tagXml}>"
		@currentCompiledTag.prependText(before)
		@currentCompiledTag.appendText(after)
		return before+options.insideValue+after
	replaceXmlTag: (content,options) ->
		@templaterState.offset[options.xmlTagNumber]+=options.insideValue.length-@templaterState.matches[options.xmlTagNumber][2].length
		options.spacePreserve= if options.spacePreserve? then options.spacePreserve else true
		options.noStartTag= if options.noStartTag? then options.noStartTag else false
		options.noEndTag= if options.noEndTag? then options.noEndTag else false
		replacer=@xmlToBeReplaced(options)
		@templaterState.matches[options.xmlTagNumber][2]=options.insideValue #so that the templaterState.matches are still correct
		startTag= @templaterState.calcXmlTagPosition(options.xmlTagNumber)#where the open tag starts: <w:t>
		#calculate the replacer according to the params
		@templaterState.moveCharacters(options.xmlTagNumber+1,replacer.length,@templaterState.matches[options.xmlTagNumber][0].length)
		if content.indexOf(@templaterState.matches[options.xmlTagNumber][0])==-1
			throw new Error("content #{@templaterState.matches[options.xmlTagNumber][0]} not found in content")
		content = DocUtils.replaceFirstFrom content,@templaterState.matches[options.xmlTagNumber][0], replacer, startTag
		@templaterState.matches[options.xmlTagNumber][0]=replacer
		preContent = content.substr(@lastStart,startTag-@lastStart)
		if @templaterState.loopType()=="simple"
			@compiled.appendText(preContent)
			@lastStart = startTag + @templaterState.matches[options.xmlTagNumber][0].length
			@compiled.appendTag(@currentCompiledTag)
		content
	replaceTagByValue:(newValue,content) ->
		options=
			xmlTagNumber:@templaterState.tagStart.numXmlTag
			noStartTag:@templaterState.matches[@templaterState.tagStart.numXmlTag].first?
			noEndTag:@templaterState.matches[@templaterState.tagStart.numXmlTag].last?

		if @templaterState.tagEnd.numXmlTag==@templaterState.tagStart.numXmlTag #<w>{aaaaa}</w>
			@currentCompiledTag = new CompiledXmlTag ([@templaterState.getLeftValue(),{type:'tag',tag:@templaterState.textInsideTag},@templaterState.getRightValue()])
			options.insideValue=@templaterState.getLeftValue()+newValue+@templaterState.getRightValue()
			return @replaceXmlTag(content,options)

		else if @templaterState.tagEnd.numXmlTag>@templaterState.tagStart.numXmlTag #<w>{aaa</w> ... <w> aaa} </w>
			# 1. for the first (@templaterState.tagStart.numXmlTag): replace **{tag by **tagValue

			options.insideValue=newValue
			@currentCompiledTag = new CompiledXmlTag ([{type:'tag',tag:@templaterState.textInsideTag}])
			if !@templaterState.matches[@templaterState.tagStart.numXmlTag].first? and !@templaterState.matches[@templaterState.tagStart.numXmlTag].last?  #normal case
				@currentCompiledTag = new CompiledXmlTag ([ @templaterState.getLeftValue(), {type:'tag',tag:@templaterState.textInsideTag} ])
				options.insideValue=@templaterState.getLeftValue()+newValue

			content= @replaceXmlTag(content,options)

			#2. for in between (@templaterState.tagStart.numXmlTag+1...@templaterState.tagEnd.numXmlTag) replace whole by ""

			options=
				insideValue:""
				spacePreserve:false

			for k in [(@templaterState.tagStart.numXmlTag+1)...@templaterState.tagEnd.numXmlTag]
				options.xmlTagNumber=k
				@currentCompiledTag = new CompiledXmlTag ([])
				content= @replaceXmlTag(content, options)

			#3. for the last (@templaterState.tagEnd.numXmlTag) replace ..}__ by ".." ###
			options =
				insideValue:@templaterState.getRightValue()
				spacePreserve:true
				xmlTagNumber:@templaterState.tagEnd.numXmlTag
				noEndTag:@templaterState.matches[@templaterState.tagEnd.numXmlTag].last?

			@currentCompiledTag = CompiledXmlTag.null()
			return @replaceXmlTag(content, options)
	replaceLoopTag:()->
		#You DashLoop= take the outer scope only if you are in a table
		if @templaterState.loopType()=='dash'
			return @dashLoop(@templaterState.loopOpen.element)
		if @intelligentTagging==on
			dashElement=@calcIntellegentlyDashElement()
			if dashElement!=false then return @dashLoop(dashElement,true)
		outerLoop=new SubContent(@content).getOuterLoop(@templaterState)
		innerTemplate=new SubContent(@content).getInnerLoop(@templaterState).text
		@forLoop(outerLoop,innerTemplate)
	calcSubXmlTemplater:(innerTagsContent,argOptions)->
		options= @toJson()
		if argOptions?
			if argOptions.tags?
				options.tags=argOptions.tags
				options.scopeList = options.scopeList.concat(argOptions.tags)
				options.scopePath= options.scopePath.concat(@templaterState.loopOpen.tag)
		(new @currentClass innerTagsContent,options)
			.render()
	forLoop: (outerTags,subTemplate)->
		###
			<w:t>{#forTag} blabla</w:t>
			Blabla1
			Blabla2
			<w:t>{/forTag}</w:t>

			Let subTemplate be what is in between the first closing tag and the second opening tag | blabla....Blabla2<w:t>|
			Let outerTagsContent what is in between the first opening tag  and the last closing tag     |{#forTag} blabla....Blabla2<w:t>{/forTag}|
			We replace outerTagsContent by n*subTemplate, n is equal to the length of the array in scope forTag
			<w:t>subContent subContent subContent</w:t>
		###
		startTag = outerTags.start
		preContent = @content.substr(@lastStart,startTag-@lastStart)
		@compiled.appendText(preContent)
		@lastStart = outerTags.end

		tag=@templaterState.loopOpen.tag
		newContent=""
		@scopeManager.loopOver tag, (subTags) =>
			subfile=@calcSubXmlTemplater(subTemplate,{tags:subTags})
			newContent+=subfile.content
		, @templaterState.loopIsInverted

		subfile=@calcSubXmlTemplater(subTemplate,{tags:{}})
		@compiled.appendSubTemplate(subfile.compiled.compiled,tag,@templaterState.loopIsInverted)
		@lastStart+=newContent.length - outerTags.text.length
		@replaceXml(outerTags,newContent)
