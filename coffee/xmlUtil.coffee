DocUtils=require('./docUtils')
XmlUtil={}

XmlUtil.getListXmlElements= (text,start=0,end=text.length-1) ->
	###
	get the different closing and opening tags between two texts (doesn't take into account tags that are opened then closed (those that are closed then opened are returned)):
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
XmlUtil.getListDifferenceXmlElements= (text,start=0,end=text.length-1) -> #it returns the difference between two scopes, ie simplifyes closes and opens. If it is not null, it means that the beginning is for example in a table, and the second one is not. If you hard copy this text, the XML will  break
	scope= @getListXmlElements text,start,end
	while(1)
		if (scope.length<=1) #if scope.length==1, then they can't be an opeining and closing tag
			break;
		if ((scope[0]).tag.substr(2)==(scope[scope.length-1]).tag.substr(1)) #if the first closing is the same than the last opening, ie: [</tag>,...,<tag>]
			scope.pop() #remove both the first and the last one
			scope.shift()
		else break;
	scope

module.exports=XmlUtil
