"use strict";
const browserify = require("browserify");
const path = require("path");

const options = {
	insertGlobalVars: {
		xmldom() {
			return {
				XMLSerializer: window.XMLSerializer,
				DOMParser: window.DOMParser,
			};
		},
		Buffer() {
			// instead of the full polyfill, we just use the raw value
			// (or undefined).
			return '(typeof Buffer !== "undefined" ? Buffer : undefined)';
		},
	},
	postBundleCB(src, done) {
		// remove the source mapping of zlib.js, see https://github.com/Stuk/jszip/issues/75
		const srcWithoutSourceMapping = src.replace(/\/\/@ sourceMappingURL=raw..flate.min.js.map/g, "");
		done(null, srcWithoutSourceMapping);
	},
};

const filename = process.argv[2];
if (!filename) {
	throw new Error("You have to specify which file is to be minified");
}

const b = browserify([path.join(__dirname, filename)], options);

const result = b.bundle();

result.pipe(process.stdout);
