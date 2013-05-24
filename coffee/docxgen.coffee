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
							console.log "start==end"
							console.log "foundinside--"+startMatch+"----"+endMatch+"===="+startj+"<->"+endj+"---"+textInsideBracket+"---"+fileName
							console.log textInsideBracket
							match[2]=match[2].replace "{#{textInsideBracket}}", currentScope[innerText]
							replacer= "<w:t"+match[1]+">"+match[2]+"</w:t>"
							fileData = fileData.replace match[0], replacer
							match[0]=replacer
							console.log match[0]
						if endMatch>startMatch    # <w>{aaa</w><w>bbb}</w>
							#startmatch first
							fileData = fileData.replace matches[startMatch][0],  "<w:t"+match[1]+">"+match[2].substr(startj).substr(0,endj)+"</w:t>" 
					else
						if inBracket is true then textInsideBracket+=char

			@files[fileName].data= fileData
			###rules=[{'regex':///
			\{\#				#Opening bracket and opening for
			((?:.(?!<w:t))*)>	#Formating in between
			<w:t([^>]*)>		#begin of text element
			([a-zA-Z_éèàê0-9]+) #tagName
			((?:.(?!<w:t))*)>	#Formating in between
			<w:t([^>]*)>		#begin of text element
			\}					#Closing bracket
			///,'replacement':'$1><w:t$2>#3$4><w:t xml:space="preserve">','forstart':true},
			{'regex':///
			(<w:t[^>]*>)		#Begin of text element
			([^<>]*)			#Any text (not formating)
			\{					#opening bracket
			([a-zA-Z_éèàê0-9]+) #tagName
			\} 					#closing bracket
			([^}])/// 			#anything but a closing bracket
			,'replacement':'$1$2#3$4','forstart':false},
			{'regex':///
			\{					#Opening bracket
			([^}]*?)			#Formating in betweent
			<w:t([^>]*)> 		#begin of text element
			([a-zA-Z_éèàê0-9]+) #tagName
			\}					#Closing Bracket
			///,'replacement':'$1<w:t$2>#3','forstart':false},
			{'regex':///
			\{					#Opening bracket
			((?:.(?!<w:t))*)>	#Formating in between
			<w:t([^>]*)>		#begin of text element
			([a-zA-Z_éèàê0-9]+) #tagName
			((?:.(?!<w:t))*)>	#Formating in between
			<w:t([^>]*)>		#begin of text element
			\}					#Closing bracket
			///,'replacement':'$1><w:t$2>#3$4><w:t xml:space="preserve">','forstart':false}]
			@files[fileName].data= @regexTest(rules,fileData)###

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
		output.join("")
	getFullTextMatches: (path="word/document.xml") ->
		regex= "<w:t([^>]*)>([^<>]*)?</w:t>"
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