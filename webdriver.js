/* eslint-disable no-process-env */
/* eslint-disable no-console */

const {
	BROWSER = "CHROME",
	browserName,
	version,
	platform,
	TRAVIS_JOB_NUMBER,
	TRAVIS_BUILD_NUMBER,
	SAUCE_USERNAME,
	SAUCE_ACCESS_KEY,
} = process.env;
function exit(message) {
	console.log(message);
	/* eslint-disable no-process-exit */
	process.exit(1);
	/* eslint-enable no-process-exit */
}

let fullBrowserName = null;
const finalhandler = require("finalhandler");
const webdriverio = require("webdriverio");
const { expect } = require("chai");
const request = require("request");
const serveStatic = require("serve-static");
const port = 9000;
const http = require("http");

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
	SAUCELABS: {
		browserName,
		version,
		platform,
		tags: ["docxtemplater"],
		name: "docxtemplater mocha",
		"tunnel-identifier": TRAVIS_JOB_NUMBER,
		tunnelIdentifier: TRAVIS_JOB_NUMBER,
		build: TRAVIS_BUILD_NUMBER,
		captureHtml: true,
		public: true,
	},
};

const desiredCapabilities = browserCapability[BROWSER];
fullBrowserName = BROWSER + " (local)";
if (!desiredCapabilities) {
	exit("Unknown browser :" + BROWSER);
}
let options = {};

if (BROWSER === "SAUCELABS") {
	fullBrowserName = `${browserName} ${version} ${platform} (SAUCELABS)`;
	options = {
		tunnelIdentifier: TRAVIS_JOB_NUMBER,
		"tunnel-identifier": TRAVIS_JOB_NUMBER,
		build: TRAVIS_BUILD_NUMBER,
		host: "ondemand.saucelabs.com",
		port: 80,
		user: SAUCE_USERNAME,
		key: SAUCE_ACCESS_KEY,
		logLevel: "silent",
	};
}

options.desiredCapabilities = desiredCapabilities;

console.log("Running test on " + fullBrowserName);

const client = webdriverio.remote(options);
const serve = serveStatic(__dirname);
const server = http.createServer(function onRequest(req, res) {
	serve(req, res, finalhandler(req, res));
});

function updateSaucelabsStatus(result, done) {
	request(
		{
			headers: { "Content-Type": "text/json" },
			url: `http://${SAUCE_USERNAME}:${SAUCE_ACCESS_KEY}@saucelabs.com/rest/v1/${SAUCE_USERNAME}/jobs/${
				client.requestHandler.sessionID
			}`,
			method: "PUT",
			body: JSON.stringify({
				passed: result,
				public: true,
			}),
		},
		function(err) {
			if (err) {
				done(err);
				return false;
			}

			done();
		}
	);
}

const startTime = +new Date();
server.listen(port, function() {
	function test() {
		if (+new Date() - startTime > 10000) {
			exit("Aborting connection to webdriver after 10 seconds");
		}
		return client
			.init()
			.url(`http://localhost:${port}/test/mocha.html`)
			.then(function() {
				return client.waitForText("#status", 30000);
			})
			.getText("#mocha-stats")
			.then(function(text) {
				const passes = parseInt(text.replace(/.*passes: ([0-9]+).*/, "$1"), 10);
				const failures = parseInt(
					text.replace(/.*failures: ([0-9]+).*/, "$1"),
					10
				);
				return client
					.waitForExist("li.failures a", 5000)
					.then(function() {
						return client.element("li.failures a").click();
					})
					.then(function() {
						return client.pause(2000);
					})
					.then(function() {
						expect(passes).to.be.above(0);
						expect(failures).to.be.equal(0);
						return { failures, passes };
					});
			})
			.then(function({ passes }) {
				console.log(
					`browser tests successful (${passes} passes) on ${fullBrowserName}`
				);
				if (BROWSER === "SAUCELABS") {
					updateSaucelabsStatus(true, e => {
						if (e) {
							throw e;
						}
						server.close();
					});
				} else {
					server.close();
				}
			})
			.end()
			.catch(function(e) {
				if (e.message.indexOf("ECONNREFUSED") !== -1) {
					return test();
				}
				if (BROWSER === "SAUCELABS") {
					updateSaucelabsStatus(false, err => {
						if (err) {
							throw err;
						}
						exit(e);
					});
				} else {
					exit(e);
				}
			});
	}
	test();
});
