/* eslint-disable no-process-env,no-process-exit,no-console */

import chalk from "chalk";
import url from "url";
import finalhandler from "finalhandler";
import serveStatic from "serve-static";
import http from "http";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { chromium, firefox } from "playwright";
import { expect } from "chai";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Environment variables
const { BROWSER = "CHROME" } = process.env;

const port = 9000;
const second = 1000;
const timeoutConnection = 180;
const failuresRegex = /.*failures: ([0-9]+).*/;
const passesRegex = /.*passes: ([0-9]+).*/;

function exit(message) {
	console.log(message);
	process.exit(1);
}

async function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Browser configuration
const browserConfig = {
	CHROME: {
		launch: () =>
			chromium.launch({
				args: ["--headless", "--disable-gpu"],
			}),
		name: "Chrome (local)",
	},
	FIREFOX: {
		launch: () =>
			firefox.launch({
				args: ["-headless"],
			}),
		name: "Firefox (local)",
	},
};

if (!browserConfig[BROWSER]) {
	exit(`Unknown browser: ${BROWSER}`);
}

// Set up static file server
const serve = serveStatic(__dirname);
const server = http.createServer((req, res) => {
	serve(req, res, finalhandler(req, res));
});

const startTime = +new Date();

server.listen(port, async () => {
	let browser;
	let context;
	let page;

	try {
		browser = await browserConfig[BROWSER].launch();
		context = await browser.newContext();
		page = await context.newPage();

		// Setup console logging
		page.on("console", (msg) => {
			console.log("BROWSERLOG:", msg.text());
		});

		// Main test function
		async function runTests() {
			try {
				if (+new Date() - startTime > timeoutConnection * second) {
					throw new Error(`Aborting after ${timeoutConnection} seconds`);
				}

				// Configure test URL
				const mochaUrl = url.parse(
					`http://localhost:${port}/test/mocha.html`,
					true
				);
				delete mochaUrl.search;
				if (process.env.filter) {
					mochaUrl.query.grep = process.env.filter;
					mochaUrl.query.invert = "true";
				}
				mochaUrl.query.browser = browserConfig[BROWSER].name;

				// Navigate to test page
				await page.goto(url.format(mochaUrl));

				// Wait for tests to start
				await page.waitForSelector("li.test", { timeout: 120000 });

				// Monitor test progress
				const progressInterval = setInterval(async () => {
					const texts = await page.$$eval("li h1, li h2", (elements) =>
						elements.map((el) => el.textContent)
					);

					texts.forEach((text) => {
						console.log(
							text
								.replace(/^(.*)\n(.*)$/g, "$2 $1")
								.replace(/^(.*[^0-9])([0-9]+ms)$/g, "$1 $2")
						);
					});
				}, 100);

				// Wait for tests to complete
				await page.waitForSelector("#status", { timeout: 120000 });
				await page.waitForTimeout(5000);
				await page.waitForSelector("li.failures a", { timeout: 5000 });

				clearInterval(progressInterval);

				// Get test results
				const statsText = await page.$eval(
					"#mocha-stats",
					(el) => el.textContent
				);
				const passes = parseInt(statsText.replace(passesRegex, "$1"), 10);
				const failures = parseInt(statsText.replace(failuresRegex, "$1"), 10);

				if (failures > 0) {
					await sleep(1000);
					const failedTests = await page.$$eval("li.test.fail", (elements) =>
						elements.map((el) => ({
							title: el.querySelector("h2").textContent,
							error: el.querySelector("pre.error").textContent,
						}))
					);

					failedTests.forEach(({ title, error }) => {
						console.log(title.replace(/./g, "="));
						console.log(title);
						console.log(title.replace(/./g, "="));
						console.log(error);
						console.log();
					});

					throw new Error(
						`${failures} failures happened on ${browserConfig[BROWSER].name}`
					);
				}

				expect(passes).to.be.above(0);
				await sleep(1000);
				console.log(
					chalk.green(
						`browser tests successful (${passes} passes) on ${browserConfig[BROWSER].name}`
					)
				);

				// Cleanup
				server.close();
				await browser.close();
				process.exit(0);
			} catch (error) {
				if (error.message.includes("ECONNREFUSED")) {
					return runTests();
				}
				exit(error);
			}
		}

		await runTests();
	} catch (error) {
		if (browser) {
			await browser.close();
		}
		exit(error);
	}
});
