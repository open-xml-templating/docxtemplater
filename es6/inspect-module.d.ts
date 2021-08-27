// Type definitions for Docxtemplater 3
// Project: https://github.com/open-xml-templating/docxtemplater/
// Definitions by: edi9999 <https://github.com/edi9999>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.9

import { DXT } from "./docxtemplater";
export default class InspectModule implements DXT.Module {
  constructor();
  getAllTags(): Record<string, unknown>;
  getTags(file: string): Record<string, unknown>;
  fullInspected: Record<
    string,
    {
      nullValues: {
        detail: {
          part: DXT.Part;
          scopeManager: DXT.ScopeManager;
        }[];
        summary: string[][];
      };
    }
  >;

  getStructuredTags(file: string): DXT.Part[];
  getAllStructuredTags(file: string): DXT.Part[];
  getFileType(): string;
  getTemplatedFiles(): string[];
}
