const { expect, makeDocxV4 } = require("../utils.js");
const Docxtemplater = require("../../docxtemplater.js");
const { traits, isContent } = Docxtemplater.DocUtils;
const { XTTemplateError } = Docxtemplater.Errors;

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
						const paragraphParts = postparsed.slice(left + 1, right);
						let error = false;
						for (let i = 0, len = paragraphParts.length; i < len; i++) {
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
						message: "FooModule tag should be the only text in a paragraph",
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
});
