import { DXT } from "./docxtemplater";

declare class TxtTemplater {
  /**
   * Create TxtTemplater instance (and compile it on the fly)
   *
   * @param content the template that you want to use
   * @param options `modules` and other options
   */
  constructor(content: string, options?: DXT.ConstructorOptions);

  render(data?: any): string;
}

export default TxtTemplater;
