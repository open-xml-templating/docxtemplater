import { DXT } from "./js/docxtemplater";

interface ParserOptions {
  filters?: { [x: string]: (input: any, ...filters: any[]) => any };
  csp?: boolean;
  cache?: any;
  literals?: { [x: string]: any };
}

type Parser = {
  (tag: string): DXT.Parser;
  filters: { [x: string]: (input: any, ...filters: any[]) => any };
  configure: (options: ParserOptions) => (tag: string) => DXT.Parser;
};

declare var angularParser: Parser;
export default angularParser;
