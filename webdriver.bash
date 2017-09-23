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


if [ "$REMOTE_BROWSER" = "" ]
then
	node webdriver.js
	exit "$?"
fi

set +e

browserName="chrome" platform="Windows 10" version="58.0.3029.81" node webdriver.js
browserName="firefox" platform="Windows 10" version="55.0." node webdriver.js
browserName="internet explorer" platform="Windows 10" version="11.103.10586.0." node webdriver.js
browserName="internet explorer" platform="Windows 2008" version="9.0.8112.16421." node webdriver.js
browserName="internet explorer" platform=XP version=7  node webdriver.js
browserName="microsoftedge" platform="Windows 10" version="15.15063." node webdriver.js
browserName="opera" platform="Windows 2008" version="12.12." node webdriver.js
browserName="safari" platform="Mac 10.12" version="10.0."  node webdriver.js
browserName="iphone" platform="Mac 10.11" version="10.2." node webdriver.js
browserName="android" platform="Linux" version="7.1." node webdriver.js
