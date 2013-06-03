###
Docxgen.coffee
Created by Edgar HIPP
03/06/2013
###

encode_utf8 = (s)->
	unescape(encodeURIComponent(s))

decode_utf8= (s) ->
	decodeURIComponent(escape(s)).replace(new RegExp(String.fromCharCode(160),"g")," ")


String.prototype.replaceFirstFrom = (search,replace,from) ->
	this.substr(0,from)+this.substr(from).replace(search,replace)


preg_match_all= (regex, haystack) ->
	testRegex= new RegExp(regex,'g');
	matchArray= []
	replacer = (match,pn ..., offset, string)->
		pn.unshift match #add match so that pn[0] = whole match, pn[1]= first parenthesis,...
		pn.offset=offset
		matchArray.push pn
	haystack.replace testRegex,replacer
	matchArray

window.DocxGen = class DocxGen
	imageExtensions=['gif','jpeg','jpg','emf','png']
	constructor: (content, @templateVars={}) ->
		@files={}
		@templatedFiles=["word/document.xml"
		"word/footer1.xml",
		"word/footer2.xml",
		"word/footer3.xml",
		"word/header1.xml",
		"word/header2.xml",
		"word/header3.xml"
		]
		if typeof content == "string"
			@load(content)
	load: (content)->
		zip = new JSZip(content);
		@files=zip.files
	getValueFromTag: (tag,scope) ->
		if scope[tag]? then return scope[tag] else return "undefined"
	getImageList: () ->
		regex= ///
		[^.]*  #name
		\.   #point
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
	setTemplateVars: (templateVars) ->
		@templateVars=templateVars;

	calcScopeContent: (content,start=0,end=content.length-1) ->
		regex= """<(\/?[^/> ]+)([^>]*)>"""

		tags= preg_match_all(regex,content)
		result=[]

		for tag,i in tags
			if tag[1][0]=='/' #closing tag
				justOpened= false
				if result.length>0
					lastTag= result[result.length-1]
					innerLastTag= lastTag.tag.substr(1,lastTag.tag.length-2)
					innerCurrentTag= tag[1].substr(1)
					if innerLastTag==innerCurrentTag then justOpened= true
				if justOpened then result.pop() else result.push {tag:'<'+tag[1]+'>',offset:tag.offset}
			else if tag[2][tag[2].length-1]=='/' #open/closing tag
			else	#opening tag
				result.push {tag:'<'+tag[1]+'>',offset:tag.offset}
		result

	calcScopeDifference: (content,start=0,end=content.length-1) ->
		scope= @calcScopeContent content,start,end
		while(1)
			if (scope.length<=1)
				break;
			if ((scope[0]).tag.substr(2)==(scope[scope.length-1]).tag.substr(1))
				scope.pop()
				scope.shift()
			else break;
		scope

	calcInnerTextScope: (content,start,end,tag) -> #tag: w:t
		endTag= content.indexOf('</'+tag+'>',end)
		if endTag==-1 then throw "can't find endTag"
		endTag+=('</'+tag+'>').length
		startTag = Math.max content.lastIndexOf('<'+tag+'>',start), content.lastIndexOf('<'+tag+' ',start)
		if startTag==-1 then throw "can't find startTag"
		{"text":content.substr(startTag,endTag-startTag),startTag,endTag}

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

			if copyContent==content
				console.log content
				console.log "Substr====>>>"
				console.log content.substr(startB)
				console.log "#{startB}= #{matches[startiMatch].offset}"
				throw "offset problem0: didnt changed the value (should have changed from #{matches[startiMatch][0]} to #{replacer}"

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

			console.log matches[startiMatch][0]+"=>"+replacer

			content= content.replaceFirstFrom matches[startiMatch][0],replacer, startB

			matches[startiMatch][0]=replacer

			if copyContent==content# or copyContent.length+replacer.length-matches[startiMatch][0].length!=content.length
				console.log content
				console.log "Substr====>>>"
				console.log content.substr(startB)
				console.log "#{startB}= #{matches[startiMatch].offset}"
				throw "offset problem1: didnt changed the value (should have changed from #{matches[startiMatch][0]} to #{replacer}"

			#2.
			for k in [(startiMatch+1)...endiMatch]
				replacer = matches[k][1]+'</w:t>'
				startB= matches[k].offset+charactersAdded[k]
				charactersAdded[k+1]=charactersAdded[k]+replacer.length-matches[k][0].length
				if content.indexOf(matches[k][0])==-1 then throw "content #{matches[k][0]} not found in content"
				copyContent= content
				console.log matches[k][0]+"=>"+replacer
				content= content.replaceFirstFrom matches[k][0],replacer,startB
				matches[k][0]=replacer
				if copyContent==content #or copyContent.length+replacer.length-matches[k][0].length!=content.length
					console.log content
					console.log "Substr====>>>"
					console.log content.substr(startB)
					console.log "#{startB}= #{matches[startiMatch].offset}"
					console.log "new charactersAdded: #{charactersAdded}"
					throw "offset problem2: didnt changed the value (should have changed from #{matches[startiMatch][0]} to #{replacer}"
			#3.
			regexLeft= /^[^}]*}(.*)$/;
			matches[endiMatch][2]=matches[endiMatch][2].replace regexLeft, '$1'
			replacer= '<w:t xml:space="preserve">'+matches[endiMatch][2]+"</w:t>";
			startB= matches[endiMatch].offset+charactersAdded[endiMatch]
			charactersAdded[endiMatch+1]=charactersAdded[endiMatch]+replacer.length-matches[endiMatch][0].length

			if content.indexOf(matches[endiMatch][0])==-1 then throw "content #{matches[endiMatch][0]} not found in content"
			copyContent=content
			content= content.replaceFirstFrom matches[endiMatch][0], replacer,startB
			console.log matches[endiMatch][0]+"=>"+replacer

			if copyContent==content# or copyContent.length+replacer.length-matches[endiMatch][0].length!=content.length
				console.log content
				console.log "Substr====>>>"
				console.log content.substr(startB)
				console.log "#{startB}= #{matches[startiMatch].offset}"
				throw "offset problem3: didnt changed the value (should have changed from #{matches[startiMatch][0]} to #{replacer}"
			matches[endiMatch][0]=replacer
		else
			throw "Bracket closed before opening"

		# if startContent.length+charactersAdded!=content.length+startCharactersAdded then throw "startContent and endContent have not different characters"

		for match, j in matches when j>endiMatch
			charactersAdded[j+1]=charactersAdded[j]

		# console.log charactersAdded.join(',')
		return [content,charactersAdded,matches]
	###
	content is the whole content to be tagged
	scope is the current scope
	returns the new content of the tagged content###
	_applyTemplateVars:(content,currentScope)->
		matches = @_getFullTextMatchesFromData(content)
		charactersAdded= (0 for i in [0...matches.length])

		replacer = (match,pn ..., offset, string)->
			console.log arguments
			pn.unshift match #add match so that pn[0] = whole match, pn[1]= first parenthesis,...
			pn.offset= offset
			matches.unshift pn #add at the beginning
			charactersAdded.unshift 0

		content.replace /^()([^<]+)/,replacer

		inForLoop= false # bracket with sharp: {#forLoop}______{/forLoop}
		inBracket= false # all brackets  {___}
		inDashLoop = false	# bracket with dash: {-tr dashLoop} {/dashLoop}
		textInsideBracket= ""

		for match,i in matches
			innerText= match[2] || "" #text inside the <w:t>
			for t in [i...matches.length]
				charactersAdded[t+1]=charactersAdded[t]
			for character,j in innerText
				for glou,u in matches when u<=i
					if content[glou.offset+charactersAdded[u]]!=glou[0][0]
						console.log "********no < at the beginning of #{glou[0]}: #{content[glou.offset+charactersAdded[u]]}*******"
						console.log u
						console.log glou
						console.log "charAdded: #{charactersAdded.join(',')}"
						console.log content.substr(glou.offset,100)+"..."
						console.log content.substr(glou.offset+charactersAdded[u],100)+"..."
						console.log "no < at the beginning of #{glou[0]}"
						throw "no < at the beginning of #{glou[0]} (2)"

				if character=='{'
					if inBracket is true then throw "Bracket already open with text: #{textInsideBracket}"
					inBracket= true
					textInsideBracket= ""
					startiMatch= i
					startjMatch= j
				else if character == '}'

					if textInsideBracket[0]=='#' and inForLoop is false and inDashLoop is false
						tagForLoop= textInsideBracket.substr 1
						inForLoop= true #begin for loop
						openiStartLoop= startiMatch
						openjStartLoop= startjMatch
						openjEndLoop= j
						openiEndLoop= i

					if textInsideBracket[0]=='-' and inForLoop is false and inDashLoop is false
						tagDashLoop= textInsideBracket.substr 1
						inDashLoop= true
						openiStartLoop= startiMatch
						openjStartLoop= startjMatch
						openjEndLoop = j
						openiEndLoop= i
						regex= /^-([a-zA-Z_:]+) ([a-zA-Z_:]+)$/
						elementDashLoop= textInsideBracket.replace regex, '$1'
						tagDashLoop= textInsideBracket.replace regex, '$2'
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

					if inBracket is false then throw "Bracket already closed"
					inBracket= false

					endiMatch = i
					closejStartLoop= startjMatch
					closejEndLoop= j

					if inForLoop is false and inDashLoop is false
						console.log 'start'
						console.log charactersAdded
						[content,charactersAdded,matches] = @replaceTag(content,endiMatch,startiMatch,matches,textInsideBracket,@getValueFromTag(textInsideBracket,currentScope),charactersAdded)
						console.log charactersAdded
						
					if textInsideBracket[0]=='/' and ('/'+tagDashLoop == textInsideBracket) and inDashLoop is true
						closeiStartLoop= startiMatch
						closeiEndLoop= i
						endLoop= i

						startB= matches[openiStartLoop].offset+matches[openiStartLoop][1].length+charactersAdded[openiStartLoop]+openjStartLoop
						endB= matches[closeiEndLoop].offset+matches[closeiEndLoop][1].length+charactersAdded[closeiEndLoop]+closejEndLoop+1

						resultFullScope = (@calcInnerTextScope content, startB, endB, elementDashLoop)
						charactersAdded[openiStartLoop]-=resultFullScope.startTag
						B= resultFullScope.text

						if (content.indexOf B)==-1 then throw "couln't find B in content"

						A = B

						copyA= A

						#for deleting the opening tag
						[A,charactersAdded,matches]= @replaceTag(A,openiEndLoop,openiStartLoop,matches,"-#{elementDashLoop} #{tagDashLoop}","",charactersAdded)

						if copyA==A then throw "A should have changed after deleting the opening tag"
						copyA= A
						#for deleting the closing tag
						[A,charactersAdded,matches]= @replaceTag(A,closeiEndLoop,closeiStartLoop,matches,'/'+tagDashLoop,"",charactersAdded)

						if copyA==A then throw "A should have changed after deleting the opening tag"


						if currentScope[tagDashLoop]?
							if typeof currentScope[tagDashLoop]!='object' then throw '{#'+tagDashLoop+"}should be an object (it is a #{typeof currentScope[tagDashLoop]})"
							newContent= "";

							for scope,i in currentScope[tagDashLoop]
								newContent+=@_applyTemplateVars A,scope

							content= content.replace B, newContent
						else content= content.replace B, ""

						return @_applyTemplateVars content,currentScope


					if textInsideBracket[0]=='/' and ('/'+tagForLoop == textInsideBracket) and inForLoop is true

						closeiStartLoop= startiMatch
						closeiEndLoop= i

						endLoop= i

						
						startB= matches[openiStartLoop].offset+matches[openiStartLoop][1].length+charactersAdded[openiStartLoop]+openjStartLoop
						endB= matches[closeiEndLoop].offset+matches[closeiEndLoop][1].length+charactersAdded[closeiEndLoop]+closejEndLoop+1
						B= content.substr(startB,endB-startB)

						startA= matches[openiEndLoop].offset+matches[openiEndLoop][1].length+charactersAdded[openiEndLoop]+openjEndLoop+1
						endA= matches[closeiStartLoop].offset+matches[closeiStartLoop][1].length+charactersAdded[closeiStartLoop]+closejStartLoop

						A= content.substr(startA,endA-startA)

						extendedA= content.substr(startA-100,endA-startA+200)
						extendedB= content.substr(startB-100,endB-startB+200)

						if B[0]!='{' or B.indexOf('{')==-1 or B.indexOf('/')==-1 or B.indexOf('}')==-1 or B.indexOf('#')==-1
							console.log matches[openiStartLoop]
							console.log "openiStartLoop:#{openiStartLoop},closeiEndLoop:#{closeiEndLoop},openiEndLoop:#{openiEndLoop},closeiStartLoop:#{closeiStartLoop}"
							console.log charactersAdded[openiStartLoop]
							console.log charactersAdded.join(';')
							console.log B
							console.log "=============>>>"
							console.log A
							throw "no {,#,/ or } found in B: #{B} --------------- Context: #{extendedB}"
						startSubContent= matches[openiStartLoop].offset
						endSubContent= matches[closeiEndLoop].offset


						inForLoop= false #end for loop

						if currentScope[tagForLoop]?
							if typeof currentScope[tagForLoop]!='object' then throw '{#'+tagForLoop+"}should be an object (it is a #{typeof currentScope[tagForLoop]})"
							newContent= "";

							for scope,i in currentScope[tagForLoop]
								newContent+=@_applyTemplateVars A,scope

							content=content.replace B, newContent
						else content= content.replace B, ""

						return @_applyTemplateVars content,currentScope

				else #if character != '{' and character != '}'
					if inBracket is true then textInsideBracket+=character
		content


	applyTemplateVars:()->
		for fileName in @templatedFiles when @files[fileName]?
			fileData= @files[fileName].data
			scope= @templateVars
			@files[fileName].data= @_applyTemplateVars(fileData,scope)
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
		matches= @getFullTextMatches(path,data)
		output= (match[2] for match in matches)
		decode_utf8(output.join(""))
	getFullTextMatches: (path="word/document.xml",data="") ->
		if data== ""
			file= @files[path]
			return @_getFullTextMatchesFromData(file.data)
		else return @_getFullTextMatchesFromData(data)
	_getFullTextMatchesFromData: (data) ->
		regex= "(<w:t[^>]*>)([^<>]*)?</w:t>"
		matches= preg_match_all(regex,data)
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