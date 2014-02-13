root= global ? window
env= if global? then 'node' else 'browser'

#This is an abstract class, DocXTemplater is an example of inherited class

XmlTemplater =  class XmlTemplater #abstract class !!
	constructor: (content="",options={}) ->
		@tagX='' #TagX represents the name of the tag that contains text. For example, in docx, @tagX='w:t'
		@currentClass=XmlTemplater #This is used because tags are recursive, so the class needs to be able to instanciate an object of the same class. I created a variable so you don't have to Override all functions relative to recursivity
		@fromJson(options)
		@currentScope=@Tags
		@templaterState= new TemplaterState
	load: (@content) ->
		@templaterState.matches = @_getFullTextMatchesFromData()
		@templaterState.charactersAdded= (0 for i in [0...@templaterState.matches.length])
		@handleRecursiveCase()
	getValueFromScope: (tag,scope) ->
		@useTag(tag)
		if scope[tag]?
			content= DocUtils.encode_utf8 scope[tag]
		else
			content= "undefined"
			@DocxGen.logUndefined(tag,scope)
		if content.indexOf('{')!=-1 or content.indexOf('}')!=-1
			throw "You can't enter { or  } inside the content of a variable"
		content
	getFullText:() ->
		@templaterState.matches= @_getFullTextMatchesFromData() #get everything that is between <w:t>
		output= (match[2] for match in @templaterState.matches) #get only the text
		DocUtils.decode_utf8(output.join("")) #join it
	_getFullTextMatchesFromData: () ->
		@templaterState.matches= DocUtils.preg_match_all("(<#{@tagX}[^>]*>)([^<>]*)?</#{@tagX}>",@content)
	calcInnerTextScope: (text,start,end,tag) -> #tag: w:t
		endTag= text.indexOf('</'+tag+'>',end)
		if endTag==-1 then throw "can't find endTag #{endTag}"
		endTag+=('</'+tag+'>').length
		startTag = Math.max text.lastIndexOf('<'+tag+'>',start), text.lastIndexOf('<'+tag+' ',start)
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
	forLoop: (innerTagsContent="",outerTagsContent="") ->
		###
			<w:t>{#forTag} blabla</w:t>
			Blabla1
			Blabla2
			<w:t>{/forTag}</w:t>

			Let innerTagsContent be what is in between the first closing bracket and the second opening bracket
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
		if innerTagsContent=="" and outerTagsContent==""
			outerTagsContent= @findOuterTagsContent().content
			innerTagsContent= @findInnerTagsContent().content
			if outerTagsContent[0]!='{' or outerTagsContent.indexOf('{')==-1 or outerTagsContent.indexOf('/')==-1 or outerTagsContent.indexOf('}')==-1 or outerTagsContent.indexOf('#')==-1 then throw "no {,#,/ or } found in outerTagsContent: #{outerTagsContent}"

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
		resultFullScope = @calcInnerTextScope @content, start, end, elementDashLoop
		for t in [0..@templaterState.matches.length]
			@templaterState.charactersAdded[t]-=resultFullScope.startTag
		B= resultFullScope.text
		if (@content.indexOf B)==-1 then throw "couln't find B in @content"
		A = B
		copyA= A

		#for deleting the opening tag

		@templaterState.bracketEnd= {"numMatch":@templaterState.loopOpen.end.numMatch,"numCharacter":@templaterState.loopOpen.end.numCharacter}
		@templaterState.bracketStart= {"numMatch":@templaterState.loopOpen.start.numMatch,"numCharacter":@templaterState.loopOpen.start.numCharacter}
		if sharp==false then @templaterState.textInsideTag= "-"+@templaterState.loopOpen.element+" "+@templaterState.loopOpen.tag
		if sharp==true then @templaterState.textInsideTag= "#"+@templaterState.loopOpen.tag

		A= @replaceTagByValue("",A)
		if copyA==A then throw "A should have changed after deleting the opening tag"
		copyA= A

		@templaterState.textInsideTag= "/"+@templaterState.loopOpen.tag
		#for deleting the closing tag
		@templaterState.bracketEnd= {"numMatch":@templaterState.loopClose.end.numMatch,"numCharacter":@templaterState.loopClose.end.numCharacter}
		@templaterState.bracketStart= {"numMatch":@templaterState.loopClose.start.numMatch,"numCharacter":@templaterState.loopClose.start.numCharacter}
		A= @replaceTagByValue("",A)

		if copyA==A then throw "A should have changed after deleting the opening tag"

		return @forLoop(A,B)

	replaceXmlTag: (content,tagNumber,insideValue,spacePreserve=false,noStartTag=false) ->
		@templaterState.matches[tagNumber][2]=insideValue #so that the templaterState.matches are still correct
		startTag= @templaterState.matches[tagNumber].offset+@templaterState.charactersAdded[tagNumber]  #where the open tag starts: <w:t>
		#calculate the replacer according to the params
		if noStartTag == true
			replacer= insideValue
		else
			if spacePreserve==true
				replacer= """<#{@tagX} xml:space="preserve">#{insideValue}</#{@tagX}>"""
			else replacer= @templaterState.matches[tagNumber][1]+insideValue+"</#{@tagX}>"
		@templaterState.charactersAdded[tagNumber+1]+=replacer.length-@templaterState.matches[tagNumber][0].length
		if content.indexOf(@templaterState.matches[tagNumber][0])==-1 then throw "content #{@templaterState.matches[tagNumber][0]} not found in content"
		copyContent= content
		content = DocUtils.replaceFirstFrom content,@templaterState.matches[tagNumber][0], replacer, startTag
		@templaterState.matches[tagNumber][0]=replacer

		if copyContent==content then throw "offset problem0: didnt changed the value (should have changed from #{@templaterState.matches[@templaterState.bracketStart.numMatch][0]} to #{replacer}"
		content

	replaceTagByValue: (newValue,content=@content) ->
		console.log(@templaterState)
		if (@templaterState.matches[@templaterState.bracketEnd.numMatch][2].indexOf ('}'))==-1 then throw "no closing bracket at @templaterState.bracketEnd.numMatch #{@templaterState.matches[@templaterState.bracketEnd.numMatch][2]}"
		if (@templaterState.matches[@templaterState.bracketStart.numMatch][2].indexOf ('{'))==-1 then throw "no opening bracket at @templaterState.bracketStart.numMatch #{@templaterState.matches[@templaterState.bracketStart.numMatch][2]}"
		copyContent=content
		if @templaterState.bracketEnd.numMatch==@templaterState.bracketStart.numMatch #<w>{aaaaa}</w>
			if (@templaterState.matches[@templaterState.bracketStart.numMatch].first?)
				insideValue= @templaterState.matches[@templaterState.bracketStart.numMatch][2].replace "{#{@templaterState.textInsideTag}}", newValue
				content= @replaceXmlTag(content,@templaterState.bracketStart.numMatch,insideValue,true,true)

			else if (@templaterState.matches[@templaterState.bracketStart.numMatch].last?)
				insideValue= @templaterState.matches[@templaterState.bracketStart.numMatch][0].replace "{#{@templaterState.textInsideTag}}", newValue
				content= @replaceXmlTag(content,@templaterState.bracketStart.numMatch,insideValue,true,true)
			else
				insideValue= @templaterState.matches[@templaterState.bracketStart.numMatch][2].replace "{#{@templaterState.textInsideTag}}", newValue
				content= @replaceXmlTag(content,@templaterState.bracketStart.numMatch,insideValue,true)

		else if @templaterState.bracketEnd.numMatch>@templaterState.bracketStart.numMatch

			# 1. for the first (@templaterState.bracketStart.numMatch): replace __{.. by __value
			regexRight= /^([^{]*){.*$/
			subMatches= @templaterState.matches[@templaterState.bracketStart.numMatch][2].match regexRight

			if @templaterState.matches[@templaterState.bracketStart.numMatch].first? #if the content starts with:  {tag</w:t>
				content= @replaceXmlTag(content,@templaterState.bracketStart.numMatch,newValue,true,true)
			else if @templaterState.matches[@templaterState.bracketStart.numMatch].last?
				content= @replaceXmlTag(content,@templaterState.bracketStart.numMatch,newValue,true,true)
			else
				insideValue=subMatches[1]+newValue
				content= @replaceXmlTag(content,@templaterState.bracketStart.numMatch,insideValue,true)

			#2. for in between (@templaterState.bracketStart.numMatch+1...@templaterState.bracketEnd.numMatch) replace whole by ""
			for k in [(@templaterState.bracketStart.numMatch+1)...@templaterState.bracketEnd.numMatch]
				@templaterState.charactersAdded[k+1]=@templaterState.charactersAdded[k]
				content= @replaceXmlTag(content,k,"")

			#3. for the last (@templaterState.bracketEnd.numMatch) replace ..}__ by ".." ###
			regexLeft= /^[^}]*}(.*)$/;
			insideValue = @templaterState.matches[@templaterState.bracketEnd.numMatch][2].replace regexLeft, '$1'
			@templaterState.charactersAdded[@templaterState.bracketEnd.numMatch+1]=@templaterState.charactersAdded[@templaterState.bracketEnd.numMatch]
			content= @replaceXmlTag(content,k, insideValue,true)

		for match, j in @templaterState.matches when j>@templaterState.bracketEnd.numMatch
			@templaterState.charactersAdded[j+1]=@templaterState.charactersAdded[j]
		if copyContent==content then throw "copycontent=content !!"
		content
	###
	content is the whole content to be tagged
	scope is the current scope
	returns the new content of the tagged content###
	applyTags:()->
		@templaterState.initialize()
		for match,numMatch in @templaterState.matches
			innerText= if match[2]? then match[2] else "" #text inside the <w:t>
			for character,numCharacter in innerText
				@templaterState.currentStep={'numMatch':numMatch,'numCharacter':numCharacter}
				for m,t in @templaterState.matches when t<=numMatch
					if @content[m.offset+@templaterState.charactersAdded[t]]!=m[0][0] then throw "no < at the beginning of #{m[0][0]} (2)"
				if character=='{'
					@templaterState.startTag()
				else if character == '}'
					@templaterState.endTag()
					result=@executeEndTag()
					if result!=undefined
						return result
				else #if character != '{' and character != '}'
					if @templaterState.inTag is true then @templaterState.textInsideTag+=character
		new ImgReplacer(this).findImages().replaceImages()
		this
	handleRecursiveCase:()->
		###
		Because xmlTemplater is recursive (meaning it can call it self), we need to handle special cases where the XML is not valid:
		For example with this string "I am</w:t></w:r></w:p><w:p><w:r><w:t>sleeping",
			- we need to match also the string that is inside an implicit <w:t> (that's the role of replacerUnshift)
			- we need to match the string that is at the right of a <w:t> (that's the role of replacerPush)
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

		regex= "(<#{@tagX}[^>]*>)([^>]+)$"
		@content.replace (new RegExp(regex)),replacerPush

	#set the tag as used, so that DocxGen can return the list off all tags
	useTag: (tag) ->
		u = @usedTags
		for s,i in @scopePath
			u[s]={} unless u[s]?
			u = u[s]
		if tag!=""
			u[tag]= true
	calcIntellegentlyDashElement:()->return false
	executeEndTag:()->
		if @templaterState.loopType()=='simple'
			@content = @replaceTagByValue(@getValueFromScope(@templaterState.textInsideTag,@currentScope))
		if @templaterState.textInsideTag[0]=='/' and ('/'+@templaterState.loopOpen.tag == @templaterState.textInsideTag)
			#You DashLoop= take the outer scope only if you are in a table
			if @templaterState.loopType()=='dash'
				return @dashLoop(@templaterState.loopOpen.element)
			if @intelligentTagging==on
				dashElement=@calcIntellegentlyDashElement()
				if dashElement!=false then return @dashLoop(dashElement,true)
			return @forLoop()
		return undefined
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
