/* eslint-disable no-console,no-process-env */
const env = process.env;

const ADBLOCK = is(env.ADBLOCK);
const COLOR = is(env.npm_config_color);
const SILENT =
	["silent", "error", "warn"].indexOf(env.npm_config_loglevel) !== -1;

const CI = [
	"BUILD_NUMBER",
	"CI",
	"CONTINUOUS_INTEGRATION",
	"DRONE",
	"RUN_ID",
].some(function (it) {
	return is(env[it]);
});

function linkColor(link) {
	return "\u001B[94m " + link + " \u001B[0m";
}

const BANNER =
	"\u001B[96mThank you for using docxtemplater for generating docx / pptx documents !\u001B[0m\n" +
	"\u001B[96mIf you want to support this lovely project, it would be so kind to \u001B[0m\n\n" +
	"\u001B[96m * star us on github :" +
	linkColor("https://github.com/open-xml-templating/docxtemplater") +
	"\u001B[0m\n" +
	"\u001B[96m * give us a 5-star rating on openbase : " +
	linkColor("https://openbase.com/js/docxtemplater") +
	"\u001B[0m\n" +
	"\u001B[96m * consider using a paid plan or module :" +
	linkColor("https://docxtemplater.com/pricing/") +
	"\u001B[0m\n";

function is(it) {
	return !!it && it !== "0" && it !== "false";
}

function isBannerRequired() {
	if (ADBLOCK || CI || SILENT) {
		return false;
	}
	return true;
}

function showBanner() {
	console.log(COLOR ? BANNER : BANNER.replace(/\u001B\[\d+m/g, ""));
}

if (isBannerRequired()) {
	showBanner();
}
