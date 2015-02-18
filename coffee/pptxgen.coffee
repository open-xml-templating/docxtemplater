###
PptxGen.coffee
Created by @contextmatters, based on DocxGen by Edgar HIPP

Notes:
Based on DocxGen, this class implements specifics for working with PPTx files.
Most of the code below exists to manage the relationships necessary to support
adding slides when content in a table spills over.

0) render -> does the search/replacements as per DocXGen
1) post render, it checks each slide for a table with more rows than the @chunkSize() (set in DocUtils.config["pptx.splitRows"]; 5 is the default)
2) for each overflow table:
 - figure out how many slides must be added
 - use @splitTableIntoChunks() to break the table into bounded pieces based on the original slide; repeat header if desireed (set in DocUtils.config["pptx.repeatHeader"]; defaults to true)
 - each addition is added to the updated TOC in @all_slides
3) for each slide in @all_slides, add the file and the relationships to support it via @presentationLinks()
 - pptx is a zip that keeps slides in "ppt/slides/slideN.xml"
 - "[Content_Types].xml" keeps a list of files included
 - "ppt/presentation.xml" - keeps a list of slide relationships (i.e. what slideLayout, master, handoutmaster, etc are used)
 - "ppt/_rels/presentation.xml.rels" keeps a TOC that connects a filename to a relationship id (relId) via a "slidelst" entry
4) once all of that is done, resume normal operations

###

DocUtils=require('./docUtils')
DocxGen=require('./docxgen')
PptXTemplater=require('./pptxTemplater')
XmlMatcher=require('./xmlMatcher')
JSZip=require('jszip')

PptxGen = class PptxGen extends DocxGen

	additionalSlide:(addition)->
		if addition["first"]
			@zip.file(addition["original_file_name"], addition["chunk"])
		else
			@addSlide(addition["original_index"], addition["new_index"], addition["chunk"])

	addSlide:(source, num, content)->
		@zip.file("ppt/slides/slide"+num+".xml",content)
		@newSlideRel(source, num)

	allSlides:->
		@all_slides ||= @getAllSlides()

	chunkSize:->
		@chunk_size ||= DocUtils.config["pptx.splitRows"] || 5

	contentTypeParts:->
		parts = ""
		for i in [@originalSlidesCount()+1..@totalSlidesCount()] by 1
			parts += '<Override PartName="/ppt/slides/slide'+i+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
		return parts

	contentTypesContent:->
		@content_types_content ||= @zip.file("[Content_Types].xml").asText()

	existingMaxRelId: ->
		@existing_max_rel_id ||= Math.max.apply(null, @existingRelIds())

	existingRelIds: ->
		@existing_rel_ids ||= @presentationRelsContent().match(/rId(\d+)/g).map (str)-> Number(str.substring(3,str.length))

	getAllSlides:->
		@all_slides = []
		for file_name, index in @getSlideTemplates()
			original_content = @zip.file(file_name).asText()
			rows = DocUtils.preg_match_all("\/a:tr",original_content)
			additional_table_slides = Math.floor(rows.length/@chunkSize())
			chunks = @splitTableIntoChunks(original_content, additional_table_slides, @chunkSize())
			for i in [0..additional_table_slides-1] by 1
				@all_slides.push {chunk: chunks[i], original_file_name: file_name, original_index: index+1, additional_table_slides: additional_table_slides, new_index: i+1, first: (i==0)}
		return @all_slides

	getNewRelIds: ->
		@rel_ids = []
		for slide_id in [1..@newSlidesCount()] by 1
			@rel_ids.push @existingMaxRelId()+slide_id
		return @rel_ids

	getSlideMasters:->
		@slide_masters ||= @zip.file(/ppt\/(slideMasters)\/(slideMaster)\d+\.xml/).map (file) -> file.name

	getSlideTemplates:->
		@slide_templates ||= @zip.file(/ppt\/(slides)\/(slide)\d+\.xml/).map (file) -> file.name

	getTemplateClass:->PptXTemplater

	getTemplatedFiles:->
		@getSlideTemplates().concat ["ppt/presentation.xml"], @getSlideMasters()

	getFullText:(path="ppt/slides/slide1.xml") ->
		super(path)

	insertBefore:(content, target, insert)->
		pos = content.indexOf(target)
		return @spliceInto(pos, content, insert)

	newPresentationRels: ->
		string = ""
		for slide_id in [@originalSlidesCount()+1..@totalSlidesCount()] by 1
			rel_id = @existingMaxRelId()+(slide_id-@originalSlidesCount())
			string += @slideRel(rel_id, slide_id)
		return string

	newRelIds: ->
		@rel_ids ||= @getNewRelIds()

	newSlidesCount:->
		@new_slides ||= @totalSlidesCount() - @originalSlidesCount()

	newSlideRel:(source, num) =>
		slide_rel = @zip.file("ppt/slides/_rels/slide"+source+".xml.rels").asText()
		@zip.file("ppt/slides/_rels/slide"+num+".xml.rels", slide_rel)

	originalSlidesCount:->
		@original_slide_count ||= @getSlideTemplates().length

	presentationLinks:->
		@zip.file("ppt/_rels/presentation.xml.rels", @updatePresentationRelsContent())
		@zip.file("ppt/presentation.xml", @updatePresentationContent())
		@zip.file("[Content_Types].xml", @updateContentTypes())

	presentationRelsContent:->
		@presentation_rels_content ||= @zip.file("ppt/_rels/presentation.xml.rels").asText()

	presentationContent:->
		@presentation_content ||= @zip.file("ppt/presentation.xml").asText()

	totalSlidesCount:->
		@total_slides_count ||= @allSlides().length

	render:->
		@moduleManager.sendEvent('rendering')
		for file_name in @templatedFiles when @zip.files[file_name]?
			@moduleManager.sendEvent('rendering-file',file_name)
			currentFile= @createTemplateClass(file_name)
			content = currentFile.render().content
			@zip.file(file_name,content)
			@moduleManager.sendEvent('rendered-file',file_name)
		for addition, index in @allSlides()
			@additionalSlide(addition) if addition["additional_table_slides"] > 0
		@presentationLinks()
		@moduleManager.sendEvent('rendered')
		this

	repeatHeader:->
		@repeat_header ||= DocUtils.config["pptx.repeatHeader"] ? 1 : 0

	slideRel:(rel_id, slide_id) ->
		'<Relationship Id="rId'+rel_id+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+slide_id+'.xml"/>'

	spliceInto:(start, text, str)->
		return text.substring(0, start) + str + text.substring(start, text.length)

	splitTableIntoChunks: (content, chunk_count, chunk_size)->
		mid_start = content.indexOf("<a:tr h=")
		mid_end = content.indexOf("</a:tbl>")
		middle = content.substring(mid_start, mid_end)
		rows = middle.match(/\<a\:tr h\=\"\d{6}\"\>(.*?)\<\/a\:tr\>/g)
		header= rows.splice(0, 1)

		top = content.substring(0, mid_start)
		bottom = content.substring(mid_end, content.length)
		chunks = []
		chunk_start = 0
		for row_index in [1..chunk_count] by 1
			header = "" if not @repeatHeader() and row_index > 1
			chunk_start = chunk_end if row_index > 1
			chunk_end = chunk_start + chunk_size
			middle_rows = rows.slice(chunk_start, chunk_end).join("")
			chunks[row_index-1] = top+header+middle_rows+bottom

		return chunks

	updateContentTypes:->
		return @insertBefore(@contentTypesContent(), '</Types>', @contentTypeParts())

	updatePresentationContent:->
		presentation_content = @presentationContent()
		for slide_id in [1..@newSlidesCount()] by 1
			id = 1000+slide_id
			rel_id = @existingMaxRelId()+(slide_id-@originalSlidesCount()+1)
			presentation_content = @insertBefore(presentation_content, '</p14:sldIdLst>', '<p14:sldId id="'+id+'"/>')
			presentation_content = @insertBefore(presentation_content, '</p:sldIdLst>', '<p:sldId id="'+id+'" r:id="rId'+rel_id+'"/>')
		return presentation_content

	updatePresentationRelsContent:->
		return @insertBefore(@presentationRelsContent(), '</Relationships>', @newPresentationRels() )

module.exports=PptxGen
