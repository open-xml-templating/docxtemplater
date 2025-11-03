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
		cachedParsers: Record<
			string,
			(scope: any, context: ParserContext) => any
		>;
		parser(tag: string): Parser;
		getValue(value: string, { part: Part }): any;
	}

	interface Rendered {
		value: string;
		errors: any[];
	}

	type Error = any;
	type Compression = "STORE" | "DEFLATE";

	interface ZipOptions {
		/**
		 * the default file compression method to use. Available methods are `STORE` and `DEFLATE`. You can also provide your own compression method.
		 * @default "DEFLATE"
		 */
		compression?: Compression | undefined;
		/**
		 * the options to use when compressing the file. With `STORE` (no compression), this parameter is ignored.
		 * With `DEFLATE`, you can give the compression level with `compressionOptions : {level:6}`
		 * (or any level between 1 (best speed) and 9 (best compression)).
		 *
		 * Note : if the entry is already compressed (coming from a compressed zip file),
		 * calling `generate()` with a different compression level won't update the entry.
		 * The reason is simple : PizZip doesn't know how compressed the content was and how to match the compression level with the implementation we use.
		 */
		compressionOptions?:
			| {
					level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
			  }
			| null
			| undefined;
		/**
		 * The comment to use for the zip file.
		 */
		comment?: string | undefined;
		/**
		 * The platform to use when generating the zip file. When using `DOS`, the attribute `dosPermissions` of each file is used.
		 * When using `UNIX`, the attribute `unixPermissions` of each file is used.
		 * If you set the platform value on nodejs, be sure to use `process.platform`.
		 * `fs.stats` returns a non executable mode for folders on windows,
		 * if you force the platform to `UNIX` the generated zip file will have a strange behavior on UNIX platforms.
		 * @default "DOS"
		 */
		platform?: "DOS" | "UNIX" | NodeJS.Platform | undefined;
		/**
		 * The function to encode the file name / comment.
		 * By default, PizZip uses UTF-8 to encode the file names / comments. You can use this method to force an other encoding.
		 * Note : the encoding used is not stored in a zip file, not using UTF-8 may lead to encoding issues.
		 * The function takes a string and returns a bytes array (Uint8Array or Array).
		 */
		encodeFileName?(name: string): Buffer;

		/**
		 * The function to change the ordering of the files in the zip archive.
		 * The function takes the files array and returns the list of files in the order that you want them to be in the final zip file.
		 */
		fileOrder?(files: string[]): string[];
	}

	interface RenderOptions {
		joinUncorrupt(parts: Part[], options: RenderOptions): Part[];
		render(part: Part, options: RenderOptions): Rendered | null;
		nullGetter?(part: Part, scopeManager: ScopeManager): any;
		resolvedId: string;
		index: number;
		scopeManager: ScopeManager;
		stripInvalidXMLChars: boolean;
		linebreaks: boolean;
		fileType: string;
		fileTypeConfig: any;
		filePath: string;
		contentType: string;
		parser: Parser;
		cachedParsers: Record<
			string,
			(scope: any, context: ParserContext) => any
		>;
		compiled: Part[];
	}

	interface Module {
		set?(options: any): void;
		clone?(): Module;
		matchers?(): [
			string,
			string,
			{ [x: string]: any } | ((part: SimplePart) => { [x: string]: any }),
		][];
		render?(part: Part, options: RenderOptions): Rendered | null;
		getTraits?(traitName: string, parsed: Part[], options: any): any;
		getFileType?(opts: any): string | void;
		nullGetter?(part: Part, scopeManager: ScopeManager): any;
		optionsTransformer?(options: Options, doc: Docxtemplater): Options;
		postrender?(parts: string[], options: any): string[];
		errorsTransformer?(errors: Error[]): Error[];
		getRenderedMap?(map: any): any;
		preparse?(parsed: any, options: any): any;
		parse?(placeHolderContent: string): SimplePart | null;
		postparse?(postparsed: Part[], modules: Module[], options: any): Part[];
		on?(event: string): void;
		preResolve?(options: any): void;
		resolve?(part: Part, options: any): null | Promise<any>;
		preZip?(content: string, currentFile: string): null | string;

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
		allowUnbalancedLoops?: boolean;
		changeDelimiterPrefix?: string | null;
	}

	interface Options {
		delimiters?: { start: string | null; end: string | null };
		paragraphLoop?: boolean;
		parser?(tag: string): Parser;
		errorLogging?: boolean | string;
		linebreaks?: boolean;
		nullGetter?(part: Part, scopeManager: ScopeManager): any;
		fileTypeConfig?: any;
		warnFn?(errors: Error[]): any;
		syntax?: Syntax;
		stripInvalidXMLChars?: boolean;
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
	modules: DXT.Module[];
	findModule(name: string): DXT.Module | null;

	toBuffer(options?: DXT.ZipOptions): Buffer;
	toBlob(options?: DXT.ZipOptions): Blob;
	toBase64(options?: DXT.ZipOptions): string;
	toUint8Array(options?: DXT.ZipOptions): Uint8Array;
	toArrayBuffer(options?: DXT.ZipOptions): ArrayBuffer;
}

declare namespace Docxtemplater {
	export { DXT };
}

export = Docxtemplater;
