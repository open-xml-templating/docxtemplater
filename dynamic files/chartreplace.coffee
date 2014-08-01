		
		
		# tagsMatch = new RegExp("{[^{}]+}","g")
		# @data = @xmlTemplater.content
		# @tagArray = tagsMatch.exec(@data)
		# if @tagArray == null  #Nothing to do here...
			# return @data 
		# else #Graph contains tags, struggle starts here...
			# @getAllTags(@tagArray)
		# match

		
	# getAllTags:(@tagArray)->
		# for tag in @tagArray
			# filter1 = tag.substring(1,tag.length-1) #remove '{' and '}'