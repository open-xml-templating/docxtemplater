// The error thrown here contains additional information when logged with JSON.stringify (it contains a properties object containing all suberrors).
function replaceErrors(key, value) {
	if (value instanceof Error) {
		return Object.getOwnPropertyNames(value).reduce(function (error, key) {
			error[key] = value[key];
			return error;
		}, {});
	}
	return value;
}

function logger(error) {
	// eslint-disable-next-line no-console
	console.log(JSON.stringify({ error }, replaceErrors));
	if (error.properties && error.properties.errors instanceof Array) {
		const errorMessages = error.properties.errors
			.map(function (error) {
				return error.properties.explanation;
			})
			.join("\n");
		// eslint-disable-next-line no-console
		console.log("errorMessages", errorMessages);
		// errorMessages is a humanly readable message looking like this :
		// 'The tag beginning with "foobar" is unopened'
	}
}
module.exports = logger;
