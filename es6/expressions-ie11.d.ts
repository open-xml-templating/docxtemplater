import { DXT } from "./js/docxtemplater";

interface ParserOptions {
  filters?: { [x: string]: (input: any, ...filters: any[]) => any };
  csp?: boolean;
  cache?: any;
  literals?: { [x: string]: any };
  isIdentifierStart?: (char: string) => boolean;
  isIdentifierContinue?: (char: string) => boolean;
  postEvaluate?: (
    result: any,
    tag: string,
    scope: any,
    context: DXT.ParserContext
  ) => any;
}

interface ExpressionParser extends DXT.Parser {
  compiled: any;
  getIdentifiers(): string[];
  getObjectIdentifiers(): any;
}

type Parser = {
  (tag: string): ExpressionParser;
  filters: { [x: string]: (input: any, ...filters: any[]) => any };
  configure: (options: ParserOptions) => (tag: string) => DXT.Parser;
};

declare var expressionParser: Parser;
export default expressionParser;
