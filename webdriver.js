/* eslint-disable no-process-env */
/* eslint-disable no-console */

function exit(message) {
	console.log(message);
	/* eslint-disable no-process-exit */
	process.exit(1);
	/* eslint-enable no-process-exit */
}

const finalhandler = require("finalhandler");
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
	serve(req, res, finalhandler(req, res));
});
server.listen(port, function () {
	browser
		.init()
		.url(`http://localhost:${port}/test/mocha.html`)
		.pause(4000)
		.getText("#mocha-stats").then(function (text) {
			const passes = parseInt(text.replace(/.*passes: ([0-9]+).*/, "$1"), 10);
			const failures = parseInt(text.replace(/.*failures: ([0-9]+).*/, "$1"), 10);
			expect(passes).to.be.above(1);
			expect(failures).to.be.equal(0);
			return {failures, passes};
		})
		.catch(function (e) {
			exit(e);
		})
		.then(function ({passes}) {
			console.log(`browser tests successful (${passes} passes)`);
			server.close();
		})
		.end();
});

