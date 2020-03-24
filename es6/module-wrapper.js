function emptyFun() {}
function identity(i) {
	return i;
}
module.exports = function (module) {
	const defaults = {
		set: emptyFun,
		parse: emptyFun,
		render: emptyFun,
		getTraits: emptyFun,
		getFileType: emptyFun,
		nullGetter: emptyFun,
		optionsTransformer: identity,
		postrender: identity,
		errorsTransformer: identity,
		getRenderedMap: identity,
		preparse: identity,
		postparse: identity,
		on: emptyFun,
		resolve: emptyFun,
	};
	if (
		Object.keys(defaults).every(function (key) {
			return !module[key];
		})
	) {
		throw new Error(
			"This module cannot be wrapped, because it doesn't define any of the necessary functions"
		);
	}
	Object.keys(defaults).forEach(function (key) {
		module[key] = module[key] || defaults[key];
	});
	return module;
};
