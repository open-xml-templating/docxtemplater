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

REMOTE_BROWSER="${REMOTE_BROWSER:-""}"
if [ "$REMOTE_BROWSER" = "" ]
then
	if netstat -tnlp | grep --color -E 4444 >/dev/null
	then
		echo "Using existing selenium"
	else
		selenium-standalone install --silent
		selenium-standalone start -- -log /tmp/protractor.log &
		pid="$!"
	fi
fi

if [ "$REMOTE_BROWSER" = "" ]
then
	node webdriver.js
	exit "$?"
fi

set +e

browserName="chrome" platform="Windows 10" version="58" node webdriver.js
browserName="firefox" platform="Windows 10" version="55" node webdriver.js
browserName="internet explorer" platform="Windows 10" version="11" node webdriver.js
browserName="iphone" platform="Mac 10.11" version="10.2" node webdriver.js
