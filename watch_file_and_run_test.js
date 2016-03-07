"use strict";

var fs = require("fs");
var path = require("path");
var exec = require("child_process").exec;

var lastRun = 0;
var throttleTime = 1000;

var execTests = function () {
	/* eslint-disable no-console */
	exec("npm run mocha -- --colors", function (error, stdout, stderr) {
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
};

fs.watch(path.join(__dirname, "js"), function () {
	var now = new Date().getTime();
	if (now < lastRun + throttleTime) {
		return;
	}
	lastRun = now;

	setTimeout(execTests, 10);
});

