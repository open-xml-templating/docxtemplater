const {
	expect,
	expectToThrow,
	captureLogs,
	makeDocxV4,
	wrapMultiError,
	expectToThrowSnapshot,
} = require("../utils.js");
const Docxtemplater = require("../../docxtemplater.js");
const { traits, isContent } = Docxtemplater.DocUtils;
const { Errors } = Docxtemplater;
const { XTTemplateError } = Errors;

describe("Traits", () => {
	it("should work with expandToOne and call onError if multiple tags in same paragraph", () => {
		const moduleName = "foo_module/foo";
		const ignoredErrors = [];
		const module = {
			name: "FooModule",
			requiredAPIVersion: "3.0.0",
			matchers() {
				return [["__", moduleName]];
			},
			postparse(parsed) {
				parsed = traits.expandToOne(parsed, {
					moduleName,
					getInner: ({ part, left, right, postparsed, index }) => {
						const paragraphParts = postparsed.slice(
							left + 1,
							right
						);
						let error = false;
						for (
							let i = 0, len = paragraphParts.length;
							i < len;
							i++
						) {
							const p = paragraphParts[i];
							if (i === index - left - 1) {
								continue;
							}
							if (isContent(p)) {
								error = true;
							}
						}
						if (error === true) {
							// This error wil be catched by onError and then ignored (and put into ignoredErrs)
							const err = new XTTemplateError(
								"Foo tag should be the only text in a paragraph"
							);
							throw err;
						}
						return part;
					},
					expandTo: "w:p",
					onError(opts) {
						const { part } = opts;
						ignoredErrors.push(
							`${opts.rootError.name} ${opts.rootError.message}`
						);
						if (part.module === moduleName) {
							return "ignore";
						}
					},
				});
				return parsed;
			},
			render(part) {
				if (part.module === moduleName) {
					return {
						value: "MYVAL",
					};
				}
			},
		};
		const doc = makeDocxV4("<w:p><w:t>Foo {__user} {__bar}</w:t></w:p>", {
			modules: [module],
		}).render();

		expect(ignoredErrors).to.deep.equal([
			"TemplateError Foo tag should be the only text in a paragraph",
		]);
		expect(doc.getFullText()).to.be.equal("Foo MYVAL MYVAL");
	});

	it("should work with expandToOne and call onError if no surrounding paragraphs found", () => {
		const moduleName = "foo_module/foo";
		const ignoredErrors = [];
		const module = {
			name: "FooModule",
			requiredAPIVersion: "3.0.0",
			matchers() {
				return [["__", moduleName]];
			},
			postparse(parsed) {
				parsed = traits.expandToOne(parsed, {
					moduleName,
					expandTo: "w:p",
					onError(opts) {
						const { part } = opts;
						ignoredErrors.push(
							`${opts.name || opts.rootError.name} ${opts.message || opts.rootError.message}`
						);
						if (part.module === moduleName) {
							return "ignore";
						}
					},
					error: {
						message:
							"FooModule tag should be the only text in a paragraph",
						id: "foo_tag_w_p_noexpand",
					},
				});
				return parsed;
			},
			render(part) {
				if (part.module === moduleName) {
					return {
						value: "MYVAL",
					};
				}
			},
		};
		const doc = makeDocxV4("<w:t>Foo {__user} {__bar}</w:t></w:p>", {
			modules: [module],
		}).render();

		expect(ignoredErrors).to.deep.equal([
			"TemplateError FooModule tag should be the only text in a paragraph",
			"TemplateError FooModule tag should be the only text in a paragraph",
		]);
		expect(doc.getFullText()).to.be.equal("Foo MYVAL MYVAL");
	});

	it("should just call onError but keep it if the return value is not a string", () => {
		const moduleName = "foo_module/foo";
		const module = {
			name: "FooModule",
			requiredAPIVersion: "3.0.0",
			matchers() {
				return [["__", moduleName]];
			},
			postparse(parsed) {
				parsed = traits.expandToOne(parsed, {
					moduleName,
					getInner: ({ part, left, right, postparsed, index }) => {
						const paragraphParts = postparsed.slice(
							left + 1,
							right
						);
						let error = false;
						for (
							let i = 0, len = paragraphParts.length;
							i < len;
							i++
						) {
							const p = paragraphParts[i];
							if (i === index - left - 1) {
								continue;
							}
							if (isContent(p)) {
								error = true;
							}
						}
						if (error === true) {
							const err = new XTTemplateError(
								"Foo tag should be the only text in a paragraph"
							);
							err.properties = {
								explanation: "Foo tag",
								id: "foo_id",
							};
							throw err;
						}
						return part;
					},
					expandTo: "w:p",
					onError() {
						// Do nothing with the error
						return;
					},
				});
				return parsed;
			},
			render(part) {
				if (part.module === moduleName) {
					return {
						value: "MYVAL",
					};
				}
			},
		};
		const capture = captureLogs();
		expectToThrow(
			() =>
				makeDocxV4("<w:p><w:t>Foo {__user} {__bar}</w:t></w:p>", {
					modules: [module],
				}).render(),
			XTTemplateError,
			wrapMultiError({
				name: "TemplateError",
				message: "Foo tag should be the only text in a paragraph",
				properties: {
					id: "foo_id",
					file: "word/document.xml",
				},
			})
		);
		capture.stop();
	});

	it("should just call onError but keep it if the return value is not a string", () => {
		const moduleName = "foo_module/foo";
		const module = {
			name: "FooModule",
			requiredAPIVersion: "3.0.0",
			matchers() {
				return [["__", moduleName]];
			},
			postparse(parsed) {
				parsed = traits.expandToOne(parsed, {
					moduleName,
					getInner: ({ part, left, right, postparsed, index }) => {
						const paragraphParts = postparsed.slice(
							left + 1,
							right
						);
						let error = false;
						for (
							let i = 0, len = paragraphParts.length;
							i < len;
							i++
						) {
							const p = paragraphParts[i];
							if (i === index - left - 1) {
								continue;
							}
							if (isContent(p)) {
								error = true;
							}
						}
						if (error === true) {
							// This error wil be catched by onError and then ignored (and put into ignoredErrs)
							const err = new XTTemplateError(
								"Foo tag should be the only text in a paragraph"
							);
							err.properties = {
								explanation: "Hello",
								id: "foo_id",
							};
							throw err;
						}
						return part;
					},
					expandTo: "w:p",
					onError() {
						return "";
					},
				});
				return parsed;
			},
			render(part) {
				if (part.module === moduleName) {
					return {
						value: "MYVAL",
					};
				}
			},
		};

		const capture = captureLogs();
		expectToThrowSnapshot(() =>
			makeDocxV4("<w:t>Foo {__user} {__bar}</w:t></w:p>", {
				modules: [module],
			}).render()
		);
		capture.stop();
	});

	it("should just work if onError throws an error", () => {
		const moduleName = "foo_module/foo";
		const module = {
			name: "FooModule",
			requiredAPIVersion: "3.0.0",
			matchers() {
				return [["__", moduleName]];
			},
			postparse(parsed) {
				parsed = traits.expandToOne(parsed, {
					moduleName,
					getInner: ({ part, left, right, postparsed, index }) => {
						const paragraphParts = postparsed.slice(
							left + 1,
							right
						);
						let error = false;
						for (
							let i = 0, len = paragraphParts.length;
							i < len;
							i++
						) {
							const p = paragraphParts[i];
							if (i === index - left - 1) {
								continue;
							}
							if (isContent(p)) {
								error = true;
							}
						}
						if (error === true) {
							const err = new XTTemplateError(
								"Foo tag should be the only text in a paragraph"
							);
							err.properties = {
								explanation: "Foo tag",
								id: "foo_id",
							};
							throw err;
						}
						return part;
					},
					expandTo: "w:p",
					onError() {
						throw new Error("Other error");
					},
				});
				return parsed;
			},
			render(part) {
				if (part.module === moduleName) {
					return {
						value: "MYVAL",
					};
				}
			},
		};
		const capture = captureLogs();
		let expectedError;
		try {
			makeDocxV4("<w:p><w:t>Foo {__user} {__bar}</w:t></w:p>", {
				modules: [module],
			}).render();
		} catch (e) {
			expectedError = e;
		}
		expect(expectedError.message).to.equal("Other error");
		capture.stop();
	});

	it("should just work if getInner throws an error", () => {
		const moduleName = "foo_module/foo";
		const module = {
			name: "FooModule",
			requiredAPIVersion: "3.0.0",
			matchers() {
				return [["__", moduleName]];
			},
			postparse(parsed) {
				parsed = traits.expandToOne(parsed, {
					moduleName,
					getInner: () => {
						throw new Error("Error from inner");
					},
					expandTo: "w:p",
				});
				return parsed;
			},
			render(part) {
				if (part.module === moduleName) {
					return {
						value: "MYVAL",
					};
				}
			},
		};
		const capture = captureLogs();
		let expectedError;
		try {
			makeDocxV4("<w:p><w:t>Foo {__user} {__bar}</w:t></w:p>", {
				modules: [module],
			}).render();
		} catch (e) {
			expectedError = e;
		}
		expect(expectedError.message).to.equal("Error from inner");
		capture.stop();
	});
});
