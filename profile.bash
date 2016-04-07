#!/bin/bash

set -e
set -u

mkdir -p prof/tests

npm run compile

find ./js -name '*.js' | while IFS='' read -r filename || [[ -n "$filename" ]]; do
	echo "$filename"
	echo "${filename/js/prof}"
	profi-stanbul profile --output "${filename/js/prof}" "${filename}"
done

mocha prof/tests/docxtemplater.js

jqq='. | to_entries | sort_by(.value.ms) | .[].value | .filename + "@" + .name + ":" + (.calls|tostring) + ":" + (.ms|tostring) + "ms"'

jq <p.json --raw-output "$jqq" |
	sed "s:$(pwd)/prof/::g"
