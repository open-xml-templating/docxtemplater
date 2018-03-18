#!/bin/bash

set -euo pipefail
pid=""

cleanup() {
	if [ "$pid" != "" ]
	then
		kill "$pid" || true
	fi
}
trap "cleanup" EXIT INT
PATH="$PATH:./node_modules/.bin/"
BROWSER="${BROWSER:-CHROME}"

if [ "$BROWSER" != "SAUCELABS" ]
then
	if netstat -tnlp 2>/dev/null | grep --color -E 4444 >/dev/null
	then
		echo "Using existing selenium"
	else
		selenium-standalone install --silent
		selenium-standalone start -- -log /tmp/protractor.log &
		pid="$!"
	fi
	node webdriver.js
	exit "$?"
fi

result=0
browserName="chrome" platform="Windows 10" version="58" node webdriver.js || result=1
browserName="firefox" platform="Windows 10" version="55" node webdriver.js || result=1
browserName="internet explorer" platform="Windows 10" version="11" node webdriver.js || result=1
browserName="iphone" platform="Mac 10.11" version="10.2" node webdriver.js || result=1
exit "$result"
