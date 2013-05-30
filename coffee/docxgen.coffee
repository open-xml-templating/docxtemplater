###
Docxgen.coffee
Created by Edgar HIPP
###

window.encode_utf8 = (s)->
	unescape(encodeURIComponent(s))

window.decode_utf8= (s) ->
	decodeURIComponent(escape(s)).replace(new RegExp(String.fromCharCode(160),"g")," ")


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

	###
	content is the whole content to be tagged
	scope is the current scope
	returns the new content of the tagged content###
	_applyTemplateVars:(content,currentScope)->

		matches = @_getFullTextMatchesFromData(content)


		charactersAdded=0

		replacer = (match,pn ..., offset, string)->
			pn.unshift match #add match so that pn[0] = whole match, pn[1]= first parenthesis,...
			pn.offset= offset
			matches.push pn

		content.replace /^()([^<]+)/,replacer

		inForLoop= false
		inBracket= false
		textInsideBracket= ""

		# console.log matches
		for match,i in matches
			innerText= match[2] || "" #text inside the <w:t>
			for character,j in innerText
				if character=='{'
					if inBracket is true then throw "Bracket already open"
					inBracket= true
					textInsideBracket= ""
					startiMatch= i
					startjMatch= j
				else if character == '}'
					if textInsideBracket[0]=='#' and inForLoop is false
						tagForLoop= textInsideBracket.substr 1
						inForLoop= true #begin for loop
						openiStartLoop= startiMatch
						openjStartLoop= startjMatch
						openjEndLoop= j
						openiEndLoop= i
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

					if inForLoop is false

						if endiMatch==startiMatch #<w>{aaaaa}</w>
							match[2]=match[2].replace "{#{textInsideBracket}}", @getValueFromTag(textInsideBracket,currentScope)
							replacer= '<w:t xml:space="preserve">'+match[2]+"</w:t>"
							charactersAdded+=replacer.length-match[0].length
							if content.indexOf(match[0])==-1 then throw "content #{match[0]} not found in content"
							content = content.replace match[0], replacer
							match[0]=replacer
						else if endiMatch>startiMatch
							###replacement:-> <w:t>blabla12</w:t>   <w:t></w:t> <w:t> blabli</w:t>
							1. for the first (startiMatch): replace {.. by the value
							2. for in between (startiMatch+1...endiMatch) replace whole by ""
							3. for the last (endiMatch) replace ..} by "" ###

							# 1.
							regexRight= /^([^{]*){.*$/
							subMatches= matches[startiMatch][2].match regexRight

							if matches[startiMatch][1]=="" #if the content starts not with <w:t>
								matches[startiMatch][2]=@getValueFromTag(textInsideBracket,currentScope)
								replacer= matches[startiMatch][2]
							else
								matches[startiMatch][2]=subMatches[1]+@getValueFromTag(textInsideBracket,currentScope)
								replacer= '<w:t xml:space="preserve">'+matches[startiMatch][2]+"</w:t>"


							copyContent = content
							charactersAdded+=replacer.length-matches[startiMatch][0].length
							if content.indexOf(matches[startiMatch][0])==-1 then throw "content #{matches[startiMatch][0]} not found in content"
							content= content.replace matches[startiMatch][0],replacer

							if copyContent==content
								throw 'didnt changed the value'

							#2.
							for k in [(startiMatch+1)...endiMatch]
								replacer = matches[k][1]+'</w:t>'
								charactersAdded+=replacer.length-matches[k][0].length
								if content.indexOf(matches[k][0])==-1 then throw "content #{matches[k][0]} not found in content"
								content= content.replace matches[k][0],replacer

							#3.
							regexLeft= /^[^}]*}(.*)$/;
							matches[endiMatch][2]=matches[endiMatch][2].replace regexLeft, '$1'
							replacer= '<w:t xml:space="preserve">'+matches[endiMatch][2]+"</w:t>";
							charactersAdded+=replacer.length-matches[endiMatch][0].length
							if content.indexOf(matches[endiMatch][0])==-1 then throw "content #{matches[endiMatch][0]} not found in content"
							content= content.replace matches[endiMatch][0], replacer
							matches[endiMatch][0]=replacer
							# match= matches[endiMatch]
						else
							throw "Bracket closed before opening"

					if textInsideBracket[0]=='/' and ('/'+tagForLoop == textInsideBracket)

						closeiStartLoop=startiMatch
						closeiEndLoop= i


						throw "For loop not opened" if inForLoop==false

						endLoop=i

						startB= matches[openiStartLoop].offset+matches[openiStartLoop][1].length+charactersAdded+openjStartLoop
						endB= matches[closeiEndLoop].offset+matches[closeiEndLoop][1].length+charactersAdded+closejEndLoop+1
						B= content.substr(startB,endB-startB)

						startA= matches[openiEndLoop].offset+matches[openiEndLoop][1].length+charactersAdded+openjEndLoop+1
						endA= matches[closeiStartLoop].offset+matches[closeiStartLoop][1].length+charactersAdded+closejStartLoop

						A= content.substr(startA,endA-startA)

						extendedA= content.substr(startA-100,endA-startA+200)
						extendedB= content.substr(startB-100,endB-startB+200)

						if B.indexOf('{')==-1 or B.indexOf('/')==-1 or B.indexOf('}')==-1 or B.indexOf('#')==-1then throw "no {,#,/ or } found in B: #{B} --------------- Context: #{extendedB}"
						startSubContent= matches[openiStartLoop].offset
						endSubContent= matches[closeiEndLoop].offset

						console.log "AAAAAAA--#{startA}--#{endA}--#{A}"
						console.log "BBBBBBB--#{startB}--#{endB}--#{B}"

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
	getFullText:(path="word/document.xml") ->
		matches= @getFullTextMatches(path)
		output= (match[2] for match in matches)
		decode_utf8(output.join(""))
	getFullTextMatches: (path="word/document.xml") ->
		file= @files[path]
		@_getFullTextMatchesFromData(file.data)
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