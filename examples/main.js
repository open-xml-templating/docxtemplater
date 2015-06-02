DocUtils=require('../js/docUtils.js')
DocxGen=require('../js/docxgen.js')

function textAreaAdjust(o) {
    o.style.height = "1px";
    o.style.height = (25+o.scrollHeight)+"px";
}

loadFile=function(url,callback){
    JSZipUtils.getBinaryContent(url,function(err,data){
		callback(null,data)
    });
}

window.onload=  function () {

var textAreaList= document.getElementsByTagName('textarea');

for (var i = textAreaList.length - 1; i >= 0; i--) {
	textAreaAdjust(textAreaList[i])
	var executeButton=document.createElement('button')
	executeButton.className = "execute";
	executeButton.innerHTML="Execute";
	textAreaList[i].parentNode.insertBefore(executeButton, textAreaList[i].nextSibling);

	var viewRawButton=document.createElement('button')
	viewRawButton.className = "raw";
	viewRawButton.innerHTML="View Initial Document";
	textAreaList[i].parentNode.insertBefore(viewRawButton, textAreaList[i].nextSibling);
};

var executeButtonList= document.getElementsByClassName('execute');

for (var i = 0; i < executeButtonList.length; i++) {
	executeButtonList[i].onclick=function()
	{
		childs=(this.parentNode.childNodes)

		for (var j = 0; j < childs.length; j++) {
			if(childs[j].tagName=='TEXTAREA')
			{
				eval(childs[j].value)
			}
		};
	}
};


var viewRawButtonList= document.getElementsByClassName('raw');

for (var i = 0; i < viewRawButtonList.length; i++) {
	viewRawButtonList[i].onclick=function()
	{
		var childs=(this.parentNode.childNodes)

		for (var j = 0; j < childs.length; j++) {
			if(childs[j].tagName=='TEXTAREA')
			{
				var raw=(childs[j].getAttribute("raw"))
                loadFile(raw,function(err,content){
                    output=new DocxGen(content).getZip().generate({"type":"blob"})
                    saveAs(output,"raw.docx")
                })
			}
		}
	}
}

}
