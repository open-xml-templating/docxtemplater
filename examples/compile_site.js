var Mustache = require('mustache');
var fs = require('fs');

var view = {
  title: "Joe",
  calc: function () {
    return 2 + 4;
  }
};

var baseHtml = fs.readFileSync(__dirname+"/index.mustache").toString();

var output = Mustache.render(baseHtml, view);

fs.writeFileSync(__dirname+"/index.html", output);
