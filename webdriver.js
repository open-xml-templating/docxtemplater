/* eslint-disable no-process-env */
/* eslint-disable no-console */

function exit(message) {
	console.log(message);
	/* eslint-disable no-process-exit */
	process.exit(1);
	/* eslint-enable no-process-exit */
}

const webdriverio = require("webdriverio");
const {expect} = require("chai");
const serveStatic = require("serve-static");
const port = 8444;
const http = require("http");

if (!process.env.BROWSER) {
	exit("BROWSER env variable not set");
}

const browserCapability = {
	CHROME: {
		browserName: "chrome",
		chromeOptions: {
			args: [
				"headless",
				// Use --disable-gpu to avoid an error from a missing Mesa
				// library, as per
				// https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md
				"disable-gpu",
			],
		},
	},
	FIREFOX: {
		browserName: "firefox",
	},
};

const desiredCapabilities = browserCapability[process.env.BROWSER];
if (!desiredCapabilities) {
	exit("Unknown browser :" + process.env.BROWSER);
}
const options = {desiredCapabilities};
const browser = webdriverio.remote(options);

const serve = serveStatic(__dirname);
const server = http.createServer(function onRequest(req, res) {
	serve(req, res);
});
server.listen(port, function () {
	browser
		.init()
		.url(`http://localhost:${port}/test/mocha.html`)
		.pause(4000)
		.getText("#mocha-stats").then(function (text) {
			expect(text).match(/passes: [0-9]{3}/);
			expect(text).contain("failures: 0");
		})
		.catch(function (e) {
			exit(e);
		})
		.then(function () {
			console.log("browser tests succesful");
			server.close();
		})
		.end();
});

