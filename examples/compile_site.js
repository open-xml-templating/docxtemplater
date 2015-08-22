var Mustache = require('mustache');
var fs = require('fs');

var view = {
  features: {
    easy:fs.readFileSync(__dirname+"/basic14.svg").toString(),
    everywhere:fs.readFileSync(__dirname+"/cellphone106.svg").toString(),
    fulldocumentation:fs.readFileSync(__dirname+"/text150.svg").toString(),
    manytags:fs.readFileSync(__dirname+"/open112.svg").toString(),
    openextension:fs.readFileSync(__dirname+"/puzzle37.svg").toString(),
    freebeer:fs.readFileSync(__dirname+"/drink24.svg").toString(),
    fullytested:fs.readFileSync(__dirname+"/test-tube12.svg").toString(),
  }
};

var baseHtml = fs.readFileSync(__dirname+"/index.mustache").toString();

var output = Mustache.render(baseHtml, view);

fs.writeFileSync(__dirname+"/index.html", output);
