"use strict";
var browserify = require('browserify');

var options = {
  insertGlobalVars: {
    Buffer: function () {
      // instead of the full polyfill, we just use the raw value
      // (or undefined).
      return '(typeof Buffer !== "undefined" ? Buffer : undefined)';
    }
  },
  postBundleCB: function(src, done) {
    // add the license
    // remove the source mapping of zlib.js, see #75
    var srcWithoutSourceMapping = src.replace(/\/\/@ sourceMappingURL=raw..flate.min.js.map/g, '');
    done(err, license + srcWithoutSourceMapping);
  }
};

var b=browserify(['js/docxgen.js'],options);

var result = b.bundle();


// options.postBundleCB(result);
result.pipe(process.stdout);
