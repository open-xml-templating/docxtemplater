/* eslint-disable no-process-env */
/* eslint-disable no-console */

function exit(message) {
	console.log(message);
	/* eslint-disable no-process-exit */
	process.exit(1);
	/* eslint-enable no-process-exit */
}

let browserName = null;
const finalhandler = require("finalhandler");
const webdriverio = require("webdriverio");
const {expect} = require("chai");
const request = require("request");
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
browserName = process.env.BROWSER + " (local)";
if (!desiredCapabilities) {
	exit("Unknown browser :" + process.env.BROWSER);
}
let options = {desiredCapabilities};

if (process.env.REMOTE_BROWSER === "saucelabs") {
	browserName = process.env.browserName + " " + process.env.version + " " + process.env.platform + " (saucelabs)";
	options = {
		desiredCapabilities: {
			browserName: process.env.browserName,
			version: process.env.version,
			platform: process.env.platform,
			tags: ["docxtemplater"],
			name: "docxtemplater mocha",
			"tunnel-identifier": process.env.TRAVIS_JOB_NUMBER,
			tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
			build: process.env.TRAVIS_BUILD_NUMBER,
			captureHtml: true,
			public: true,
		},
		tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
		"tunnel-identifier": process.env.TRAVIS_JOB_NUMBER,
		build: process.env.TRAVIS_BUILD_NUMBER,
		host: "ondemand.saucelabs.com",
		port: 80,
		user: process.env.SAUCE_USERNAME,
		key: process.env.SAUCE_ACCESS_KEY,
		logLevel: "silent",
	};
}

console.log("Running test on " + browserName);

const browser = webdriverio.remote(options);
const serve = serveStatic(__dirname);
const server = http.createServer(function onRequest(req, res) {
	serve(req, res, finalhandler(req, res));
});

function updateSaucelabsStatus(result, done) {
	const options = {
		headers: {"Content-Type": "text/json"},
		url: "http://" + process.env.SAUCE_USERNAME + ":" + process.env.SAUCE_ACCESS_KEY + "@saucelabs.com/rest/v1/" + process.env.SAUCE_USERNAME + "/jobs/" + browser.requestHandler.sessionID,
		method: "PUT",
		body: JSON.stringify({
			passed: result,
			public: true,
		}),
	};

	request(options, function (err) {
		if(err) {
			done(err);
			return false;
		}

		done();
	});
}
server.listen(port, function () {
	let retries = 0;
	function test() {
		retries++;
		if (retries >= 50) {
			exit(`Aborting connection to webdriver after ${retries} attempts`);
		}
		return browser
			.init()
			.url(`http://localhost:${port}/test/mocha.html`)
			.then(function () {
				return browser.waitForText("#status", 30000);
			})
			.getText("#mocha-stats").then(function (text) {
				const passes = parseInt(text.replace(/.*passes: ([0-9]+).*/, "$1"), 10);
				const failures = parseInt(text.replace(/.*failures: ([0-9]+).*/, "$1"), 10);
				expect(passes).to.be.above(1);
				expect(failures).to.be.equal(0);
				return {failures, passes};
			})
			.then(function ({passes}) {
				console.log(`browser tests successful (${passes} passes)`);
				if (process.env.REMOTE_BROWSER === "saucelabs") {
					updateSaucelabsStatus(true, (e) => {
						if (e) {
							throw e;
						}
						server.close();
					});
				}
				else {
					server.close();
				}
			})
			.end()
			.catch(function (e) {
				if (e.message.indexOf("ECONNREFUSED") !== -1) {
					return test();
				}
				if (process.env.REMOTE_BROWSER === "saucelabs") {
					updateSaucelabsStatus(false, (err) => {
						if (err) {
							throw err;
						}
						exit(e);
					});
				}
				else {
					exit(e);
				}
			});
	}
	test();
});

