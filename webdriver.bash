#!/usr/bin/env bash

set -euo pipefail
export TZ='Europe/Paris'

if ! [ -f test/mocha.html ]; then
	echo "test/mocha.html does not exist" 1>&2
	exit 1
fi
export GRAY='[90m'
export NORMAL='[m'

BROWSER="${BROWSER:-CHROME|FIREFOX|}"
PATH="$PATH:./node_modules/.bin/"
if grep '|' <<<"$BROWSER" >/dev/null; then
	messages=""
	while read -r -d '|' browser; do
		result=0
		BROWSER="$browser" ./webdriver.bash || result="$?"
		if [ "$result" != "0" ]; then
			messages="$messages"$'\n'"Fail for $browser"
		fi
	done <<<"$BROWSER"
	if [ "$messages" != "" ]; then
		echo "$messages"
		exit 1
	fi
	exit 0
fi

npx playwright install

result=0
{ FORCE_COLOR=1 node webdriver.mjs | tee /tmp/test.log; } || result="$?"
if [ "$result" = "0" ]; then
	exit 0
fi
