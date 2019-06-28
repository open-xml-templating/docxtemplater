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
		"goog:chromeOptions": {
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
		"moz:firefoxOptions": {
			args: ["-headless"],
		},
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
		user: SAUCE_USERNAME,
		key: SAUCE_ACCESS_KEY,
		logLevel: "warn",
	};
}

options.capabilities = desiredCapabilities;

console.log("Running test on " + fullBrowserName);

const serve = serveStatic(__dirname);
const server = http.createServer(function onRequest(req, res) {
	serve(req, res, finalhandler(req, res));
});

function updateSaucelabsStatus(client, result, done) {
	request(
		{
			headers: { "Content-Type": "text/json" },
			url: `http://${SAUCE_USERNAME}:${SAUCE_ACCESS_KEY}@saucelabs.com/rest/v1/${SAUCE_USERNAME}/jobs/${client.sessionId}`,
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

const second = 1000;
const timeoutConnection = 180;
const failuresRegex = /.*failures: ([0-9]+).*/;
const passesRegex = /.*passes: ([0-9]+).*/;
const startTime = +new Date();
server.listen(port, async function() {
	const client = await webdriverio.remote(options);
	async function waitForText(selector, timeout) {
		return await client.waitUntil(
			async function getText() {
				const el = await client.$(selector);
				if (!(await el.isExisting())) {
					return false;
				}
				const text = await el.getText();
				if (text.length > 0) {
					return true;
				}
			},
			timeout,
			`Expected to find text in ${selector} but did not find it`
		);
	}
	async function waitForExist(selector, timeout) {
		return await client.waitUntil(
			async function exists() {
				const el = await client.$(selector);
				if (await el.isExisting()) {
					return true;
				}
			},
			timeout,
			`Expected to find ${selector} but did not find it`
		);
	}
	async function test() {
		try {
			if (+new Date() - startTime > timeoutConnection * second) {
				exit(
					`Aborting connection to webdriver after ${timeoutConnection} seconds`
				);
			}
			const postfix = process.env.filter
				? `?grep=${process.env.filter}&invert=true`
				: "";
			const url = `http://localhost:${port}/test/mocha.html${postfix}`;
			await client.url(url);

			await waitForText("#status", 30000);
			const text = await (await client.$("#mocha-stats")).getText();
			const passes = parseInt(text.replace(passesRegex, "$1"), 10);
			const failures = parseInt(text.replace(failuresRegex, "$1"), 10);
			await waitForExist("li.failures a", 5000);
			await (await client.$("li.failures a")).click();
			await client.pause(2000);
			expect(passes).to.be.above(0);
			expect(failures).to.be.equal(0);
			console.log(
				`browser tests successful (${passes} passes) on ${fullBrowserName}`
			);
			if (BROWSER === "SAUCELABS") {
				updateSaucelabsStatus(client, true, e => {
					if (e) {
						throw e;
					}
					server.close();
				});
			} else {
				server.close();
			}
		} catch (e) {
			if (e.message.indexOf("ECONNREFUSED") !== -1) {
				return test();
			}
			if (BROWSER === "SAUCELABS") {
				updateSaucelabsStatus(client, false, err => {
					if (err) {
						throw err;
					}
					exit(e);
				});
			} else {
				exit(e);
			}
		}
	}
	test();
});
