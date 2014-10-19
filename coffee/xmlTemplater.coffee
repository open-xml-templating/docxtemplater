DocUtils=require('./docUtils')
ScopeManager=require('./scopeManager')
SubContent=require('./subContent')
TemplaterState=require('./templaterState')
XmlMatcher=require('./xmlMatcher')
ImgReplacer=require('./imgReplacer')
#This is an abstract class, DocXTemplater is an example of inherited class

module.exports=class XmlTemplater #abstract class !!
	constructor: (content="",options={}) ->
		@tagXml='' #tagXml represents the name of the tag that contains text. For example, in docx, @tagXml='w:t'
		@currentClass=XmlTemplater #This is used because tags are recursive, so the class needs to be able to instanciate an object of the same class. I created a variable so you don't have to Override all functions relative to recursivity
		@fileType = options.fileType
		@fromJson(options)
		@templaterState= new TemplaterState
	load: (@content) ->
		xmlMatcher=new XmlMatcher(@content).parse(@tagXml)
		@templaterState.matches = xmlMatcher.matches
		@templaterState.charactersAdded= xmlMatcher.charactersAdded
	fromJson:(options={})->
		@Tags= if options.Tags? then options.Tags else {}
		@DocxGen= if options.DocxGen? then options.DocxGen else null
		@intelligentTagging=if options.intelligentTagging? then options.intelligentTagging else off
		@scopePath=if options.scopePath? then options.scopePath else []
		@scopeList= if options.scopeList? then options.scopeList else [@Tags]
		@usedTags=if options.usedTags? then options.usedTags else {}
		@imageId=if options.imageId? then options.imageId else 0
		@parser= if options.parser? then options.parser else DocUtils.defaultParser
		@fileName=options.fileName
		@scopeManager=new ScopeManager(@Tags,@scopePath,@usedTags,@scopeList,@parser)
		@imgManager=options.imgManager
	toJson: () ->
		Tags:DocUtils.clone @scopeManager.tags
		DocxGen:@DocxGen
		intelligentTagging:DocUtils.clone @intelligentTagging
		scopePath:DocUtils.clone @scopeManager.scopePath
		scopeList: DocUtils.clone @scopeManager.scopeList
		usedTags:@scopeManager.usedTags
		localImageCreator:@localImageCreator
		imageId:@imageId
		parser:@parser
		imgManager:@imgManager
		fileName:@fileName
	calcIntellegentlyDashElement:()->return false #to be implemented by classes that inherit xmlTemplater, eg DocxTemplater
	getFullText:(@tagXml=@tagXml) ->
		matcher=new XmlMatcher(@content).parse(@tagXml)
		output= (match[2] for match in matcher.matches) #get only the text
		DocUtils.wordToUtf8(DocUtils.convert_spaces(output.join(""))) #join it
	###
	content is the whole content to be tagged
	scope is the current scope
	returns the new content of the tagged content###
	applyTags:()->
		@templaterState.initialize()
		for match,numXmlTag in @templaterState.matches
			innerText= match[2] #text inside the <w:t>
			for character,numCharacter in innerText
				@templaterState.currentStep={'numXmlTag':numXmlTag,'numCharacter':numCharacter}
				@templaterState.context+=character
				for m,t in @templaterState.matches when t==numXmlTag
					if @content[m.offset+@templaterState.charactersAdded[t]]!=m[0][0]
						throw new Error("no < at the beginning of #{m[0][0]} (2)")
				if character==DocUtils.tags.start
					@templaterState.startTag()
				else if character == DocUtils.tags.end
					@templaterState.endTag()
					if @templaterState.loopType()=='simple'
						@replaceSimpleTag()
					if @templaterState.loopType()=='xml'
						@replaceSimpleTagRawXml()
						break
					else if @templaterState.isLoopClosingTag()
						return @replaceLoopTag()
				else
					if @templaterState.inTag is true then @templaterState.textInsideTag+=character
		if @DocxGen? and @DocxGen.qrCode!=false
			new ImgReplacer(this).findImages().replaceImages()
		this
	replaceSimpleTag:()->
		newValue=@scopeManager.getValueFromScope(@templaterState.textInsideTag)
		@content=@replaceTagByValue(DocUtils.utf8ToWord(newValue),@content)
	replaceSimpleTagRawXml:()->
		subContent=new SubContent(@content).getInnerTag(@templaterState).getOuterXml('w:p')
		newText=@scopeManager.getValueFromScope(@templaterState.tag)
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
		{_,start,end}= @templaterState.findOuterTagsContent(@content)
		outerXml = DocUtils.getOuterXml @content, start, end, elementDashLoop
		@templaterState.moveCharacters(0,0,outerXml.startTag)
		outerXmlText= outerXml.text
		innerXmlText=@deleteOuterTags(outerXmlText,sharp)
		@forLoop(innerXmlText,outerXmlText)
	xmlToBeReplaced:(noStartTag,spacePreserve, insideValue,xmlTagNumber,noEndTag)->
		if noStartTag == true
			return insideValue
		else
			if spacePreserve==true && @fileType != "pptx"
				str="""<#{@tagXml} xml:space="preserve">#{insideValue}"""
			else
				str=@templaterState.matches[xmlTagNumber][1]+insideValue
			if noEndTag==true then return str else return str+"</#{@tagXml}>"
	replaceXmlTag: (content,options) ->
		xmlTagNumber=options.xmlTagNumber
		insideValue=options.insideValue
		spacePreserve= if options.spacePreserve? then options.spacePreserve else true
		noStartTag= if options.noStartTag? then options.noStartTag else false
		noEndTag= if options.noEndTag? then options.noEndTag else false
		replacer=@xmlToBeReplaced(noStartTag,spacePreserve,insideValue,xmlTagNumber,noEndTag)
		@templaterState.matches[xmlTagNumber][2]=insideValue #so that the templaterState.matches are still correct
		startTag= @templaterState.calcXmlTagPosition(xmlTagNumber)#where the open tag starts: <w:t>
		#calculate the replacer according to the params
		@templaterState.moveCharacters(xmlTagNumber+1,replacer.length,@templaterState.matches[xmlTagNumber][0].length)
		if content.indexOf(@templaterState.matches[xmlTagNumber][0])==-1 then throw new Error("content #{@templaterState.matches[xmlTagNumber][0]} not found in content")
		content = DocUtils.replaceFirstFrom content,@templaterState.matches[xmlTagNumber][0], replacer, startTag
		@templaterState.matches[xmlTagNumber][0]=replacer
		content
	replaceTagByValue:(newValue,content) ->
		if (@templaterState.innerContent('tagEnd').indexOf (DocUtils.tags.end))==-1 then throw new Error("no closing tag at @templaterState.tagEnd.numXmlTag #{@templaterState.innerContent('tagEnd')}")
		if (@templaterState.innerContent('tagStart').indexOf (DocUtils.tags.start))==-1 then throw new Error("no opening tag at @templaterState.tagStart.numXmlTag #{@templaterState.innerContent('tagStart')}")

		sTag=DocUtils.tags.start
		eTag=DocUtils.tags.end

		if @templaterState.tagEnd.numXmlTag==@templaterState.tagStart.numXmlTag #<w>{aaaaa}</w>
			options=
				xmlTagNumber:@templaterState.tagStart.numXmlTag
				insideValue:@templaterState.innerContent('tagStart').replace "#{sTag}#{@templaterState.textInsideTag}#{eTag}", newValue
				noStartTag:@templaterState.matches[@templaterState.tagStart.numXmlTag].first?
				noEndTag:@templaterState.matches[@templaterState.tagStart.numXmlTag].last?

			return @replaceXmlTag(content,options)
		else if @templaterState.tagEnd.numXmlTag>@templaterState.tagStart.numXmlTag #<w>{aaa</w> ... <w> aaa} </w> or worse
			# 1. for the first (@templaterState.tagStart.numXmlTag): replace **{tag by **tagValue
			sInnerContent=@templaterState.innerContent('tagStart')
			leftValue= sInnerContent.substr(0,sInnerContent.indexOf(sTag))

			options=
				xmlTagNumber:@templaterState.tagStart.numXmlTag
				noStartTag:@templaterState.matches[@templaterState.tagStart.numXmlTag].first?

			options.insideValue=newValue
			if !@templaterState.matches[@templaterState.tagStart.numXmlTag].first? and !@templaterState.matches[@templaterState.tagStart.numXmlTag].last?  #normal case
				options.insideValue=leftValue+newValue

			content= @replaceXmlTag(content,options)

			#2. for in between (@templaterState.tagStart.numXmlTag+1...@templaterState.tagEnd.numXmlTag) replace whole by ""

			options=
				insideValue:""
				spacePreserve:false

			for k in [(@templaterState.tagStart.numXmlTag+1)...@templaterState.tagEnd.numXmlTag]
				options.xmlTagNumber=k
				content= @replaceXmlTag(content, options)

			#3. for the last (@templaterState.tagEnd.numXmlTag) replace ..}__ by ".." ###
			sInnerContent=@templaterState.innerContent('tagEnd')
			leftValue= sInnerContent.substr(sInnerContent.indexOf(eTag)+1)
			options =
				insideValue:leftValue
				spacePreserve:true
				xmlTagNumber:k
				noEndTag:@templaterState.matches[@templaterState.tagStart.numXmlTag].last? or @templaterState.matches[@templaterState.tagStart.numXmlTag].first?
			return @replaceXmlTag(content, options)
	replaceLoopTag:()->
		#You DashLoop= take the outer scope only if you are in a table
		if @templaterState.loopType()=='dash'
			return @dashLoop(@templaterState.loopOpen.element)
		if @intelligentTagging==on
			dashElement=@calcIntellegentlyDashElement()
			if dashElement!=false then return @dashLoop(dashElement,true)
		@forLoop()
	calcSubXmlTemplater:(innerTagsContent,argOptions)->
		options= @toJson()
		if argOptions?
			if argOptions.Tags?
				options.Tags=argOptions.Tags
				options.scopeList = options.scopeList.concat(argOptions.Tags)
				options.scopePath= options.scopePath.concat(@templaterState.loopOpen.tag)
		subfile= new @currentClass innerTagsContent,options
		subsubfile=subfile.applyTags()
		@imageId=subfile.imageId
		subsubfile
	forLoop: (innerTagsContent=@templaterState.findInnerTagsContent(@content).content,outerTagsContent=@templaterState.findOuterTagsContent(@content).content)->
		###
			<w:t>{#forTag} blabla</w:t>
			Blabla1
			Blabla2
			<w:t>{/forTag}</w:t>

			Let innerTagsContent be what is in between the first closing tag and the second opening tag | blabla....Blabla2<w:t>|
			Let outerTagsContent what is in between the first opening tag  and the last closing tag     |{#forTag} blabla....Blabla2<w:t>{/forTag}|
			We replace outerTagsContent by n*innerTagsContent, n is equal to the length of the array in scope forTag
			<w:t>subContent subContent subContent</w:t>
		###
		tag=@templaterState.loopOpen.tag
		newContent=""
		@scopeManager.loopOver tag, (subTags) =>
			subfile=@calcSubXmlTemplater(innerTagsContent,{Tags:subTags})
			newContent+=subfile.content
		, @templaterState.loopIsInverted
		if !@scopeManager.getValue(tag)?
			# This line is only for having the ability to retrieve the tags from a document
			@calcSubXmlTemplater(innerTagsContent,{Tags:{}})
		@content=@content.replace outerTagsContent, newContent
		@calcSubXmlTemplater(@content)
