const { get, unset, omit, cloneDeep } = require("lodash");
const { expect } = require("chai");
const { captureLogs } = require("./logs.js");
const Errors = require("../../errors.js");

// cleanError dep
function checkLength(e, expectedError, propertyPath) {
	const propertyPathLength = propertyPath + "Length";
	const property = get(e, propertyPath);
	const expectedPropertyLength = get(expectedError, propertyPathLength);
	if (property && expectedPropertyLength) {
		expect(expectedPropertyLength).to.be.a(
			"number",
			JSON.stringify(expectedError.properties)
		);
		expect(expectedPropertyLength).to.equal(property.length);
		unset(e, propertyPath);
		unset(expectedError, propertyPathLength);
	}
}

// eslint-disable-next-line complexity
function cleanError(e, expectedError) {
	const message = e.message;
	// this over delete?
	e = omit(e, ["line", "sourceURL", "stack"]);
	// ?
	e.message = message;
	if (expectedError.properties && e.properties) {
		if (!e.properties.explanation) {
			throw new Error("No explanation for this error");
		}
		if (expectedError.properties.explanation != null) {
			const e1 = e.properties.explanation;
			const e2 = expectedError.properties.explanation;
			expect(e1).to.be.deep.equal(
				e2,
				`Explanations differ '${e1}' != '${e2}': for ${JSON.stringify(
					expectedError
				)}`
			);
		}
		delete e.properties.explanation;
		delete expectedError.properties.explanation;
		if (e.properties.postparsed) {
			e.properties.postparsed.forEach(function (p) {
				delete p.lIndex;
				delete p.endLindex;
				delete p.offset;
			});
		}
		const rootError = e.properties.rootError;
		if (rootError) {
			const expRootError = expectedError.properties.rootError;
			expect(rootError, JSON.stringify(e.properties)).to.be.instanceOf(
				Error,
				"rootError doesn't have correct type"
			);
			expect(
				expRootError,
				JSON.stringify(expectedError.properties)
			).to.be.instanceOf(Object, "expectedError doesn't have a rootError");
			if (expectedError) {
				expect(rootError.message).to.equal(
					expRootError.message,
					"rootError.message"
				);
			}
			delete e.properties.rootError;
			delete expectedError.properties.rootError;
		}
		if (expectedError.properties.offset != null) {
			const o1 = e.properties.offset;
			const o2 = expectedError.properties.offset;
			// offset can be arrays, so deep compare
			expect(o1).to.be.deep.equal(
				o2,
				`Offset differ ${o1} != ${o2}: for ${JSON.stringify(expectedError)}`
			);
		}
		delete expectedError.properties.offset;
		delete e.properties.offset;
		checkLength(e, expectedError, "properties.paragraphParts");
		checkLength(e, expectedError, "properties.postparsed");
		checkLength(e, expectedError, "properties.parsed");
	}
	if (e.stack && expectedError) {
		expect(e.stack).to.contain("Error: " + expectedError.message);
	}
	delete e.stack;
	return e;
}

function wrapMultiError(error) {
	return {
		name: "TemplateError",
		message: "Multi error",
		properties: {
			id: "multi_error",
			errors: Array.isArray(error) ? error : [error],
		},
	};
}

function jsonifyError(e) {
	return JSON.parse(
		JSON.stringify(e, function (key, value) {
			if (value instanceof Promise) {
				return {};
			}
			return value;
		})
	);
}

function errorVerifier(e, type, expectedError) {
	e = cloneDeep(e);
	expectedError = cloneDeep(expectedError);
	expect(e, "No error has been thrown").not.to.be.equal(null);
	const toShowOnFail = e.stack;
	expect(e, toShowOnFail).to.be.instanceOf(
		Error,
		"error is not a Javascript error"
	);
	expect(e, toShowOnFail).to.be.instanceOf(
		type,
		"error doesn't have the correct type"
	);
	expect(e, toShowOnFail).to.be.an("object");
	expect(e, toShowOnFail).to.have.property("properties");
	expect(e.properties, toShowOnFail).to.be.an("object");
	if (type.name && type.name !== "XTInternalError") {
		expect(e.properties, toShowOnFail).to.have.property("explanation");
		expect(e.properties.explanation, toShowOnFail).to.be.a("string");
		expect(e.properties.explanation, toShowOnFail).to.be.a("string");
	}
	if (e.properties.id) {
		expect(e.properties.id, toShowOnFail).to.be.a("string");
	}
	e = cleanError(e, expectedError);
	const errorProperties = e.properties.errors;
	if (errorProperties) {
		const expErrorProperties = expectedError.properties.errors;
		const msg =
			"expected : \n" +
			JSON.stringify(expErrorProperties) +
			"\nactual : \n" +
			JSON.stringify(errorProperties);
		expect(expErrorProperties).to.be.an("array", msg);

		const l1 = errorProperties.length;
		const l2 = expErrorProperties.length;
		expect(l1).to.equal(
			l2,
			`Expected to have the same amount of e.properties.errors ${l1} !== ${l2} ` +
				msg
		);
		errorProperties.forEach(function (suberror, i) {
			const cleaned = cleanError(suberror, expErrorProperties[i]);
			errorProperties[i] = jsonifyError(cleaned);
		});
	}

	const realError = jsonifyError(e);
	expect(realError).to.be.deep.equal(expectedError);
}

function expectToThrow(fn, type, expectedError) {
	let err = null;
	const capture = captureLogs();
	try {
		fn();
	} catch (e) {
		err = e;
	}
	capture.stop();
	if (!type) {
		expect(err).to.satisfy(function (err) {
			return !!err;
		});
		return;
	}
	errorVerifier(err, type, expectedError);
	return capture;
}

function expectToThrowAsync(fn, type, expectedError) {
	const capture = captureLogs();
	return Promise.resolve(null)
		.then(function () {
			const r = fn();
			return r.then(function () {
				capture.stop();
				return null;
			});
		})
		.catch(function (error) {
			capture.stop();
			return error;
		})
		.then(function (err) {
			if (!type) {
				expect(err).to.satisfy(function (err) {
					return !!err;
				});
				return;
			}
			errorVerifier(err, type, expectedError);
			return capture;
		});
}

function expectToThrowSnapshot(fn, update) {
	let err = null;
	const capture = captureLogs();
	try {
		fn();
	} catch (e) {
		err = e;
	}
	capture.stop();
	expect(errToObject(err)).to.matchSnapshot(update);
	return capture;
}

function expectToThrowAsyncSnapshot(fn, update) {
	const capture = captureLogs();
	return Promise.resolve(null)
		.then(function () {
			const r = fn();
			return r.then(function () {
				capture.stop();
				return null;
			});
		})
		.catch(function (error) {
			capture.stop();
			return error;
		})
		.then(function (err) {
			expect(err).to.matchSnapshot(update);
			return capture;
		});
}

function errToObject(err) {
	const obj = {};
	if (err instanceof Errors.XTTemplateError) {
		obj._type = "XTTemplateError";
	} else if (err instanceof Errors.XTAPIVersionError) {
		obj._type = "XTAPIVersionError";
	} else if (err instanceof Errors.XTRenderingError) {
		obj._type = "XTRenderingError";
	} else if (err instanceof Errors.XTScopeParserError) {
		obj._type = "XTScopeParserError";
	} else if (err instanceof Errors.XTInternalError) {
		obj._type = "XTInternalError";
	} else if (err instanceof Errors.XTAPIVersionError) {
		obj._type = "XTAPIVersionError";
	}

	if (err.name) {
		obj.name = err.name;
	}
	if (err.message) {
		obj.message = err.message;
	}
	if (err.properties) {
		obj.properties = {};
		Object.entries(err.properties).forEach(function ([key, value]) {
			if (value instanceof Error) {
				obj.properties[key] = errToObject(value);
				return;
			}
			if (Array.isArray(value)) {
				obj.properties[key] = value.map(function (value) {
					if (value instanceof Error) {
						return errToObject(value);
					}
					return value;
				});
				return;
			}
			obj.properties[key] = value;
		});
	}
	return obj;
}

function unhandledRejectionHandler(reason) {
	throw reason;
}

module.exports = {
	wrapMultiError,
	errorVerifier,
	expectToThrow,
	expectToThrowAsync,
	expectToThrowSnapshot,
	expectToThrowAsyncSnapshot,
	unhandledRejectionHandler,
};
