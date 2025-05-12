const fs = require("fs");

const PizZip = require("pizzip");

const Docxtemplater = require("./docxtemplater.js");

const zip = new PizZip(fs.readFileSync("examples/memory-stress.docx"));
const doc = new Docxtemplater(zip, { paragraphLoop: true });

const a = [];
for (let i = 0, len = 500; i < len; i++) {
	const b = [];
	for (let j = 0, len2 = 500; j < len2; j++) {
		b.push({ title: i + j, c: [{ content: "Hi" }, { content: "Ho" }] });
	}
	a.push({ b });
}

doc.render({ a });
const buf = doc.toBuffer();

const minSize = 500;
if (buf.length < minSize * 1000 * 1000) {
	throw new Error("The output document should be at least ${minSize} MB");
}
// eslint-disable-next-line no-console
console.log("memory-test buffer length : ", buf.length);
