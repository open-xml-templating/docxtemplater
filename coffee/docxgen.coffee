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
	regexTest:(rules,file_data) ->
		output= file_data
		for rule,i in rules
			while output.match(rule.regex)
				match= rule.regex.exec(output);
				current_char=0
				rule_replacement_length= rule.replacement.length
				replacement= ""
				while (current_char<=rule_replacement_length)
					if rule.replacement.charAt(current_char)=='$'
						current_char++;
						i= parseInt rule.replacement.charAt(current_char)
						replacement+=match[i]
					else if rule.replacement.charAt(current_char)=='#'
						current_char++;
						i= parseInt rule.replacement.charAt(current_char)
						replacement+=@templateVars[match[i]]
					else
						replacement+=rule.replacement.charAt(current_char)
					current_char++
				output= output.replace match[0],replacement
				
		output
	applyTemplateVars:()->
		for file_name in @templatedFiles when @files[file_name]?
			file_data= @files[file_name].data
			rules=[{'regex':///
			(<w:t[^>]*>)		#Begin of text element
			([^<>]*)			#Any text (not formating)
			\{					#opening bracket
			([a-zA-Z_éèàê0-9]+) #tag_name
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
			([^}]*?)			#Formating in between
			<w:t([^>]*)>		#begin of text element
			([a-zA-Z_éèàê0-9]+) #tagName
			(.*?)				#Formating in between
			<w:t([^>]*)>		#begin of text element
			\}					#Closing bracket
			///,'replacement':'$1<w:t$2>#3$4<w:t xml:space="preserve">'}]
			@files[file_name].data= @regexTest(rules,file_data)
	#output all files, if docx has been loaded via javascript, it will be available
	output: (download = true) ->
		file_count= Object.size(@files)
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
		