import Docxtemplater, { DXT } from "./docxtemplater";
import InspectModule from "./inspect-module";
import expressionParser from "../expressions";
import ieExpressionParser from "../expressions-ie11";
import TxtTemplater from "./text";
const PizZip: any = require("pizzip");
import { expectType, expectError } from "tsd";

expressionParser.filters.map = function (input: any, key: any): any {
  if (!input) {
    return input;
  }

  if ("map" in input) {
    return input.map(function (x: any) {
      return x[key];
    });
  }
};

ieExpressionParser.filters.map = function (input: any, key: any): any {
  if (!input) {
    return input;
  }

  if ("map" in input) {
    return input.map(function (x: any) {
      return x[key];
    });
  }
};

const tDoc = new TxtTemplater("Hello {#users}{name},{/users} how are you ?", {
  parser: expressionParser,
});
tDoc.render({ users: [{ name: "John" }, { name: "Baz" }] });

const tDoc2 = new TxtTemplater("Hello {#users}{name},{/users} how are you ?", {
  parser: expressionParser,
});
tDoc2
  .renderAsync({ users: [{ name: "John" }, { name: "Baz" }] })
  .then(function (result: any) {
    console.log(result.toUpperCase());
  });

const doc1 = new Docxtemplater(
  {},
  {
    delimiters: { start: "[[", end: "]]" },
    nullGetter: function (part) {
      expectError(part.foobar);
      if (part.module === "rawxml") {
        return "";
      }
      if (part.type === "placeholder" && part.value === "foobar") {
        return "{Foobar}";
      }
      return "Hello";
    },
  }
);
const iModule = new InspectModule();
doc1.setData({ foo: "bar" });
doc1.attachModule({
  set: function () {},
  parse: function (placeHolderContent) {
    if (placeHolderContent.indexOf(":hello") === 0) {
      return {
        type: "placeholder",
        module: "mycustomModule",
        value: placeHolderContent.substr(7),
        isEmpty: "foobar",
      };
    }
    return null;
  },
  getFoobar: function () {},
});
doc1.attachModule(iModule);
const tags = iModule.getAllTags();
const tags2 = iModule.getAllStructuredTags();
const nullValues = iModule.fullInspected["word/document.xml"].nullValues;
const firstTag = nullValues.detail[0].part.value;
const scope = nullValues.detail[0].scopeManager.scopeList[0];
expectType<string>(firstTag);
doc1.render();

const buf: Buffer = doc1.toBuffer({
  compression: "DEFLATE",
});
const blob: Blob = doc1.toBlob({
  compression: "DEFLATE",
});
const str: string = doc1.toBase64({
  compression: "DEFLATE",
});
const u8: Uint8Array = doc1.toUint8Array({
  compression: "DEFLATE",
});
const ab: ArrayBuffer = doc1.toArrayBuffer({
  compression: "DEFLATE",
});

new Docxtemplater(
  {},
  {
    stripInvalidXMLChars: true,
  }
);

new Docxtemplater(
  {},
  {
    stripInvalidXMLChars: false,
  }
);

new Docxtemplater(
  {},
  {
    errorLogging: false,
  }
);

new Docxtemplater(
  {},
  {
    errorLogging: "jsonl",
  }
);

new Docxtemplater(
  {},
  {
    errorLogging: "json",
  }
);

expectError(doc1.foobar());
expectError(new Docxtemplater(1, 2));
expectError(new Docxtemplater({}, { delimiters: { start: 1, end: "]]" } }));
expectError(new Docxtemplater({}, { delimiters: { start: "[[" } }));
expectError(new Docxtemplater({}, { stripInvalidXMLChars: "yo" }));

const doc2 = new Docxtemplater();
doc2.loadZip(new PizZip("hello"));

// Error because parser should return a {get: fn} object
expectError(
  doc2.setOptions({
    parser: function (tag) {
      return 10;
    },
  })
);

doc2.setOptions({
  parser: function (tag) {
    expectType<string>(tag);
    return {
      get: function (scope, context) {
        const first = context.scopeList[0];
        expectType<DXT.integer>(context.num);
        expectError(context.foobar);
        if (context.meta.part.value === tag) {
          return scope[context.meta.part.value];
        }
        expectError(context.meta.part.other);
        return scope[tag];
      },
    };
  },
});

const doc3 = new Docxtemplater();
doc3.loadZip(new PizZip("hello"));
doc3.compile();
doc3.resolveData({ a: "b" }).then(function () {
  doc3.render();
});
doc3.replaceFirstSection = true;
doc3.replaceLastSection = true;
const doc4 = new Docxtemplater(new PizZip("hello"));
doc4.renderAsync({ a: "b" }).then(function () {
  console.log("end");
});
const text = doc3.getFullText();
const text2 = doc3.getFullText("word/heading1.xml");

new Docxtemplater(new PizZip("hello"), { errorLogging: false });

// Error because getFullText requires a string parameter
expectError(doc3.getFullText(false));
expectError(doc3.getFullText(10));

const doc5 = new Docxtemplater(new PizZip("hello"), {
  parser: expressionParser,
});

const doc6 = new Docxtemplater(new PizZip("hello"), {
  parser: ieExpressionParser,
});

const doc7 = new Docxtemplater(new PizZip("hello"), {
  parser: expressionParser.configure({
    filters: {
      foo: (a: any) => a,
      bar: (a: any) => a,
    },
    csp: true,
    cache: {},
    literals: { true: true },
  }),
});

const doc8 = new Docxtemplater(new PizZip("hello"), {
  parser: ieExpressionParser.configure({
    filters: {
      foo: (a: any) => a,
      bar: (a: any) => a,
    },
    csp: true,
    cache: {},
    literals: { true: true },
  }),
});

const doc9 = new Docxtemplater(new PizZip("hello"), {
  syntax: {
    allowUnopenedTag: true,
    allowUnclosedTag: true,
    changeDelimiterPrefix: null,
  },
});

const doc10 = new Docxtemplater(new PizZip("hello"), {
  syntax: {
    allowUnopenedTag: true,
    changeDelimiterPrefix: "",
  },
});

function validStartChars(ch: string): boolean {
  return /[a-z]/.test(ch);
}
function validContinuationChars(ch: string): boolean {
  return /[a-z]/.test(ch);
}
expressionParser.configure({
  isIdentifierStart: validStartChars,
  isIdentifierContinue: validContinuationChars,
});
ieExpressionParser.configure({
  isIdentifierStart: validStartChars,
  isIdentifierContinue: validContinuationChars,
});

expressionParser.configure({
  evaluateIdentifier(tag: string, scope: any, scopeList: any[], context: any) {
    let res = context.num + context.num;
    return res;
  },
});

expressionParser.configure({
  setIdentifier(
    tag: string,
    value: any,
    scope: any,
    scopeList: any[],
    context: any
  ) {
    scopeList[0][tag] = value;
    return true;
  },
});

expressionParser.configure({
  postEvaluate(
    result: any,
    tag: string,
    scope: any,
    context: DXT.ParserContext
  ) {
    return result;
  },
});

ieExpressionParser.configure({
  postEvaluate(
    result: any,
    tag: string,
    scope: any,
    context: DXT.ParserContext
  ) {
    return result;
  },
});

// Define the parameter type for getFileType
interface FileTypeParams {
  doc: Docxtemplater;
}

const avoidRenderingCoreXMLModule = {
  name: "avoidRenderingCoreXMLModule",
  getFileType({ doc }: FileTypeParams): void {
    doc.targets = doc.targets.filter(function (file: string) {
      if (
        file === "docProps/core.xml" ||
        file === "docProps/app.xml" ||
        file === "docProps/custom.xml"
      ) {
        return false;
      }
      return true;
    });
  },
};
new Docxtemplater(new PizZip("hello"), {
  modules: [avoidRenderingCoreXMLModule],
  paragraphLoop: true,
  linebreaks: true,
});

interface SetOptions {
  Lexer: any;
  zip: any;
}
const fixDocPrCorruptionModule: DXT.Module = {
  set(options: SetOptions) {
    if (options.Lexer) {
      this.Lexer = options.Lexer;
    }
    if (options.zip) {
      this.zip = options.zip;
    }
  },
  on(event) {
    if (event === "attached") {
      this.attached = false;
    }
    if (event !== "syncing-zip") {
      return;
    }
    const zip = this.zip;
    const Lexer = this.Lexer;
    let prId = 1;
    function setSingleAttribute(
      partValue: string,
      attr: string,
      attrValue: string | number
    ) {
      const regex = new RegExp(`(<.* ${attr}=")([^"]+)(".*)$`);
      if (regex.test(partValue)) {
        return partValue.replace(regex, `$1${attrValue}$3`);
      }
      let end = partValue.lastIndexOf("/>");
      if (end === -1) {
        end = partValue.lastIndexOf(">");
      }
      return (
        partValue.substr(0, end) +
        ` ${attr}="${attrValue}"` +
        partValue.substr(end)
      );
    }
    for (const f of zip.file(/\.xml$/)) {
      let text = f.asText();
      const xmllexed = Lexer.xmlparse(text, {
        text: [],
        other: ["wp:docPr"],
      });
      if (xmllexed.length > 1) {
        text = xmllexed.reduce(function (fullText: string, part: DXT.Part) {
          if (
            part.tag === "wp:docPr" &&
            part.position &&
            ["start", "selfclosing"].indexOf(part.position) !== -1
          ) {
            return fullText + setSingleAttribute(part.value, "id", prId++);
          }
          return fullText + part.value;
        }, "");
      }
      zip.file(f.name, text);
    }
  },
};
new Docxtemplater(new PizZip("hello"), {
  modules: [fixDocPrCorruptionModule],
});
