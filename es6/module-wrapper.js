const { XTInternalError } = require("./errors.js");

function emptyFun() {}
function identity(i) {
	return i;
}
module.exports = function (module) {
	const defaults = {
		on: emptyFun,
		set: emptyFun,
		getFileType: emptyFun,
		optionsTransformer: identity,
		preparse: identity,
		matchers: () => [],
		parse: emptyFun,
		getTraits: emptyFun,
		postparse: identity,
		errorsTransformer: identity,
		preResolve: emptyFun,
		resolve: emptyFun,
		getRenderedMap: identity,
		render: emptyFun,
		nullGetter: emptyFun,
		postrender: identity,
	};
	if (Object.keys(defaults).every((key) => !module[key])) {
		const err = new XTInternalError(
			"This module cannot be wrapped, because it doesn't define any of the necessary functions"
		);
		err.properties = {
			id: "module_cannot_be_wrapped",
			explanation:
				"This module cannot be wrapped, because it doesn't define any of the necessary functions",
		};
		throw err;
	}
	for (const key in defaults) {
		module[key] ||= defaults[key];
	}
	return module;
};
