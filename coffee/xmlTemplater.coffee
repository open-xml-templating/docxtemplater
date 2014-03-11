root= global ? window
env= if global? then 'node' else 'browser'

#This is an abstract class, DocXTemplater is an example of inherited class

XmlTemplater =  class XmlTemplater #abstract class !!
	constructor: (content="",options={}) ->
		@tagXml='' #tagXml represents the name of the tag that contains text. For example, in docx, @tagXml='w:t'
		@currentClass=XmlTemplater #This is used because tags are recursive, so the class needs to be able to instanciate an object of the same class. I created a variable so you don't have to Override all functions relative to recursivity
		@fromJson(options)
		@currentScope=@Tags
		@templaterState= new TemplaterState
	load: (@content) ->
		@templaterState.matches = @_getFullTextMatchesFromData()
		@templaterState.charactersAdded= (0 for i in [0...@templaterState.matches.length])
		@handleRecursiveCase()
	parser: (tag) ->
		return {
		'get':(scope) -> return scope[tag]
		}
	getValueFromScope: (tag=@templaterState.loopOpen.tag,scope=@currentScope) ->
		parser=@parser(tag)
		result=parser.get(scope)
		if result?
			if typeof result=='string'
				@useTag(tag)
				value= DocUtils.encode_utf8 result
				if value.indexOf('{')!=-1 or value.indexOf('}')!=-1
					throw "You can't enter { or  } inside the content of a variable"
			else value= result
		else
			@useTag(tag)
			value= "undefined"
			@DocxGen.logUndefined(tag,scope)
		value
	getFullText:() ->
		@templaterState.matches= @_getFullTextMatchesFromData() #get everything that is between <w:t>
		output= (match[2] for match in @templaterState.matches) #get only the text
		DocUtils.decode_utf8(output.join("")) #join it
	_getFullTextMatchesFromData: () ->
		@templaterState.matches= DocUtils.preg_match_all("(<#{@tagXml}[^>]*>)([^<>]*)</#{@tagXml}>",@content)
	calcOuterXml: (text,start,end,xmlTag) -> #tag: w:t
		endTag= text.indexOf('</'+xmlTag+'>',end)
		if endTag==-1 then throw "can't find endTag #{endTag}"
		endTag+=('</'+xmlTag+'>').length
		startTag = Math.max text.lastIndexOf('<'+xmlTag+'>',start), text.lastIndexOf('<'+xmlTag+' ',start)
		if startTag==-1 then throw "can't find startTag"
		{"text":text.substr(startTag,endTag-startTag),startTag,endTag}
	findOuterTagsContent: () ->
		start = @templaterState.calcStartTag @templaterState.loopOpen
		end= @templaterState.calcEndTag @templaterState.loopClose
		{content:@content.substr(start,end-start),start,end}
	findInnerTagsContent: () ->
		start= @templaterState.calcEndTag @templaterState.loopOpen
		end= @templaterState.calcStartTag @templaterState.loopClose
		{content:@content.substr(start,end-start),start,end}
	fromJson:(options)->
		@Tags= if options.Tags? then options.Tags else {}
		@DocxGen= if options.DocxGen? then options.DocxGen else null
		@intelligentTagging=if options.intelligentTagging? then options.intelligentTagging else off
		@scopePath=if options.scopePath? then options.scopePath else []
		@usedTags=if options.usedTags? then options.usedTags else {}
		@imageId=if options.imageId? then options.imageId else 0
	toJson: () ->
		Tags:DocUtils.clone @Tags
		DocxGen:@DocxGen
		intelligentTagging:DocUtils.clone @intelligentTagging
		scopePath:DocUtils.clone @scopePath
		usedTags:@usedTags
		localImageCreator:@localImageCreator
		imageId:@imageId
	forLoop: (innerTagsContent=@findInnerTagsContent().content,outerTagsContent=@findOuterTagsContent().content)->
		###
			<w:t>{#forTag} blabla</w:t>
			Blabla1
			Blabla2
			<w:t>{/forTag}</w:t>

			Let innerTagsContent be what is in between the first closing tag and the second opening tag
			Let outerTagsContent what is in between the first opening tag {# and the last closing tag

			innerTagsContent=</w:t>
			Blabla1
			Blabla2
			<w:t>

			outerTagsContent={#forTag}</w:t>
			Blabla1
			Blabla2
			<w:t>{/forTag}

			We replace outerTagsContent by n*innerTagsContent, n is equal to the length of the array in scope forTag
			<w:t>subContent subContent subContent</w:t>
		###

		tagValue=@currentScope[@templaterState.loopOpen.tag]
		newContent= "";
		if tagValue?
			if typeof tagValue == 'object'
				for scope,i in tagValue
					subfile=@calcSubXmlTemplater(innerTagsContent,scope)
					newContent+=subfile.content
			if tagValue == true
				subfile=@calcSubXmlTemplater(innerTagsContent,@currentScope)
				newContent+=subfile.content
		else
			subfile=@calcSubXmlTemplater(innerTagsContent,{})

		@content=@content.replace outerTagsContent, newContent

		nextFile=@calcSubXmlTemplater(@content)
		if ((nextFile.getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{nextFile.getFullText()} (3)"
		nextFile
	dashLoop: (elementDashLoop,sharp=false) ->
		{content,start,end}= @findOuterTagsContent()
		outerXml = @calcOuterXml @content, start, end, elementDashLoop
		for t in [0..@templaterState.matches.length]
			@templaterState.charactersAdded[t]-=outerXml.startTag
		outerXmlText= outerXml.text
		if (@content.indexOf outerXmlText)==-1 then throw "couln't find outerXmlText in @content"
		innerXmlText = outerXmlText
		copyinnerXmlText= innerXmlText

		#for deleting the opening tag

		@templaterState.tagEnd= {"numXmlTag":@templaterState.loopOpen.end.numXmlTag,"numCharacter":@templaterState.loopOpen.end.numCharacter}
		@templaterState.tagStart= {"numXmlTag":@templaterState.loopOpen.start.numXmlTag,"numCharacter":@templaterState.loopOpen.start.numCharacter}
		if sharp==false then @templaterState.textInsideTag= "-"+@templaterState.loopOpen.element+" "+@templaterState.loopOpen.tag
		if sharp==true then @templaterState.textInsideTag= "#"+@templaterState.loopOpen.tag

		innerXmlText= @replaceTagByValue("",innerXmlText)
		if copyinnerXmlText==innerXmlText then throw "innerXmlText should have changed after deleting the opening tag"
		copyinnerXmlText= innerXmlText

		@templaterState.textInsideTag= "/"+@templaterState.loopOpen.tag
		#for deleting the closing tag
		@templaterState.tagEnd= {"numXmlTag":@templaterState.loopClose.end.numXmlTag,"numCharacter":@templaterState.loopClose.end.numCharacter}
		@templaterState.tagStart= {"numXmlTag":@templaterState.loopClose.start.numXmlTag,"numCharacter":@templaterState.loopClose.start.numCharacter}
		innerXmlText= @replaceTagByValue("",innerXmlText)

		if copyinnerXmlText==innerXmlText then throw "innerXmlText should have changed after deleting the opening tag"

		return @forLoop(innerXmlText,outerXmlText)

	xmlToBeReplaced:(noStartTag,spacePreserve, insideValue,xmlTagNumber)->
		if noStartTag == true
			return insideValue
		else
			if spacePreserve==true
				return """<#{@tagXml} xml:space="preserve">#{insideValue}</#{@tagXml}>"""
			else
				return @templaterState.matches[xmlTagNumber][1]+insideValue+"</#{@tagXml}>"
	replaceXmlTag: (content,options) ->
		xmlTagNumber=options.xmlTagNumber
		insideValue=options.insideValue
		spacePreserve= if options.spacePreserve? then options.spacePreserve else true
		noStartTag= if options.noStartTag? then options.noStartTag else false
		replacer=@xmlToBeReplaced(noStartTag,spacePreserve,insideValue,xmlTagNumber)
		@templaterState.matches[xmlTagNumber][2]=insideValue #so that the templaterState.matches are still correct
		startTag= @templaterState.matches[xmlTagNumber].offset+@templaterState.charactersAdded[xmlTagNumber]  #where the open tag starts: <w:t>
		#calculate the replacer according to the params
		@templaterState.charactersAdded[xmlTagNumber+1]+=replacer.length-@templaterState.matches[xmlTagNumber][0].length
		if content.indexOf(@templaterState.matches[xmlTagNumber][0])==-1 then throw "content #{@templaterState.matches[xmlTagNumber][0]} not found in content"
		copyContent= content
		content = DocUtils.replaceFirstFrom content,@templaterState.matches[xmlTagNumber][0], replacer, startTag
		@templaterState.matches[xmlTagNumber][0]=replacer

		if copyContent==content then throw "offset problem0: didnt changed the value (should have changed from #{@templaterState.matches[@templaterState.tagStart.numXmlTag][0]} to #{replacer}"
		content

	replaceTagByValue: (newValue,content=@content) ->
		if (@templaterState.matches[@templaterState.tagEnd.numXmlTag][2].indexOf ('}'))==-1 then throw "no closing tag at @templaterState.tagEnd.numXmlTag #{@templaterState.matches[@templaterState.tagEnd.numXmlTag][2]}"
		if (@templaterState.matches[@templaterState.tagStart.numXmlTag][2].indexOf ('{'))==-1 then throw "no opening tag at @templaterState.tagStart.numXmlTag #{@templaterState.matches[@templaterState.tagStart.numXmlTag][2]}"
		copyContent=content
		if @templaterState.tagEnd.numXmlTag==@templaterState.tagStart.numXmlTag #<w>{aaaaa}</w>
			insideValue= @templaterState.matches[@templaterState.tagStart.numXmlTag][2].replace "{#{@templaterState.textInsideTag}}", newValue
			content= @replaceXmlTag(content,
			{
				xmlTagNumber:@templaterState.tagStart.numXmlTag
				insideValue:insideValue
				noStartTag:@templaterState.matches[@templaterState.tagStart.numXmlTag].first? or @templaterState.matches[@templaterState.tagStart.numXmlTag].last?
			})
		else if @templaterState.tagEnd.numXmlTag>@templaterState.tagStart.numXmlTag

			# 1. for the first (@templaterState.tagStart.numXmlTag): replace **{tag by **tagValue
			regexRight= /^([^{]*){.*$/
			subMatches= @templaterState.matches[@templaterState.tagStart.numXmlTag][2].match regexRight

			if @templaterState.matches[@templaterState.tagStart.numXmlTag].first? or @templaterState.matches[@templaterState.tagStart.numXmlTag].last? #if the content starts with:  {tag</w:t>
				content= @replaceXmlTag(content,
				{
					xmlTagNumber:@templaterState.tagStart.numXmlTag
					insideValue:newValue
					noStartTag:@templaterState.matches[@templaterState.tagStart.numXmlTag].last?
				})
			else
				content= @replaceXmlTag(content,
				{
					xmlTagNumber:@templaterState.tagStart.numXmlTag
					insideValue:subMatches[1]+newValue
				})

			#2. for in between (@templaterState.tagStart.numXmlTag+1...@templaterState.tagEnd.numXmlTag) replace whole by ""
			for k in [(@templaterState.tagStart.numXmlTag+1)...@templaterState.tagEnd.numXmlTag]
				@templaterState.charactersAdded[k+1]=@templaterState.charactersAdded[k]
				content= @replaceXmlTag(content,
				{
					xmlTagNumber:k
					insideValue:""
					spacePreserve:false
				})

			#3. for the last (@templaterState.tagEnd.numXmlTag) replace ..}__ by ".." ###
			regexLeft= /^[^}]*}(.*)$/;
			insideValue = @templaterState.matches[@templaterState.tagEnd.numXmlTag][2].replace regexLeft, '$1'
			@templaterState.charactersAdded[@templaterState.tagEnd.numXmlTag+1]=@templaterState.charactersAdded[@templaterState.tagEnd.numXmlTag]
			content= @replaceXmlTag(content,
			{
				xmlTagNumber:k
				insideValue:insideValue
			})

		for match, j in @templaterState.matches when j>@templaterState.tagEnd.numXmlTag
			@templaterState.charactersAdded[j+1]=@templaterState.charactersAdded[j]
		if copyContent==content then throw "copycontent=content !!"
		content
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
				for m,t in @templaterState.matches when t<=numXmlTag
					if @content[m.offset+@templaterState.charactersAdded[t]]!=m[0][0] then throw "no < at the beginning of #{m[0][0]} (2)"
				if character=='{'
					@templaterState.startTag()
				else if character == '}'
					@templaterState.endTag()
					if @templaterState.loopType()=='simple'
						@replaceSimpleTag()
					if @templaterState.textInsideTag[0]=='/' and ('/'+@templaterState.loopOpen.tag == @templaterState.textInsideTag)
						return @replaceLoopTag()
				else #if character != '{' and character != '}'
					if @templaterState.inTag is true then @templaterState.textInsideTag+=character
		new ImgReplacer(this).findImages().replaceImages()
		this
	handleRecursiveCase:()->
		###
		Because xmlTemplater is recursive (meaning it can call it self), we need to handle special cases where the XML is not valid:
		For example with this string "I am</w:t></w:r></w:p><w:p><w:r><w:t>sleeping",
			- we need to match also the string that is inside an implicit <w:t> (that's the role of replacerUnshift) (in this case 'I am')
			- we need to match the string that is at the right of a <w:t> (that's the role of replacerPush) (in this case 'sleeping')
		the test: describe "scope calculation" it "should compute the scope between 2 <w:t>" makes sure that this part of code works
		It should even work if they is no XML at all, for example if the code is just "I am sleeping", in this case however, they should only be one match
		###
		replacerUnshift = (match,pn ..., offset, string)=>
			pn.unshift match #add match so that pn[0] = whole match, pn[1]= first parenthesis,...
			pn.offset= offset
			pn.first= true
			@templaterState.matches.unshift pn #add at the beginning
			@templaterState.charactersAdded.unshift 0
		@content.replace /^()([^<]+)/,replacerUnshift

		replacerPush = (match,pn ..., offset, string)=>
			pn.unshift match #add match so that pn[0] = whole match, pn[1]= first parenthesis,...
			pn.offset= offset
			pn.last= true
			@templaterState.matches.push pn #add at the beginning
			@templaterState.charactersAdded.push 0

		regex= "(<#{@tagXml}[^>]*>)([^>]+)$"
		@content.replace (new RegExp(regex)),replacerPush

	#set the tag as used, so that DocxGen can return the list off all tags
	useTag: (tag) ->
		u = @usedTags
		for s,i in @scopePath
			u[s]={} unless u[s]?
			u = u[s]
		if tag!=""
			u[tag]= true
	calcIntellegentlyDashElement:()->return false #to be implemented by classes that inherit xmlTemplater, eg DocxTemplater
	replaceSimpleTag:()->
		@content = @replaceTagByValue(@getValueFromScope(@templaterState.textInsideTag))
	replaceLoopTag:()->
		#You DashLoop= take the outer scope only if you are in a table
		if @templaterState.loopType()=='dash'
			return @dashLoop(@templaterState.loopOpen.element)
		if @intelligentTagging==on
			dashElement=@calcIntellegentlyDashElement()
			if dashElement!=false then return @dashLoop(dashElement,true)
		@forLoop()
	calcSubXmlTemplater:(innerTagsContent,scope)->
		options= @toJson()
		if scope?
			options.Tags= scope
			options.scopePath= options.scopePath.concat(@templaterState.loopOpen.tag)
		subfile= new @currentClass innerTagsContent,options
		subfile.applyTags()
		if ((subfile.getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{subfile.getFullText()} (1)"
		@imageId=subfile.imageId
		subfile


root.XmlTemplater=XmlTemplater
