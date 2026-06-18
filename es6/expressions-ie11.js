const expressions = require("./expressions.js");

const exportedValue = expressions.configure({
	useProxy: false,
});
exportedValue.configure = (config = {}) => {
	config.useProxy = false;
	return expressions.configure(config);
};
exportedValue.filters = expressions.filters;
exportedValue.compile = expressions.compile;
exportedValue.Parser = expressions.Parser;
exportedValue.Lexer = expressions.Lexer;

module.exports = exportedValue;
