#!/bin/bash

set -e
set -u

profile() {
	find ./js -name '*.js' | while IFS='' read -r filename; do
		echo "$filename"
		echo "${filename/js/prof}"
		mkdir -p "$(dirname "${filename/js/prof}")"
		profi-stanbul profile --output "${filename/js/prof}" "${filename}"
	done
	mocha prof/tests/docxtemplater.js
}

analyse() {
	jqq='. | to_entries | sort_by(.value.ms) | .[].value | .filename + "@" + .name + ":" + (.calls|tostring) + ":" + (.ms|tostring) + "ms"'

	jq <p.json --raw-output "$jqq" |
	sed "s:$(pwd)/prof/::g"
}

compile() {
	npm run compile
}

action=${1:-""}
if [ "$action" = "" ]
then
	echo "compile"
	compile
	echo "profile"
	profile >/dev/null
	echo "analyse"
	analyse
else
	"$action"
fi


