const { PassThrough } = require("node:stream");
const { once } = require("node:events");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const PizZip = require("pizzip");
const { streamOutput } = require("../../../utils/stream-output.js");
const {
	createDocV4,
	expect,
	loadDocumentV4,
	shouldBeSame,
} = require("../utils.js");

async function collectZip(write) {
	const output = new PassThrough();
	const chunks = [];
	output.on("data", (chunk) => chunks.push(chunk));
	const completed = once(output, "end");
	await write(output);
	await completed;
	return Buffer.concat(chunks);
}

describe("Streaming ZIP output", () => {
	it("writes a rendered DOCX that has the same extracted files as PizZip output", async () => {
		const doc = createDocV4("tag-example.docx");
		doc.render({ first_name: "Jane", last_name: "Doe", phone: "123" });
		const expected = new PizZip(doc.toBuffer(), { checkCRC32: true });
		const output = await collectZip((destination) =>
			streamOutput(doc, destination)
		);
		const actual = new PizZip(output, { checkCRC32: true });

		expect(Object.keys(actual.files)).to.deep.equal(
			Object.keys(expected.files)
		);
		for (const name of Object.keys(expected.files)) {
			if (!expected.files[name].dir) {
				expect(actual.file(name).asNodeBuffer()).to.deep.equal(
					expected.file(name).asNodeBuffer()
				);
			}
		}
	});

	it("writes a rendered DOCX to a file that matches the expected document", async () => {
		const destination = path.join(
			os.tmpdir(),
			`docxtemplater-stream-${process.pid}-${Date.now()}.docx`
		);
		const doc = createDocV4("tag-example.docx");
		doc.render({
			first_name: "Hipp",
			last_name: "Edgar",
			phone: "0652455478",
			description: "New Website",
		});
		try {
			await streamOutput(doc, fs.createWriteStream(destination));
			const streamedDoc = loadDocumentV4(
				destination,
				fs.readFileSync(destination)
			);
			shouldBeSame({
				doc: streamedDoc,
				expectedName: "expected-tag-example.docx",
			});
		} finally {
			fs.rmSync(destination, { force: true });
		}
	});
});
