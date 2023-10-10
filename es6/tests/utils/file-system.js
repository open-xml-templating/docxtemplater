const PizZip = require("pizzip");
const path = require("path");
const fs = require("fs");
const AssertionModule = require("../assertion-module.js");
const Docxtemplater = require("../../docxtemplater.js");

let examplesDirectory = "";
const imageData = {};

function getExamplesDirectory() {
	return examplesDirectory;
}

function walk(dir) {
	const results = [];
	const list = fs.readdirSync(dir);
	list.forEach(function (file) {
		if (file.indexOf(".") === 0) {
			return;
		}
		file = dir + "/" + file;
		const stat = fs.statSync(file);
		if (stat && stat.isDirectory()) {
			Array.prototype.push.apply(results, walk(file));
		} else {
			results.push(file);
		}
	});
	return results;
}

function writeFile(expectedName, zip) {
	if (path.resolve) {
		if (fs.writeFileSync) {
			const writeFile =
				// eslint-disable-next-line no-process-env
				process.env.UPDATE === "true"
					? path.resolve(examplesDirectory, expectedName)
					: path.resolve(examplesDirectory, "..", expectedName);
			fs.writeFileSync(
				writeFile,
				zip.generate({ type: "nodebuffer", compression: "DEFLATE" })
			);
		}
		if (typeof window !== "undefined" && window.saveAs) {
			const out = zip.generate({
				type: "blob",
				mimeType:
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				compression: "DEFLATE",
			});
			saveAs(out, expectedName); // comment to see the error
		}
	}
}

function unlinkFile(expectedName) {
	if (path.resolve) {
		const writeFile = path.resolve(examplesDirectory, "..", expectedName);
		try {
			fs.unlinkSync(writeFile);
		} catch (e) {
			if (e.code !== "ENOENT") {
				throw e;
			}
		}
	}
}

function load(name, content, cache) {
	const zip = new PizZip(content);
	const doc = new Docxtemplater();
	doc.attachModule(new AssertionModule());
	doc.loadZip(zip);
	doc.loadedName = name;
	doc.loadedContent = content;
	cache[name] = doc;
	return doc;
}

function loadImage(name, content) {
	imageData[name] = content;
}

function loadFile(name, callback) {
	if (fs.readFileSync) {
		const path = require("path");
		const buffer = fs.readFileSync(
			path.join(examplesDirectory, name),
			"binary"
		);
		return callback(null, name, buffer);
	}
	return PizZipUtils.getBinaryContent(
		"../examples/" + name,
		function (err, data) {
			if (err) {
				return callback(err);
			}
			return callback(null, name, data);
		}
	);
}

function setExamplesDirectory(ed) {
	examplesDirectory = ed;
	if (fs && fs.writeFileSync) {
		const fileNames = walk(examplesDirectory).map(function (f) {
			return f.replace(examplesDirectory + "/", "");
		});
		fs.writeFileSync(
			path.resolve(__dirname, "filenames.js"),
			"module.exports=" + JSON.stringify(fileNames)
		);
		global.fileNames = fileNames;
	}
}

module.exports = {
	getExamplesDirectory,
	writeFile,
	unlinkFile,
	load,
	loadImage,
	loadFile,
	setExamplesDirectory,
};
