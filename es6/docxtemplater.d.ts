declare namespace DXT {
  type integer = number;

  interface SimplePart {
    type: string;
    value: string;
    module?: string;
    [x: string]: any;
  }

  interface Part {
    type: string;
    value: string;
    module: string;
    raw: string;
    offset: integer;
    lIndex: integer;
    num: integer;
    inverted?: boolean;
    endLindex?: integer;
    expanded?: Part[];
    subparsed?: Part[];
    position?: string;
    tag?: string;
  }

  interface ScopeManager {
    scopeList: any[];
    scopeLindex: integer[];
    scopePath: string[];
    scopePathItem: integer[];
    scopePathLength: integer[];
    resolved: any;
    cachedParsers: Record<string, (scope: any, context: ParserContext) => any>;
    parser(tag: string): Parser;
  }

  interface Rendered {
    value: string;
    errors: any[];
  }

  type Error = any;

  interface Module {
    set?(options: any): void;
    parse?(placeHolderContent: string): SimplePart | null;
    matchers?(): [
      string,
      string,
      { [x: string]: any } | ((part: SimplePart) => { [x: string]: any }),
    ][];
    render?(part: Part): Rendered | null;
    getTraits?(traitName: string, parsed: any): any;
    getFileType?(opts: any): string | void;
    nullGetter?(part: Part, scopeManager: any): any;
    optionsTransformer?(options: Options): Options;
    postrender?(parts: string[], options: any): string[];
    errorsTransformer?(errors: Error[]): Error[];
    getRenderedMap?(map: any): any;
    preparse?(parsed: any, options: any): any;
    postparse?(postparsed: Part[], modules: Module[], options: any): Part[];
    on?(event: string): void;
    resolve?(part: Part, options: any): null | Promise<any>;
    [x: string]: any;
  }

  interface ParserContext {
    meta: {
      part: Part;
    };
    scopeList: any[];
    scopePath: string[];
    scopePathItem: integer[];
    scopePathLength: integer[];
    num: integer;
  }

  interface Parser {
    get(scope: any, context: ParserContext): any;
  }

  interface Syntax {
    allowUnopenedTag?: boolean;
    allowUnclosedTag?: boolean;
    changeDelimiterPrefix?: string | null;
  }

  interface Options {
    delimiters?: { start: string; end: string };
    paragraphLoop?: boolean;
    parser?(tag: string): Parser;
    errorLogging?: boolean | string;
    linebreaks?: boolean;
    nullGetter?(part: Part): any;
    syntax?: Syntax;
  }

  interface ConstructorOptions extends Options {
    modules?: Module[];
  }
}

declare class Docxtemplater<TZip = any> {
  static default: typeof Docxtemplater;
  /**
   * Create Docxtemplater instance (and compile it on the fly)
   *
   * @param zip Serialized zip archive
   * @param options `modules` and other options
   */
  constructor(zip: TZip, options?: DXT.ConstructorOptions);
  /**
   * Create Docxtemplater instance, without options
   */
  constructor();

  setData(data: any): this;
  resolveData(data: any): Promise<any>;
  render(data?: any): this;
  renderAsync(data?: any): Promise<any>;
  getZip(): TZip;

  loadZip(zip: TZip): this;
  setOptions(options: DXT.Options): this;
  attachModule(module: DXT.Module): this;
  compile(): this;
  getFullText(path?: string): string;
  targets: string[]; // used to know which files are templated
  replaceFirstSection?: boolean; // used for the subsection module
  replaceLastSection?: boolean; // used for the subsection module
  includeSections?: boolean; // used for the subsection module
  keepStyles?: boolean; // used for the subtemplate module
}

declare namespace Docxtemplater {
  export { DXT };
}

export = Docxtemplater;
