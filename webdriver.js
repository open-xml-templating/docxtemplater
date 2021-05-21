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
const chalk = require("chalk");
function exit(message) {
	console.log(message);
	/* eslint-disable-next-line no-process-exit */
	process.exit(1);
}

let fullBrowserName = null;
const url = require("url");
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
				"--headless",
				// Use --disable-gpu to avoid an error from a missing Mesa
				// library, as per
				// https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md
				"--disable-gpu",
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

const second = 1000;
const minute = 60 * second;

const commonOptions = {
	automationProtocol: "webdriver",
	logLevel: "warn",
	connectionRetryTimeout: 5 * minute,
};

let options;

if (BROWSER === "SAUCELABS") {
	fullBrowserName = `${browserName} ${version} ${platform} (SAUCELABS)`;
	options = {
		...commonOptions,
		tunnelIdentifier: TRAVIS_JOB_NUMBER,
		"tunnel-identifier": TRAVIS_JOB_NUMBER,
		build: TRAVIS_BUILD_NUMBER,
		user: SAUCE_USERNAME,
		key: SAUCE_ACCESS_KEY,
	};
} else {
	options = {
		...commonOptions,
		path: "/wd/hub/",
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
		function (err) {
			if (err) {
				done(err);
				return false;
			}

			done();
		}
	);
}

const timeoutConnection = 180;
const failuresRegex = /.*failures: ([0-9]+).*/;
const passesRegex = /.*passes: ([0-9]+).*/;
const startTime = +new Date();
server.listen(port, async function () {
	let client;
	try {
		client = await webdriverio.remote(options);
	} catch (e) {
		exit(e);
	}
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
			{
				timeout,
				timeoutMsg: `Expected to find text in ${selector} but did not find it`,
			}
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
			{
				timeout,
				timeoutMsg: `Expected to find ${selector} but did not find it`,
			}
		);
	}
	async function test() {
		let interval;
		try {
			if (+new Date() - startTime > timeoutConnection * second) {
				exit(
					`Aborting connection to webdriver after ${timeoutConnection} seconds`
				);
			}

			const mochaUrl = url.parse(
				`http://localhost:${port}/test/mocha.html`,
				true
			);
			delete mochaUrl.search;
			if (process.env.filter) {
				mochaUrl.query.grep = process.env.filter;
				mochaUrl.query.invert = "true";
			}
			mochaUrl.query.browser = fullBrowserName;
			await client.url(url.format(mochaUrl));

			await waitForExist("li.test", 120000);
			let index = 0;
			let running = false;
			interval = setInterval(async function () {
				if (interval === null || running) {
					return;
				}
				running = true;
				const texts = await client.$$("li.test");
				if (index === texts.length) {
					return;
				}
				for (let i = index, len = texts.length; i < len; i++) {
					if (interval === null) {
						return;
					}
					const text = await texts[i].getText();
					console.log(
						text
							.replace(/^(.*)\n(.*)$/g, "$2 $1")
							.replace(/^(.*[^0-9])([0-9]+ms)$/g, "$1 $2")
					);
				}
				index = texts.length;
				running = false;
			}, 100);
			await waitForText("#status", 120000);
			await client.pause(5000);
			await waitForExist("li.failures a", 5000);
			const text = await (await client.$("#mocha-stats")).getText();
			clearInterval(interval);
			interval = null;
			const passes = parseInt(text.replace(passesRegex, "$1"), 10);
			const failures = parseInt(text.replace(failuresRegex, "$1"), 10);
			if (failures > 0) {
				const failedSuites = await client.$$("li.test.fail");
				for (let i = 0, len = failedSuites.length; i < len; i++) {
					const titleElement = await await failedSuites[i].$("h2");
					const title = await client.execute((parent) => {
						let child = parent.firstChild;
						let ret = "";
						while (child) {
							if (child.nodeType === Node.TEXT_NODE) {
								ret += child.textContent;
							}
							child = child.nextSibling;
						}
						return ret;
					}, titleElement);
					const error = await (await failedSuites[i].$("pre.error")).getText();
					console.log(title.replace(/./g, "="));
					console.log(title);
					console.log(title.replace(/./g, "="));
					console.log(error);
					console.log();
				}
				throw new Error(`Failures happened on ${fullBrowserName}`);
			}
			expect(passes).to.be.above(0);
			console.log(
				chalk.green(
					`browser tests successful (${passes} passes) on ${fullBrowserName}`
				)
			);
			if (BROWSER === "SAUCELABS") {
				updateSaucelabsStatus(client, true, (e) => {
					if (e) {
						throw e;
					}
					server.close();
				});
			} else {
				server.close();
			}
			client.deleteSession();
		} catch (e) {
			clearInterval(interval);
			interval = null;
			if (e.message.indexOf("ECONNREFUSED") !== -1) {
				return test();
			}
			if (BROWSER === "SAUCELABS") {
				updateSaucelabsStatus(client, false, (err) => {
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
