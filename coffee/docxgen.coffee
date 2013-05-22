###
Docxgen.coffee
Created by Edgar HIPP
###

Object.size = (obj) ->
	size=0
	log = 0
	for key of obj
		size++
	size

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
				console.log "rule"+i+"-->#{rule.regex}";
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
				console.log ("#{match[0]}")
				console.log "--------->>>>>"
				console.log match
				console.log(replacement)
				output= output.replace match[0],replacement
		output
	applyTemplateVars:()->
		for fileName in @templatedFiles when @files[fileName]?
			fileData= @files[fileName].data
			rules=[{'regex':///
			(<w:t[^>]*>)		#Begin of text element
			([^<>]*)			#Any text (not formating)
			\{					#opening bracket
			([a-zA-Z_éèàê0-9]+) #tagName
			\} 					#closing bracket
			([^}])/// 			#anything but a closing bracket
			,'replacement':'$1$2#3$4'},
			{'regex':///
			\{					#Opening bracket
			([^}]*?)			#Formating in betweent
			<w:t([^>]*)> 		#begin of text element
			([a-zA-Z_éèàê0-9]+) #tagName
			\}					#Closing Bracket
			///,'replacement':'$1<w:t$2>#3'},
			{'regex':///
			\{					#Opening brakcket
			((?:.(?!<w:t))*)>	#Formating in between
			<w:t([^>]*)>		#begin of text element
			([a-zA-Z_éèàê0-9]+) #tagName
			((?:.(?!<w:t))*)>	#Formating in between
			<w:t([^>]*)>		#begin of text element
			\}					#Closing bracket
			///,'replacement':'$1><w:t$2>#3$4><w:t xml:space="preserve">'}]
			@files[fileName].data= @regexTest(rules,fileData)
	#output all files, if docx has been loaded via javascript, it will be available
	output: (download = true) ->
		zip = new JSZip()
		doOutput= () ->
			document.location.href= "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,#{outputFile}"
		for index of @files
			file=@files[index]
			if file.name.slice(-1)!='/'
				if file.name.slice(-4) in [".png",".emf",".jpg","jpeg"]
					zip.file file.name,file.data,file.options
				else
					zip.file file.name,file.data#,file.options
		outputFile= zip.generate()
		if download==true then doOutput()
		outputFile
	download: (swfpath, imgpath, filename="default.docx") ->
		outputFile= @output(false)
		Downloadify.create 'downloadify',
			filename: () ->	return filename
			data: () -> 
				return outputFile
			# onComplete: () ->  alert 'Your File Has Been Saved!'
			onCancel: () -> alert 'You have cancelled the saving of this file.'
			onError: () -> alert 'You must put something in the File Contents or there will be nothing to save!'
			swf: swfpath
			downloadImage: imgpath
			width: 100
			height: 30
			transparent: true
			append: false
			dataType:'base64'
		