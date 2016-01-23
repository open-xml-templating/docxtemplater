"use strict";
var browserify = require("browserify");
var path = require("path");

var options = {
	insertGlobalVars: {
		Buffer: function () {
			// instead of the full polyfill, we just use the raw value
			// (or undefined).
			return '(typeof Buffer !== "undefined" ? Buffer : undefined)';
		},
	},
	postBundleCB: function (src, done) {
		// remove the source mapping of zlib.js, see https://github.com/Stuk/jszip/issues/75
		var srcWithoutSourceMapping = src.replace(/\/\/@ sourceMappingURL=raw..flate.min.js.map/g, "");
		done(null, srcWithoutSourceMapping);
	},
};

var b = browserify([path.join(__dirname, "/js/docxgen.js")], options);

var result = b.bundle();

result.pipe(process.stdout);
