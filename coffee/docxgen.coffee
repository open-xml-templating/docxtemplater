###
Docxgen.coffee
Created by Edgar HIPP
###

preg_match_all= (regex, haystack) ->
	globalRegex = new RegExp(regex, 'g');
	globalMatch = haystack.match(globalRegex);
	matchArray = new Array();
	if globalMatch!=null
		for match,i in globalMatch
			nonGlobalRegex = new RegExp(regex);
			nonGlobalMatch = globalMatch[i].match(nonGlobalRegex)
			matchArray.push(nonGlobalMatch)
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
	regexTest:(rules,fileData) ->
		output= fileData
		for rule,i in rules
			while output.match(rule.regex)
				match= rule.regex.exec(output);
				currentChar=0
				ruleReplacementLength= rule.replacement.length
				replacement= ""
				while (currentChar<=ruleReplacementLength)
					if rule.replacement.charAt(currentChar)=='$'
						currentChar++;
						j= parseInt rule.replacement.charAt(currentChar)
						replacement+=match[j]
					else if rule.replacement.charAt(currentChar)=='#'
						currentChar++;
						j= parseInt rule.replacement.charAt(currentChar)
						replacement+=@templateVars[match[j]]
					else
						replacement+=rule.replacement.charAt(currentChar)
					currentChar++
				output= output.replace match[0],replacement
		output
	applyTemplateVars:()->
		for fileName in @templatedFiles when @files[fileName]?
			matches = @getFullTextMatches(fileName)
			fileData= @files[fileName].data
			scopes=[@templateVars]
			currentScope= @templateVars
			console.log currentScope
			inBracket= false
			
			for match,i in matches
				innerText= match[2]  #text inside the <w:t>

				for char,j in innerText
					if char=='{'
						if inBracket is true then throw "Bracket already open"
						inBracket= true
						textInsideBracket= ""
						startMatch= i
						startj=j
					else if char == '}'
						if inBracket is false then throw "Bracket already closed"
						inBracket= false
						endMatch = i
						endj=j+1
						starti= i
						if endMatch==startMatch #<w>{aaaaa}</w>
							# console.log "start==end"
							# console.log "foundinside--"+startMatch+"----"+endMatch+"===="+startj+"<->"+endj+"---"+textInsideBracket+"---"+fileName
							# console.log textInsideBracket
							match[2]=match[2].replace "{#{textInsideBracket}}", currentScope[innerText]
							replacer= '<w:t xml:space="preserve">'+match[2]+"</w:t>"
							fileData = fileData.replace match[0], replacer
							console.log "match0->#{match[0]}---replacer:#{replacer}"
							match[0]=replacer
						else if endMatch>startMatch

							###replacement:-> <w:t>blabla12</w:t>   <w:t></w:t> <w:t> blabli</w:t>
							1. for the first ($startMatch): replace {.. by the value
							2. for in between ($startMatch+1..$endMatch$) replace whole by ""
							3. for the last ($endMatch) replace ..} by ""###
							
							# 1.
							regexRight= /^([^{]*){.*$/
							subMatches= matches[startMatch][2].match regexRight
							matches[startMatch][2]=subMatches[1]+currentScope[textInsideBracket]
							replacer= '<w:t xml:space="preserve">'+matches[startMatch][2]+"</w:t>"
							console.log "match0->#{matches[startMatch][0]}---replacer:#{replacer}"
							glou=fileData
							fileData=fileData.replace matches[startMatch][0],replacer
							
							if glou==fileData
								throw 'didnt changed the value'
							#2.

							for k in [(startMatch+1)...endMatch]
								replacer = matches[k][1]+'</w:t>'
								fileData= fileData.replace matches[k][0],replacer
								console.log "match0->#{matches[k][0]}---replacer:#{replacer}"
							
							#3.
							regexLeft= /^[^}]*}(.*)$/;
							matches[endMatch][2]=matches[endMatch][2].replace regexLeft, '$1'
							replacer= '<w:t xml:space="preserve">'+matches[endMatch][2]+"</w:t>";
							fileData= fileData.replace matches[endMatch][0], replacer
							console.log "match0->#{matches[endMatch][0]}---replacer:#{replacer}"
							matches[endMatch][0]=replacer
						else
							throw "Bracket closed before opening"
						# if endMatch>startMatch    # <w>{aaa</w><w>bbb}</w>
						# 	#startmatch first
							
						# 	fileData = fileData.replace matches[startMatch][0],  "<w:t"+match[1]+">"+match[2].substr(startj).substr(0,endj)+"</w:t>" 
					else
						if inBracket is true then textInsideBracket+=char

			@files[fileName].data= fileData

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
		console.log matches
		output= (match[2] for match in matches)
		output.join("")
	getFullTextMatches: (path="word/document.xml") ->
		regex= "(<w:t[^>]*>)([^<>]*)?</w:t>"
		file= @files[path]
		matches= preg_match_all(regex,file.data)
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