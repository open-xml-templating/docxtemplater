exports[`Api versioning  should fail with invalid versions`] = {
  "_type": "XTAPIVersionError",
  "name": "APIVersionError",
  "message": "neededVersion is not a valid version",
  "properties": {
    "id": "api_version_error",
    "neededVersion": [
      5,
      0
    ],
    "explanation": "the neededVersion must be an array of length 3"
  }
}

exports[`Api versioning  should fail with invalid versions-1`] = {
  "_type": "XTAPIVersionError",
  "name": "APIVersionError",
  "message": "The major api version do not match, you probably have to update docxtemplater with npm install --save docxtemplater",
  "properties": {
    "id": "api_version_error",
    "neededVersion": [
      5,
      6,
      0
    ],
    "currentModuleApiVersion": [
      3,
      37,
      0
    ],
    "explanation": "moduleAPIVersionMismatch : needed=5.6.0, current=3.37.0"
  }
}

exports[`Api versioning  should fail with invalid versions-2`] = {
  "_type": "XTAPIVersionError",
  "name": "APIVersionError",
  "message": "The minor api version is not uptodate, you probably have to update docxtemplater with npm install --save docxtemplater",
  "properties": {
    "id": "api_version_error",
    "neededVersion": [
      3,
      44,
      0
    ],
    "currentModuleApiVersion": [
      3,
      37,
      0
    ],
    "explanation": "moduleAPIVersionMismatch : needed=3.44.0, current=3.37.0"
  }
}

exports[`Api versioning  should fail with invalid versions-3`] = {
  "_type": "XTAPIVersionError",
  "name": "APIVersionError",
  "message": "The patch api version is not uptodate, you probably have to update docxtemplater with npm install --save docxtemplater",
  "properties": {
    "id": "api_version_error",
    "neededVersion": [
      3,
      37,
      100
    ],
    "currentModuleApiVersion": [
      3,
      37,
      0
    ],
    "explanation": "moduleAPIVersionMismatch : needed=3.37.100, current=3.37.0"
  }
}

exports[`Compilation errors  should fail early when a loop closes the wrong loop`] = {
  "_type": "XTTemplateError",
  "name": "TemplateError",
  "message": "Multi error",
  "properties": {
    "errors": [
      {
        "_type": "XTTemplateError",
        "name": "TemplateError",
        "message": "Unopened loop",
        "properties": {
          "id": "unopened_loop",
          "explanation": "The loop with tag \"loop3\" is unopened",
          "xtag": "loop3",
          "offset": 16,
          "file": "word/document.xml"
        }
      },
      {
        "_type": "XTTemplateError",
        "name": "TemplateError",
        "message": "Unopened loop",
        "properties": {
          "id": "unopened_loop",
          "explanation": "The loop with tag \"loop3\" is unopened",
          "xtag": "loop3",
          "offset": 24,
          "file": "word/document.xml"
        }
      }
    ],
    "id": "multi_error",
    "explanation": "The template has multiple errors"
  }
}

exports[`Compilation errors  should fail when rawtag is not in paragraph`] = {
  "_type": "XTTemplateError",
  "name": "TemplateError",
  "message": "Multi error",
  "properties": {
    "errors": [
      {
        "_type": "XTTemplateError",
        "name": "TemplateError",
        "message": "Raw tag not in paragraph",
        "properties": {
          "id": "raw_tag_outerxml_invalid",
          "explanation": "The tag \"myrawtag\" is not inside a paragraph, putting raw tags inside an inline loop is disallowed.",
          "rootError": {
            "_type": "XTTemplateError",
            "name": "TemplateError",
            "message": "No tag \"w:p\" was found at the left",
            "properties": {
              "id": "no_xml_tag_found_at_left",
              "explanation": "No tag \"w:p\" was found at the left",
              "offset": 0,
              "part": {
                "type": "placeholder",
                "module": "rawxml",
                "value": "myrawtag",
                "offset": 0,
                "endLindex": 3,
                "lIndex": 3,
                "raw": "@myrawtag"
              },
              "parsed": [
                {
                  "type": "tag",
                  "position": "start",
                  "text": true,
                  "value": "<w:t xml:space=\"preserve\">",
                  "tag": "w:t",
                  "lIndex": 0
                },
                {
                  "type": "placeholder",
                  "module": "rawxml",
                  "value": "myrawtag",
                  "offset": 0,
                  "endLindex": 3,
                  "lIndex": 3,
                  "raw": "@myrawtag"
                },
                {
                  "type": "tag",
                  "position": "end",
                  "text": true,
                  "value": "</w:t>",
                  "tag": "w:t",
                  "lIndex": 4
                }
              ],
              "index": 1,
              "element": "w:p"
            }
          },
          "xtag": "myrawtag",
          "offset": 0,
          "postparsed": [
            {
              "type": "tag",
              "position": "start",
              "text": true,
              "value": "<w:t xml:space=\"preserve\">",
              "tag": "w:t",
              "lIndex": 0
            },
            {
              "type": "placeholder",
              "module": "rawxml",
              "value": "myrawtag",
              "offset": 0,
              "endLindex": 3,
              "lIndex": 3,
              "raw": "@myrawtag"
            },
            {
              "type": "tag",
              "position": "end",
              "text": true,
              "value": "</w:t>",
              "tag": "w:t",
              "lIndex": 4
            }
          ],
          "expandTo": "w:p",
          "index": 1,
          "file": "word/document.xml"
        }
      }
    ],
    "id": "multi_error",
    "explanation": "The template has multiple errors"
  }
}

