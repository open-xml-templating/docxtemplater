import Docxtemplater, { DXT } from "./docxtemplater";
import InspectModule from "./inspect-module";

const PizZip: any = require("pizzip");
import { expectType, expectError } from "tsd";
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
const nullValues = iModule.fullInspected["word/document.xml"].nullValues;
const firstTag = nullValues.detail[0].part.value;
const scope = nullValues.detail[0].scopeManager.scopeList[0];
expectType<string>(firstTag);
doc1.render();

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
