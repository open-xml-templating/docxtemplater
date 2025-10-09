import { DXT } from "./docxtemplater";

declare class TxtTemplater {
	static default: typeof TxtTemplater;
	/**
	 * Create TxtTemplater instance (and compile it on the fly)
	 *
	 * @param content the template that you want to use
	 * @param options `modules` and other options
	 */
	constructor(content: string, options?: DXT.ConstructorOptions);

	render(data?: any): string;
	renderAsync(data?: any): Promise<string>;
}

export = TxtTemplater;
