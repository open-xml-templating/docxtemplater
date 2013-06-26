window.XmlTemplater = class XmlTemplater
	constructor: (content="",creator,@templateVars={},@intelligentTagging=off,@scopePath=[],@usedTemplateVars={},@imageId=0) ->
		@tagX=''
		@class=window.XmlTemplater
		if creator instanceof DocxGen or (not creator?)
			@DocxGen=creator
		else
			options= creator
			@templateVars= options.templateVars
			@DocxGen= options.DocxGen
			@intelligentTagging=options.intelligentTagging
			@scopePath=options.scopePath
			@usedTemplateVars=options.usedTemplateVars
			@imageId=options.imageId
		if typeof content=="string" then @load content else throw "content must be string!"
		@currentScope=@templateVars
	load: (@content) ->
		@matches = @_getFullTextMatchesFromData()
		@charactersAdded= (0 for i in [0...@matches.length])
		replacerUnshift = (match,pn ..., offset, string)=>
			pn.unshift match #add match so that pn[0] = whole match, pn[1]= first parenthesis,...
			pn.offset= offset
			pn.first= true
			@matches.unshift pn #add at the beginning
			@charactersAdded.unshift 0
		@content.replace /^()([^<]+)/,replacerUnshift

		replacerPush = (match,pn ..., offset, string)=>
			pn.unshift match #add match so that pn[0] = whole match, pn[1]= first parenthesis,...
			pn.offset= offset
			pn.last= true
			@matches.push pn #add at the beginning
			@charactersAdded.push 0

		regex= "(<#{@tagX}[^>]*>)([^>]+)$"
		@content.replace (new RegExp(regex)),replacerPush
	setUsedTemplateVars: (tag) ->
		u = @usedTemplateVars
		for s,i in @scopePath
			u[s]={} unless u[s]?
			u = u[s]
		if tag!=""
			u[tag]= true
	getValueFromTag: (tag,scope) ->
		@setUsedTemplateVars(tag)
		content= ""
		if scope[tag]? 
			content= DocUtils.encode_utf8 scope[tag] 
		else 
			content= "undefined"
		if content.indexOf('{')!=-1 or content.indexOf('}')!=-1
			alert('On ne peut mettre de { ou de } dans le contenu d\'une variable')
			throw 'On ne peut mettre de { ou de } dans le contenu d\'une variable'
		content
	calcScopeText: (text,start=0,end=text.length-1) ->
		###get the different closing and opening tags between two texts (doesn't take into account tags that are opened then closed (those that are closed then opened are returned)):
		returns:[{"tag":"</w:r>","offset":13},{"tag":"</w:p>","offset":265},{"tag":"</w:tc>","offset":271},{"tag":"<w:tc>","offset":828},{"tag":"<w:p>","offset":883},{"tag":"<w:r>","offset":1483}]
		###
		tags= DocUtils.preg_match_all("<(\/?[^/> ]+)([^>]*)>",text.substr(start,end)) #getThemAll (the opening and closing tags)!
		result=[]
		for tag,i in tags
			if tag[1][0]=='/' #closing tag
				justOpened= false
				if result.length>0
					lastTag= result[result.length-1]
					innerLastTag= lastTag.tag.substr(1,lastTag.tag.length-2)
					innerCurrentTag= tag[1].substr(1)
					if innerLastTag==innerCurrentTag then justOpened= true #tag was just opened
				if justOpened then result.pop() else result.push {tag:'<'+tag[1]+'>',offset:tag.offset}
			else if tag[2][tag[2].length-1]=='/' #open/closing tag aren't taken into account(for example <w:style/>)
			else	#opening tag
				result.push {tag:'<'+tag[1]+'>',offset:tag.offset}
		result
	calcScopeDifference: (text,start=0,end=text.length-1) -> #it returns the difference between two scopes, ie simplifyes closes and opens. If it is not null, it means that the beginning is for example in a table, and the second one is not. If you hard copy this text, the XML will  break
		scope= @calcScopeText text,start,end
		while(1)
			if (scope.length<=1) #if scope.length==1, then they can't be an opeining and closing tag
				break;
			if ((scope[0]).tag.substr(2)==(scope[scope.length-1]).tag.substr(1)) #if the first closing is the same than the last opening, ie: [</tag>,...,<tag>]
				scope.pop() #remove both the first and the last one
				scope.shift()
			else break;
		scope
	getFullText:() ->
		@matches= @_getFullTextMatchesFromData() #get everything that is between <w:t>
		output= (match[2] for match in @matches) #get only the text
		DocUtils.decode_utf8(output.join("")) #join it
	_getFullTextMatchesFromData: () ->
		@matches= DocUtils.preg_match_all("(<#{@tagX}[^>]*>)([^<>]*)?</#{@tagX}>",@content)
	calcInnerTextScope: (text,start,end,tag) -> #tag: w:t
		endTag= text.indexOf('</'+tag+'>',end)
		if endTag==-1 then throw "can't find endTag #{endTag}"
		endTag+=('</'+tag+'>').length
		startTag = Math.max text.lastIndexOf('<'+tag+'>',start), text.lastIndexOf('<'+tag+' ',start)
		if startTag==-1 then throw "can't find startTag"
		{"text":text.substr(startTag,endTag-startTag),startTag,endTag}
	calcB: () ->
		startB = @calcStartBracket @loopOpen
		endB= @calcEndBracket @loopClose
		{B:@content.substr(startB,endB-startB),startB,endB}
	calcA: () ->
		startA= @calcEndBracket @loopOpen
		endA= @calcStartBracket @loopClose
		{A:@content.substr(startA,endA-startA),startA,endA}
	calcStartBracket: (bracket) ->
		@matches[bracket.start.i].offset+@matches[bracket.start.i][1].length+@charactersAdded[bracket.start.i]+bracket.start.j
	calcEndBracket: (bracket)->
		@matches[bracket.end.i].offset+@matches[bracket.end.i][1].length+@charactersAdded[bracket.end.i]+bracket.end.j+1
	toJson: () ->
		templateVars:DocUtils.clone @templateVars
		DocxGen:@DocxGen
		intelligentTagging:DocUtils.clone @intelligentTagging
		scopePath:DocUtils.clone @scopePath
		usedTemplateVars:@usedTemplateVars
		imageId:@imageId
	forLoop: (A="",B="") ->
		###
			<w:t>{#forTag} blabla</w:t>
			Blabla1
			Blabla2
			<w:t>{/forTag}</w:t>

			Let A be what is in between the first closing bracket and the second opening bracket
			Let B what is in between the first opening tag {# and the last closing tag

			A=</w:t>
			Blabla1
			Blabla2
			<w:t>

			B={#forTag}</w:t>
			Blabla1
			Blabla2
			<w:t>{/forTag}

			We replace B by nA, n is equal to the length of the array in scope forTag
			<w:t>subContent subContent subContent</w:t>
		###
		if A=="" and B==""
			B= @calcB().B
			A= @calcA().A

			if B[0]!='{' or B.indexOf('{')==-1 or B.indexOf('/')==-1 or B.indexOf('}')==-1 or B.indexOf('#')==-1 then throw "no {,#,/ or } found in B: #{B}"

		if @currentScope[@loopOpen.tag]?
			# if then throw '{#'+@loopOpen.tag+"}should be an object (it is a #{typeof @currentScope[@loopOpen.tag]})"
			subScope= @currentScope[@loopOpen.tag] if typeof @currentScope[@loopOpen.tag]=='object'
			subScope= true if @currentScope[@loopOpen.tag]=='true'
			subScope= false if @currentScope[@loopOpen.tag]=='false'
			newContent= "";

			if typeof subScope == 'object'
				for scope,i in @currentScope[@loopOpen.tag]
					options= @toJson()
					options.templateVars=scope
					options.scopePath= options.scopePath.concat(@loopOpen.tag)
					subfile= new @class  A,options
					subfile.applyTemplateVars()
					@imageId=subfile.imageId
					newContent+=subfile.content #@applyTemplateVars A,scope
					if ((subfile.getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{subfile.getFullText()} (1)"
			if subScope == true
				options= @toJson()
				options.templateVars= @currentScope
				options.scopePath= options.scopePath.concat(@loopOpen.tag)
				subfile= new @class  A,options
				subfile.applyTemplateVars()
				@imageId=subfile.imageId
				newContent+=subfile.content #@applyTemplateVars A,scope
				if ((subfile.getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{subfile.getFullText()} (1)"
			@content=@content.replace B, newContent
		else
			options= @toJson()
			options.templateVars={}
			options.scopePath= options.scopePath.concat(@loopOpen.tag)
			subfile= new @class A, options
			subfile.applyTemplateVars()
			@imageId=subfile.imageId
			@content= @content.replace B, ""

		options= @toJson()
		nextFile= new @class @content,options
		nextFile.applyTemplateVars()
		@imageId=nextFile.imageId
		if ((nextFile.getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{nextFile.getFullText()} (3)"
		@content=nextFile.content
		return this

	dashLoop: (elementDashLoop,sharp=false) ->
		{B,startB,endB}= @calcB()
		resultFullScope = @calcInnerTextScope @content, startB, endB, elementDashLoop
		for t in [0..@matches.length]
			@charactersAdded[t]-=resultFullScope.startTag
		B= resultFullScope.text
		if (@content.indexOf B)==-1 then throw "couln't find B in @content"
		A = B
		copyA= A

		#for deleting the opening tag

		@bracketEnd= {"i":@loopOpen.end.i,"j":@loopOpen.end.j}
		@bracketStart= {"i":@loopOpen.start.i,"j":@loopOpen.start.j}
		if sharp==false then @textInsideBracket= "-"+@loopOpen.element+" "+@loopOpen.tag
		if sharp==true then @textInsideBracket= "#"+@loopOpen.tag

		A= @replaceCurly("",A)
		if copyA==A then throw "A should have changed after deleting the opening tag"
		copyA= A

		@textInsideBracket= "/"+@loopOpen.tag
		#for deleting the closing tag
		@bracketEnd= {"i":@loopClose.end.i,"j":@loopClose.end.j}
		@bracketStart= {"i":@loopClose.start.i,"j":@loopClose.start.j}
		A= @replaceCurly("",A)

		if copyA==A then throw "A should have changed after deleting the opening tag"

		return @forLoop(A,B)

	replaceXmlTag: (content,tagNumber,insideValue,spacePreserve=false,noStartTag=false) ->
		@matches[tagNumber][2]=insideValue #so that the matches are still correct
		startTag= @matches[tagNumber].offset+@charactersAdded[tagNumber]  #where the open tag starts: <w:t>
		#calculate the replacer according to the params
		if noStartTag == true
			replacer= insideValue
		else
			if spacePreserve==true
				replacer= """<#{@tagX} xml:space="preserve">#{insideValue}</#{@tagX}>"""
			else replacer= @matches[tagNumber][1]+insideValue+"</#{@tagX}>"
		@charactersAdded[tagNumber+1]+=replacer.length-@matches[tagNumber][0].length
		if content.indexOf(@matches[tagNumber][0])==-1 then throw "content #{@matches[tagNumber][0]} not found in content"
		copyContent= content
		content = DocUtils.replaceFirstFrom content,@matches[tagNumber][0], replacer, startTag
		@matches[tagNumber][0]=replacer

		if copyContent==content then throw "offset problem0: didnt changed the value (should have changed from #{@matches[@bracketStart.i][0]} to #{replacer}"
		content

	replaceCurly: (newValue,content=@content) ->
		if (@matches[@bracketEnd.i][2].indexOf ('}'))==-1 then throw "no closing bracket at @bracketEnd.i #{@matches[@bracketEnd.i][2]}"
		if (@matches[@bracketStart.i][2].indexOf ('{'))==-1 then throw "no opening bracket at @bracketStart.i #{@matches[@bracketStart.i][2]}"
		copyContent=content
		if @bracketEnd.i==@bracketStart.i #<w>{aaaaa}</w>
			if (@matches[@bracketStart.i].first?)
				insideValue= @matches[@bracketStart.i][2].replace "{#{@textInsideBracket}}", newValue
				content= @replaceXmlTag(content,@bracketStart.i,insideValue,true,true)

			else if (@matches[@bracketStart.i].last?)
				insideValue= @matches[@bracketStart.i][0].replace "{#{@textInsideBracket}}", newValue
				content= @replaceXmlTag(content,@bracketStart.i,insideValue,true,true)
			else
				insideValue= @matches[@bracketStart.i][2].replace "{#{@textInsideBracket}}", newValue
				content= @replaceXmlTag(content,@bracketStart.i,insideValue,true)

		else if @bracketEnd.i>@bracketStart.i

			# 1. for the first (@bracketStart.i): replace __{.. by __value
			regexRight= /^([^{]*){.*$/
			subMatches= @matches[@bracketStart.i][2].match regexRight

			if @matches[@bracketStart.i].first? #if the content starts with:  {tag</w:t>
				content= @replaceXmlTag(content,@bracketStart.i,newValue,true,true)
			else if @matches[@bracketStart.i].last?
				content= @replaceXmlTag(content,@bracketStart.i,newValue,true,true)
			else
				insideValue=subMatches[1]+newValue
				content= @replaceXmlTag(content,@bracketStart.i,insideValue,true)

			#2. for in between (@bracketStart.i+1...@bracketEnd.i) replace whole by ""
			for k in [(@bracketStart.i+1)...@bracketEnd.i]
				@charactersAdded[k+1]=@charactersAdded[k]
				content= @replaceXmlTag(content,k,"")

			#3. for the last (@bracketEnd.i) replace ..}__ by ".." ###
			regexLeft= /^[^}]*}(.*)$/;
			insideValue = @matches[@bracketEnd.i][2].replace regexLeft, '$1'
			@charactersAdded[@bracketEnd.i+1]=@charactersAdded[@bracketEnd.i]
			content= @replaceXmlTag(content,k, insideValue,true)

		for match, j in @matches when j>@bracketEnd.i
			@charactersAdded[j+1]=@charactersAdded[j]
		if copyContent==content then throw "copycontent=content !!"
		return content
	replaceImages:() ->
		for match,u in @imgMatches
			xmlImg= DocUtils.Str2xml '<?xml version="1.0" ?><w:document mc:Ignorable="w14 wp14" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">'+match[0]+'</w:document>'
				
			if @DocxGen.qrCode

				tagrId= xmlImg.getElementsByTagNameNS('*','blip')[0]
				rId = tagrId.getAttribute('r:embed')
				oldFile= @DocxGen.getImageByRid(rId)


				qr= new DocxQrCode (oldFile.data)
				

				# imgName= qr.result.replace(/\//g,'_').replace(/:/g,'_')
				# imgData= qr.data
				# console.log "newId#{newId}"
				tag= xmlImg.getElementsByTagNameNS('*','docPr')[0]
				imgName= (tag.getAttribute('name')+"_Copie_"+@imageId+".png").replace(/\x20/,"")
				newId= @DocxGen.addImageRels(imgName,"")
				
				@imageId++
				tag.setAttribute('id',@imageId)
				tag.setAttribute('name',"#{imgName}")

				
				tagrId.setAttribute('r:embed',"rId#{newId}")

				imageTag= xmlImg.getElementsByTagNameNS('*','drawing')[0]
				console.log imageTag
				console.log @content
				@content=@content.replace(match[0], DocUtils.xml2Str imageTag)	


				callback= (qr) =>
					console.log @DocxGen
					console.log imgName
					@DocxGen.setImage("word/media/#{imgName}",qr.data)

				qr.decode(callback)


			if @currentScope["img"]? then if @currentScope["img"][u]?
				imgName= @currentScope["img"][u].name
				imgData= @currentScope["img"][u].data
				throw 'DocxGen not defined' unless @DocxGen?
				newId= @DocxGen.addImageRels(imgName,imgData)
				tag= xmlImg.getElementsByTagNameNS('*','docPr')[0]

				@imageId++
				tag.setAttribute('id',@imageId)
				tag.setAttribute('name',"#{imgName}")

				tagrId= xmlImg.getElementsByTagNameNS('*','blip')[0]

				tagrId.setAttribute('r:embed',"rId#{newId}")

				imageTag= xmlImg.getElementsByTagNameNS('*','drawing')[0]
				@content=@content.replace(match[0], DocUtils.xml2Str imageTag)
	findImages: () ->
		@imgMatches= DocUtils.preg_match_all ///
		<w:drawing>
		.*
		</w:drawing>
		///, @content
	###
	content is the whole content to be tagged
	scope is the current scope
	returns the new content of the tagged content###
	applyTemplateVars:()->
		@setUsedTemplateVars("")
		@inForLoop= false # bracket with sharp: {#forLoop}______{/forLoop}
		@inBracket= false # all brackets  {___}
		@inDashLoop = false	# bracket with dash: {-w:tr dashLoop} {/dashLoop}
		@textInsideBracket= ""
		for match,i in @matches
			innerText= match[2] || "" #text inside the <w:t>
			for t in [i...@matches.length]
				@charactersAdded[t+1]=@charactersAdded[t]
			for character,j in innerText
				for m,t in @matches when t<=i
					if @content[m.offset+@charactersAdded[t]]!=m[0][0] then throw "no < at the beginning of #{m[0][0]} (2)"
				if character=='{'
					if @inBracket is true then throw "Bracket already open with text: #{@textInsideBracket}"
					@inBracket= true
					@textInsideBracket= ""
					@bracketStart={"i":i,"j":j}

				else if character == '}'
					@bracketEnd={"i":i,"j":j}

					if @textInsideBracket[0]=='#' and @inForLoop is false and @inDashLoop is false
						@inForLoop= true #begin for loop
						@loopOpen={'start':@bracketStart,'end':@bracketEnd,'tag':@textInsideBracket.substr 1}
					if @textInsideBracket[0]=='-' and @inForLoop is false and @inDashLoop is false
						@inDashLoop= true
						regex= /^-([a-zA-Z_:]+) ([a-zA-Z_:]+)$/
						@loopOpen={'start':@bracketStart,'end':@bracketEnd,'tag':(@textInsideBracket.replace regex, '$2'),'element':(@textInsideBracket.replace regex, '$1')}
					if @inBracket is false then	throw "Bracket already closed #{@content}"
					@inBracket= false

					if @inForLoop is false and @inDashLoop is false
						@content = @replaceCurly(@getValueFromTag(@textInsideBracket,@currentScope))

					if @textInsideBracket[0]=='/'
						@loopClose={'start':@bracketStart,'end':@bracketEnd}

					if @textInsideBracket[0]=='/' and ('/'+@loopOpen.tag == @textInsideBracket) and @inDashLoop is true
						return @dashLoop(@loopOpen.element)

					if @textInsideBracket[0]=='/' and ('/'+@loopOpen.tag == @textInsideBracket) and @inForLoop is true
						#You DashLoop= take the outer scope only if you are in a table
						dashLooping= no
						if @intelligentTagging==on
							{B,startB,endB}= @calcB()
							scopeContent= @calcScopeText @content, startB,endB-startB
							for t in scopeContent
								if t.tag=='<w:tc>'
									dashLooping= yes
									elementDashLoop= 'w:tr'

						if dashLooping==no
							return @forLoop()
						else
							return @dashLoop(elementDashLoop,true)
				else #if character != '{' and character != '}'
					if @inBracket is true then @textInsideBracket+=character
		# if ((@getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{@getFullText()} (2)"
		@findImages()
		@replaceImages()
		this