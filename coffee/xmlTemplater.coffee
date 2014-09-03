root= global ? window
env= if global? then 'node' else 'browser'

#This is an abstract class, DocXTemplater is an example of inherited class

root.XmlTemplater =  class XmlTemplater #abstract class !!
	constructor: (content="",options={}) ->
		@tagXml='' #tagXml represents the name of the tag that contains text. For example, in docx, @tagXml='w:t'
		@currentClass=root.XmlTemplater #This is used because tags are recursive, so the class needs to be able to instanciate an object of the same class. I created a variable so you don't have to Override all functions relative to recursivity
		@fromJson(options)
		@templaterState= new TemplaterState
		@currentScope=@Tags
		@valF=0
	load: (@content) ->
		xmlMatcher=new XmlMatcher(@content).parse(@tagXml)
		@templaterState.matches = xmlMatcher.matches
		@templaterState.charactersAdded= xmlMatcher.charactersAdded
	fromJson:(options={})->
		@Tags= if options.Tags? then options.Tags else {}
		@DocxGen= if options.DocxGen? then options.DocxGen else null
		@intelligentTagging=if options.intelligentTagging? then options.intelligentTagging else off
		@scopePath=if options.scopePath? then options.scopePath else []
		@usedTags=if options.usedTags? then options.usedTags else {}
		@imageId=if options.imageId? then options.imageId else 0
		@chartId=if options.chartId? then options.chartId else 0
		@parser= if options.parser? then options.parser else root.DocUtils.defaultParser
		@scopeManager=new ScopeManager(@Tags,@scopePath,@usedTags,@Tags,@parser)
	toJson: () ->
		Tags:DocUtils.clone @scopeManager.tags
		DocxGen:@DocxGen
		intelligentTagging:DocUtils.clone @intelligentTagging
		scopePath:DocUtils.clone @scopeManager.scopePath
		usedTags:@scopeManager.usedTags
		localImageCreator:@localImageCreator
		imageId:@imageId
		chartId:@chartId
		parser:@parser
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
		if @DocxGen? and @DocxGen.qrCode
			new ImgReplacer(this).findImages().replaceImages()
			new ChartReplacer(this).findCharts().replaceCharts()
		this
	replaceSimpleTag:()->
		newValue=@scopeManager.getValueFromScope(@templaterState.textInsideTag)
		@content = @replaceTagByValue(DocUtils.utf8ToWord(newValue))
		@content
	replaceSimpleTagRawXml:()->
		subContent=new SubContent(@content).getInnerTag(@templaterState).getOuterXml('w:p')
		newText=@scopeManager.getValueFromScope(@templaterState.tag)
		@templaterState.moveCharacters(@templaterState.tagStart.numXmlTag,newText,subContent.text)
		@content= subContent.replace(newText).fullText
	deleteOuterTags:(outerXmlText,sharp)->
		#delete the opening tag
		@templaterState.tagEnd= {"numXmlTag":@templaterState.loopOpen.end.numXmlTag,"numCharacter":@templaterState.loopOpen.end.numCharacter}
		@templaterState.tagStart= {"numXmlTag":@templaterState.loopOpen.start.numXmlTag,"numCharacter":@templaterState.loopOpen.start.numCharacter}
		if sharp==false then @templaterState.textInsideTag= "-"+@templaterState.loopOpen.element+" "+@templaterState.loopOpen.tag
		if sharp==true then @templaterState.textInsideTag= "#"+@templaterState.loopOpen.tag
		xmlText= @replaceTagByValue("",outerXmlText)

		#delete the closing tag
		@templaterState.tagEnd= {"numXmlTag":@templaterState.loopClose.end.numXmlTag,"numCharacter":@templaterState.loopClose.end.numCharacter}
		@templaterState.tagStart= {"numXmlTag":@templaterState.loopClose.start.numXmlTag,"numCharacter":@templaterState.loopClose.start.numCharacter}
		@templaterState.textInsideTag= "/"+@templaterState.loopOpen.tag
		@replaceTagByValue("",xmlText)
	dashLoop: (elementDashLoop,sharp=false) ->
		{_,start,end}= @templaterState.findOuterTagsContent(@content)
		outerXml = @getOuterXml @content, start, end, elementDashLoop
		@templaterState.moveCharacters(0,"",outerXml.startTag)
		outerXmlText= outerXml.text
		innerXmlText=@deleteOuterTags(outerXmlText,sharp)
		@forLoop(innerXmlText,outerXmlText)
	xmlToBeReplaced:(noStartTag,spacePreserve, insideValue,xmlTagNumber,noEndTag)->
		if noStartTag == true
			return insideValue
		else
			if spacePreserve==true 
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
		@templaterState.moveCharacters(xmlTagNumber+1,replacer,@templaterState.matches[xmlTagNumber][0])
		if content.indexOf(@templaterState.matches[xmlTagNumber][0])==-1 then throw new Error("content #{@templaterState.matches[xmlTagNumber][0]} not found in content")
		content = DocUtils.replaceFirstFrom content,@templaterState.matches[xmlTagNumber][0], replacer, startTag
		@templaterState.matches[xmlTagNumber][0]=replacer
		content
	replaceTagByValue: (newValue,content=@content) ->
		if (@templaterState.matches[@templaterState.tagEnd.numXmlTag][2].indexOf (DocUtils.tags.end))==-1 then throw new Error("no closing tag at @templaterState.tagEnd.numXmlTag #{@templaterState.matches[@templaterState.tagEnd.numXmlTag][2]}")
		if (@templaterState.matches[@templaterState.tagStart.numXmlTag][2].indexOf (DocUtils.tags.start))==-1 then throw new Error("no opening tag at @templaterState.tagStart.numXmlTag #{@templaterState.matches[@templaterState.tagStart.numXmlTag][2]}")

		sTag=DocUtils.tags.start
		eTag=DocUtils.tags.end

		if @templaterState.tagEnd.numXmlTag==@templaterState.tagStart.numXmlTag #<w>{aaaaa}</w>
			options=
				xmlTagNumber:@templaterState.tagStart.numXmlTag
				insideValue:@templaterState.matches[@templaterState.tagStart.numXmlTag][2].replace "#{sTag}#{@templaterState.textInsideTag}#{eTag}", newValue
				noStartTag:@templaterState.matches[@templaterState.tagStart.numXmlTag].first? or @templaterState.matches[@templaterState.tagStart.numXmlTag].last?

			content= @replaceXmlTag(content,options)
		else if @templaterState.tagEnd.numXmlTag>@templaterState.tagStart.numXmlTag #<w>{aaa</w> ... <w> aaa} </w> or worse
			# 1. for the first (@templaterState.tagStart.numXmlTag): replace **{tag by **tagValue
			regexRight= new RegExp("^([^#{sTag}]*)#{sTag}.*$")
			subMatches= @templaterState.matches[@templaterState.tagStart.numXmlTag][2].match regexRight

			options=
				xmlTagNumber:@templaterState.tagStart.numXmlTag

			if !@templaterState.matches[@templaterState.tagStart.numXmlTag].first? and !@templaterState.matches[@templaterState.tagStart.numXmlTag].last?  #normal case
				options.insideValue=subMatches[1]+newValue
			else #if the content starts with:  {tag</w:t> (when handling recursive cases)
				options.insideValue=newValue
				options.noStartTag=@templaterState.matches[@templaterState.tagStart.numXmlTag].first?

			content= @replaceXmlTag(content,options)

			#2. for in between (@templaterState.tagStart.numXmlTag+1...@templaterState.tagEnd.numXmlTag) replace whole by ""

			options=
				insideValue:""
				spacePreserve:false

			for k in [(@templaterState.tagStart.numXmlTag+1)...@templaterState.tagEnd.numXmlTag]
				options.xmlTagNumber=k
				content= @replaceXmlTag(content, options)

			#3. for the last (@templaterState.tagEnd.numXmlTag) replace ..}__ by ".." ###
			regexLeft= new RegExp ("^[^#{eTag}]*#{eTag}(.*)$")
			options =
				insideValue:@templaterState.matches[@templaterState.tagEnd.numXmlTag][2].replace regexLeft, '$1'
				spacePreserve:true
				xmlTagNumber:k

				noEndTag:@templaterState.matches[@templaterState.tagStart.numXmlTag].last? or @templaterState.matches[@templaterState.tagStart.numXmlTag].first?

			content= @replaceXmlTag(content, options)
		content
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
				options.scopePath= options.scopePath.concat(@templaterState.loopOpen.tag)
		subfile= new @currentClass innerTagsContent,options
		subsubfile=subfile.applyTags()
		@imageId=subfile.imageId
		@chartId=subfile.chartId
		subsubfile
	getOuterXml: (text,start,end,xmlTag) -> #tag: w:t
		endTag= text.indexOf('</'+xmlTag+'>',end)
		if endTag==-1 then throw new Error("can't find endTag #{endTag}")
		endTag+=('</'+xmlTag+'>').length
		startTag = Math.max text.lastIndexOf('<'+xmlTag+'>',start), text.lastIndexOf('<'+xmlTag+' ',start)
		if startTag==-1 then throw new Error("can't find startTag")
		{"text":text.substr(startTag,endTag-startTag),startTag,endTag}
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

		# if (Tags:subTags=="graph")
			# console.log(Tags:subTags)
			# return
		
		tag=@templaterState.loopOpen.tag
		newContent=""
		@scopeManager.loopOver tag, (subTags) =>
			subfile=@calcSubXmlTemplater(innerTagsContent,{Tags:subTags})
			newContent+=subfile.content
		, @templaterState.loopIsInverted
		if !@scopeManager.get(tag)?
			# This line is only for having the ability to retrieve the tags from a document
			@calcSubXmlTemplater(innerTagsContent,{Tags:{}})
		@content=@content.replace outerTagsContent, newContent
		@calcSubXmlTemplater(@content)
		
	replaceGraph:(chartXml)->
		@newChart = chartXml
		columnData=[]
		if !(@Tags["graph"]) #If not graph data found, return with original data
			return @newChart
		for data in Object.keys(@Tags["graph"][0]) #Get all the columns in the "graph" tag
			columnData.push(@Tags["graph"][0][data])
		index=0
		@seriesMatches= DocUtils.preg_match_all ///
		<c:ser[^>]*>
		(?:(?!<\/ser>).)*?
		</c:ser>
		///g, chartXml
		for column in @seriesMatches
			@replaceColumn(column,columnData[index])
			index++
		@newChart
	replaceColumn:(ser,data)->
		matchXml = DocUtils.Str2xml '<?xml version="1.0" ?><w:document mc:Ignorable="w14 wp14" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">'+ser+'</w:document>'
		
		if env=='browser'
			oldCat= matchXml.getElementsByTagNameNS('*','cat')[0]	
			oldVal= matchXml.getElementsByTagNameNS('*','val')[0]
					
		if env=='node'
			oldCat= matchXml.getElementsByTagName("c:cat")[0]
			oldVal= matchXml.getElementsByTagName("c:val")[0]
			
		newCategorie = matchXml.createElement("c:cat")
		newStrRef = matchXml.createElement("c:strRef")
		newF = matchXml.createElement("c:f")
		newFValue = matchXml.createTextNode("categories")
		newF.appendChild(newFValue)
		newStrRef.appendChild(newF)
		newStrCache = matchXml.createElement("c:strCache")
		newPtCount = matchXml.createElement("c:ptCount")
		newPtCount.setAttribute('val',data.length)
		newStrCache.appendChild(newPtCount)
		id=0
		for val in data
			newPt = matchXml.createElement("c:pt")
			newPt.setAttribute('idx',id++)
			newV = matchXml.createElement("c:v")
			newYear = matchXml.createTextNode(val["key"])
			newV.appendChild(newYear)
			newPt.appendChild(newV)
			newStrCache.appendChild(newPt)
		newStrRef.appendChild(newStrCache)
		newCategorie.appendChild(newStrRef)
		matchXml.replaceChild(newCategorie,oldCat)
		
		newVal = matchXml.createElement("c:val")
		newNumRef = matchXml.createElement("c:numRef")
		newF = matchXml.createElement("c:f")
		newFValue = matchXml.createTextNode(@valF++)
		newF.appendChild(newFValue)
		newNumRef.appendChild(newF)
		newNumCache = matchXml.createElement("c:numCache")
		newFormatCode = matchXml.createElement("c:formatCode")
		newFormatCodeValue = matchXml.createTextNode("General")
		newFormatCode.appendChild(newFormatCodeValue)
		newNumCache.appendChild(newFormatCode)
		newPtCount = matchXml.createElement("c:ptCount")
		newPtCount.setAttribute('val',data.length)
		newNumCache.appendChild(newPtCount)
		id=0
		for val in data
			newPt = matchXml.createElement("c:pt")
			newPt.setAttribute('idx',id++)
			newV = matchXml.createElement("c:v")
			newYear = matchXml.createTextNode(val["value"])
			newV.appendChild(newYear)
			newPt.appendChild(newV)
			newNumCache.appendChild(newPt)
		newNumRef.appendChild(newNumCache)
		newVal.appendChild(newNumRef)
		matchXml.replaceChild(newVal,oldVal)
		
		if env=='browser' then chartTag= matchXml.getElementsByTagNameNS('*','ser')[0]
		if env=='node' then chartTag=matchXml.getElementsByTagName('c:ser')[0]
		#console.log(DocUtils.xml2Str matchXml)
		replacement= DocUtils.xml2Str chartTag
		@newChart = @newChart.replace(ser, replacement)
		
		
