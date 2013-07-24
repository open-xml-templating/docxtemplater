#!/usr/bin/env node

/**
 * Module dependencies.
 */


var path = require('path');
var fs = require('fs');
var lib = path.join(path.dirname(fs.realpathSync(__filename)), '../lib');


global.fs = require('fs');
global.vm = require('vm');
global.http= require('http');
global.https = require('https');
global.DOMParser = require('xmldom').DOMParser;
global.XMLSerializer = require('xmldom').XMLSerializer;
global.PNG = require(__dirname+'/../../libs/pngjs/png-node');


["grid.js", "version.js", "detector.js", "formatinf.js", "errorlevel.js", "bitmat.js", "datablock.js", "bmparser.js", "datamask.js", "rsdecoder.js", "gf256poly.js", "gf256.js", "decoder.js", "qrcode.js", "findpat.js", "alignpat.js", "databr.js"].forEach(function(file) {
return vm.runInThisContext(global.fs.readFileSync(__dirname + '/../../libs/jsqrcode/' + file), file);
});
['jszip.js', 'jszip-load.js', 'jszip-deflate.js', 'jszip-inflate.js'].forEach(function(file) {
return vm.runInThisContext(global.fs.readFileSync(__dirname + '/../../libs/jszip/' + file), file);
});
['docxgen.js'].forEach(function(file) {
return vm.runInThisContext(global.fs.readFileSync(__dirname + '/../../js/' + file), file);
});

require(lib + '/main.js');


// global.vm = require('vm');
// var path = require('path');
// global.https = require('https');
// global.http= require('http');
// global.fs = require('fs');
// vm.runInThisContext(global.fs.readFileSync('docxgen.js'), 'docxgen.js');
// DocUtils.loadDoc('https://ws.sfereno.com/report/images/deperditionsThermiques?murs=34&renouvellementAir=14&plancherHaut=21&pontsThermiques=4&ouvertures=11&plancherBas=16')