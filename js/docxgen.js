/*
Docxgen.coffee
Created by Edgar HIPP
*/


(function() {
  var DocxGen, preg_match_all,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  preg_match_all = function(regex, haystack) {
    var globalMatch, globalRegex, i, match, matchArray, nonGlobalMatch, nonGlobalRegex, _i, _len;

    globalRegex = new RegExp(regex, 'g');
    globalMatch = haystack.match(globalRegex);
    matchArray = new Array();
    if (globalMatch !== null) {
      for (i = _i = 0, _len = globalMatch.length; _i < _len; i = ++_i) {
        match = globalMatch[i];
        nonGlobalRegex = new RegExp(regex);
        nonGlobalMatch = globalMatch[i].match(nonGlobalRegex);
        matchArray.push(nonGlobalMatch);
      }
    }
    return matchArray;
  };

  window.DocxGen = DocxGen = (function() {
    var imageExtensions;

    imageExtensions = ['gif', 'jpeg', 'jpg', 'emf', 'png'];

    function DocxGen(content, templateVars) {
      this.templateVars = templateVars != null ? templateVars : {};
      this.files = {};
      this.templatedFiles = ["word/document.xml", "word/footer1.xml", "word/footer2.xml", "word/footer3.xml", "word/header1.xml", "word/header2.xml", "word/header3.xml"];
      if (typeof content === "string") {
        this.load(content);
      }
    }

    DocxGen.prototype.load = function(content) {
      var zip;

      zip = new JSZip(content);
      return this.files = zip.files;
    };

    DocxGen.prototype.getImageList = function() {
      var extension, imageList, index, regex;

      regex = /[^.]*\.([^.]*)/;
      imageList = [];
      for (index in this.files) {
        extension = index.replace(regex, '$1');
        if (__indexOf.call(imageExtensions, extension) >= 0) {
          imageList.push({
            "path": index,
            files: this.files[index]
          });
        }
      }
      return imageList;
    };

    DocxGen.prototype.setImage = function(path, data) {
      return this.files[path].data = data;
    };

    DocxGen.prototype.setTemplateVars = function(templateVars) {
      return this.templateVars = templateVars;
    };

    DocxGen.prototype.regexTest = function(rules, fileData) {
      var currentChar, i, j, match, output, replacement, rule, ruleReplacementLength, _i, _len;

      output = fileData;
      for (i = _i = 0, _len = rules.length; _i < _len; i = ++_i) {
        rule = rules[i];
        while (output.match(rule.regex)) {
          match = rule.regex.exec(output);
          currentChar = 0;
          ruleReplacementLength = rule.replacement.length;
          replacement = "";
          while (currentChar <= ruleReplacementLength) {
            if (rule.replacement.charAt(currentChar) === '$') {
              currentChar++;
              j = parseInt(rule.replacement.charAt(currentChar));
              replacement += match[j];
            } else if (rule.replacement.charAt(currentChar) === '#') {
              currentChar++;
              j = parseInt(rule.replacement.charAt(currentChar));
              replacement += this.templateVars[match[j]];
            } else {
              replacement += rule.replacement.charAt(currentChar);
            }
            currentChar++;
          }
          output = output.replace(match[0], replacement);
        }
      }
      return output;
    };

    DocxGen.prototype.applyTemplateVars = function() {
      var char, currentScope, endMatch, endj, fileData, fileName, i, inBracket, innerText, j, match, matches, replacer, scopes, startMatch, starti, startj, textInsideBracket, _i, _j, _k, _len, _len1, _len2, _ref, _results;

      _ref = this.templatedFiles;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        fileName = _ref[_i];
        if (!(this.files[fileName] != null)) {
          continue;
        }
        matches = this.getFullTextMatches(fileName);
        fileData = this.files[fileName].data;
        scopes = [this.templateVars];
        currentScope = this.templateVars;
        inBracket = false;
        for (i = _j = 0, _len1 = matches.length; _j < _len1; i = ++_j) {
          match = matches[i];
          innerText = match[2];
          for (j = _k = 0, _len2 = innerText.length; _k < _len2; j = ++_k) {
            char = innerText[j];
            if (char === '{') {
              if (inBracket === true) {
                throw "Bracket already open";
              }
              inBracket = true;
              textInsideBracket = "";
              startMatch = i;
              startj = j;
            } else if (char === '}') {
              if (inBracket === false) {
                throw "Bracket already closed";
              }
              inBracket = false;
              endMatch = i;
              endj = j + 1;
              starti = i;
              if (endMatch === startMatch) {
                console.log("start==end");
                console.log("foundinside--" + startMatch + "----" + endMatch + "====" + startj + "<->" + endj + "---" + textInsideBracket + "---" + fileName);
                console.log(textInsideBracket);
                match[2] = match[2].replace("{" + textInsideBracket + "}", currentScope[innerText]);
                replacer = "<w:t" + match[1] + ">" + match[2] + "</w:t>";
                fileData = fileData.replace(match[0], replacer);
                match[0] = replacer;
                console.log(match[0]);
              }
              if (endMatch > startMatch) {
                fileData = fileData.replace(matches[startMatch][0], "<w:t" + match[1] + ">" + match[2].substr(startj).substr(0, endj) + "</w:t>");
              }
            } else {
              if (inBracket === true) {
                textInsideBracket += char;
              }
            }
          }
        }
        _results.push(this.files[fileName].data = fileData);
        /*rules=[{'regex':///
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
        			@files[fileName].data= @regexTest(rules,fileData)
        */

      }
      return _results;
    };

    DocxGen.prototype.output = function(download) {
      var doOutput, file, index, outputFile, zip;

      if (download == null) {
        download = true;
      }
      zip = new JSZip();
      doOutput = function() {
        return document.location.href = "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64," + outputFile;
      };
      for (index in this.files) {
        file = this.files[index];
        zip.file(file.name, file.data, file.options);
      }
      outputFile = zip.generate();
      if (download === true) {
        doOutput();
      }
      return outputFile;
    };

    DocxGen.prototype.getFullText = function(path) {
      var match, matches, output;

      if (path == null) {
        path = "word/document.xml";
      }
      matches = this.getFullTextMatches(path);
      output = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = matches.length; _i < _len; _i++) {
          match = matches[_i];
          _results.push(match[2]);
        }
        return _results;
      })();
      return output.join("");
    };

    DocxGen.prototype.getFullTextMatches = function(path) {
      var file, matches, regex;

      if (path == null) {
        path = "word/document.xml";
      }
      regex = "<w:t([^>]*)>([^<>]*)?</w:t>";
      file = this.files[path];
      return matches = preg_match_all(regex, file.data);
    };

    DocxGen.prototype.download = function(swfpath, imgpath, filename) {
      var outputFile;

      if (filename == null) {
        filename = "default.docx";
      }
      outputFile = this.output(false);
      return Downloadify.create('downloadify', {
        filename: function() {
          return filename;
        },
        data: function() {
          return outputFile;
        },
        onCancel: function() {
          return alert('You have cancelled the saving of this file.');
        },
        onError: function() {
          return alert('You must put something in the File Contents or there will be nothing to save!');
        },
        swf: swfpath,
        downloadImage: imgpath,
        width: 100,
        height: 30,
        transparent: true,
        append: false,
        dataType: 'base64'
      });
    };

    return DocxGen;

  })();

}).call(this);
