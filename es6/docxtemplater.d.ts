// Type definitions for Docxtemplater 3
// Project: https://github.com/open-xml-templating/docxtemplater/
// Definitions by: edi9999 <https://github.com/edi9999>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.9

export namespace DXT {
    type integer = number;

    interface SimplePart {
        type: string
        value: string
        module?: string
        [x: string]: any
    }

    interface Part {
        type: string
        value: string
        module: string
        raw: string
        offset: integer
        lIndex: integer
        num: integer
        inverted?: boolean
        endLIndex?: integer
        expanded?: Part[]
        subparsed?: Part[]
    }

    interface Rendered {
        value: string
        errors: any[]
    }

    type Error = any

    interface Module {
        set?(options:any): void
        parse?(placeHolderContent: string): SimplePart | null
        render?(part: Part): Rendered | null
        getTraits?(traitName: string, parsed: any): any
        getFileType?(opts: any): string
        nullGetter?(part: Part, scopeManager: any) : any
        optionsTransformer?(options: Options): Options
        postrender?(parts: string[], options: any) : string[]
        errorsTransformer?(errors: Error[]) :Error[]
        getRenderedMap?(map: any): any
        preparse?(parsed: any, options: any): any
        postparse?(postparsed: Part[], modules: Module[], options: any): Part[]
        on?(event :string) :void
        resolve?(part :Part, options: any): null | Promise<any>
        [x: string]: any
    }

    interface ParserContext {
        meta: {
            part: Part
        }
        scopeList: any[]
        scopePath: string[]
        scopePathItem: integer[]
        scopePathLength: integer[]
        num: integer
    }

    interface Parser{
        get(scope: any, context: ParserContext): any
    }

    interface ConstructorOptions {
        modules? : Module[]
        delimiters? : { start: string, end: string }
        paragraphLoop? : boolean
        parser?(tag: string) : Parser
        linebreaks?: boolean
        nullGetter?(part: Part) : any
    }

    interface Options {
        delimiters? : { start: string, end: string }
        paragraphLoop? : boolean
        parser?(tag: string) : Parser
        linebreaks?: boolean
        nullGetter?(part: Part) : any
    }
}

declare class Docxtemplater {
    /**
     * Create Docxtemplater instance (and compile it on the fly)
     *
     * @param zip Serialized zip archive
     * @param options modules and other other options
     */
    constructor (zip: any, options?: DXT.ConstructorOptions);
    /**
     * Create Docxtemplater instance, without options
     */
    constructor ();

    setData(data: any): this
    resolveData(data: any): Promise<any>
    render() : this
    getZip() : any

    loadZip(zip: any): this
    setOptions(options: DXT.Options): this
    attachModule(module: DXT.Module): this
    compile(): this
}

export default Docxtemplater;
