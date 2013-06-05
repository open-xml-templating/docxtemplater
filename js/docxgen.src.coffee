encode_utf8 = (s)->
	unescape(encodeURIComponent(s))

decode_utf8= (s) ->
	decodeURIComponent(escape(s)).replace(new RegExp(String.fromCharCode(160),"g")," ") #replace Ascii 160 space by the normal space, Ascii 32

String.prototype.replaceFirstFrom = (search,replace,from) ->  #replace first occurence of search (can be regex) after *from* offset
	this.substr(0,from)+this.substr(from).replace(search,replace)

preg_match_all= (regex, content) -> 
	###regex is a string, content is the content. It returns an array of all matches with their offset, for example: 
	regex=la
	content=lolalolilala
	returns: [{0:'la',offset:2},{0:'la',offset:8},{0:'la',offset:10}]
	###
	matchArray= []
	replacer = (match,pn ..., offset, string)->
		pn.unshift match #add match so that pn[0] = whole match, pn[1]= first parenthesis,...
		pn.offset= offset
		matchArray.push pn
	content.replace (new RegExp(regex,'g')),replacer
	matchArray

window.XmlTemplater = class XmlTemplater
	constructor: (content="",@templateVars={},@intelligentTagging=off) ->
		if typeof content=="string" then @load content else throw "content must be string!"
		@currentScope=@templateVars
	load: (@content) ->
		@matches = @_getFullTextMatchesFromData()
		@charactersAdded= (0 for i in [0...@matches.length])
		replacer = (match,pn ..., offset, string)=>
			pn.unshift match #add match so that pn[0] = whole match, pn[1]= first parenthesis,...
			pn.offset= offset
			@matches.unshift pn #add at the beginning
			@charactersAdded.unshift 0
		@content.replace /^()([^<]+)/,replacer
	getValueFromTag: (tag,scope) ->
		if scope[tag]? then return encode_utf8 scope[tag] else return "undefined"
	calcScopeText: (text,start=0,end=text.length-1) -> 
		###get the different closing and opening tags between two texts (doesn't take into account tags that are opened then closed (those that are closed then opened are returned)): 
		returns:[{"tag":"</w:r>","offset":13},{"tag":"</w:p>","offset":265},{"tag":"</w:tc>","offset":271},{"tag":"<w:tc>","offset":828},{"tag":"<w:p>","offset":883},{"tag":"<w:r>","offset":1483}] 
		###
		tags= preg_match_all("<(\/?[^/> ]+)([^>]*)>",text.substr(start,end)) #getThemAll!
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
			if (scope.length<=1) #if scope.length==1, then they can't be an opeining and closeing tag 
				break;
			if ((scope[0]).tag.substr(2)==(scope[scope.length-1]).tag.substr(1))
				scope.pop()
				scope.shift()
			else break;
		scope
	getFullText:() ->
		@matches= @_getFullTextMatchesFromData()
		output= (match[2] for match in @matches)
		decode_utf8(output.join(""))
	_getFullTextMatchesFromData: () ->
		@matches= preg_match_all("(<w:t[^>]*>)([^<>]*)?</w:t>",@content)
	calcInnerTextScope: (text,start,end,tag) -> #tag: w:t
		endTag= text.indexOf('</'+tag+'>',end)
		if endTag==-1 then throw "can't find endTag #{endTag}"
		endTag+=('</'+tag+'>').length
		startTag = Math.max text.lastIndexOf('<'+tag+'>',start), text.lastIndexOf('<'+tag+' ',start)
		if startTag==-1 then throw "can't find startTag"
		{"text":text.substr(startTag,endTag-startTag),startTag,endTag}
	calcB: (matches,content,openiStartLoop,openjStartLoop,closeiEndLoop,closejEndLoop,charactersAdded) ->
		startB = matches[openiStartLoop].offset+matches[openiStartLoop][1].length+charactersAdded[openiStartLoop]+openjStartLoop
		endB= matches[closeiEndLoop].offset+matches[closeiEndLoop][1].length+charactersAdded[closeiEndLoop]+closejEndLoop+1
		{B:content.substr(startB,endB-startB),start:startB,end:endB}

	calcA: (matches,content,openiEndLoop,openjEndLoop,closeiStartLoop,closejStartLoop,charactersAdded) ->
		startA= matches[openiEndLoop].offset+matches[openiEndLoop][1].length+charactersAdded[openiEndLoop]+openjEndLoop+1
		endA= matches[closeiStartLoop].offset+matches[closeiStartLoop][1].length+charactersAdded[closeiStartLoop]+closejStartLoop
		{A:content.substr(startA,endA-startA),start:startA,end:endA}

	forLoop: (content,currentScope,tagForLoop,charactersAdded,closeiStartLoop,closeiEndLoop,matches,openiStartLoop,openjStartLoop,closejEndLoop,openiEndLoop,openjEndLoop,closejStartLoop) ->
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

		B= (@calcB matches,content,openiStartLoop,openjStartLoop,closeiEndLoop,closejEndLoop,charactersAdded).B
		A= (@calcA matches,content,openiEndLoop,openjEndLoop,closeiStartLoop,closejStartLoop,charactersAdded).A

		if B[0]!='{' or B.indexOf('{')==-1 or B.indexOf('/')==-1 or B.indexOf('}')==-1 or B.indexOf('#')==-1 then throw "no {,#,/ or } found in B: #{B}"


		if currentScope[tagForLoop]?
			if typeof currentScope[tagForLoop]!='object' then throw '{#'+tagForLoop+"}should be an object (it is a #{typeof currentScope[tagForLoop]})"
			newContent= "";
			for scope,i in currentScope[tagForLoop]
				subfile= new XmlTemplater A, scope, @intelligentTagging
				subfile.applyTemplateVars()
				newContent+=subfile.content #@applyTemplateVars A,scope
				if ((subfile.getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{subfile.getFullText()} (1)"
			content=content.replace B, newContent
		else content= content.replace B, ""

		nextFile= new XmlTemplater content, currentScope, @intelligentTagging
		nextFile.applyTemplateVars()
		if ((nextFile.getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{nextFile.getFullText()} (3)"
		this.content=nextFile.content
		return this

	dashLoop: (textInsideBracket,tagDashLoop,startiMatch,i,openiStartLoop,openjStartLoop,openiEndLoop,closejEndLoop,content,charactersAdded,matches,currentScope,elementDashLoop) ->
		console.log "tagdashLoop:#{tagDashLoop}"
		closeiStartLoop= startiMatch
		closeiEndLoop= i
		startB= matches[openiStartLoop].offset+matches[openiStartLoop][1].length+charactersAdded[openiStartLoop]+openjStartLoop
		endB= matches[closeiEndLoop].offset+matches[closeiEndLoop][1].length+charactersAdded[closeiEndLoop]+closejEndLoop+1
		resultFullScope = (@calcInnerTextScope content, startB, endB, elementDashLoop)
		for t in [0..matches.length]
			charactersAdded[t]-=resultFullScope.startTag
		B= resultFullScope.text
		if (content.indexOf B)==-1 then throw "couln't find B in content"
		A = B
		copyA= A
		#for deleting the opening tag
		[A,charactersAdded,matches]= @replaceTag(A,openiEndLoop,openiStartLoop,matches,"#{textInsideBracket}","",charactersAdded)
		if copyA==A then throw "A should have changed after deleting the opening tag"
		copyA= A
		#for deleting the closing tag
		[A,charactersAdded,matches]= @replaceTag(A,closeiEndLoop,closeiStartLoop,matches,'/'+tagDashLoop,"",charactersAdded)
		if copyA==A then throw "A should have changed after deleting the opening tag"
		if currentScope[tagDashLoop]?
			if typeof currentScope[tagDashLoop]!='object' then throw '{#'+tagDashLoop+"}should be an object (it is a #{typeof currentScope[tagDashLoop]})"
			newContent= "";
			for scope,i in currentScope[tagDashLoop]
				subfile= new XmlTemplater A, scope, @intelligentTagging
				subfile.applyTemplateVars()
				newContent+=subfile.content #@applyTemplateVars A,scope
				if ((subfile.getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{subfile.getFullText()} (5)"
			content= content.replace B, newContent
		else content= content.replace B, ""

		nextFile= new XmlTemplater content, currentScope, @intelligentTagging
		nextFile.applyTemplateVars()
		this.content=nextFile.content
		if ((nextFile.getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{nextFile.getFullText()} (6)"
		return this
	


	replaceTag: (content,endiMatch,startiMatch,matches,textInsideBracket,newValue,charactersAdded) ->
		if (matches[endiMatch][2].indexOf ('}'))==-1 then throw "no closing bracket at endiMatch #{matches[endiMatch][2]}"
		if (matches[startiMatch][2].indexOf ('{'))==-1 then throw "no opening bracket at startiMatch #{matches[startiMatch][2]}"

		if endiMatch==startiMatch #<w>{aaaaa}</w>
			matches[startiMatch][2]=matches[startiMatch][2].replace "{#{textInsideBracket}}", newValue
			replacer= '<w:t xml:space="preserve">'+matches[startiMatch][2]+"</w:t>"
			startB= matches[startiMatch].offset+charactersAdded[startiMatch]
			charactersAdded[startiMatch+1]+=replacer.length-matches[startiMatch][0].length
			if content.indexOf(matches[startiMatch][0])==-1 then throw "content #{matches[startiMatch][0]} not found in content"
			copyContent= content
			content = content.replaceFirstFrom matches[startiMatch][0], replacer, startB
			matches[startiMatch][0]=replacer

			if copyContent==content then throw "offset problem0: didnt changed the value (should have changed from #{matches[startiMatch][0]} to #{replacer}"

		else if endiMatch>startiMatch
			###replacement:-> <w:t>blabla12</w:t>   <w:t></w:t> <w:t> blabli</w:t>
			1. for the first (startiMatch): replace {.. by the value
			2. for in between (startiMatch+1...endiMatch) replace whole by ""
			3. for the last (endiMatch) replace ..} by "" ###

			# 1.
			regexRight= /^([^{]*){.*$/
			subMatches= matches[startiMatch][2].match regexRight

			if matches[startiMatch][1]=="" #if the content starts with:  {tag</w:t>
				matches[startiMatch][2]=newValue
				replacer= matches[startiMatch][2]
			else
				matches[startiMatch][2]=subMatches[1]+newValue
				replacer= '<w:t xml:space="preserve">'+matches[startiMatch][2]+"</w:t>"


			copyContent = content
			startB= matches[startiMatch].offset+charactersAdded[startiMatch]
			charactersAdded[startiMatch+1]+=replacer.length-matches[startiMatch][0].length
			if content.indexOf(matches[startiMatch][0])==-1 then throw "content #{matches[startiMatch][0]} not found in content"

			content= content.replaceFirstFrom matches[startiMatch][0],replacer, startB
			matches[startiMatch][0]=replacer

			if copyContent==content then throw "offset problem1: didnt changed the value (should have changed from #{matches[startiMatch][0]} to #{replacer}"

			#2.
			for k in [(startiMatch+1)...endiMatch]
				replacer = matches[k][1]+'</w:t>'
				startB= matches[k].offset+charactersAdded[k]
				charactersAdded[k+1]=charactersAdded[k]+replacer.length-matches[k][0].length
				if content.indexOf(matches[k][0])==-1 then throw "content #{matches[k][0]} not found in content"
				copyContent= content
				content= content.replaceFirstFrom matches[k][0],replacer,startB
				matches[k][0]=replacer
				if copyContent==content then throw "offset problem2: didnt changed the value (should have changed from #{matches[startiMatch][0]} to #{replacer}"
			#3.
			regexLeft= /^[^}]*}(.*)$/;
			matches[endiMatch][2]=matches[endiMatch][2].replace regexLeft, '$1'
			replacer= '<w:t xml:space="preserve">'+matches[endiMatch][2]+"</w:t>";
			startB= matches[endiMatch].offset+charactersAdded[endiMatch]
			charactersAdded[endiMatch+1]=charactersAdded[endiMatch]+replacer.length-matches[endiMatch][0].length

			if content.indexOf(matches[endiMatch][0])==-1 then throw "content #{matches[endiMatch][0]} not found in content"
			copyContent=content
			content= content.replaceFirstFrom matches[endiMatch][0], replacer,startB

			if copyContent==content then throw "offset problem3: didnt changed the value (should have changed from #{matches[startiMatch][0]} to #{replacer}"
			matches[endiMatch][0]=replacer
		else
			throw "Bracket closed before opening"

		for match, j in matches when j>endiMatch
			charactersAdded[j+1]=charactersAdded[j]

		return [content,charactersAdded,matches]
	###
	content is the whole content to be tagged
	scope is the current scope
	returns the new content of the tagged content###
	applyTemplateVars:()->
		@charactersAdded=@charactersAdded
		@currentScope= @currentScope
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
					if @content[m.offset+@charactersAdded[t]]!=m[0][0] then throw "no < at the beginning of #{glou[0]} (2)"
				if character=='{'
					if @inBracket is true then throw "Bracket already open with text: #{@textInsideBracket}"
					@inBracket= true
					@textInsideBracket= ""
					startiMatch= i
					startjMatch= j
					@bracketStart={"i":i,"j":j}
				else if character == '}'
					@bracketEnd={"i":i,"j":j}
					if @textInsideBracket[0]=='#' and @inForLoop is false and @inDashLoop is false
						tagForLoop= @textInsideBracket.substr 1
						@inForLoop= true #begin for loop
						openiStartLoop= startiMatch # open: for "{#tag}" iStart=iEnd, jStart=0, jEnd=5
						openjStartLoop= startjMatch
						openjEndLoop= j
						openiEndLoop= i
						
						@loopOpen={'start':@bracketStart,'end':@bracketEnd,'tag':@textInsideBracket.substr 1}
					if @textInsideBracket[0]=='-' and @inForLoop is false and @inDashLoop is false
						# tagDashLoop= @textInsideBracket.substr 1
						@inDashLoop= true
						openiStartLoop= startiMatch
						openjStartLoop= startjMatch
						openjEndLoop = j
						openiEndLoop= i
						
						regex= /^-([a-zA-Z_:]+) ([a-zA-Z_:]+)$/
						elementDashLoop= @textInsideBracket.replace regex, '$1'
						tagDashLoop= @textInsideBracket.replace regex, '$2'
						@loopOpen={'start':@bracketStart,'end':@bracketEnd,'tag':@textInsideBracket.replace regex, '$2'}

					if @inBracket is false then throw "Bracket already closed"
					@inBracket= false

					if @inForLoop is false and @inDashLoop is false
						[@content,@charactersAdded,@matches] = @replaceTag(@content,@bracketEnd.i,@bracketStart.i,@matches,@textInsideBracket,@getValueFromTag(@textInsideBracket,@currentScope),@charactersAdded)

					if @textInsideBracket[0]=='/'
						@loopClose={'start':@bracketStart,'end':@bracketEnd}
						closejStartLoop= startjMatch
						closejEndLoop= j
						
					if @textInsideBracket[0]=='/' and ('/'+tagDashLoop == @textInsideBracket) and @inDashLoop is true
						return @dashLoop(@textInsideBracket,tagDashLoop,startiMatch,i,openiStartLoop,openjStartLoop,openiEndLoop,closejEndLoop,@content,@charactersAdded,@matches,@currentScope,elementDashLoop)

					if @textInsideBracket[0]=='/' and ('/'+tagForLoop == @textInsideBracket) and @inForLoop is true
						#You DashLoop= take the outer scope only if you are in a table
						dashLooping= no
						if @intelligentTagging==on
							scopeContent= @calcScopeText @content, @matches[openiStartLoop].offset+@charactersAdded[openiStartLoop],@matches[i].offset+@charactersAdded[i]-(@matches[openiStartLoop].offset+@charactersAdded[openiStartLoop])
							for t in scopeContent
								if t.tag=='<w:tc>'
									dashLooping= yes
									elementDashLoop= 'w:tr'

						if dashLooping==no
							return @forLoop(@content,@currentScope,tagForLoop,@charactersAdded,startiMatch,i,@matches,openiStartLoop,openjStartLoop,closejEndLoop,openiEndLoop,openjEndLoop,closejStartLoop)
						else
							return @dashLoop(@textInsideBracket,@textInsideBracket.substr(1),startiMatch,i,openiStartLoop,openjStartLoop,openiEndLoop,closejEndLoop,@content,@charactersAdded,@matches,@currentScope,elementDashLoop)
				else #if character != '{' and character != '}'
					if @inBracket is true then @textInsideBracket+=character
		if ((@getFullText().indexOf '{')!=-1) then throw "they shouln't be a { in replaced file: #{@getFullText()} (2)"
		this
###
Docxgen.coffee
Created by Edgar HIPP
03/06/2013
###

window.DocxGen = class DocxGen
	imageExtensions=['gif','jpeg','jpg','emf','png']
	constructor: (content, @templateVars={},@intelligentTagging=off) ->
		@files={}
		@templatedFiles=["word/document.xml"
		"word/footer1.xml",
		"word/footer2.xml",
		"word/footer3.xml",
		"word/header1.xml",
		"word/header2.xml",
		"word/header3.xml"
		]
		if typeof content == "string" then @load(content)
	load: (content)->
		zip = new JSZip content
		@files=zip.files
	getImageList: () ->
		regex= ///
		[^.]*  #name
		\.   #dot
		([^.]*)  #extension
		///
		imageList= []
		for index of @files
			extension= index.replace(regex,'$1')
			if extension in imageExtensions
				imageList.push {"path":index,files:@files[index]}
		imageList
	setImage: (path,data) ->
		@files[path].data= data
	applyTemplateVars:()->
		for fileName in @templatedFiles when @files[fileName]?
			currentFile= new XmlTemplater(@files[fileName].data,@templateVars,@intelligentTagging)
			@files[fileName].data= currentFile.applyTemplateVars().content
	setTemplateVars: (@templateVars) ->
	#output all files, if docx has been loaded via javascript, it will be available
	output: (download = true) ->
		zip = new JSZip()
		doOutput= () ->
			document.location.href= "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,#{outputFile}"
		for index of @files
			file=@files[index]
			zip.file file.name,file.data,file.options
		outputFile= zip.generate()
		if download==true then doOutput()
		outputFile
	getFullText:(path="word/document.xml",data="") ->
		currentFile= new XmlTemplater(@files[path].data,@templateVars,@intelligentTagging)
		currentFile.getFullText()
	download: (swfpath, imgpath, filename="default.docx") ->
		outputFile= @output(false)
		Downloadify.create 'downloadify',
			filename: () ->	return filename
			data: () ->
				return outputFile
			onCancel: () -> alert 'You have cancelled the saving of this file.'
			onError: () -> alert 'You must put something in the File Contents or there will be nothing to save!'
			swf: swfpath
			downloadImage: imgpath
			width: 100
			height: 30
			transparent: true
			append: false
			dataType:'base64'