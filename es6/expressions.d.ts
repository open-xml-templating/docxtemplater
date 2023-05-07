import { DXT } from "./js/docxtemplater";

type Parser = {
  (tag: string): DXT.Parser;
  filters: { [x: string]: (input: any, ...filters: any[]) => any };
};

declare var angularParser: Parser;
export default angularParser;
