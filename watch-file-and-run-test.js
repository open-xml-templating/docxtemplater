"use strict";

const fs = require("fs");
const path = require("path");
const exec = require("child_process").exec;

let lastRun = 0;
const throttleTime = 1000;
/* eslint-disable no-console */

function execTests() {
	exec("robo mocha", function (error, stdout, stderr) {
		if (stdout) {
			console.log("stdout: " + stdout);
		}
		if (stderr) {
			console.log("stderr: " + stderr);
		}
		if (error !== null) {
			console.log("exec error: " + error);
		}
	});
}

function onFileChange() {
	const now = new Date().getTime();
	if (now < lastRun + throttleTime) {
		return;
	}
	lastRun = now;

	setTimeout(execTests, 10);
}

fs.watch(path.join(__dirname, "js"), onFileChange);
fs.watch(path.join(__dirname, "js", "tests"), onFileChange);
