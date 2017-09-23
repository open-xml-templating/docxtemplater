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
echo "node webdriver"
node webdriver.js
